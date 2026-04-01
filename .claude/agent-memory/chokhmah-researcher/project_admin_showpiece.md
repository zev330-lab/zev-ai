---
name: Admin Backend Showpiece Initiative
description: Research phase for upgrading TOLA admin dashboard with mission-control aesthetics, agent monitoring, cost tracking, Google Calendar/Gmail integration, Claude as primary interface, and personal OS transformation
type: project
---

Zev wants the admin backend to be spectacular — a demo-worthy showpiece for AI consulting prospects. Seven research areas identified:
1. AI agent monitoring UIs (LangSmith, Langfuse, AgentOps patterns)
2. Mission control / operations center design (NASA Open MCT, SpaceX patterns)
3. React Flow node visualization best practices
4. Family hub improvements (Cozi, FamilyWall, Homsy patterns, Google Calendar integration)
5. Cost tracking / token usage dashboards
6. Google Calendar + Gmail deep integration — transform dashboard into a personal operating system (research completed 2026-03-21, expansion doc at `.tola/research/google-calendar-gmail-personal-os-expansion.md`)
7. Claude as Primary Admin Interface — conversational command center replacing tab-clicking with natural language tool use, agent orchestration, and generative UI (research completed 2026-03-22, expansion doc at `.tola/research/claude-primary-interface-expansion.md`)

**Why:** The admin panel doubles as a portfolio piece for prospective consulting clients. It needs to communicate sophistication and operational maturity at a glance. The "personal OS" vision (calendar + email + tasks + AI agents in one screen) is the differentiator from generic admin panels. The "Claude as primary interface" vision takes this further — the demo pitch becomes "I talk to my business and it does things."

**How to apply:** Future implementation work should prioritize visual impact and "alive" feel. Animations, real-time indicators, sparklines, and health rings are more important than feature completeness. Google Workspace integration should use OAuth2 with offline refresh token for a single personal user (not service account for consumer @gmail.com). MCP tools available for AI-assisted calendar/email through Admin Chat. The admin chat has 27+ existing API routes that can become Claude tools with no new backend code — the tool catalog should be the first implementation step.
