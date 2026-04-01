# Claude as Primary Business Interface — Vision + Roadmap

**Synthesized:** 2026-03-22 | **Source:** `.tola/research/claude-primary-interface-expansion.md`

---

## 1. Vision Statement

Claude becomes the primary way Zev operates his business. Instead of navigating 11 admin pages and clicking through tabs, Zev types natural language commands into a single interface that can read data, create records, trigger agents, and orchestrate multi-step workflows across every module. The GUI remains for spatial tasks (kanban, calendar, flow diagrams) but the chat can do anything the GUI can do — and compound actions the GUI cannot. This is also the live demo that sells Zev's consulting practice: "I'll show you what I built for myself, and I'll build it for you."

---

## 2. Current State (Before Phase 1)

What existed before this work began:

| Component | File | Capability | Limitation |
|-----------|------|------------|------------|
| Admin Chat | `src/components/admin/admin-chat.tsx` | Claude Sonnet, 20-msg context, markdown rendering | Read-only. `getLiveContext()` dumped ~1,500 tokens of flat text from 10 tables on every message. No tool use. No streaming. No mutations. |
| Public Chat | `src/components/chat-widget.tsx` | Claude Haiku, lead extraction after 3+ messages, auto-creates contacts/discoveries | Stateless, no tool use, no streaming, 512 max tokens |
| Command Palette | `src/components/admin/command-palette.tsx` | Cmd+K search across pages/discoveries/contacts/posts | Keyword only. No NLP. No actions beyond navigation. |
| API Routes | `src/app/api/admin/*` | 27+ routes covering all modules (contacts, discoveries, projects, finance, family, knowledge, content, social, agents, settings) | Fully functional but only accessible via GUI clicks |

**The gap:** The chat was a well-connected reporter — knew everything, could do nothing. Every action required leaving the chat, navigating to the right page, finding the right row, clicking buttons.

---

## 3. Phase 1: Agentic Tool Use (DONE)

**What was built:** Full agentic Claude interface with read+write tools, multi-step reasoning, and transparent execution display.

### Implementation

**Backend** — `src/app/api/admin/chat/route.ts`
- 15 tools defined as JSON schemas, passed to Claude API `tools` parameter
- Agentic loop: Claude returns `tool_use` blocks, server executes against Supabase, returns results, Claude continues or responds. Max 5 rounds.
- All tools execute via `getSupabaseAdmin()` directly (not through API routes — direct DB access for speed)
- Auth: validates `admin_auth` session cookie via `isValidSession()`
- Model: `claude-sonnet-4-6`, 2048 max tokens
- Cost tracking: `tokensToCost()` and `formatCost()` from `src/lib/cost-utils.ts`

**Frontend** — `src/components/admin/admin-chat.tsx`
- 440px panel, bottom-right, "Agentic" badge in header
- Transparent tool call display: collapsible section shows each tool name, input params, and result snippet
- Token count + cost displayed per response
- 5 starter prompts: prioritization, meeting prep, projects, time logging, task creation
- Markdown rendering (headers, bold, lists, numbered items)

### Tool Catalog (15 tools)

**Read (10):**
| Tool | What it queries |
|------|----------------|
| `search_contacts` | Contacts by name/email/company/status |
| `search_discoveries` | Discoveries by name/company/pipeline_status |
| `get_projects` | Projects + milestones + time entries (enriched) |
| `get_invoices` | Invoices by status/client |
| `get_family_data` | Tasks/events/notes, optionally filtered |
| `get_agents` | Agent health + 7-day activity + token usage |
| `get_blog_posts` | Posts by status/category |
| `get_social_queue` | Social posts by platform/status |
| `search_knowledge` | Knowledge base by query/source |
| `get_dashboard_stats` | Aggregate: discoveries, agents, costs, finance, family, content |

**Write (5):**
| Tool | What it does |
|------|-------------|
| `create_family_task` | Creates task with title, priority, due date, assignee (fuzzy matched) |
| `log_project_time` | Logs hours to project (fuzzy name match), with description and date |
| `create_knowledge_entry` | Adds insight/lesson/note to knowledge base |
| `update_contact_status` | Updates CRM status + appends notes (by email or name) |
| `trigger_agent` | Invokes any of 15 edge functions (validated against whitelist) |

### What Phase 1 does NOT have
- No streaming (full response returned as JSON blob)
- No conversation persistence (resets on page refresh)
- No page-aware context (chat does not know what admin page you are on)
- No confirmation dialogs for write actions (Claude confirms in text, not UI)
- No external service integration (no Gmail, Calendar, etc.)
- No structured/rich UI responses (text + markdown only)

---

## 4. Phase 2: Persistence + Context + Templates (NEXT)

### 4a. Conversation Persistence

**Goal:** Chat history survives page refresh and is queryable across sessions.

**Implementation plan:**
- New Supabase table: `admin_chat_sessions` — id, title (auto-generated from first message), messages (JSONB array), tool_calls_count, total_tokens, created_at, updated_at
- On first message of a new session, create a row. On each subsequent message, append to the JSONB array.
- Chat UI: add a "History" button that shows past sessions. Clicking one loads it.
- API change: `POST /api/admin/chat` accepts optional `session_id`. If provided, loads history from DB instead of relying on client-sent messages.
- Retention: auto-archive sessions older than 30 days (Foundation agent could handle this).
- Enables: "Remember when I asked about ButcherBox last week?" — Claude can reference stored conversations.

### 4b. Page-Aware Context

**Goal:** When the chat opens on `/admin/discoveries`, it knows that. "What's wrong with this one?" refers to the currently viewed discovery.

**Implementation plan:**
- `AdminChat` component accepts a `context` prop: `{ page: string; entityType?: string; entityId?: string; entityData?: object }`
- Each admin page passes its context: the discoveries page passes the selected discovery, the contacts page passes the selected contact, etc.
- The context is injected into the system prompt as a `CURRENT_PAGE_CONTEXT` block.
- No new tools needed — the context is just additional system prompt text.

### 4c. Saved Command Templates

**Goal:** "When I say 'weekly report,' pull discoveries, invoices, blog posts, and social metrics from the last 7 days."

**Implementation plan:**
- New Supabase table: `chat_templates` — id, trigger_phrase, expanded_prompt, created_at
- When user says "remember: when I say X, do Y," Claude calls a `save_template` tool
- On each message, server checks if input matches a trigger phrase (exact or fuzzy). If so, expands the prompt before sending to Claude.
- Starter: pre-seed with "weekly report," "morning briefing," "prep for meeting"

### 4d. SSE Streaming

**Goal:** Token-by-token response rendering, progressive tool execution display.

**Implementation plan:**
- Change `POST /api/admin/chat` response from JSON to `text/event-stream`
- Stream text tokens as `data: {"type":"text","content":"..."}` events
- Stream tool calls as `data: {"type":"tool_start","name":"search_contacts"}` and `data: {"type":"tool_result","name":"...","result":"..."}` events
- Frontend: replace `fetch` + JSON parse with `fetch` + `ReadableStream` reader
- Tool execution display updates live as each tool starts and completes

---

## 5. Phase 3: MCP + Desktop + Generative UI (FUTURE)

### 5a. MCP Server

**Goal:** Expose all tools as an MCP server so Claude Desktop / Claude Code / Cursor can access the full admin system.

**Architecture:**
```
Tool Definitions (shared JSON schemas)
  |
  +-- Web chat: Claude API tool_use parameter (Phase 1, done)
  |
  +-- MCP server: registers same tools as MCP tools
  |
  +-- Both call: Supabase directly (or /api/admin/* routes)
```

**Composition with external MCP servers:**
- Supabase MCP (official, `mcp.supabase.com`) — direct DB access with OAuth
- Google Workspace MCP — Gmail + Calendar + Drive
- Slack MCP (official) — 47 tools
- Custom zev.ai MCP — wraps the 15+ tools from Phase 1

**Enables:** "Check my calendar, find my meeting with John, pull his discovery, draft a briefing, email it to him" — orchestrated across Google Calendar MCP + zev.ai MCP + Gmail MCP from Claude Desktop.

**Google OAuth note:** Single-user setup. Use Google OAuth "testing" mode (< 100 users, no verification needed). Needs offline refresh tokens for `@gmail.com`.

### 5b. Claude Desktop Access

**Goal:** Zev interacts with admin system from Claude Desktop without opening browser.

**Depends on:** MCP server (5a). Once the MCP server is deployed, Claude Desktop connects via config file.

### 5c. Generative UI

**Goal:** Chat responses include interactive components, not just text. "Show me overdue invoices" renders a sortable table with action buttons.

**Two approaches:**

1. **Structured response rendering (simpler):** Claude returns structured JSON (`display_type: "invoice_list"`, `data: [...]`). Client has a registry of display components (`InvoiceCard`, `DiscoveryTimeline`, `TaskKanban`, `ContactCard`, `AgentHealthGrid`) and renders the matching one. Many of these components already exist in admin pages.

2. **Vercel AI SDK streamUI (complex):** Server streams React Server Components to client. Requires RSC refactor. More powerful but significantly harder to debug and maintain.

**Recommendation:** Start with structured response rendering. The component registry maps naturally to existing admin page components. Full generative UI is a Phase 4 consideration.

---

## 6. Architecture

### Tool Execution Flow (Phase 1, current)

```
User types message
  |
  v
POST /api/admin/chat (validates admin_auth cookie)
  |
  v
Build messages array (last 20 messages from client)
  |
  v
Claude API call (system prompt + 15 tool schemas + messages)
  |
  v
Claude returns: tool_use blocks OR text
  |
  +-- If tool_use: executeTool() runs Supabase queries
  |     |
  |     v
  |   Tool results appended to messages
  |     |
  |     v
  |   Claude API called again (sees tool results)
  |     |
  |     v
  |   Repeat (max 5 rounds)
  |
  +-- If text (or stop_reason: end_turn): return response
        |
        v
      JSON response: { response, tool_calls[], usage }
        |
        v
      Client renders: markdown text + collapsible tool call display
```

### Tool-to-Data Mapping

All tools execute via `getSupabaseAdmin()` (service role, bypasses RLS). No intermediate API route calls — direct DB access for minimal latency.

Key query patterns:
- **Fuzzy search:** `.ilike('name', '%${query}%')` or `.or('name.ilike..., email.ilike..., company.ilike...')`
- **Enrichment:** `get_projects` does parallel queries for milestones + time entries, then merges
- **Aggregation:** `get_dashboard_stats` queries 6 tables in `Promise.all()`, computes summaries
- **Fuzzy write:** `log_project_time` matches project by name (`ilike`), takes first result
- **Agent trigger:** Direct `fetch` to Supabase Edge Function URL with service role key

### Confirmation Tiers (for write operations)

Current state: no UI confirmation. Claude confirms in prose ("Task created: ...").

Planned tiering:
| Tier | Actions | Confirmation |
|------|---------|-------------|
| Auto-execute | All read operations | None |
| Soft confirm | Create task, log time, add knowledge entry, update contact status | Claude states what it did in response text |
| Hard confirm | Trigger agent, publish content, send email (future), delete (future) | UI confirmation dialog before execution |

### System Prompt

Located inline in `route.ts` as `SYSTEM_PROMPT` constant. Key behavioral directives:
- "Be direct, specific, actionable. Zev is technical."
- Priority order: revenue-blocking > time-sensitive > growth > maintenance
- Multi-tool use encouraged for comprehensive answers
- "Act like a chief of staff"

### Cost Profile

| Scenario | Tool calls | Approx. tokens | Approx. cost (Sonnet) |
|----------|-----------|----------------|----------------------|
| Simple question ("how many discoveries?") | 1 | ~3,000 | ~$0.02 |
| Prioritization query | 2-3 | ~5,000 | ~$0.04 |
| Meeting prep | 4-5 | ~8,000 | ~$0.08 |
| Max complexity (5 rounds) | 8-10 | ~12,000 | ~$0.12 |

Compared to old system: eliminates the ~1,500 token `getLiveContext()` dump on every message. Simple queries are cheaper. Complex queries cost more but deliver actual actions, not just prose.

---

## 7. Demo Script: "Prep Me for My Meeting"

This is the north-star interaction for client demos. It demonstrates multi-step agentic reasoning, cross-module data synthesis, and actionable output.

### Setup
- Have a contact "John Smith" (Acme Corp) in CRM with status `meeting_scheduled`
- Have a completed discovery for Acme Corp with research brief + assessment doc
- Have an outstanding invoice for Acme Corp
- Have a knowledge entry tagged with Acme Corp

### Script

**Zev types:** "Prep me for my meeting with John tomorrow"

**Claude executes (visible as collapsible tool calls):**
1. `search_contacts` `{query: "John"}` — finds John Smith, Acme Corp, status: meeting_scheduled
2. `search_discoveries` `{query: "Acme"}` — finds discovery #47, pipeline_status: complete, progress_pct: 100
3. `get_invoices` `{client_name: "Acme"}` — finds $8,500 outstanding invoice, sent 14 days ago
4. `search_knowledge` `{query: "Acme"}` — finds meeting notes from initial call

**Claude responds with structured briefing:**
- **Who:** John Smith, COO at Acme Corp. First contact 3 weeks ago via discovery form.
- **Pipeline:** Assessment complete. Key pain points: [from discovery]. Recommended scope: [from assessment doc].
- **Financials:** $8,500 invoice sent 14 days ago, still outstanding. Follow up.
- **Talking Points:** Based on assessment findings, lead with [specific recommendation]. Address [specific concern from notes].
- **Suggested Agenda:** 1) Relationship check-in, 2) Review assessment findings, 3) Discuss proposal, 4) Address invoice status.

**Zev types:** "Create a follow-up task for after the meeting"

**Claude executes:**
5. `create_family_task` `{title: "Follow up with John Smith re: Acme proposal", priority: "high", due_date: "2026-03-24", assigned_to_name: "Zev"}`

**Claude responds:** "Task created: 'Follow up with John Smith re: Acme proposal' (high priority, due March 24, assigned to Zev)"

### What this demonstrates to prospects
- Natural language replaces 4 different admin pages
- AI synthesizes across modules without manual context-switching
- Write actions happen inline (task creation)
- Full transparency on what the AI did (tool call display)
- The system is built, running, and real — not a mockup

### Future demo additions (Phase 2-3)
- "Send John a reminder about the invoice" (Gmail MCP)
- "What time is the meeting?" (Calendar MCP)
- "Show me the discovery" (generative UI renders the discovery card inline)

---

## Key Files

| File | Role |
|------|------|
| `src/app/api/admin/chat/route.ts` | Agentic loop, tool definitions, tool execution, system prompt |
| `src/components/admin/admin-chat.tsx` | Chat UI, tool call transparency display, starters |
| `src/lib/cost-utils.ts` | Token-to-cost calculation, formatting |
| `src/lib/auth.ts` | Session token validation (shared by chat + all admin routes) |
| `src/lib/supabase.ts` | `getSupabaseAdmin()` — service role client used by all tools |
| `.tola/research/claude-primary-interface-expansion.md` | Full Chokhmah expansion (competitive analysis, architecture options, risk assessment) |

---

## Decisions Made

1. **Architecture: Option A (tool use via Claude API)** — not generative UI, not MCP-first. Tool use is the simplest path that delivers full read+write capability using existing API routes and Supabase queries. MCP comes in Phase 3 as a parallel access layer.

2. **UI: Enhanced bottom-right panel** — not full-screen chat, not split view. Preserves all existing admin pages. The chat is additive. Avoids the risk of losing spatial navigation and muscle memory. Can evolve to a persistent command bar later.

3. **Tools execute directly against Supabase** — not via API route fetch calls. Eliminates HTTP overhead for tool execution. The chat route already validates auth, so the tools inherit that security boundary.

## Decisions Deferred

1. **Streaming** — Phase 2. Works without it. Adds significant complexity to both server (SSE) and client (ReadableStream parsing). Worth doing but not blocking.

2. **Google OAuth integration** — Phase 3. Requires OAuth consent screen setup, refresh token handling, and either custom tool implementation or MCP server. Calendar + Gmail are the highest-value external integrations.

3. **Generative UI** — Phase 3+. Structured response rendering (JSON display_type) is the pragmatic middle ground. Full RSC streaming is an optimization for later.
