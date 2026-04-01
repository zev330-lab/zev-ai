# Pipeline Rebuild Plan: pg_cron Polling Orchestrator

**Status:** Ready for execution
**Author:** Binah (Planner)
**Date:** 2026-03-18

---

## 1. Problem Statement

The discovery assessment pipeline (Guardian -> Visionary -> Architect -> Oracle) is broken in production due to three compounding issues:

1. **`_pipeline_config.service_role_key` = 'PLACEHOLDER'** — The pg_net trigger in migration 003 reads this value at runtime. Since it was never set to the real key, every trigger invocation silently no-ops (line 59-63 of 003: `IF _key = 'PLACEHOLDER' THEN RETURN NEW`). This is the primary failure mode.
2. **pg_net silent failures** — Even if the key were set, pg_net provides no visibility into HTTP call failures. Failed requests vanish into a background worker with no logging accessible from SQL.
3. **No rate-limit spacing** — The trigger fires immediately on status change, meaning Visionary -> Architect -> Oracle all attempt Claude API calls within seconds. With a 30K input tokens/min rate limit, the second or third call will 429.

The current retry mechanism (migration 004) cannot compensate because it also depends on the PLACEHOLDER key, and it only retries rows marked `failed` — it cannot help rows that never progressed because the trigger silently did nothing.

## 2. Architecture Decision: pg_cron Polling Worker

**Decision:** Replace the pg_net trigger chain with a single pg_cron job that polls the `discoveries` table every 30 seconds and invokes the next Edge Function for one eligible row at a time.

**Rationale:**
- pg_cron is universally available on all Supabase instances (already proven working via migration 004)
- pg_net is still used for the HTTP call itself, but the *orchestration logic* moves to pg_cron — making failures visible and retryable
- A polling model naturally enforces rate-limit spacing: the worker only processes one step per cycle
- No new infrastructure (pgmq) required — simpler to debug, maintain, and explain

**What stays the same:**
- The 4 Edge Functions (pipeline-guardian, pipeline-visionary, pipeline-architect, pipeline-oracle) — they work correctly in isolation
- The `_shared/` utilities (pipeline-utils.ts, agent-utils.ts, supabase.ts)
- The `discoveries` table schema from migration 002
- The submit-discover API route's INSERT behavior (just remove the fire-and-forget fetch)

**What changes:**
- Migration 003 (pg_net trigger) — DROP trigger, keep `_pipeline_config` table
- Migration 004 (retry cron) — REPLACE with unified polling worker
- New column: `pipeline_step_completed_at` on discoveries
- New column: `pipeline_retry_count` on discoveries
- `submit-discover/route.ts` — remove fire-and-forget Guardian call

## 3. Database Schema Changes

### New columns on `discoveries`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `pipeline_step_completed_at` | `TIMESTAMPTZ` | `NULL` | Timestamp of last completed Claude API call. Used for global 60s cooldown. |
| `pipeline_retry_count` | `INTEGER` | `0` | Number of retry attempts for current step. Max 3 before permanent failure. |

### Objects to DROP

| Object | Source | Reason |
|--------|--------|--------|
| `TRIGGER on_pipeline_status_change` | 003 | Replaced by pg_cron polling |
| `FUNCTION trigger_pipeline_next()` | 003 | No longer needed |
| `CRON JOB retry-failed-pipelines` | 004 | Replaced by unified worker |
| `FUNCTION retry_failed_pipelines()` | 004 | Replaced by unified worker |

### Objects to KEEP

| Object | Source | Reason |
|--------|--------|--------|
| `TABLE _pipeline_config` | 003 | Still needed for supabase_url and service_role_key |
| `EXTENSION pg_net` | 003 | Still used for HTTP calls |
| `EXTENSION pg_cron` | 004 | Still used for scheduling |

### `_pipeline_config` — Must Set Real Key

The `service_role_key` row in `_pipeline_config` MUST be updated to the real Supabase service role key. This is a manual step post-migration:

```sql
UPDATE _pipeline_config SET value = '<REAL_SERVICE_ROLE_KEY>' WHERE key = 'service_role_key';
```

The key is available in Supabase Dashboard > Settings > API > service_role key, or in `~/dev/_credentials/.env.master`.

## 4. The Polling Worker: `pipeline_poll_and_dispatch()`

### Algorithm (pseudocode)

```
FUNCTION pipeline_poll_and_dispatch():
  -- GLOBAL COOLDOWN: Check if any discovery completed a step within 60s
  SELECT MAX(pipeline_step_completed_at) FROM discoveries
  IF (now - max) < 60 seconds:
    RETURN  -- respect rate limit, try again in 30s

  -- FIND NEXT ROW TO PROCESS (priority: oldest first)
  SELECT one row FROM discoveries WHERE:
    pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing')
    AND pipeline_retry_count < 3
    AND (pipeline_step_completed_at IS NULL
         OR pipeline_step_completed_at < now() - interval '60 seconds')
  ORDER BY created_at ASC
  LIMIT 1

  IF no row found: RETURN

  -- MAP STATUS TO FUNCTION
  CASE pipeline_status:
    'pending'       -> 'pipeline-guardian'
    'researching'   -> 'pipeline-visionary'
    'scoping'       -> 'pipeline-architect'
    'synthesizing'  -> 'pipeline-oracle'

  -- DISPATCH via pg_net
  PERFORM net.http_post(url, headers, body)
```

### Key Design Points

1. **Global cooldown** — The worker checks `MAX(pipeline_step_completed_at)` across ALL discoveries, not just the one being processed. This prevents concurrent pipelines from exceeding rate limits.
2. **One row per cycle** — `LIMIT 1` ensures only one Edge Function is invoked per 30-second cycle.
3. **FIFO ordering** — `ORDER BY created_at ASC` processes oldest submissions first.
4. **Retry cap** — `pipeline_retry_count < 3` prevents infinite retry loops. After 3 failures, the row stays in `failed` status permanently (admin can manually reset).

### How Each Edge Function Signals Completion

Currently, each Edge Function (except Oracle) updates `pipeline_status` to the next state. This is the "signal" that the step completed. No change needed to this behavior.

**Addition:** Each function must ALSO set `pipeline_step_completed_at = now()` when it updates the status. This is how the global cooldown tracks the last Claude API call.

This requires a small edit to each of the 4 Edge Functions:
- Guardian: add `pipeline_step_completed_at: new Date().toISOString()` to the update payload
- Visionary: same
- Architect: same
- Oracle: same (already sets `pipeline_completed_at`, but also needs `pipeline_step_completed_at`)

### How Retries Work

When an Edge Function fails (sets `pipeline_status = 'failed'`), the polling worker will NOT pick it up because it only looks for `pending|researching|scoping|synthesizing`.

**Change to `failPipeline()` in pipeline-utils.ts:** Instead of setting status to `failed` immediately, increment `pipeline_retry_count` and keep the current status. Only set `failed` if retry_count >= 3.

```typescript
// NEW failPipeline behavior:
// 1. Read current retry_count
// 2. If < 3: increment retry_count, keep current status (worker will re-dispatch)
// 3. If >= 3: set status to 'failed' permanently
```

This means the polling worker naturally retries failed steps on its next cycle.

## 5. Complete Component List and Changes

### Migration 005: `005_pipeline_cron_worker.sql`

| Section | What |
|---------|------|
| Add columns | `pipeline_step_completed_at`, `pipeline_retry_count` |
| Drop trigger | `on_pipeline_status_change` |
| Drop function | `trigger_pipeline_next()` |
| Drop cron job | `retry-failed-pipelines` |
| Drop function | `retry_failed_pipelines()` |
| Create function | `pipeline_poll_and_dispatch()` |
| Create cron job | `pipeline-worker` running every 30 seconds |
| Update config | Comment reminding to set real service_role_key |

### Edge Function Changes

| File | Change | Scope |
|------|--------|-------|
| `pipeline-guardian/index.ts` | Add `pipeline_step_completed_at` to update, reset `pipeline_retry_count` to 0 | 2 lines |
| `pipeline-visionary/index.ts` | Add `pipeline_step_completed_at` to update, reset `pipeline_retry_count` to 0 | 2 lines |
| `pipeline-architect/index.ts` | Add `pipeline_step_completed_at` to update, reset `pipeline_retry_count` to 0 | 2 lines |
| `pipeline-oracle/index.ts` | Add `pipeline_step_completed_at` to update | 1 line |
| `_shared/pipeline-utils.ts` | Change `failPipeline()` to retry-aware (increment count, only fail at 3) | ~15 lines |

### Vercel Route Change

| File | Change | Scope |
|------|--------|-------|
| `src/app/api/submit-discover/route.ts` | Remove fire-and-forget `fetch()` to pipeline-guardian (lines 112-127). The INSERT with `pipeline_status: 'pending'` is sufficient — pg_cron picks it up. | Delete ~15 lines |

### No Changes Required

| Component | Reason |
|-----------|--------|
| Discovery form UI (`/discover`) | Submits to API route, unaffected |
| Admin discoveries page | Reads pipeline_status, unaffected |
| Admin TOLA dashboard | Reads agent logs, unaffected |
| `_shared/supabase.ts` | No changes |
| `_shared/agent-utils.ts` | No changes |

## 6. Build Order (Dependency Chain)

```
Phase 1: Database (no dependencies)
├── 1A. Write migration 005
├── 1B. Write SQL to delete test records
└── 1C. Look up real service_role_key from credentials

Phase 2: Edge Function Updates (depends on: schema from 1A)
├── 2A. Update failPipeline() in pipeline-utils.ts
├── 2B. Update pipeline-guardian/index.ts
├── 2C. Update pipeline-visionary/index.ts
├── 2D. Update pipeline-architect/index.ts
└── 2E. Update pipeline-oracle/index.ts
   (2B-2E are independent of each other, depend on 2A)

Phase 3: Vercel Route (independent of Phase 2)
└── 3A. Simplify submit-discover/route.ts

Phase 4: Deploy (depends on: ALL of Phase 1-3)
├── 4A. Git commit and push
├── 4B. supabase db push (applies migration 005)
├── 4C. UPDATE _pipeline_config SET value = '<key>' WHERE key = 'service_role_key'
├── 4D. SQL: DELETE test discoveries
├── 4E. supabase functions deploy pipeline-guardian --no-verify-jwt
├── 4F. supabase functions deploy pipeline-visionary --no-verify-jwt
├── 4G. supabase functions deploy pipeline-architect --no-verify-jwt
├── 4H. supabase functions deploy pipeline-oracle --no-verify-jwt
└── 4I. vercel --prod --scope steinmetz-real-estate-professionlas

Phase 5: Test (depends on: ALL of Phase 4)
├── 5A. Submit test discovery via /discover form
├── 5B. Monitor: check discoveries table every 30s for status progression
├── 5C. Verify: pending -> researching -> scoping -> synthesizing -> complete
└── 5D. Check admin/discoveries for research_brief, assessment_doc, meeting_prep_doc
```

### Parallelism Opportunities

- Phase 1A, 1B, 1C can all be done simultaneously
- Phase 2B, 2C, 2D, 2E can all be done simultaneously (after 2A)
- Phase 3A can be done in parallel with Phase 2
- Phase 4E-4H can be done in parallel (or use a single deploy-all command if available)

## 7. Constraints (What Must NOT Change)

| Constraint | Reason |
|------------|--------|
| Edge Function signatures (`{ discovery_id }` JSON body) | The pg_cron worker dispatches with this exact payload |
| `pipeline_status` enum values (`pending`, `researching`, `scoping`, `synthesizing`, `complete`, `failed`) | Admin UI depends on these exact strings |
| `research_brief` as JSONB, `assessment_doc` and `meeting_prep_doc` as TEXT | Admin discoveries page renders these directly |
| Claude model `claude-sonnet-4-6` | Specified in all 3 Claude-calling functions |
| `web_search` tool on Visionary only | Architect and Oracle do not use web search |
| Agent logging (`logAction`, `updateHeartbeat`, `recordMetric`) | Admin TOLA dashboard reads these |
| CORS headers on all Edge Functions | Called from browser in admin manual-trigger flow |

## 8. Risk Assessment and Mitigation

### Risk 1: `_pipeline_config` key still PLACEHOLDER after migration
- **Likelihood:** HIGH (this is a manual step easily forgotten)
- **Impact:** Pipeline silently does nothing (same as current bug)
- **Mitigation:** Add a RAISE NOTICE in the polling function if key is PLACEHOLDER. Include the UPDATE command as a comment in migration 005. Add to deploy checklist.

### Risk 2: pg_cron 30-second interval too slow for user perception
- **Likelihood:** MEDIUM
- **Impact:** User submits form, waits up to 30s before Guardian even starts. Full pipeline takes ~4 minutes (30s wait + Guardian + 60s cooldown + Visionary + 60s + Architect + 60s + Oracle).
- **Mitigation:** Acceptable for async pipeline. The confirmation email sets expectations ("I'm preparing for our conversation"). If faster kickoff needed later, keep the fire-and-forget Guardian call in submit-discover as an optimization (but pg_cron is the reliability backstop).

### Risk 3: Edge Function timeout during Claude API call
- **Likelihood:** LOW-MEDIUM (Visionary with web_search can take 30-60s)
- **Impact:** Function times out, no status update written, row stuck
- **Mitigation:** The polling worker will re-dispatch stuck rows on next cycle. The `pipeline_retry_count` prevents infinite loops. Current `callClaude` timeout is 120-150s which is within Supabase Edge Function's 150s limit (cutting it close for Visionary's 150s timeout).

### Risk 4: Multiple cron cycles dispatch to the same row
- **Likelihood:** LOW (30s cycle, functions take 10-60s)
- **Impact:** Duplicate work, wasted tokens, potential race condition on status update
- **Mitigation:** Add a `pipeline_locked_at` column (TIMESTAMPTZ). The worker sets it before dispatching and only picks rows where `pipeline_locked_at IS NULL OR pipeline_locked_at < now() - interval '5 minutes'`. The Edge Function clears it on completion. This is an OPTIONAL enhancement — skip for v1 since the 60s global cooldown makes double-dispatch unlikely.

### Risk 5: Supabase CLI migration ordering
- **Likelihood:** LOW
- **Impact:** Migration 005 references objects from 003/004 that may not exist
- **Mitigation:** Use `IF EXISTS` on all DROP statements. Use `CREATE OR REPLACE` for functions.

## 9. "Done" Definition

The pipeline rebuild is complete when:

1. A discovery submitted via `/discover` progresses through all 4 stages automatically
2. Pipeline status transitions are visible in `/admin/discoveries`
3. Research brief, assessment doc, and meeting prep doc are all populated
4. The full pipeline completes within 5 minutes of submission
5. A deliberately failed step (e.g., malformed data) retries up to 3 times then marks `failed`
6. No PLACEHOLDER values remain in `_pipeline_config`
7. All test records from development are cleaned up

## 10. Detailed File Specifications

### Migration 005 Structure

```sql
-- 1. Add new columns
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS pipeline_step_completed_at TIMESTAMPTZ;
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS pipeline_retry_count INTEGER DEFAULT 0;

-- 2. Drop old orchestration (IF EXISTS for safety)
DROP TRIGGER IF EXISTS on_pipeline_status_change ON discoveries;
DROP FUNCTION IF EXISTS trigger_pipeline_next();
SELECT cron.unschedule('retry-failed-pipelines');
DROP FUNCTION IF EXISTS retry_failed_pipelines();

-- 3. Create polling worker function
CREATE OR REPLACE FUNCTION pipeline_poll_and_dispatch() ...

-- 4. Schedule: every 30 seconds
SELECT cron.schedule('pipeline-worker', '30 seconds', $$SELECT pipeline_poll_and_dispatch()$$);
```

Note: pg_cron supports sub-minute intervals via the `'N seconds'` syntax (available on Supabase's pg_cron version). If this fails, fall back to `'* * * * *'` (every minute) which is still acceptable.

### `failPipeline()` New Signature

```typescript
export async function failPipeline(
  supabase: SupabaseClient,
  discoveryId: string,
  step: string,
  errorMsg: string,
): Promise<void> {
  // Read current retry count
  const { data } = await supabase
    .from('discoveries')
    .select('pipeline_retry_count')
    .eq('id', discoveryId)
    .single();

  const retryCount = (data?.pipeline_retry_count ?? 0) + 1;

  if (retryCount >= 3) {
    // Permanent failure
    await supabase.from('discoveries').update({
      pipeline_status: 'failed',
      pipeline_error: `${step} failed after ${retryCount} attempts: ${errorMsg}`,
      pipeline_retry_count: retryCount,
    }).eq('id', discoveryId);
  } else {
    // Retriable: keep current status, increment count, clear error
    await supabase.from('discoveries').update({
      pipeline_error: `${step} attempt ${retryCount}: ${errorMsg}`,
      pipeline_retry_count: retryCount,
    }).eq('id', discoveryId);
  }
}
```

### submit-discover/route.ts Change

Remove lines 112-127 (the fire-and-forget fetch block). The INSERT with `pipeline_status: 'pending'` at line 29 is the only trigger needed. The pg_cron worker picks it up within 30 seconds.

---

## 11. Deploy Checklist (Copy-Paste Ready)

```bash
# 1. Push migration and function updates
cd ~/dev/zev-ai
git add -A
git commit -m "feat: replace pg_net trigger chain with pg_cron polling worker for pipeline reliability"
git push origin main

# 2. Apply database migration
supabase db push --linked

# 3. Set the real service role key (GET FROM SUPABASE DASHBOARD)
# Run in Supabase SQL Editor:
# UPDATE _pipeline_config SET value = '<SERVICE_ROLE_KEY>' WHERE key = 'service_role_key';

# 4. Delete test discoveries (run in SQL Editor)
# DELETE FROM discoveries WHERE email IS NULL OR email LIKE '%test%';

# 5. Deploy Edge Functions
supabase functions deploy pipeline-guardian --no-verify-jwt
supabase functions deploy pipeline-visionary --no-verify-jwt
supabase functions deploy pipeline-architect --no-verify-jwt
supabase functions deploy pipeline-oracle --no-verify-jwt

# 6. Deploy Vercel
vercel --prod --scope steinmetz-real-estate-professionlas

# 7. Test: submit a discovery at /discover, then monitor:
# SELECT id, pipeline_status, pipeline_step_completed_at, pipeline_retry_count, pipeline_error
# FROM discoveries ORDER BY created_at DESC LIMIT 5;
```

---

**End of plan. All sections are actionable. Executor (Gevurah/Tiferet) should proceed in the build order defined in Section 6.**
