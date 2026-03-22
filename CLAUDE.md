# zev.ai — AI Consulting Website + TOLA v3.0 Agent Framework

## Overview
Flagship website for Zev Steinmetz's AI consulting practice + personal operating system. Outcome-forward public site (leads with client results, not architecture). TOLA framework powers the backend — 11 specialized agents, 9 coordination patterns, 22 structured communication paths. Architecture is discoverable via /approach but not the headline.

**Layout architecture:** Root layout uses `LayoutWrapper` client component that conditionally renders public Navbar/Footer only for non-admin routes. Admin routes get only AdminShell sidebar — no public nav/footer overlap.

## Stack
- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4 (inline @theme)
- **Animations:** Framer Motion (useScroll, useTransform, useInView, stagger reveals)
- **Fonts:** Sora (sans, body) + Source Serif 4 (serif, headings/editorial)
- **Backend:** Supabase (PostgreSQL + RLS + Realtime + Edge Functions)
- **AI:** Claude API (Sonnet) with web_search tool
- **Email:** Resend (form notifications)
- **Deployment:** Vercel + Supabase Edge Functions
- **Domain:** zev.ai (pending DNS)

## TOLA v3.0 Agent Architecture

### 11 Agents (Tree of Life nodes)
Crown (human authority), Visionary (research), Architect (planning), Oracle (synthesis, phantom),
Guardian (validation), Nexus (routing, center), Catalyst (engagement), Sentinel (monitoring),
Prism (testing), Foundation (infrastructure), Gateway (application)

### Runtime — ALL 11 AGENTS ACTIVE
- **Pipeline functions:** pipeline-guardian, pipeline-visionary, pipeline-architect, pipeline-oracle, pipeline-proposal, pipeline-content-engine, pipeline-social-agent
- **Background agent functions (all with pg_cron):**
  - `agent-nexus` (every 5 min) — health-check all agents, health scoring, path activity aggregation
  - `agent-guardian-bg` (every 5 min) — anomaly detection, circuit breaker (10 errors → kill switch)
  - `agent-crown` (every 15 min) — token spend tracking, Tier 3 queue scan, daily governance digest
  - `agent-prism` (every 30 min) — synthetic site health checks, agent output audit, daily quality report
  - `agent-catalyst-bg` (hourly) — pipeline velocity analysis, bottleneck detection, trend comparison
  - `agent-gateway` (hourly) — sitemap/robots/RSS validation, SEO audit, page count tracking
  - `agent-foundation-bg` (every 2h) — database maintenance, row counts, archival (30-day retention), daily infra report
- **Legacy:** `tola-agent` single fat function for Sentinel + general routing
- **Supabase project:** ctrzkvdqkcqgejaedkbr

### Assessment Pipeline
Discovery form → Guardian validates → Visionary researches (Claude + web_search) → Architect scopes (9 constraints) → Oracle synthesizes meeting prep → Crown review queue.
Each step is a separate Edge Function (`pipeline-guardian`, `pipeline-visionary`, `pipeline-architect`, `pipeline-oracle`).

**Proposal Generation:** After pipeline completes, "Generate Proposal" button triggers `pipeline-proposal` Edge Function. Calls Claude to generate a professional SOW with executive summary, discovery findings, phased implementation plan, deliverables, and pricing tiers. Stored in `proposal_data` JSONB column. Supports `include_pricing` toggle, PDF download via browser print, and Edit & Regenerate with custom prompt context.

**Chaining:** pg_cron polls every 60s (`advance_pipeline()`), dispatches next step via pg_net with 300s timeout.
**Rate limiting:** 60-second global cooldown between Claude API calls (tracked via `pipeline_step_completed_at`).
**Retry:** Auto-retries on 429/529/timeout errors up to 5 times. Stuck in-flight steps recovered after 5 min.
**Config:** `_pipeline_config` table stores `supabase_url` and `service_role_key` for pg_net dispatch.

### Pipeline Statuses
pending → researching → scoping → synthesizing → complete | failed

### Pipeline Columns (discoveries table)
`pipeline_status`, `pipeline_error`, `pipeline_completed_at`, `pipeline_step_completed_at` (cooldown tracking), `pipeline_started_at` (in-flight guard), `pipeline_retry_count`, `progress_pct` (0-100 integer), `proposal_data` (JSONB: markdown, generated_at, model_used, tokens_used, prompt_context), `include_pricing` (boolean, default true)

### Pipeline Progress Tracking
Each stage updates `progress_pct` as it works:
- Guardian: 0% start → 10% validated
- Visionary: 15% start → 20% Claude API call → 35% research complete
- Architect: 40% start → 45% Claude API call → 65% assessment complete
- Oracle: 70% start → 75% Claude API call → 90% meeting prep complete → 100% done

### 3-Tier Decision Model
- **Tier 1 (80%):** Autonomous — UX, technical, operational
- **Tier 2 (15%):** Notify & proceed — dependencies, infrastructure, trade-offs
- **Tier 3 (5%):** Full stop — brand, creative, security, scope

## Pages

### Navigation
Home | Services | Our Approach | Work | About | Blog | [Start Your Discovery] CTA button

### Public (9)
- `/` — Outcome-focused hero, pain point agitation (4 problems), services journey (Assess→Build→Optimize→Scale), social proof (ButcherBox/Blank Industries/Rosen Media Group examples), principles, CTA
- `/services` — 4 tiers: each with Problem → What we do → What you get → Timeline → Price. No agent names. "Starting from" pricing.
- `/approach` — Nature-inspired architecture: philosophy, Tree of Life diagram, 9 coordination patterns modeled on nature, 3-tier human oversight, build+runtime duality
- `/work` — Case studies (Problem → Process → Payoff): Steinmetz RE (18 agents, 2000+ pages), Blank Industries (unified BI), KabbalahQ.ai (adaptive learning)
- `/about` — Zev's story: real estate → AI builder, William Raveis background, hands-on builder emphasis
- `/blog` — Blog listing with category filtering (6 content pillars), card grid, dynamic from blog_posts table
- `/blog/[slug]` — Dynamic post pages: ToC sidebar, author bio, related posts, JSON-LD BlogPosting + FAQPage schemas
- `/blog/rss.xml` — RSS feed of published posts
- `/contact` — Form → Supabase contacts
- `/discover` — 12-step intake form → assessment pipeline
- `/tola` — Redirects to /approach

### Admin (11) — not in nav, noindex, dark theme operations center
Nav order: TOLA > Dashboard > Discoveries > Content > Projects > Finance > Family > Knowledge > Agents > Contacts

- `/admin/tola` — TOLA Operating System (React Flow): 11-node graph with 22 paths, real-time agent health, MiniMap, Controls, click-to-expand panels with sub-agent sections for Architect/Foundation/Catalyst/Oracle
- `/admin` — Dashboard home: stat cards, pipeline stage breakdown, activity feed
- `/admin/discoveries` — Sortable list with real-time progress bars (0-100%, color-coded staleness), 5-tab detail
- `/admin/content` — Content engine: Blog Posts + Social Queue, approve/publish workflow, calendar view, platform previews
- `/admin/projects` — Project Command Center (Architect sub-agent): card grid with milestone progress, time tracking, Log Time modal. Seeded with 6 projects.
- `/admin/finance` — Financial Overview (Foundation sub-agent): revenue/outstanding/hours metrics, invoice CRUD, Recharts chart
- `/admin/family` — Family Hub (Catalyst sub-agent): Today view, kanban tasks (To Do/In Progress/Done), quick capture bar, events list, notes feed, family member avatar filters. Seeded with family member placeholders.
- `/admin/knowledge` — Knowledge Base (Oracle sub-agent): prominent search bar, source-categorized entries (Meeting/Voice Memo/Article/Insight/Lesson/Discovery), quick capture, "Sync from Discoveries" + "Sync from Blog" auto-ingestion, pgvector similarity search
- `/admin/agents` — Agent card grid with stats, Tree of Life diagram, activity feed
- `/admin/contacts` — Contact list with status badges, search, detail slide-out
- `/admin/login` — Password auth

## Authentication & Security
- **Auth module:** `src/lib/auth.ts` — shared session token generation using Web Crypto API (SHA-256)
- **Session tokens:** Admin password is never stored in cookies. Login route hashes password → stores hex digest in `admin_auth` cookie (httpOnly, secure, sameSite: lax, 7-day expiry)
- **Middleware:** `src/middleware.ts` — protects `/admin/*` routes (except `/admin/login`) by validating hashed session token
- **API auth:** All admin API routes import `isValidSession` from `@/lib/auth` and verify the cookie hash matches
- **Agent trigger validation:** `POST /api/admin/agents/trigger` validates agent name against whitelist of 15 known Edge Functions
- **Input validation:** `_type` params validated in projects/finance/family routes; bulk operations capped at 100 items

## API Routes
- `POST /api/submit-contact` — Insert contact, send email
- `POST /api/submit-discover` — Insert discovery, trigger assessment pipeline
- `POST /api/admin/login` — Validates password, sets hashed session cookie
- `GET|PATCH /api/admin/contacts` — CRUD
- `GET|PATCH|DELETE /api/admin/discoveries` — CRUD
- `GET|PATCH /api/admin/agents` — Agent list/update (kill_switch, tier, is_active, status, config — field whitelist enforced)
- `GET /api/admin/agents/[id]/logs` — Per-agent activity log
- `POST /api/admin/agents/trigger` — Invoke Edge Function (agent name validated against whitelist)
- `GET /api/admin/activity` — Latest tola_agent_log entries (used by ActivityFeed, polls 15s)
- `GET /api/admin/stats` — Dashboard stats: total discoveries, success rate, active agents, avg pipeline time, actions/pipelines today, tier 3 queue, stage breakdown, cross-module alerts
- `GET|POST|PATCH|DELETE /api/admin/content` — Blog post CRUD with publish workflow (generates schema_data, moves social_posts to social_queue, triggers ISR revalidation, auto-creates knowledge entry)
- `GET|PATCH|DELETE /api/admin/social` — Social queue CRUD with platform filtering, bulk approve via `{ ids, status }` (max 100)
- `GET|PATCH /api/admin/social-accounts` — Social account management (access_token, user_id, api_config)
- `POST /api/admin/social/publish` — Publish approved posts to platforms (accepts admin cookie or service role key)
- `GET|PATCH /api/admin/settings` — System config CRUD (cost_level, auto_publish, image_generation, heygen_enabled, etc.)
- `GET /api/og/social` — Branded image generation (query params: text, pillar, format, style)
- `GET /api/blog` — Public: list published blog posts
- `GET|POST|PATCH|DELETE /api/admin/projects` — Project CRUD with milestones and time entries (_type validated: milestone|time_entry)
- `GET|POST|PATCH /api/admin/finance` — Finance metrics, invoice CRUD, monthly metrics (_type validated: monthly_metric)
- `GET|POST|PATCH|DELETE /api/admin/family` — Family tasks/events/notes CRUD (_type validated: task|event|note|member)
- `GET|POST|PATCH|DELETE /api/admin/knowledge` — Knowledge entries CRUD, sync_discoveries, sync_blog actions

## Database (Supabase)

### Tables
- **contacts** — id, name, email, company, message, status, notes
- **discoveries** — 13 form fields + research_brief (JSONB), assessment_doc (TEXT), meeting_prep_doc (TEXT), pipeline_status, pipeline_error, pipeline_completed_at, pipeline_step_completed_at, pipeline_started_at, pipeline_retry_count, progress_pct (INT 0-100), proposal_data (JSONB), include_pricing (BOOLEAN)
- **_pipeline_config** — key/value store for pg_net dispatch (supabase_url, service_role_key)
- **tola_agents** — id, node_name, geometry_engine, display_name, description, status, tier, last_heartbeat, config, is_active, kill_switch
- **tola_agent_log** — agent_id, action, geometry_pattern, input, output, confidence, tier_used, tokens_used, latency_ms
- **tola_agent_metrics** — agent_id, metric, value, geometry_state
- **blog_posts** — id, slug (unique), title, excerpt, content (markdown), category, tags (text[]), status (draft/topic_research/outlining/drafting/reviewing/social_gen/review/published/archived), author, reading_time_min, seo_title, seo_description, schema_data (JSONB), social_posts (JSONB), generation_data (JSONB), generation_started_at, pipeline_step_completed_at, generation_error, created_at, updated_at, published_at
- **social_queue** — id, blog_post_id (FK), platform (linkedin/twitter/instagram/tiktok/threads), content, content_pillar, review_notes, image_prompt, status (draft/approved/scheduled/publishing/posted/failed), scheduled_for, posted_at, published_at, published_url, platform_post_id, publish_error, image_url, engagement (JSONB), created_at
- **social_accounts** — id, platform (unique), handle, profile_url, is_active, access_token, refresh_token, token_expires_at, user_id, api_config (JSONB). Pre-seeded with LinkedIn, Twitter, Instagram, TikTok, YouTube, Threads
- **tola_config** — key (PK), value (JSONB), updated_at. System-wide config: cost_level, auto_publish, image_generation, posting_frequency, heygen_enabled, heygen_avatar_id, seo_mode
- **content_analytics** — id, social_queue_id (FK), platform, impressions, likes, shares, comments, clicks, reach, fetched_at
- **projects** — id, name, client, status (active/paused/completed/archived), description, tola_node, start_date, target_end_date, actual_end_date. Seeded with 6 projects.
- **project_milestones** — id, project_id (FK), title, description, status (pending/in_progress/complete/blocked), due_date, completed_at, sort_order
- **project_time_entries** — id, project_id (FK), description, hours (decimal), date, billable, hourly_rate
- **invoices** — id, project_id (FK nullable), client_name, amount, status (draft/sent/paid/overdue), issued_date, due_date, paid_date, description
- **monthly_metrics** — id, month (date), revenue, costs, hours_billed, pipeline_value, new_clients
- **family_members** — id, name, role (self/spouse/child/parent), avatar_color (hex)
- **family_tasks** — id, title, description, assigned_to (FK), created_by_context, status (pending/in_progress/done), priority (low/medium/high/urgent), due_date, recurring, recurrence_pattern, completed_at
- **family_events** — id, title, description, date, time_start, time_end, family_member_ids (uuid[]), location, reminder_sent
- **family_notes** — id, content, context, tags (text[])
- **knowledge_entries** — id, title, content, source (meeting/voice_memo/article/insight/lesson/discovery), source_ref, tags (text[]), embedding (vector(1536) via pgvector), created_at, updated_at

### Migrations
- `001_tola_runtime.sql` — Agent tables, seed data, RLS, Realtime
- `002_assessment_pipeline.sql` — Pipeline columns on discoveries
- `003_pipeline_pg_net_trigger.sql` — (legacy) pg_net trigger chaining, _pipeline_config table
- `004_pipeline_retry_cron.sql` — (legacy) pg_cron retry for rate-limited failures
- `005_pipeline_cron_worker.sql` — pg_cron polling worker replaces trigger-based chaining
- `006_fix_pgnet_timeout.sql` — Fix pg_net 2s default timeout → 300s for Claude API calls
- `007_pipeline_progress_pct.sql` — Add progress_pct column to discoveries for real-time progress tracking
- `008_proposal_data.sql` — Add proposal_data JSONB and include_pricing boolean to discoveries
- `009_blog_content.sql` — blog_posts + social_queue tables, advance_content_pipeline() cron, weekly auto-generation cron
- `010_social_agent.sql` — social_accounts table, content_pillar/review_notes on social_queue, daily social agent cron (Mon-Fri noon UTC)
- `011_stalled_detection.sql` — Stalled pipeline detection (30min timeout), email alerts via Resend
- `012_projects_finance.sql` — projects, project_milestones, project_time_entries, invoices, monthly_metrics tables + seed data
- `013_family_knowledge.sql` — family_members/tasks/events/notes, knowledge_entries with vector(1536), pgvector extension, search_knowledge() function, family seed data
- `014_contact_pipeline_statuses.sql` — Adds CRM pipeline statuses (researched, meeting_scheduled, proposal_sent, client) to contacts CHECK constraint
- `015_agent_activity_loops.sql` — tola_path_activity table, dispatch_agent() helper, 7 pg_cron jobs for all background agents
- `016_social_distribution.sql` — Publishing columns on social_queue, credentials on social_accounts, tola_config table, content_analytics table, distributor pg_cron
- `017_reduce_cron_frequency.sql` — Scale back all agent cron schedules for cost optimization (Nexus/Guardian 30min, Crown 2h, Prism 6h, Catalyst 4h, Gateway 6h, Foundation 12h, pipeline pollers 5min)

### Operations SOP
Full Standard Operating Procedures document at `src/docs/OPERATIONS-SOP.md` covering: daily ops checklist, content workflow, social media, discovery pipeline, proposal workflow, family hub, knowledge base, project management, invoicing, troubleshooting, and monthly review.

### Content Generation Pipeline
Edge Function `pipeline-content-engine` — 5-step content generation with pg_cron advancement:
1. **topic_research** (Visionary) — web_search for trending AI topics, cross-ref existing posts, select topic from 6 pillars
2. **outlining** (Architect) — AEO-optimized outline with question-format headers, FAQ section, target keywords
3. **drafting** (Oracle) — Full 1,500-2,500 word blog post in Zev's voice
4. **reviewing** (Guardian) — Quality score, SEO score, brand consistency check, issue flagging
5. **social_gen** (Catalyst) — 3-5 platform-specific social variants (LinkedIn, Twitter, Instagram, Threads)

Status flow: topic_research → outlining → drafting → reviewing → social_gen → review (human approval) → published
Each step respects 60s Claude API cooldown. pg_cron polls every 60s via `advance_content_pipeline()`.
Weekly auto-generation: pg_cron creates new post every Sunday 8am EST.

### Content Pillars (6)
AI Implementation Guides, AI Strategy for Leaders, Industry-Specific AI, AI Tools & Comparisons, Case Studies, AI Trends

### Blog SEO/AEO
- JSON-LD BlogPosting schema on every published post
- FAQPage schema extracted from ## Frequently Asked Questions sections
- Person schema for Zev Steinmetz on homepage
- OpenGraph + Twitter card meta per post
- Question-format H2/H3 headers for Answer Engine Optimization
- robots.txt: GPTBot, ClaudeBot, PerplexityBot explicitly allowed
- Dynamic sitemap includes published blog posts
- RSS feed at /blog/rss.xml

### Social Media Agent Pipeline
Edge Function `pipeline-social-agent` — daily social content generation:
- Triggered Mon-Fri 7am EST by pg_cron, or on-demand from admin "Generate Posts Now" button
- Checks queue depth (skips if 3+ approved posts for next 3 days)
- Catalyst agent generates 2-3 platform-native posts from blog content, discovery insights, AI trends
- Guardian agent reviews each post for brand consistency and quality
- Balances 6 content pillars over 2-week rolling window
- Platform formatting: LinkedIn (800-1500 chars, hook-first), Twitter (280 chars), Instagram (caption+hashtags+image_prompt), TikTok ([HOOK][BODY][CTA] script), Threads (conversational, 500 chars)

### Admin Social Queue Features
- Calendar view (7-day week) and list view toggle
- Bulk approve with checkbox selection
- Platform-specific preview mockups (LinkedIn, Twitter, Instagram, TikTok, Threads)
- Connected accounts header bar from social_accounts table
- Schedule date picker per post
- Content pillar tags, Guardian review notes
- Stats: posts this week, pending, by platform breakdown

## Social Distribution System

### Architecture
Content Pipeline → Social Agent → Social Queue → [Admin Approve] → Distribution Engine → Platform APIs
All custom-built — no paid third-party posting tools.

### Platform Posting (`src/lib/social-platforms.ts`)
Direct API integration for 5 platforms:
- **Twitter/X:** v2 API — text posts + media upload via v1.1 endpoint
- **LinkedIn:** REST API v2 — text + image posts with image upload flow (initializeUpload → PUT binary → create post with image URN)
- **Instagram:** Graph API v21.0 — container creation → media_publish (requires image)
- **Threads:** Threads API v1.0 — container → publish (text or image)
- **TikTok:** Content Posting API v2 — photo mode posting (video via HeyGen stub)

### Branded Image Generation (`/api/og/social`)
Server-side image generation using Next.js `ImageResponse` (Satori):
- Brand colors: navy (#0a0e1a), periwinkle (#7c9bf5), lavender (#c4b5e0), white
- Formats: landscape (1200x630), square (1080x1080), portrait (1080x1350)
- Styles: quote, stat, tip, blog
- Auto-generates for each platform's optimal dimensions
- Query params: `text`, `pillar`, `format`, `style`

### Distribution Engine (`pipeline-distributor` Edge Function)
- pg_cron every 5 min
- Reads cost level config to control cadence
- Queries approved posts, filters by scheduled_for
- Calls `/api/admin/social/publish` with service role key auth
- Logs results to tola_agent_log

### HeyGen Video Stub (`src/lib/heygen.ts`)
- `createVideo()` — POST to HeyGen v2 API with avatar/voice config
- `getVideoStatus()` — poll video generation status
- Background: brand navy (#0a0e1a), avatar + script
- Dimensions: 1080x1920 (portrait for TikTok/Reels)
- Activated via `heygen_enabled` and `heygen_api_key` in tola_config

### Cost Optimization (tola_config)
Admin toggle: $ (low) / $$ (medium) / $$$ (high)
- **Low:** Haiku model, text-only posts, MWF cadence, max 3 posts/batch
- **Medium:** Sonnet for content + Haiku for social, images for important posts, weekday cadence, max 5 posts/batch
- **High:** Sonnet for all, full image generation, daily cadence (including weekends), max 10 posts/batch
Config stored in `tola_config` table, managed via `/api/admin/settings`.

### Admin Content Page Enhancements
- Cost optimization toggle ($/$$/$$$) in header bar
- "Publish to Platform" button on each approved social post
- "Publish All to Platforms" batch action bar
- Branded image preview in social detail slide-out
- Published URL link for posted items
- Publishing/posted/failed status badges with error display

## LLM Chat Interfaces

### Public Chat Widget (`src/components/chat-widget.tsx`)
- Floating button on all public pages (bottom-right, periwinkle with green pulse dot)
- Opens dark-themed chat panel matching site design
- Claude Haiku model (fast, cost-effective for visitor queries)
- System prompt with full service/pricing/case study knowledge
- Suggested starter questions for empty state
- Rate limited: 10 messages/minute per IP, context trimmed to last 10 messages, max 512 tokens
- Graceful fallback if ANTHROPIC_API_KEY not set
- API route: `POST /api/chat`

### Admin Chat (`src/components/admin/admin-chat.tsx`)
- Sparkle icon button in admin dashboard (bottom-right)
- Claude Sonnet model (full capability for architecture/content questions)
- System prompt with complete TOLA architecture, pipeline details, admin features
- Up to 20 messages context, 2048 max tokens
- Auth-protected via session cookie
- API route: `POST /api/admin/chat` (requires admin auth)

### Required: ANTHROPIC_API_KEY in Vercel env vars
Chat routes call Claude API directly. Set via `vercel env add ANTHROPIC_API_KEY`.

## Email Configuration
- **Public-facing email:** hello@zev.ai (all site references updated)
- **Notification delivery:** Configurable via `NOTIFICATION_EMAIL` env var (defaults to zev330@gmail.com)
- **Resend from address:** Configurable via `RESEND_FROM_EMAIL` env var (defaults to onboarding@resend.dev until domain verified)
- **DNS setup required:** Add Resend DNS records (MX, SPF, DKIM) for zev.ai domain. For receiving email, set up Cloudflare Email Routing to forward hello@zev.ai → gmail.

## Canonical Components

### Tree of Life (`src/components/tree-of-life.tsx`)
- Single SVG component, 4 modes: hero, diagram, dashboard, compact
- viewBox 0 0 500 700, pillars at x=110/250/390
- Nexus: radius 36 (larger than standard 28)
- Oracle: phantom (dashed border, periwinkle glow, 50% geometry opacity)
- 24 paths with middle-pillar emphasis (opacity 0.5, width 2)
- Used on /approach page (diagram mode) — NOT on homepage

### TOLA Operating System (`src/components/admin/tola-tree.tsx`)
- Built with @xyflow/react (React Flow) — zoom, pan, MiniMap, Controls
- Custom TolaNode: health ring (green/yellow/red/gray), sacred geometry animation, status dot, active pulse glow, phantom blur
- Custom TolaEdge: animated flow dots on active paths, green glow, dashed phantom, thicker middle pillar
- React Flow MiniMap (bottom-right) with health-colored node indicators
- React Flow Controls (bottom-left) for zoom/fit
- Enhanced stats bar: system health pulse, active agents, pipelines today, avg time, Tier 3 queue, actions today (fetched from /api/admin/stats every 30s)
- "Updated Xs ago" live indicator
- Real-time via useRealtimeAgents + useRealtimeActivityFeed hooks
- Pipeline flow visualization: active agents and their paths light up green
- Click any node → AgentPanel slide-out (logs, kill switch, tier selector, manual trigger)
- Mobile responsive: card stack with Crown pinned + Tier 3 badge
- Activity feed footer with horizontal scrolling log cards
- TOLA is FIRST item in admin sidebar nav

### Sacred Geometry (`src/components/sacred-geometry/`)
- 9 SVG components: SeedOfLife, MetatronsCube, SriYantra, Torus, Lotus, YinYang, FlowerOfLife, Merkabah, Vortex
- Barrel exported via index.ts with GEOMETRY_COMPONENTS record
- Used only on /approach page and admin — NOT on homepage or services

## Required Secrets

### Vercel env vars
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `ADMIN_PASSWORD`

### Supabase Edge Function secrets
- `ANTHROPIC_API_KEY` — **REQUIRED for assessment pipeline.** Set via: Supabase Dashboard > Project Settings > Edge Functions > Secrets, or `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

## Design System
- **Background:** dark navy (#0a0e1a)
- **Foreground:** off-white (#d0d0da), strong (#f0f0f5)
- **Accent:** periwinkle (#7c9bf5), hover (#96aff8)
- **Muted light:** #c4b5e0
- **Sections:** Alternating dark/light via `.section-light`
- **Admin:** Dark theme using --color-admin-* CSS variables
- **Easing:** [0.16, 1, 0.3, 1] throughout
- **CRITICAL:** No Kabbalah/Hebrew references in public-facing code. Agents use secular names (Crown, Visionary, etc.)
- **CRITICAL:** Public pages are outcome-forward. No agent names, geometry engine names, or technical architecture on homepage or services. Architecture details live on /approach only.

## Deployment
- **Repo:** github.com/zev330-lab/zev-ai
- **Host:** Vercel
- **Live URL:** https://zev-ai-swart.vercel.app
- **Vercel Team:** steinmetz-real-estate-professionlas
- **Deploy:** `vercel --prod`
- **Edge Functions:** `supabase functions deploy tola-agent --no-verify-jwt` (also deploy pipeline-guardian, pipeline-visionary, pipeline-architect, pipeline-oracle, pipeline-proposal)
- **Migrations:** `supabase db push`
- **Pipeline config:** After fresh migration, set `service_role_key` in `_pipeline_config` table via Supabase REST API or SQL editor
