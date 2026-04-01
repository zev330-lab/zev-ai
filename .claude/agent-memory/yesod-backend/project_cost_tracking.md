---
name: cost_tracking_infrastructure
description: Token cost tracking layer added to stats API — blended rate, shared utility, per-agent and 7-day trend data
type: project
---

Cost tracking was added to the admin stats API in March 2026.

**Why:** Owner wanted visibility into per-agent and daily token spend without an external billing dashboard.

**How to apply:** Any new feature that surfaces cost data should import `tokensToCost` / `formatCost` / `formatTokens` from `src/lib/cost-utils.ts` rather than computing rates inline. The blended rate ($0.006/1K tokens) is documented there with the full rationale (70% Haiku / 30% Sonnet mix).

`GET /api/admin/stats` now returns five additional fields:
- `daily_trend` — array of 7 objects `{ date, actions, tokens, cost }`, always 7 entries (zero-padded for empty days)
- `agent_costs` — array of `{ agent_id, tokens, actions, cost }` for agents active in last 7 days
- `total_cost_today` — float, dollars
- `total_cost_7d` — float, dollars
- `system_uptime_hours` — hours since earliest recorded tola_agents heartbeat

These are derived by pulling `tola_agent_log(created_at, tokens_used, agent_id)` for the last 7 days and aggregating in JavaScript — no DB-side GROUP BY — to keep the query simple and avoid Supabase PostgREST aggregation limits.
