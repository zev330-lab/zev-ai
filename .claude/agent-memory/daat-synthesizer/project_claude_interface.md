---
name: Claude as Primary Admin Interface
description: Multi-phase project to transform admin chat from read-only reporter to agentic command center with tools, persistence, MCP
type: project
---

Phase 1 (agentic tool use) is complete as of 2026-03-22. 15 tools (10 read, 5 write) with agentic loop in `/api/admin/chat/route.ts`. Phase 2 (persistence, page-aware context, streaming, saved templates) is next. Phase 3 is MCP server + Claude Desktop + generative UI.

**Why:** The admin chat was a well-connected reporter that could describe data but not act on it. Every action required navigating to a different page. This is also the primary client demo asset — showing prospects what an AI command center looks like in production.

**How to apply:** When Zev references the chat, admin interface, or TOLA assistant, this is the active project. Vision doc at `.tola/vision/claude-interface-roadmap.md`. Expansion research at `.tola/research/claude-primary-interface-expansion.md`. Route at `src/app/api/admin/chat/route.ts`, component at `src/components/admin/admin-chat.tsx`.
