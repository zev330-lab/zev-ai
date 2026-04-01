# Pipeline Chaining Research — Expansion Document

**Date:** 2026-03-18
**Role:** Chokhmah (Expansion/Research)
**Problem:** 4 Edge Functions must run in sequence (Guardian -> Visionary -> Architect -> Oracle), each calling Claude API, with ~60s delays between steps for rate-limit compliance. Supabase kills processes before outbound fetch calls complete.

---

## 1. Current Implementation Analysis

The project already has two chaining mechanisms in place:

**Migration 003 — pg_net DB Trigger:** A trigger on `discoveries.pipeline_status` changes fires `net.http_post()` to invoke the next Edge Function. Each function updates `pipeline_status` to the next value, which fires the trigger for the next step.

**Migration 004 — pg_cron Retry:** A cron job every 2 minutes finds `failed` discoveries with retryable errors (429/529) and re-invokes the failed step via `net.http_post()`.

**Known issues with the current approach:**
- pg_net can fail silently (confirmed by GitHub discussion #37591 — requests dropped without error if auth headers are wrong or pg_net queue is backed up)
- No delay between steps — the trigger fires immediately when status changes, hitting Claude rate limits
- The `net._http_response` table must be checked manually for debugging
- Multiple rapid inserts can cause pg_net to drop requests (GitHub issue #86)

---

## 2. Approach-by-Approach Analysis

### Approach 1: pg_cron Polling

**How it works:** A pg_cron job runs every N seconds, queries `discoveries` for rows in specific pipeline statuses that are "ready" for the next step (based on a timestamp or ready flag), and invokes the appropriate Edge Function via `net.http_post()`.

**Implementation sketch:**
```sql
-- Run every 60 seconds
SELECT cron.schedule('pipeline-worker', '* * * * *', $$
  SELECT process_pipeline_queue()
$$);

-- The function finds discoveries ready for next step
-- Uses a "next_step_after" timestamp column to enforce delays
CREATE OR REPLACE FUNCTION process_pipeline_queue() ...
  -- Find rows WHERE pipeline_status IN ('researching','scoping','synthesizing')
  --   AND next_step_after < now()
  --   AND pipeline_locked = false
  -- Lock the row, invoke via net.http_post(), let the function unlock on completion
```

**Reliability:** HIGH. pg_cron is battle-tested on Supabase. If a cycle fails, the next cycle picks it up. The row is still there.

**Delay support:** YES. Minimum pg_cron interval is 1 second (Postgres >= 15.1.1.61), but 60-second intervals are natural with `* * * * *`. Add a `next_step_after` timestamp column to enforce per-discovery delays.

**Error handling:** EXCELLENT. Failed invocations leave the row in its current state. The next cron cycle retries. Add a `retry_count` column to cap attempts.

**Complexity:** LOW-MEDIUM. One SQL function + one cron schedule. Need a locking mechanism to prevent double-processing.

**Supabase compatibility:** FULL. pg_cron is a first-class Supabase extension.

**Tradeoffs:**
- (+) Self-healing — if anything fails, next poll picks it up
- (+) Natural delay enforcement via timestamps
- (+) Single point of orchestration, easy to reason about
- (-) Polling is inherently wasteful (runs even when no work exists)
- (-) Up to 60s latency between step completion and next step start (on top of the intentional delay)
- (-) Still depends on pg_net for the HTTP call to the Edge Function

---

### Approach 2: Database Webhooks (Supabase Dashboard Webhooks)

**How it works:** Supabase Database Webhooks are a UI wrapper around pg_net triggers. When a column changes, it fires an HTTP POST to a configured URL.

**Reliability:** SAME AS pg_net TRIGGERS. Under the hood, this is `net.http_post()` from a trigger — identical to what migration 003 already does. The Supabase dashboard just provides a UI for configuring it.

**Delay support:** NO. Fires immediately on row change. No built-in delay mechanism.

**Error handling:** POOR. Same silent-failure issues as raw pg_net. No retry built in.

**Complexity:** LOW (dashboard config), but identical to what's already implemented.

**Supabase compatibility:** FULL.

**Tradeoffs:**
- (+) Slightly easier to configure via dashboard vs. raw SQL
- (-) No advantage over the existing pg_net trigger in migration 003
- (-) Cannot add delays
- (-) Same silent failure issues
- **Verdict: Not an improvement over current implementation.**

---

### Approach 3: pg_notify + Realtime

**How it works:** Use PostgreSQL `NOTIFY` from a trigger. A Supabase Realtime subscription in the Next.js app (or another Edge Function) listens for the notification and triggers the next step.

**Reliability:** LOW-MEDIUM. Realtime connections can drop silently (documented in Supabase troubleshooting). If the listener isn't connected when the NOTIFY fires, the message is lost — pg_notify has no persistence.

**Delay support:** Would need to be implemented in the listener (setTimeout in JS).

**Error handling:** POOR. Lost notifications are unrecoverable without a polling fallback.

**Complexity:** MEDIUM. Need a persistent listener process, plus reconnection logic.

**Supabase compatibility:** PARTIAL. Works if you have a persistent client (Next.js server or a long-running process). Edge Functions cannot maintain persistent Realtime subscriptions.

**Tradeoffs:**
- (+) Near-instant notification
- (-) No message persistence — if listener is down, message is lost
- (-) Requires a persistent client process
- (-) Adds fragile dependency on Realtime connection stability
- **Verdict: Poor fit. Too fragile for a critical pipeline.**

---

### Approach 4: Supabase Queues (pgmq)

**How it works:** Use the official Supabase Queues system (built on pgmq extension). Each pipeline step, upon completion, sends a message to a queue with a `sleep_seconds` delay. A pg_cron job periodically invokes an Edge Function that pops messages from the queue and processes them.

**Implementation sketch:**
```sql
-- Create the pipeline queue
SELECT pgmq.create('pipeline-steps');

-- After Guardian completes, send message with 60s delay:
SELECT pgmq.send('pipeline-steps',
  '{"discovery_id": "abc", "next_step": "visionary"}'::jsonb,
  60  -- sleep_seconds: message invisible for 60s
);

-- pg_cron runs a worker Edge Function every 30s:
SELECT cron.schedule('pipeline-worker', '30 seconds', $$
  SELECT net.http_post(
    url := '...functions/v1/pipeline-worker',
    headers := ...,
    body := '{}'::jsonb
  )
$$);
```

The worker Edge Function:
```typescript
// Pop message from queue
const { data } = await supabase.schema('pgmq_public').rpc('pop', {
  queue_name: 'pipeline-steps'
});
if (data?.length) {
  const { discovery_id, next_step } = data[0].message;
  // Process the step directly or invoke the specific function
}
```

**Reliability:** HIGH. Messages are persisted in PostgreSQL. If the worker crashes, the message becomes visible again after the visibility timeout. Guaranteed delivery semantics.

**Delay support:** YES, NATIVE. The `sleep_seconds` parameter on `send()` makes the message invisible for that duration. This is exactly the 60s delay we need.

**Error handling:** EXCELLENT. Failed processing = message stays in queue. Visibility timeout re-exposes it. Can add dead-letter logic by checking retry count in message payload. Archive table provides audit trail.

**Complexity:** MEDIUM. Need to enable pgmq extension, create queue, modify each pipeline step to enqueue instead of updating status, create worker function, set up pg_cron schedule.

**Supabase compatibility:** FULL. pgmq is a first-class Supabase feature (requires Postgres >= 15.6.1.143). Available on all plans.

**Tradeoffs:**
- (+) Purpose-built for this exact problem
- (+) Native delay support via sleep_seconds
- (+) Guaranteed delivery with visibility timeout
- (+) Audit trail via archive table
- (+) Decouples pipeline steps from direct HTTP chaining
- (+) Official Supabase feature with docs and dashboard support
- (-) Requires Postgres >= 15.6.1.143 (check current version)
- (-) Still uses pg_cron + pg_net for the worker trigger (but only one HTTP call pattern to manage)
- (-) More moving parts than simple polling
- (-) Queue must be created/managed (migration)

---

### Approach 5: pg_net Extension (Direct HTTP from Triggers)

**This is what migration 003 already implements.** Analysis included here for completeness.

**Reliability:** MEDIUM. Works most of the time but has documented silent failure modes: missing auth headers, multiple rapid triggers, pg_net worker queue backup. The `net._http_response` table captures errors but requires manual checking.

**Delay support:** NO. `net.http_post()` fires immediately when the transaction commits. No built-in delay.

**Error handling:** POOR. No retry mechanism built in. The separate pg_cron retry job (migration 004) partially compensates but only catches failures that set `pipeline_status = 'failed'` — silent drops are invisible.

**Complexity:** LOW (already implemented).

**Supabase compatibility:** FULL.

**Tradeoffs:**
- (+) Already in place
- (+) Immediate firing (no polling delay)
- (-) No delay support means rate-limit hits
- (-) Silent failures are a real, documented problem
- (-) No built-in retry
- **Verdict: Insufficient as sole mechanism. Good as a fast-path complement to a polling fallback.**

---

### Approach 6: Single Long-Running Function with Delays

**How it works:** One Edge Function runs all 4 steps sequentially with `await sleep(60_000)` between each Claude call.

**Reliability:** LOW. Supabase Edge Functions have a 400-second wall clock limit (Pro plan, background tasks). Four Claude calls at ~30-60s each + three 60s delays = 270-420 seconds. This is right at or over the limit. Any slow Claude response pushes it over.

**Delay support:** YES (just `setTimeout`).

**Error handling:** POOR. If the function dies at step 3, steps 1-2 have completed but step 3 must be retried — need to track progress externally anyway.

**Complexity:** LOW (one function), but error recovery is complex.

**Supabase compatibility:** RISKY. Tight against wall clock limits. CPU time limits (200ms active) are not an issue since it's mostly I/O waiting.

**Tradeoffs:**
- (+) Simplest mental model
- (+) No orchestration infrastructure
- (-) 400s wall clock limit makes this unreliable for 4 Claude calls + delays
- (-) No partial retry — failure at step 3 wastes steps 1-2
- (-) Blocks a function instance for 4-7 minutes
- (-) Cannot adjust delays per step
- **Verdict: Too fragile. Would work if the pipeline had 2 steps max.**

---

### Approach 7: Client-Side Polling + Triggering

**How it works:** After form submission, the Next.js app (either client-side or a server action) polls the `discoveries` table and triggers each next step when the previous one completes.

**Implementation sketch:**
```typescript
// After form submit, start polling
const pollInterval = setInterval(async () => {
  const discovery = await supabase.from('discoveries')
    .select('pipeline_status')
    .eq('id', discoveryId).single();

  if (discovery.pipeline_status === 'researching_complete') {
    await sleep(60_000);
    await supabase.functions.invoke('pipeline-architect', { body: { discovery_id: discoveryId } });
  }
}, 5000);
```

**Reliability:** LOW. Depends on the user keeping the browser tab open (client-side) or the Vercel serverless function staying alive (server-side). If the user closes the tab after step 1, steps 2-4 never run.

**Delay support:** YES (trivial in JS).

**Error handling:** MEDIUM. Can catch errors and retry in the polling loop. But if the process dies, no recovery without a server-side fallback.

**Complexity:** LOW for client, but need server-side fallback for reliability.

**Supabase compatibility:** N/A (runs on Vercel/client).

**Tradeoffs:**
- (+) Full control over timing and error handling
- (+) Can show real-time progress to user
- (-) Unreliable if user leaves / tab closes
- (-) Vercel serverless functions have their own timeout limits (~10s default, 60s max on Pro)
- (-) Moves orchestration responsibility to the wrong layer
- **Verdict: Useful as a UX enhancement (showing progress) but not as the primary orchestration mechanism.**

---

## 3. Comparative Matrix

| Criterion           | pg_cron Poll | DB Webhooks | pg_notify | Queues (pgmq) | pg_net Trigger | Single Fn | Client Poll |
|---------------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Reliability         | HIGH | MED | LOW | HIGH | MED | LOW | LOW |
| Delay support       | YES | NO | Manual | NATIVE | NO | YES | YES |
| Error handling      | GOOD | POOR | POOR | EXCELLENT | POOR | POOR | MED |
| Retry capability    | GOOD | NONE | NONE | BUILT-IN | NONE | NONE | MED |
| Complexity          | LOW | LOW | MED | MED | LOW | LOW | LOW |
| Supabase compat     | FULL | FULL | PARTIAL | FULL | FULL | RISKY | N/A |
| Observability       | GOOD | POOR | POOR | GOOD | POOR | MED | MED |
| Already implemented | Partial (004) | ~003 | NO | NO | YES (003) | NO | NO |

---

## 4. Recommended Approach: Supabase Queues (pgmq) + pg_cron Worker

**Why this is the best fit:**

1. **Native delay support** via `sleep_seconds` is the killer feature. The 60s rate-limit gap maps directly to pgmq's message visibility delay. No hacks, no extra columns, no timestamp arithmetic.

2. **Guaranteed delivery.** Messages persist in PostgreSQL. If the worker crashes, the message becomes visible again after the visibility timeout. This eliminates the silent-failure problem that plagues pg_net triggers.

3. **Official Supabase feature.** First-party documentation, dashboard integration, and the processing-large-jobs blog post explicitly recommends this pattern for exactly this use case.

4. **Clean error handling.** Failed messages stay in the queue. Add a `retry_count` field to the message payload. After N retries, move to a dead-letter state. The archive table provides a complete audit trail.

5. **Decoupled architecture.** Pipeline steps don't need to know about each other. Each step just enqueues the next message. The worker function is the single point of orchestration.

**Architecture:**

```
Form Submit
  -> Insert discovery (pipeline_status = 'pending')
  -> Enqueue: {step: 'guardian', discovery_id: X, retry: 0} with sleep_seconds=0

pg_cron (every 30s)
  -> Invokes pipeline-worker Edge Function via net.http_post()

pipeline-worker Edge Function:
  -> Pop message from 'pipeline-steps' queue
  -> Route to handler based on step field
  -> On success: enqueue next step with sleep_seconds=60
  -> On failure (retryable): re-enqueue with sleep_seconds=120, retry+1
  -> On failure (permanent): update discovery as failed, archive message
```

**What to keep from current implementation:**
- The pg_cron retry job (migration 004) concept is sound — adapt it to check for stuck queue messages
- The `_pipeline_config` table for storing secrets is a good pattern
- The individual pipeline step logic (Guardian validation, Visionary research, etc.) stays the same

**What to change:**
- Replace pg_net trigger (migration 003) with queue-based chaining
- Consolidate 4 separate pipeline functions into 1 worker function that routes internally
- Add pgmq extension and queue creation to migrations
- Each step enqueues the next step instead of updating `pipeline_status` to trigger the next function

**Migration path:** Can be done incrementally:
1. Enable pgmq, create queue
2. Add pipeline-worker function
3. Modify Guardian to enqueue instead of relying on trigger
4. Test, then migrate remaining steps
5. Remove migration 003 trigger once fully migrated

---

## 5. Hybrid Option Worth Considering

**pgmq + pg_net trigger as fast-path optimization:**

Keep the pg_net trigger from migration 003 as a "fast path" for steps that don't need delays (Guardian -> Visionary has no Claude call in Guardian, so no rate-limit concern). Use pgmq with `sleep_seconds=60` only for the Claude-to-Claude transitions (Visionary -> Architect -> Oracle).

This gives immediate firing where safe and delayed firing where needed. The pg_cron worker acts as a safety net for any pg_net failures.

---

## 6. Alternative Worth Mentioning: Simple pg_cron Polling (No pgmq)

If enabling pgmq is not possible (Postgres version too old), the pg_cron polling approach is the second-best option. It's what migration 004 already partially implements. Extend it:

- Add `pipeline_step_ready_at` timestamp column to discoveries
- Each pipeline step sets `pipeline_step_ready_at = now() + interval '60 seconds'`
- pg_cron job every 30s: find rows WHERE `pipeline_step_ready_at < now()` AND status in processing states
- Invoke appropriate function via pg_net

This is simpler but reinvents what pgmq already provides. Use this as a fallback if pgmq is unavailable.

---

## 7. Things Nobody Asked About But Should Consider

1. **Postgres version check.** pgmq requires >= 15.6.1.143. The project should verify its current Supabase Postgres version before committing to the Queues approach.

2. **Idempotency.** Every pipeline step MUST be idempotent. If the worker processes the same message twice (visibility timeout race), the step should detect it's already complete (check pipeline_status) and skip.

3. **Concurrency control.** What if two discoveries are submitted simultaneously? The 30K tokens/min rate limit is per-API-key, not per-discovery. Two parallel Visionary calls will both hit the limit. The worker should process one message at a time and enforce a global cooldown.

4. **Queue monitoring.** Add a dashboard view showing queue depth, processing times, and failed messages. The `pgmq.q_pipeline_steps` and `pgmq.a_pipeline_steps` tables are queryable.

5. **Dead letter handling.** After N retries (3-5), move the message to a dead-letter queue or mark the discovery as permanently failed. Alert via the admin dashboard.

6. **Wall clock limits.** The worker function must complete within 150s (response time) or 400s (with waitUntil background). A single Claude call can take 30-60s. The worker should process ONE message per invocation to stay well within limits.

7. **Service role key in `_pipeline_config`.** The current approach stores the service role key in a plain table. Consider migrating to Vault (`vault.create_secret()`) as shown in the official pg_cron scheduling docs.

8. **`EdgeRuntime.waitUntil()`** could be used within the worker to return a 200 immediately and process the message in the background, buying more wall clock time (up to 400s on Pro).

---

## Sources

- [Processing Large Jobs with Edge Functions, Cron, and Queues](https://supabase.com/blog/processing-large-jobs-with-edge-functions)
- [Supabase Queues Documentation](https://supabase.com/docs/guides/queues)
- [Supabase Queues Quickstart](https://supabase.com/docs/guides/queues/quickstart)
- [Supabase Queues API Reference](https://supabase.com/docs/guides/queues/api)
- [Consuming Queue Messages with Edge Functions](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions)
- [Scheduling Edge Functions with pg_cron](https://supabase.com/docs/guides/functions/schedule-functions)
- [Edge Function Background Tasks (waitUntil)](https://supabase.com/docs/guides/functions/background-tasks)
- [Edge Function Wall Clock Limits](https://supabase.com/docs/guides/troubleshooting/edge-function-wall-clock-time-limit-reached-Nk38bW)
- [Edge Function Limits](https://supabase.com/docs/guides/functions/limits)
- [pg_net Extension Documentation](https://supabase.com/docs/guides/database/extensions/pg_net)
- [pg_net Silent Failure Discussion #37591](https://github.com/orgs/supabase/discussions/37591)
- [pg_net Multiple Insert Bug #86](https://github.com/supabase/pg_net/issues/86)
- [pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Cron Module](https://supabase.com/modules/cron)
- [pgmq Extension](https://supabase.com/docs/guides/queues/pgmq)
