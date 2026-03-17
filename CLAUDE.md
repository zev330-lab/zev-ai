# zev.ai — AI Consulting Website + TOLA v3.0 Agent Framework

## Overview
Flagship website for Zev Steinmetz's AI consulting practice. Self-referential TOLA showcase — built BY TOLA agents, runs ON TOLA agents, describes TOLA. 11 specialized agents, 9 sacred geometry engines, 22 structured communication paths orchestrated through the Tree of Life.

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
Each step is a separate Edge Function invocation chained via fire-and-forget fetch().

### Pipeline Statuses
pending → researching → scoping → synthesizing → complete | failed

### 3-Tier Decision Model
- **Tier 1 (80%):** Autonomous — UX, technical, operational
- **Tier 2 (15%):** Notify & proceed — dependencies, infrastructure, trade-offs
- **Tier 3 (5%):** Full stop — brand, creative, security, scope

## Pages

### Public (7)
- `/` — Hero with Tree of Life diagram, Problem, Approach, Capabilities, Scale, Difference, CTA
- `/tola` — Framework deep-dive: 22 paths, jargon mapping table, 3-tier model, 9 geometry explainers, 11 nodes, build+runtime
- `/services` — 4 service tiers with pricing
- `/work` — Live implementation case study with Tree of Life diagram
- `/about` — Philosophy + builder background
- `/contact` — Form → Supabase contacts
- `/discover` — 12-step intake form → assessment pipeline

### Admin (4) — not in nav, noindex
- `/admin/tola` — Interactive Tree of Life dashboard: live health rings, click-to-expand agent panel, manual trigger, kill switch, tier selector, activity feed, stats bar
- `/admin` — Contacts list + detail
- `/admin/discoveries` — Discoveries with pipeline status, tabbed detail (Overview, Research, Assessment, Meeting Prep)
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
- `GET /api/admin/stats` — Actions today, pipelines today, Tier 3 queue count

## Database (Supabase)

### Tables
- **contacts** — id, name, email, company, message, status, notes
- **discoveries** — 13 form fields + research_brief (JSONB), assessment_doc (TEXT), meeting_prep_doc (TEXT), pipeline_status, pipeline_error, pipeline_completed_at
- **tola_agents** — id, node_name, geometry_engine, display_name, description, status, tier, last_heartbeat, config, is_active, kill_switch
- **tola_agent_log** — agent_id, action, geometry_pattern, input, output, confidence, tier_used, tokens_used, latency_ms
- **tola_agent_metrics** — agent_id, metric, value, geometry_state

### Migrations
- `001_tola_runtime.sql` — Agent tables, seed data, RLS, Realtime
- `002_assessment_pipeline.sql` — Pipeline columns on discoveries

## Canonical Components

### Tree of Life (`src/components/tree-of-life.tsx`)
- Single SVG component, 4 modes: hero, diagram, dashboard, compact
- viewBox 0 0 400 700, 7 tiers at 100-unit intervals
- Nexus: radius 36 (larger than standard 30)
- Oracle: phantom (dashed border, periwinkle glow, 50% geometry opacity)
- 22 paths with middle-pillar emphasis (opacity 0.5, width 2)

### Sacred Geometry (`src/components/sacred-geometry/`)
- 9 SVG components: SeedOfLife, MetatronsCube, SriYantra, Torus, Lotus, YinYang, FlowerOfLife, Merkabah, Vortex
- Barrel exported via index.ts with GEOMETRY_COMPONENTS record

## Required Secrets

### Vercel env vars
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `ADMIN_PASSWORD`

### Supabase Edge Function secrets
- `ANTHROPIC_API_KEY` — **REQUIRED for assessment pipeline.** Set via: Supabase Dashboard > Project Settings > Edge Functions > Secrets, or `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

## Design System
- **Background:** dark navy (#1e2330)
- **Foreground:** off-white (#e4e7eb), strong (#f4f5f7)
- **Accent:** teal (#5ba8b5), hover (#72bec9)
- **Periwinkle:** #7c9bf5 (Tree of Life, health rings)
- **Sections:** Alternating dark/light via `.section-light`
- **Admin:** Dark theme using --color-admin-* CSS variables
- **Easing:** [0.16, 1, 0.3, 1] throughout
- **CRITICAL:** No Kabbalah/Hebrew references in public-facing code. Agents use secular names (Crown, Visionary, etc.)

## Deployment
- **Repo:** github.com/zev330-lab/zev-ai
- **Host:** Vercel
- **Live URL:** https://zev-ai-swart.vercel.app
- **Vercel Team:** steinmetz-real-estate-professionlas
- **Deploy:** `vercel --prod`
- **Edge Functions:** `supabase functions deploy tola-agent --no-verify-jwt`
- **Migrations:** `supabase db push`
