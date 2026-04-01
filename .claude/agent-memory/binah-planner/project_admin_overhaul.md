---
name: Admin showpiece overhaul
description: 5-phase plan to transform admin backend from functional to demo-quality — sparklines, real cost tracking, TOLA cost overlay, family hub polish
type: project
---

Admin backend overhaul planned 2026-03-21. Goal is "showpiece quality" — impressive enough to demo to clients.

**Why:** Admin pages work but lack visual storytelling (no sparklines/trends), show estimated costs instead of real token spend, and family hub has placeholder names.

**How to apply:** Plan is at `.tola/plans/admin-showpiece-overhaul.md`. 5 phases:
- Phase 1: Stats API expansion + dashboard sparklines (dependency for 2/3/5)
- Phase 2: Real cost tracking in agent panel + cards
- Phase 3: TOLA tree cost overlay + enhanced viz
- Phase 4: Family hub polish (INDEPENDENT, can start first)
- Phase 5: Activity feed enhancement

Key decisions:
- Token cost uses blended rate $0.006/1K tokens from tola_agent_log.tokens_used
- No new migrations — all data exists
- Family members need manual SQL UPDATE (Irit, Havi, Parker, Allan, Sarina)
- New shared utility: src/lib/cost-utils.ts
- Recharts already installed, no new dependencies
