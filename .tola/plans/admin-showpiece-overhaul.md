# Admin Backend Showpiece Overhaul — Build Plan

**Planned by:** Binah (Planner)
**Date:** 2026-03-21
**Goal:** Transform the 11-page admin backend from functional to showpiece-quality — the kind of dashboard that makes clients say "I want that" when demoed.

---

## Current State Assessment

What exists is solid but utilitarian. Every page works. But a demo-ready dashboard needs three things the current build lacks: **visual storytelling** (data trends, not just numbers), **real cost accountability** (actual token spend, not estimates), and **personality** (the family hub should feel warm, the TOLA tree should feel alive). Here is the gap analysis:

| Area | Current | Gap |
|------|---------|-----|
| Dashboard stats | 12 flat number cards, no trends | No sparklines, no 7-day comparison, no "direction" indicators |
| TOLA tree | Custom React Flow nodes with health rings | No token cost overlay, no throughput indicators on edges, no aggregate cost display |
| Agent panel | Shows estimated cost/day (static string) | `tokens_used` column exists in `tola_agent_log` but is never aggregated for real cost |
| Agent cards | Grid of 11 cards with status/latency | No token spend per agent, no mini activity chart |
| Dashboard | Stat cards + pipeline stages + activity feed | No Recharts integration despite Recharts being installed |
| Family hub | Kanban + events + notes, basic avatars | Seed data uses "Family Member 2/3/4", needs real names and two missing members (Allan, Sarina) |
| Activity feed | Text list with dots, polls every 15s | No token cost shown inline, no geometry icon |

## Architecture Decisions

1. **No new dependencies.** Recharts is already installed. Framer Motion is available. @xyflow/react handles the tree. Everything needed is present.
2. **No new database migrations.** All data exists — `tokens_used` in `tola_agent_log`, Recharts-ready time series from `monthly_metrics`, existing seed data in `family_members`. The only DB operation is an UPDATE to fix family member names.
3. **No API credential setup.** No OAuth, no external services. Pure frontend + stats API changes.
4. **Stats API is the single backend chokepoint.** Most phases touch `/api/admin/stats/route.ts` — it needs to grow from 105 lines to ~250 lines to power sparklines and cost data. Phase 1 modifies it; all other phases consume the expanded data.
5. **Token-to-cost conversion** uses static pricing constants (Sonnet: $3/M input + $15/M output tokens; Haiku: $0.25/M input + $1.25/M output). Since `tola_agent_log.tokens_used` does not split input/output, we use a blended estimate of $0.006/1K tokens (medium tier Sonnet average). This is stored as a constant, not a config value.

## Family Member Update

A single SQL statement executed via Supabase SQL Editor (not a migration file, since this is data correction):

```sql
-- Update existing placeholders
UPDATE family_members SET name = 'Irit', avatar_color = '#e879f9' WHERE role = 'spouse';
UPDATE family_members SET name = 'Havi' WHERE role = 'child' AND avatar_color = '#4ade80';
UPDATE family_members SET name = 'Parker' WHERE role = 'child' AND avatar_color = '#f59e0b';
-- Add missing parents
INSERT INTO family_members (name, role, avatar_color) VALUES
  ('Allan', 'parent', '#60a5fa'),
  ('Sarina', 'parent', '#f472b6')
ON CONFLICT DO NOTHING;
```

This is a **manual step** — not part of any build phase. The executor should include it in their commit message as a required post-deploy action.

---

## Phase Breakdown

### Phase 1: Stats API Expansion + Dashboard Sparklines

**Priority:** Highest (dependency for Phases 2, 3, 4)
**Dependencies:** None
**Impact:** Dashboard goes from "flat numbers" to "living data"

#### What Changes

1. **Expand `/api/admin/stats/route.ts`** to return three new data blocks:
   - `token_cost_by_agent`: Aggregate `SUM(tokens_used)` from `tola_agent_log` grouped by `agent_id`, for last 24h and last 7d. Convert to dollar cost using `COST_PER_1K_TOKENS = 0.006`.
   - `daily_activity_7d`: Array of `{ date, actions, tokens, pipelines }` for the last 7 days. One query: `SELECT date_trunc('day', created_at) as day, count(*), sum(tokens_used) FROM tola_agent_log WHERE created_at > now() - interval '7 days' GROUP BY day ORDER BY day`.
   - `cost_total_24h` and `cost_total_7d`: Scalar dollar amounts derived from the token sums.

2. **Rebuild Dashboard page (`src/app/admin/page.tsx`):**
   - Replace flat `StatCard` components with `StatCardWithSparkline` that accepts a 7-day data array and renders a tiny Recharts `<AreaChart>` (40px tall, no axes, gradient fill).
   - Add direction indicators (up/down arrows) comparing today vs. 7-day average.
   - Add a "System Cost" card showing `$X.XX last 24h` with a 7-day sparkline.
   - Add a "Token Usage" card showing total tokens with per-agent breakdown bar.
   - Keep the Cost Control toggle, Pipeline Stages, Alerts, and Activity Feed sections — they are already good.

#### Files Modified

| File | Current Lines | Change | New Lines (est.) |
|------|--------------|--------|------------------|
| `src/app/api/admin/stats/route.ts` | 105 | Add 3 new query blocks + cost calculation | ~250 |
| `src/app/admin/page.tsx` | 341 | Replace StatCard, add sparklines, cost card | ~420 |

#### Definition of Done
- Dashboard loads with sparklines visible even when data is sparse (empty sparklines show flat line, not broken).
- "System Cost: $X.XX (24h)" card is accurate against manual `SELECT SUM(tokens_used) FROM tola_agent_log WHERE created_at > now() - interval '1 day'`.
- Direction arrows show correct up/down vs. 7-day average.
- No new API calls — single `/api/admin/stats` fetch powers everything.

---

### Phase 2: Real Cost Tracking in Agent Panel + Agent Cards

**Priority:** High (showpiece differentiator)
**Dependencies:** Phase 1 (consumes `token_cost_by_agent` from stats API)
**Impact:** Every agent shows real spend, not estimates

#### What Changes

1. **Agent Panel (`src/components/admin/agent-panel.tsx`):**
   - Replace the static `costPerDay.medium` display with real cost from `tola_agent_log`.
   - Add a new section: "Token Usage (7d)" showing a small Recharts `<BarChart>` of daily token consumption for this specific agent.
   - Fetch data from a new lightweight endpoint or from the existing per-agent logs endpoint (aggregate client-side from the logs already fetched).
   - Show both estimated and actual side by side: "Est: $0.01/day | Actual (7d avg): $0.008/day".

2. **Agent Cards grid (`src/app/admin/agents/page.tsx`):**
   - Add a "Cost (7d)" line to each card showing `$X.XX` actual spend.
   - Add a tiny inline token bar (colored proportionally to total system spend).
   - The stats API from Phase 1 provides `token_cost_by_agent` — use it here instead of making 11 separate API calls.

3. **Create shared cost utility (`src/lib/cost-utils.ts`):**
   - `COST_PER_1K_TOKENS` constant.
   - `tokensToCost(tokens: number): number` function.
   - `formatCost(cost: number): string` function (e.g., "$0.03").
   - Used by Phase 1, 2, and 3 to avoid duplication.

#### Files Modified

| File | Current Lines | Change | New Lines (est.) |
|------|--------------|--------|------------------|
| `src/lib/cost-utils.ts` | NEW | Token-to-cost constants and formatters | ~25 |
| `src/components/admin/agent-panel.tsx` | 450 | Add real cost section, 7d bar chart | ~530 |
| `src/app/admin/agents/page.tsx` | 293 | Add cost line per card, consume stats API | ~340 |

#### Definition of Done
- Agent panel shows "Actual (7d): $X.XX" next to the estimate.
- Clicking any agent card shows a 7-day token bar chart in the panel.
- Agent cards grid includes cost per agent without additional API calls (uses stats endpoint data).
- Cost utility is imported by 3+ files with no duplication.

---

### Phase 3: TOLA Tree Cost Overlay + Enhanced Visualization

**Priority:** High (this is the visual centerpiece)
**Dependencies:** Phase 1 (needs `token_cost_by_agent`)
**Can be built in parallel with:** Phase 2

#### What Changes

1. **TOLA Tree component (`src/components/admin/tola-tree.tsx`):**
   - Add a "Cost View" toggle button in the stats bar (next to the legend). When toggled:
     - Node borders get a subtle cost-proportional glow intensity (more spend = brighter).
     - A small `$X.XX` label appears below each node's geometry label.
     - The stats bar shows "System Cost: $X.XX (24h)" with a pulsing indicator.
   - Add edge throughput visualization: edges between agents that have communicated recently get annotated with a small token count badge at the midpoint.
   - Enhance the activity footer: show `tokens_used` inline for each log entry (already in the data, just not displayed).

2. **Stats bar enhancements:**
   - Add "Cost: $X.XX/24h" pill to the existing stats row.
   - Show a top-3 spenders mini-list on hover or always-visible.

#### Files Modified

| File | Current Lines | Change | New Lines (est.) |
|------|--------------|--------|------------------|
| `src/components/admin/tola-tree.tsx` | 597 | Cost view toggle, node cost labels, edge badges, activity tokens | ~720 |

#### Definition of Done
- Cost view toggle switches between health view and cost view smoothly.
- Node cost labels are legible at default zoom.
- Activity footer entries show token counts.
- Total system cost in stats bar matches the dashboard figure.

---

### Phase 4: Family Hub Polish

**Priority:** Medium (personal touch, impressive in demo)
**Dependencies:** None (fully independent)
**Can be built in parallel with:** Phases 1, 2, 3

#### What Changes

1. **Family page (`src/app/admin/family/page.tsx`):**
   - Enhance the "Today" banner with a greeting: "Good morning, Zev" with current date, weather-style summary of the day (X tasks due, Y events).
   - Add a week-at-a-glance calendar strip (Mon-Sun, showing event dots and task counts per day) above the kanban.
   - Improve kanban cards with drag-and-drop visual hints (not full DnD — just better visual hierarchy):
     - Priority colors as left border stripe (not just a dot).
     - Assignee avatar circle in top-right of card.
     - Subtle hover lift animation (Framer Motion `whileHover`).
   - Enhance event cards with relative date badges ("Today", "Tomorrow", "In 3 days") and color-coded urgency.
   - Add family member "presence" row at the top showing all members as larger avatar circles with their task counts.
   - Update the empty states: "No tasks yet" with a subtle illustration description or motivational text.

2. **Family member avatars throughout the admin:**
   - The member filter bubbles already exist and are good. Make them slightly larger (from `w-7 h-7` to `w-8 h-8`) and add the member name as a tooltip.

#### Files Modified

| File | Current Lines | Change | New Lines (est.) |
|------|--------------|--------|------------------|
| `src/app/admin/family/page.tsx` | 323 | Week strip, enhanced cards, greeting, presence row | ~480 |

#### Definition of Done
- Page opens with "Good [morning/afternoon/evening], Zev" and today's date.
- Week-at-a-glance strip shows 7 days with event/task indicators.
- Kanban cards have colored left borders matching priority.
- Family member avatars show task counts.
- All 6 family members appear (requires the manual SQL update above to have been run).

---

### Phase 5: Activity Feed Enhancement + Cross-Page Polish

**Priority:** Medium
**Dependencies:** Phase 1 (uses expanded stats data)
**Can be built in parallel with:** Phase 4

#### What Changes

1. **Activity Feed component (`src/components/admin/activity-feed.tsx`):**
   - Add sacred geometry micro-icons next to each entry (using the existing `GEOMETRY_COMPONENTS` but rendered at 14px).
   - Show token count inline: "health-check via Flower of Life (1.2K tokens, 340ms)".
   - Add a subtle color-coded left border per agent (reuse agent avatar colors or health colors).
   - Add "cost" column: show `$0.001` per entry based on `tokens_used`.

2. **Dashboard Activity section:**
   - Replace the current text-only ActivityFeed with a richer version that shows the geometry icon + token cost.
   - Add a "View All" link to `/admin/agents` (or a dedicated activity page in the future).

3. **Cross-page stat consistency:**
   - Ensure the `actions_today` count on the dashboard matches the TOLA tree stats bar.
   - Ensure the `cost_total_24h` shown on dashboard matches the TOLA tree cost display.

#### Files Modified

| File | Current Lines | Change | New Lines (est.) |
|------|--------------|--------|------------------|
| `src/components/admin/activity-feed.tsx` | 106 | Geometry icons, token cost, colored borders | ~150 |
| `src/app/admin/page.tsx` | ~420 (post-Phase 1) | Activity section refinement | ~430 |

#### Definition of Done
- Activity feed entries show geometry icons at 14px.
- Token cost is displayed per entry.
- Dashboard and TOLA tree show consistent numbers.

---

## Build Dependency Graph

```
Phase 1 (Stats API + Dashboard)
  |
  +---> Phase 2 (Agent Cost Tracking)
  |
  +---> Phase 3 (TOLA Tree Cost Overlay)
  |
  +---> Phase 5 (Activity Feed + Cross-Page)

Phase 4 (Family Hub) — INDEPENDENT, can start immediately
```

**Optimal execution order for a single builder:** Phase 4, Phase 1, Phase 2, Phase 3, Phase 5
**Optimal for two parallel builders:** Builder A: Phase 1 -> 2 -> 3 -> 5 | Builder B: Phase 4

---

## Constraints (Must NOT Change)

1. **React Flow node/edge type registration** must stay outside the component (lines 293-294 of tola-tree.tsx). Moving them inside causes re-renders that kill performance.
2. **`AGENT_DETAILS` constant structure** in `tola-agents.ts` — other components depend on its shape. Extend it, do not restructure.
3. **Stats API response shape** — add fields, never remove or rename existing ones. The dashboard, TOLA tree, and agent pages all consume it.
4. **Admin auth pattern** — every API route must check `isValidSession`. Do not bypass for convenience.
5. **CSS variable naming** — all admin pages use `var(--color-admin-*)`. Do not introduce hardcoded colors except in agent-specific health color maps.
6. **Recharts import pattern** — use named imports from `recharts` (already established in `finance/page.tsx`). Do not wrap in a custom chart component.

## Constraints (Family Hub Specific)

7. **Family member names** must match exactly: Zev, Irit, Havi, Parker, Allan, Sarina. Irit's role in the DB is "spouse" (she is referred to as "girlfriend" in conversation but the DB schema uses "spouse" as the role enum value — do not change the schema).
8. **Family member avatar colors** are specified and must not change: Zev (#7c9bf5), Irit (#e879f9), Havi (#4ade80), Parker (#f59e0b), Allan (#60a5fa), Sarina (#f472b6).

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stats API becomes slow with new queries | Medium | High | Use `Promise.all` for all new queries (already the pattern). Add `head: true` + `count: 'exact'` for counts. The 7-day aggregation query is the heaviest — add `.limit(7)` and ensure the `created_at` index is used. |
| Recharts SSR issues | Low | Medium | All admin pages are `'use client'`. Recharts renders client-side only. No risk. |
| Empty data makes sparklines look broken | High (new installs) | Medium | Sparklines must handle 0-length arrays gracefully. Render a flat line at y=0 with 50% opacity. Test with empty `tola_agent_log` table. |
| Family member SQL update not run | High (first deploy) | Low | Phase 4 code must handle names gracefully. If "Family Member 2" appears, the UI still works — just looks bad. Add a check: if any member name starts with "Family Member", show an amber banner "Update family member names in Supabase". |
| Token cost estimates are inaccurate | Medium | Low | Clearly label costs as "estimated" in the UI: "~$0.03 (est.)". The blended rate is an approximation. Add a tooltip explaining the calculation. |

---

## Total Estimated Changes

| Metric | Value |
|--------|-------|
| Files created | 1 (`src/lib/cost-utils.ts`) |
| Files modified | 7 |
| Net new lines (estimated) | ~600 |
| Database migrations | 0 |
| Manual DB operations | 1 (family member name update) |
| New dependencies | 0 |
| New API endpoints | 0 (expanded existing) |

---

## What "Done" Looks Like

When all 5 phases are complete, a demo walkthrough goes like this:

1. **Dashboard** opens with sparklines showing 7-day trends, a real-time cost tracker, and direction arrows on every stat. The viewer sees motion, not stasis.
2. Click **TOLA** — the Tree of Life is alive with animated paths. Toggle "Cost View" — every node shows its actual spend. The system costs $0.08/day and you can see exactly where.
3. Click any **agent node** — the slide-out shows real token spend with a 7-day bar chart, next to the estimated budget. "Guardian ran 48 times this week, spent $0.02."
4. Navigate to **Family Hub** — "Good afternoon, Zev." A week-at-a-glance strip shows Thursday is busy. The kanban has color-coded priority stripes. Six family members with avatar circles and task counts.
5. The **activity feed** everywhere shows sacred geometry icons next to each action with inline cost per operation.

That is showpiece quality.
