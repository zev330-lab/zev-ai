# zev.ai Full Site Audit — 2026-03-30

## Executive Summary

### What Works
- **Public site is solid.** All 10 public pages return 200 with real, polished content. No placeholders, no skeletons. SEO schemas, RSS feed, OpenGraph all present.
- **Admin dashboard is real.** All 13 admin routes have functional UIs with data fetching, not empty shells. Auth protection works (307 redirect to login).
- **Discovery pipeline works end-to-end.** 9 discoveries have been processed through the full Guardian > Visionary > Architect > Oracle pipeline. 8 reached 100% completion with real report data.
- **Cain/Abel task system is active.** 137 tasks, running hourly health checks, Gmail scans, briefing updates. Last activity: 03:02 UTC today.
- **Background agents are cost-free.** All 7 background agent crons (Nexus, Guardian-bg, Crown, Prism, Catalyst-bg, Gateway, Foundation-bg) are pure SQL/HTTP — zero Claude API cost.
- **Blog has real content.** 11 published posts across 6 content pillars with proper JSON-LD schemas.

### What's Broken
- **Anthropic API credits exhausted.** Detected by Abel at 03:02 UTC today. The entire pipeline (Visionary, Architect, Oracle, Guardian quality gate, content engine) is dead until credits are added.
- **steinmetzrealestate.com is down (HTTP 503).** Abel has logged this across 6+ consecutive hourly health checks spanning 9+ hours.
- **4 blog posts stuck in pipeline.** 2 in `topic_research` (one for 8 days), 2 in `outlining` — all blocked by API credits.
- **Abel worker has PATH bug.** `timeout: command not found` (Exit 127) on macOS — ~25% of scheduled tasks fail.
- **cost_level double-encoded.** Stored as `"\"low\""` instead of `"low"` in tola_config — may cause comparison bugs.
- **Catalyst Test User anomaly.** `pipeline_status=complete` but `progress_pct=0` and `pipeline_completed_at=NULL` — inconsistent state.

### What's Just Code Doing Nothing
- **Social distribution is completely inert.** All 6 social accounts have `is_active=false` and no credentials. 9 social queue posts sit in `draft` forever. The distributor cron runs every 30 minutes but has nothing to publish.
- **Nurture sequences exist but are stalled.** 1 active sequence is 30+ hours overdue. No cron appears to be advancing it. Table is undocumented.
- **$26,500 in invoices sitting in draft.** All 5 invoices have never been sent. The auto-overdue flagging only works on `sent` invoices, so these are invisible to automation.
- **Family tasks table is empty.** Family members are seeded but no tasks exist.
- **Migration 020 (workspace_sync) not applied.** `workspace_projects` table doesn't exist.
- **Sentinel agent heartbeat is 10 days stale.** Still shows `status=healthy` because status is self-reported, not computed from heartbeat age.

### What's Wasting Money (or Could Be)
- **Pipeline crons polling with no work to do.** `advance-pipeline-cron` (every 5 min) and `advance-content-pipeline-cron` (every 5 min) are polling but can't do anything without API credits. These are pure SQL when idle, so no direct cost — but Edge Function invocations still count toward Supabase limits.
- **7 background agent crons running.** All free (pure SQL), but they're updating heartbeats and writing logs to tables that nobody is monitoring in real-time.
- **Social distributor cron (every 30 min)** calls the Next.js endpoint but finds nothing to publish every time.

---

## Part 1: Codebase Inventory

### Page Routes (24 total)

#### Public Routes (11) — All Real Content
| Route | Status | Description |
|-------|--------|-------------|
| `/` | REAL | "AI that actually works" hero, pain points, services journey, FAQ, CTA |
| `/services` | REAL | 6 service tiers ($0 to $15K+), detailed pricing, FAQs |
| `/approach` | REAL | Nature-inspired architecture, Tree of Life, 9 coordination patterns, 3-tier oversight |
| `/about` | REAL | Zev's story, real estate to AI, William Raveis background |
| `/work` | REAL | 2 case studies (Steinmetz RE, KabbalahQ.ai) in Problem/Process/Payoff format |
| `/blog` | REAL | Blog listing with 6-pillar category filtering, card grid, fetches from Supabase |
| `/blog/[slug]` | REAL | Dynamic posts with TOC, author bio, related posts, JSON-LD schemas |
| `/blog/rss.xml` | REAL | Valid RSS 2.0 feed, 11 items |
| `/discover` | REAL | 4-field form, promo code support, pipeline_track param |
| `/discovery/[id]` | REAL | Dynamic AI Insight Report page, tracks views |
| `/contact` | REAL | Contact form with email fallback |
| `/tola` | REDIRECT | 307 to /approach (working) |

#### Admin Routes (13) — All Functional
| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | REAL | Operations center: stats, cost control, alerts, activity feed, health score |
| `/admin/login` | REAL | Password auth with SHA-256 session tokens |
| `/admin/tola` | REAL | TOLA OS: React Flow graph, 22 paths, agent panels, workflow visualization, costs tab |
| `/admin/tola/collaboration` | REAL | Shared context visualization between agents |
| `/admin/discoveries` | REAL | Pipeline dashboard, progress bars, 5-tab detail, timeline visualization |
| `/admin/content` | REAL | Blog + social management, markdown viewer, publish controls |
| `/admin/agents` | REAL | Agent leaderboard, status visualization, Tree of Life, kill switches |
| `/admin/contacts` | REAL | CRM with status badges, Gmail links, meeting prep AI |
| `/admin/projects` | REAL | Project cards, milestone progress, time tracking, GitHub integration |
| `/admin/finance` | REAL | Invoice CRUD, revenue metrics, Recharts charts |
| `/admin/family` | REAL | Family tasks, events, notes, kanban, calendar strip |
| `/admin/knowledge` | REAL | Knowledge base search, source categorization, sync actions |
| `/admin/cain` | REAL | Cain/Abel task system, filter tabs, activity log, Realtime subscription |

### API Routes (31 endpoints)

#### Public APIs (9)
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/submit-discover` | POST | Discovery form submission, triggers pipeline |
| `/api/submit-contact` | POST | Contact form, sends email via Resend |
| `/api/blog` | GET | List published blog posts |
| `/api/newsletter` | POST | Newsletter subscription |
| `/api/chat` | POST | Public chat widget (Claude Haiku) |
| `/api/webhooks/stripe` | POST | Stripe $499 payment webhook |
| `/api/cain/push-task` | POST | Agent-to-agent task creation (Bearer auth) |
| `/api/cain/complete-task` | POST | Agent-to-agent task completion (Bearer auth) |
| `/api/cain/tasks` | GET | Cain task list (password protected) |

#### Admin APIs (22)
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/admin/login` | POST | Session creation |
| `/api/admin/discoveries` | GET, POST, PATCH | Discovery CRUD |
| `/api/admin/agents` | GET, PATCH | Agent list/update (kill_switch, tier, config) |
| `/api/admin/agents/[id]/logs` | GET | Per-agent activity log |
| `/api/admin/agents/trigger` | POST | Invoke Edge Function (validated against whitelist) |
| `/api/admin/activity` | GET | Latest tola_agent_log entries |
| `/api/admin/stats` | GET | Dashboard stats, 7-day trends, cross-module alerts |
| `/api/admin/content` | GET, POST, PATCH, DELETE | Blog post CRUD with publish workflow |
| `/api/admin/social` | GET, POST, PATCH, DELETE | Social queue CRUD |
| `/api/admin/social/publish` | POST | Publish to social platforms |
| `/api/admin/social-accounts` | GET, PATCH | Social account management |
| `/api/admin/settings` | GET, PATCH | System config (cost_level, auto_publish, etc.) |
| `/api/admin/contacts` | GET, PATCH | CRM contacts |
| `/api/admin/projects` | GET, POST, PATCH, DELETE | Project CRUD with milestones |
| `/api/admin/projects/sync` | POST | Sync workspace directory to DB |
| `/api/admin/finance` | GET, POST, PATCH | Invoices, monthly metrics |
| `/api/admin/family` | GET, POST, PATCH, DELETE | Family tasks/events/notes |
| `/api/admin/knowledge` | GET, POST, PATCH, DELETE | Knowledge base, sync actions |
| `/api/admin/cain` | GET, POST, PATCH | Cain/Abel tasks and log |
| `/api/admin/shared-context` | GET | Agent shared context entries |
| `/api/admin/chat` | POST | Admin chat (Claude Sonnet, data-connected) |
| `/api/admin/run-migration` | POST | Database migration runner |

### Supabase Edge Functions (17)
| Function | Calls Claude API | Calls Other Paid API | Purpose |
|----------|-----------------|---------------------|---------|
| agent-catalyst-bg | No | No | Pipeline velocity analysis |
| agent-crown | No | No | Governance, token tracking |
| agent-foundation-bg | No | No | DB maintenance, archival |
| agent-gateway | No | No | SEO/sitemap monitoring |
| agent-guardian-bg | No | No | Anomaly detection, circuit breaker |
| agent-nexus | No | No | Health scoring, path aggregation |
| agent-prism | No | No | Synthetic health checks |
| pipeline-architect | **YES (Sonnet)** | No | Scope assessment |
| pipeline-content-engine | **YES (Sonnet)** | No | 5-step blog generation |
| pipeline-distributor | No | No | Social post distribution |
| pipeline-free-summary | **YES (Sonnet)** | Resend | Personalized summary email |
| pipeline-gateway-delivery | No | Resend | Insight report delivery email |
| pipeline-guardian | **YES (Sonnet)** (quality gate only) | No | Input validation + quality gate |
| pipeline-oracle | **YES (Sonnet)** | No | Report synthesis + revision |
| pipeline-proposal | **YES (Sonnet)** | No | SOW generation |
| pipeline-social-agent | **YES (Sonnet)** | No | Daily social content |
| pipeline-visionary | **YES (Sonnet + web_search)** | No | Deep research |
| tola-agent (legacy) | **YES** | No | Unified fat function (superseded) |

### pg_cron Jobs (14 active)

#### Background Agents — FREE (pure SQL/HTTP)
| Job | Schedule | Function | Cost |
|-----|----------|----------|------|
| agent-nexus-health | Every 30 min | dispatch_agent('agent-nexus') | Free |
| agent-guardian-bg | Every 30 min | dispatch_agent('agent-guardian-bg') | Free |
| agent-crown-metrics | Every 2 hours | dispatch_agent('agent-crown') | Free |
| agent-prism-qa | Every 6 hours | dispatch_agent('agent-prism') | Free |
| agent-catalyst-velocity | Every 4 hours | dispatch_agent('agent-catalyst-bg') | Free |
| agent-gateway-seo | Every 6 hours | dispatch_agent('agent-gateway') | Free |
| agent-foundation-maint | Every 12 hours | dispatch_agent('agent-foundation-bg') | Free |

#### Pipeline Orchestration — PAID (dispatches Claude API calls when work exists)
| Job | Schedule | Function | Cost |
|-----|----------|----------|------|
| advance-pipeline-cron | Every 5 min | advance_pipeline() | Paid when discoveries in pipeline |
| advance-content-pipeline-cron | Every 5 min | advance_content_pipeline() | Paid when blog posts in pipeline |
| distribute-social-posts | Every 30 min | pipeline-distributor | Free (HTTP call to own API) |

#### Automation Watchdogs — FREE (pure SQL)
| Job | Schedule | Function | Cost |
|-----|----------|----------|------|
| auto-flag-overdue-invoices | Daily 9am ET | auto_flag_overdue_invoices() | Free |
| auto-flag-stale-contacts | Daily 9:30am ET | auto_flag_stale_contacts() | Free |
| auto-recover-stuck-pipelines | Every 5 min | auto_recover_stuck_pipelines() | Free |
| content-cadence-watchdog | Daily 10am ET | content_cadence_watchdog() | Free |

### Database Tables (22 documented + 2 undocumented)

| Table | Rows | Status | Purpose |
|-------|------|--------|---------|
| tola_agents | 11 | Active | Agent registry, health, config |
| tola_agent_log | 1,700 | Active | All agent activity logging |
| tola_agent_metrics | ? | Exists | Agent performance metrics |
| tola_shared_context | 34 | Active | Inter-agent communication backbone |
| tola_config | 7 | Active | System-wide config |
| _pipeline_config | 2 | Active | Pipeline dispatch config (URL + key) |
| discoveries | 9 | Active | Assessment pipeline records |
| contacts | 8 | Active | CRM contacts |
| blog_posts | ~15 | Active | Blog content (8 published, 4 stuck) |
| social_queue | 9 | Inert | Social posts (all draft, no platforms connected) |
| social_accounts | 6 | Inert | All `is_active=false`, no credentials |
| content_analytics | ? | Empty | Social engagement tracking |
| projects | 7 | Active | Project tracking |
| project_milestones | ? | Active | Project milestone tracking |
| project_time_entries | ? | Active | Time tracking |
| invoices | 5 | Stale | All draft, $26,500 unbilled |
| monthly_metrics | ? | Exists | Revenue/costs tracking |
| family_members | 6 | Seeded | Family member profiles |
| family_tasks | 0 | Empty | No tasks created |
| family_events | ? | Exists | Family events |
| family_notes | ? | Exists | Family notes |
| knowledge_entries | 28 | Active | Knowledge base (synced from discoveries) |
| cain_tasks | 137 | Active | Cain/Abel shared task system |
| cain_log | Many | Active | Cain/Abel activity log |
| **opus_messages** | **39** | **Active (UNDOCUMENTED)** | **Opus/Cain/Abel/Zev messaging** |
| **nurture_sequences** | **2** | **Stalled (UNDOCUMENTED)** | **Post-discovery nurture emails** |
| newsletter_subscribers | 0 | Empty | Newsletter signups (migration applied) |

### MCP Servers
**None configured.** No mcp.json or MCP configuration found in project or .claude/ directory.

---

## Part 2: Live Site Testing

### Public Pages — All Pass
| URL | Status | Content | Notes |
|-----|--------|---------|-------|
| askzev.ai/ | 200 | ~9K chars | Full landing page with hero, pain points, services, FAQ |
| askzev.ai/services | 200 | ~9K chars | 6 tiers with pricing, detailed descriptions |
| askzev.ai/approach | 200 | ~18.5K chars | Architecture deep-dive, Tree of Life, coordination patterns |
| askzev.ai/about | 200 | ~5K chars | Origin story, background, differentiators |
| askzev.ai/work | 200 | ~5K chars | 2 case studies, Problem/Process/Payoff format |
| askzev.ai/blog | 200 | ~45K chars | 11 blog posts with category filtering |
| askzev.ai/discover | 200 | ~2.5K chars | Discovery form with service overview sidebar |
| askzev.ai/contact | 200 | ~3K chars | Contact form, email, location |
| askzev.ai/tola | 307 > /approach | Redirect works | Correct behavior |
| askzev.ai/blog/rss.xml | 200 | ~8.5K chars | Valid RSS 2.0, 11 items |

### Admin Pages — Auth Protected
| URL | Status | Notes |
|-----|--------|-------|
| askzev.ai/admin | 307 > /admin/login | Auth gate works |
| askzev.ai/admin/tola | 307 > /admin/login | Auth gate works |
| askzev.ai/admin/discoveries | 307 > /admin/login | Auth gate works |

**Minor bug:** Admin login page title is "Admin | zev.ai | zev.ai" (site name duplicated).

---

## Part 3: Pipeline Testing

### Discovery Pipeline
**Status: Works end-to-end, currently blocked by API credits.**

Pipeline flow verified from data:
1. Form submission (`/api/submit-discover`) creates discovery + writes `crown_to_nexus` shared_context entry
2. `advance-pipeline-cron` (every 5 min) picks it up, calls `nexus_route()` SQL function
3. Guardian validates input (spam/injection checks) — Path 2 (FREE, pure regex)
4. Visionary researches (Claude Sonnet + web_search) — Path 3 (PAID)
5. Architect scopes (Claude Sonnet, structured assessment) — Path 4 (PAID)
6. Oracle synthesizes report (Claude Sonnet, meeting prep + insight report) — Path 5 (PAID)
7. Guardian quality gate (Claude Sonnet evaluates against 6 criteria, 0.80 threshold) — Path 6 (PAID)
8. If pass: Gateway delivers (Resend email) or Crown holds for review — Path 7/8
9. If fail: Oracle revises (max 2 iterations), then Tier 3 Crown escalation

**Evidence:** 9 discoveries processed, 8 reached 100% completion. 2 shared_context entries show `nexus_to_crown_revision_failed` (quality gate failed after max revisions, correctly escalated to Crown/human review).

**Current blocker:** Anthropic API credits exhausted. No new discoveries can be processed.

### Nurture System
**Status: Table exists but system is stalled.**

- `nurture_sequences` table exists (UNDOCUMENTED in CLAUDE.md) with 2 rows
- 1 active sequence for `catalyst-test@example.com` is 30+ hours past `next_send_at`
- No visible pg_cron job or trigger advancing nurture sequences
- System appears to be a prototype that was never fully wired

### Content Engine
**Status: Works but currently blocked by API credits.**

- 11 blog posts published (most recent: 2026-03-22)
- `advance-content-pipeline-cron` polls every 5 min
- Weekly auto-generation cron creates new post entry (last fired 2026-03-29)
- 2 posts stuck in `topic_research` (1 for 8 days — slug `auto-1774140681915`)
- 2 posts stuck in `outlining` (since 2026-03-20)
- All stuck posts are blocked by exhausted Anthropic credits
- `content-cadence-watchdog` correctly fired alert that no post published in 7+ days

### Social Agent
**Status: Content exists but distribution is completely inert.**

- 9 social queue posts exist (3 LinkedIn, 3 Twitter, 3 Instagram) — all `draft`
- `pipeline-social-agent` generates content (Claude Sonnet, Mon-Fri 7am)
- `distribute-social-posts` cron runs every 30 min
- **BUT:** All 6 social accounts have `is_active=false` and no credentials
- No platform API tokens configured
- Even if posts were `approved`, they cannot be published anywhere
- `auto_publish=true` in tola_config is meaningless without platform credentials

---

## Part 4: Agent Status

### tola_agents Table
| Agent | Status | Active | Kill Switch | Last Heartbeat | Days Stale |
|-------|--------|--------|-------------|----------------|------------|
| Architect | healthy | true | false | 2026-03-27 15:21 | 3 |
| Catalyst | healthy | true | false | 2026-03-27 14:29 | 3 |
| Crown | healthy | true | false | 2026-03-27 14:27 | 3 |
| Foundation | healthy | true | false | 2026-03-27 14:27 | 3 |
| Gateway | healthy | true | false | 2026-03-27 14:27 | 3 |
| Guardian | healthy | true | false | 2026-03-27 16:00 | 3 |
| Nexus | healthy | true | false | 2026-03-27 14:27 | 3 |
| Oracle | healthy | true | false | 2026-03-27 15:56 | 3 |
| Prism | healthy | true | false | 2026-03-27 14:27 | 3 |
| **Sentinel** | **healthy** | **true** | **false** | **2026-03-19 20:41** | **10** |
| Visionary | healthy | true | false | 2026-03-27 15:17 | 3 |

**Issue:** `status=healthy` is self-reported, not computed from heartbeat freshness. All agents show "healthy" even with 3-10 day stale heartbeats. Sentinel hasn't updated in 10 days but still says healthy. The admin UI computes health dynamically (green/yellow/red) from heartbeat age, but the DB field is misleading.

### Agent Activity (from tola_agent_log)
- Total log entries: 1,700
- Recent activity dominated by `opus_send_message` / `opus_reply_message` (Cain/Abel messaging system)
- Last genuine pipeline agent activity: 2026-03-27 (Marcus Chen pipeline completion)
- Content-cadence-alert from Catalyst fired correctly on 2026-03-29

### Which Agents Are Actually Running?
| Agent | Has Cron | Frequency | Actually Running | Notes |
|-------|----------|-----------|-----------------|-------|
| Nexus | Yes | Every 30 min | Yes (free) | Health scoring, path aggregation |
| Guardian-bg | Yes | Every 30 min | Yes (free) | Anomaly detection, circuit breaker |
| Crown | Yes | Every 2 hours | Yes (free) | Token spend, tier 3 queue |
| Prism | Yes | Every 6 hours | Yes (free) | Synthetic health checks |
| Catalyst-bg | Yes | Every 4 hours | Yes (free) | Pipeline velocity |
| Gateway | Yes | Every 6 hours | Yes (free) | SEO monitoring |
| Foundation-bg | Yes | Every 12 hours | Yes (free) | DB maintenance, archival |
| Sentinel | **No cron** | N/A | **No — just a DB row** | Last heartbeat 10 days ago |
| Visionary | Pipeline only | On demand | Yes (when discoveries exist + API credits) | Currently blocked |
| Architect | Pipeline only | On demand | Yes (when discoveries exist + API credits) | Currently blocked |
| Oracle | Pipeline only | On demand | Yes (when discoveries exist + API credits) | Currently blocked |

### Claude API Cost Classification
| Cron/Function | Calls Claude | Cost per Run | Frequency |
|---------------|-------------|-------------|-----------|
| 7 background agents | No | $0.00 | Various (30m-12h) |
| advance-pipeline-cron | Only when dispatching pipeline steps | $0.04-0.12 per step | Every 5 min (polls) |
| advance-content-pipeline-cron | Only when advancing blog steps | $0.02-0.08 per step | Every 5 min (polls) |
| pipeline-social-agent | Yes (2 Claude calls) | $0.04-0.06 | Mon-Fri 7am EST |
| distribute-social-posts | No | $0.00 | Every 30 min |
| 4 automation watchdogs | No | $0.00 | Various |

---

## Part 5: Cost Analysis

### Functions That Call Paid APIs

#### Claude API (Anthropic) — Primary Cost Driver
| Function | Model | Est. Tokens | Est. Cost/Call | Trigger |
|----------|-------|-------------|---------------|---------|
| pipeline-visionary | Sonnet | 4K + web_search | $0.04-0.08 | Per discovery |
| pipeline-architect | Sonnet | 4K-8K | $0.04-0.08 | Per discovery |
| pipeline-oracle | Sonnet | 4K-6K (x2 if revision) | $0.04-0.12 | Per discovery |
| pipeline-guardian (quality gate) | Sonnet | 2K | $0.02-0.04 | Per discovery |
| pipeline-content-engine | Sonnet | 2K-8K per step x5 | $0.10-0.40 | Per blog post |
| pipeline-social-agent | Sonnet | 4K (2 calls) | $0.04-0.06 | Mon-Fri 7am |
| pipeline-proposal | Sonnet | 6K | $0.03-0.06 | Manual only |
| pipeline-free-summary | Sonnet | 2K | $0.01-0.02 | Per completion |
| Public chat (/api/chat) | Haiku | 512 max | ~$0.001 | Per visitor message |
| Admin chat (/api/admin/chat) | Sonnet | 2K max | ~$0.01 | Per admin message |

#### Resend (Email) — Free Tier (3K/month)
| Function | Trigger | Volume |
|----------|---------|--------|
| pipeline-gateway-delivery | Per report delivery | Low |
| pipeline-free-summary | Per discovery completion | Low |
| /api/submit-contact | Per contact form | Low |

#### No Other Paid APIs
- Web search is Claude's native tool (included in API cost)
- Social platform APIs would be free if credentials were configured
- HeyGen is disabled (`heygen_enabled: false`)
- Stripe webhook is receiving only

### Daily Cost Estimate (All Systems Running)

**Idle day (no new discoveries):**
| Item | Cost |
|------|------|
| Social agent (weekday) | $0.05 |
| Content pipeline (if post in pipeline) | $0.10-0.40 |
| Background agents (7 crons) | $0.00 |
| Automation watchdogs (4 crons) | $0.00 |
| **Total idle day** | **~$0.05-0.45** |

**Active day (2 discoveries + 1 blog post):**
| Item | Cost |
|------|------|
| 2 discovery pipelines (4 Claude calls each) | $0.30-0.60 |
| 1 blog post (5 pipeline steps) | $0.10-0.40 |
| Social agent | $0.05 |
| Free summary emails (2) | $0.02-0.04 |
| **Total active day** | **~$0.50-1.10** |

**Monthly estimate:** $15-35/month at current volume. The CLAUDE.md estimate of $450-900/month assumed much higher discovery volume.

---

## Part 6: Messaging System

### opus_messages Table
- **Status:** EXISTS (UNDOCUMENTED in CLAUDE.md)
- **Rows:** 39
- **Active:** Yes — last message 2026-03-29T19:12 UTC
- **Participants:** Opus, Cain, Abel, Zev
- **Content:** Operational directives, status reports, phase planning
- **Bug:** Row 36d8f41b has `from_agent=zev` replying to `to_agent=zev` (self-reply bug in voice transcription UI)
- **Notable:** Zev feedback at 15:17 on 3/29 — "this needs to be a lot better thought out, it's not a functional working tool, it makes things more difficult for me not easier"

### cain_tasks Table
- **Rows:** 137
- **Status breakdown (last 20):** 14 done, 4 failed, 2 open
- **Recurring tasks:** Gmail scan (every 30 min), health checks (hourly), briefing updates (every 2h)
- **Failure pattern:** `timeout: command not found` (Exit 127) — macOS PATH issue, ~25% failure rate
- **Key findings from Abel:**
  - Anthropic API credits exhausted (detected 03:02 UTC today)
  - steinmetzrealestate.com returning 503 (9+ hours)
  - Zion Yehoshua 5 days no reply
  - GitGuardian secret rotation needed
  - Vercel deployment failures

### cain_log
- **Active:** Yes, entries through 03:02 UTC today
- **Content:** Task completion/failure notifications, health check details

### /api/opus/send Endpoint
- **Does not exist as a standalone route.** Opus messaging appears to go through `/api/admin/cain` (POST) which handles task and log creation. The `opus_messages` table is written to via the Cain/Abel task system integration, not a dedicated `/api/opus/send` endpoint.

---

## Priority Fix List

### P0 — Critical (Act Immediately)
1. **Add Anthropic API credits** — All pipelines dead (discovery, content, quality gates). Go to console.anthropic.com, org "Zev's Individual Org", add credits.
2. **steinmetzrealestate.com is down (503)** — 9+ hours of downtime confirmed by Abel's hourly health checks. Investigate hosting provider.

### P1 — Major (Act Today)
3. **Bay State Remodeling $12,000 invoice due tomorrow (2026-03-31)** — Still in `draft`, never sent. Total $26,500 in unsent invoices.
4. **Follow up with Zion Yehoshua** — 5 days no reply per Abel's tracking.
5. **Fix Abel's `timeout` PATH bug** — ~25% task failure rate. Add `/opt/homebrew/bin` to worker PATH or alias to `gtimeout`.
6. **Unstick 4 blog posts** — 2 in `topic_research` (1 stuck 8 days), 2 in `outlining`. Will auto-resolve once API credits added, but the 8-day-old one may need manual reset.
7. **GitGuardian secret rotation** — Flagged multiple times by Abel.

### P2 — Major (Act This Week)
8. **Document opus_messages and nurture_sequences tables** — Both are undocumented in CLAUDE.md but actively used.
9. **Fix cost_level double-encoding** — `tola_config.cost_level` stored as `"\"low\""` instead of `"low"`. Fix via SQL: `UPDATE tola_config SET value = '"low"' WHERE key = 'cost_level'`.
10. **Fix Catalyst Test User anomaly** — `pipeline_status=complete` but `progress_pct=0` and `pipeline_completed_at=NULL`.
11. **Review 2 Crown escalation entries** — `nexus_to_crown_revision_failed` in shared_context for Marcus Chen and Test Pipeline discoveries.
12. **Apply or drop migration 020** — `workspace_projects` table doesn't exist; migration file sitting in git.

### P3 — Minor (When Ready)
13. **Fix admin login page title** — Shows "Admin | zev.ai | zev.ai" (duplicated).
14. **Fix agent health reporting** — `status=healthy` is self-reported and stale. Sentinel shows healthy with 10-day-old heartbeat. Consider computing health dynamically or running a cron to mark stale agents.
15. **Connect social platform credentials** — Distribution system is fully built but inert without API tokens.
16. **Wire nurture sequence advancement** — Table exists, no cron/trigger advancing it.
17. **Populate family_tasks** — Table exists and is empty.
18. **Review Vercel deployment failures** — Mentioned multiple times in Abel's logs.
19. **Add /api/opus/send endpoint** — or document that opus messaging goes through cain API.
20. **Deduplicate contacts** — Two "Zev I Steinmetz" entries with same email.

---

## Appendix: What CLAUDE.md Says vs Reality

| CLAUDE.md Claim | Reality | Match? |
|-----------------|---------|--------|
| 11 agents active | 11 agents in DB, 7 have crons, Sentinel is dead | Partial |
| 22-path shared context | 34 shared_context rows, paths working | Yes |
| Pipeline auto-advances every 60s | advance-pipeline-cron runs every 5 min (changed in migration 017) | Outdated |
| Social distribution system | Built but inert (no platform credentials) | Code exists, not functional |
| HeyGen video stub | Disabled in config | Correct |
| 6 content pillars | Blog posts span multiple categories | Yes |
| $499 Stripe webhook | Endpoint exists, no paid_499 discoveries in DB | Untested |
| nurture_sequences | Table exists, not documented | Missing from docs |
| opus_messages | Table exists, actively used, not documented | Missing from docs |
| Sentinel agent | No cron, 10-day stale heartbeat | Dead |
