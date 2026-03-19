# zev.ai — AI Consulting Website + TOLA v3.0 Agent Framework

## Overview
Flagship website for Zev Steinmetz's AI consulting practice. Outcome-forward public site (leads with client results, not architecture). TOLA framework powers the backend — 11 specialized agents, 9 coordination patterns, 22 structured communication paths. Architecture is discoverable via /approach but not the headline.

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

### Runtime
- **Edge Function:** Single "fat function" (`supabase/functions/tola-agent/`) routing to all 11 agents
- **Fully implemented:** Sentinel (health), Foundation (cleanup), Nexus (classification), Guardian (validation), Visionary (Claude + web_search research), Architect (scope assessment), Oracle (meeting prep synthesis)
- **Stubs:** Crown, Catalyst, Prism, Gateway
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

### Admin (7) — not in nav, noindex, dark theme operations center
- `/admin` — Dashboard home: stat cards (total, success rate, active agents, avg time), pipeline stage breakdown, activity feed
- `/admin/tola` — Tree of Life Operating System: full interactive 11-node graph with 24 animated paths, real-time agent health via Supabase Realtime, sacred geometry animations, click-to-expand agent panels, mobile card stack fallback, activity feed footer
- `/admin/discoveries` — Sortable list with real-time progress bars (0-100%, color-coded staleness), 5-tab detail (overview, research, assessment, meeting prep, proposal) with markdown rendering, proposal generation/PDF/regeneration
- `/admin/content` — Content engine: Blog Posts list + Social Queue, post detail with preview/edit/social/review tabs, approve/publish workflow, "Generate New Post" button triggers pipeline
- `/admin/agents` — Agent card grid (Guardian, Visionary, Architect, Oracle, Sentinel) with stats, Tree of Life diagram, activity feed, click-to-expand panel
- `/admin/contacts` — Contact list with status badges, search, detail slide-out
- `/admin/login` — Password auth

## API Routes
- `POST /api/submit-contact` — Insert contact, send email
- `POST /api/submit-discover` — Insert discovery, trigger assessment pipeline
- `POST /api/admin/login` — Auth cookie
- `GET|PATCH /api/admin/contacts` — CRUD
- `GET|PATCH /api/admin/discoveries` — CRUD
- `GET|PATCH /api/admin/agents` — Agent list/update (kill_switch, tier, is_active, status, config)
- `GET /api/admin/agents/[id]/logs` — Per-agent activity log
- `POST /api/admin/agents/trigger` — Invoke Edge Function for any agent
- `GET /api/admin/stats` — Dashboard stats: total discoveries, success rate, active agents, avg pipeline time, actions/pipelines today, tier 3 queue, stage breakdown
- `GET|POST|PATCH|DELETE /api/admin/content` — Blog post CRUD with publish workflow (generates schema_data, moves social_posts to social_queue, triggers ISR revalidation)
- `GET|PATCH|DELETE /api/admin/social` — Social queue CRUD with platform filtering, bulk approve via `{ ids, status }`
- `GET|PATCH /api/admin/social-accounts` — Social account management
- `GET /api/blog` — Public: list published blog posts

## Database (Supabase)

### Tables
- **contacts** — id, name, email, company, message, status, notes
- **discoveries** — 13 form fields + research_brief (JSONB), assessment_doc (TEXT), meeting_prep_doc (TEXT), pipeline_status, pipeline_error, pipeline_completed_at, pipeline_step_completed_at, pipeline_started_at, pipeline_retry_count, progress_pct (INT 0-100), proposal_data (JSONB), include_pricing (BOOLEAN)
- **_pipeline_config** — key/value store for pg_net dispatch (supabase_url, service_role_key)
- **tola_agents** — id, node_name, geometry_engine, display_name, description, status, tier, last_heartbeat, config, is_active, kill_switch
- **tola_agent_log** — agent_id, action, geometry_pattern, input, output, confidence, tier_used, tokens_used, latency_ms
- **tola_agent_metrics** — agent_id, metric, value, geometry_state
- **blog_posts** — id, slug (unique), title, excerpt, content (markdown), category, tags (text[]), status (draft/topic_research/outlining/drafting/reviewing/social_gen/review/published/archived), author, reading_time_min, seo_title, seo_description, schema_data (JSONB), social_posts (JSONB), generation_data (JSONB), generation_started_at, pipeline_step_completed_at, generation_error, created_at, updated_at, published_at
- **social_queue** — id, blog_post_id (FK), platform (linkedin/twitter/instagram/tiktok/threads), content, content_pillar, review_notes, image_prompt, status (draft/approved/scheduled/posted), scheduled_for, posted_at, created_at
- **social_accounts** — id, platform (unique), handle, profile_url, is_active. Pre-seeded with LinkedIn, Twitter, Instagram, TikTok, YouTube, Threads

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

## Canonical Components

### Tree of Life (`src/components/tree-of-life.tsx`)
- Single SVG component, 4 modes: hero, diagram, dashboard, compact
- viewBox 0 0 500 700, pillars at x=110/250/390
- Nexus: radius 36 (larger than standard 28)
- Oracle: phantom (dashed border, periwinkle glow, 50% geometry opacity)
- 24 paths with middle-pillar emphasis (opacity 0.5, width 2)
- Used on /approach page (diagram mode) — NOT on homepage

### TOLA Operating System (`src/components/admin/tola-tree.tsx`)
- Full interactive Tree of Life dashboard with 11 nodes and 24 animated paths
- Path flow animation via CSS stroke-dashoffset (green glow when agents are active)
- Real-time via useRealtimeAgents + useRealtimeActivityFeed hooks
- Hover tooltips on paths showing msg/hr, avg latency, error rate
- Node hover glow, active agent pulse animation
- Mobile responsive: card stack on mobile, full SVG on desktop
- Activity feed footer with horizontal scrolling log cards

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
