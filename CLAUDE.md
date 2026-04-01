# CLAUDE.md — zev-ai Project Constitution

## What This Project Is
askzev.ai — AI consulting business website and lead funnel for Zev Steinmetz. Converts visitors into paying clients through a 5-tier consulting funnel driven by Chris Voss tactical empathy principles.

## Stack
- **Framework:** Next.js 15, App Router, TypeScript, Tailwind CSS
- **Database:** Supabase Pro (project ref: ctrzkvdqkcqgejaedkbr)
- **Auth:** Supabase Auth (admin: zev330@gmail.com)
- **Hosting:** Vercel (domain: askzev.ai via Cloudflare DNS)
- **Email:** Resend
- **Payments:** Stripe
- **AI:** Claude API (Sonnet for runtime agents, Opus for roadmap generation)
- **Animations:** Framer Motion

## Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/           # Public-facing pages (/, /services, /approach, /about, /work, /blog)
│   ├── (auth)/             # Auth pages (/login)
│   ├── admin/              # Protected admin dashboard
│   ├── discover/           # Dynamic discovery form (the funnel entry point)
│   ├── roadmap/[slug]/     # Unique roadmap pages for $499 buyers
│   └── api/                # API routes
│       ├── discover/       # Form submission, acknowledgment, audio upload
│       ├── funnel/         # Research agent, email generator, roadmap webhook, retry
│       ├── opus/           # Opus messaging API (send/receive)
│       └── ...             # Other API routes
├── components/             # Reusable React components
├── lib/                    # Utilities, Supabase client, helpers
└── supabase/
    └── migrations/         # SQL migrations (numbered 001-029+)
```

## Key Database Tables
- **funnel_leads** — the funnel pipeline. All form submissions, research, deal stages.
- **discoveries** — legacy discovery pipeline (still triggers existing Edge Functions)
- **roadmaps** — generated $499 roadmap content and unique slugs
- **blog_posts** — content engine output
- **social_queue** — social media posts pending approval
- **tola_agents** — TOLA agent registry and status
- **tola_agent_log** — agent action log
- **opus_messages** — Opus↔Cain messaging channel
- **_pipeline_config** — runtime configuration (API keys, URLs)

## Design System
**Public-facing pages:** Light, warm, calming. Background #FAFAF8, sage green #A8B5A0, warm gold #C4A265, muted rose #D4A0A0, charcoal text #2C2C2C. Like steinmetzrealestate.com — NOT dark.

**Admin dashboard:** Dark professional. Deep indigo #0a0e1a, periwinkle #7c9bf5, lavender #c4b5e0, white text.

**Never:** Dark backgrounds on public pages. Dark navy on forms. Corporate/cold aesthetics anywhere client-facing.

## The Funnel (Core Business Logic)
5-tier consulting funnel:
1. **Free:** Discovery form → auto-email with free analysis
2. **$499:** AI Roadmap (interactive HTML, unique URL, delivered within 24hrs)
3. **$2,500:** Consultation ($2,001 with roadmap credit)
4. **$5K-$25K:** Single build
5. **Ongoing:** Retainer or custom

Deal stages: New Lead → Research Complete → Email Delivered → Roadmap Purchased → Consultation Booked → Proposal Sent → Building → Delivered

All agents are EVENT-DRIVEN (database triggers on INSERT/UPDATE). Never use cron jobs that call Claude API. pg_cron is acceptable only for free SQL-only operations.

## Communication Framework
All customer-facing copy uses Chris Voss tactical empathy:
- Calibrated questions ("what" and "how")
- Labels ("It sounds like...")
- Accusation audit (name fears before they do)
- Loss aversion in reverse (hope question)
- Absence of pressure as pressure
- Tone: warm, measured, human — late-night FM DJ

## Critical Rules — DO NOT VIOLATE
1. **Never create cron jobs that call Claude API.** All agent triggers must be event-driven (database INSERT/UPDATE triggers). Crons cost $700+ in 3 days when we tried this.
2. **Never deploy to Vercel without explicit instruction.** Build and verify locally first.
3. **Never use dark backgrounds on public-facing pages.** Light, warm, calming only.
4. **Never generate generic/template emails.** Every auto-email must reference the specific lead's pain, research, and situation.
5. **Never skip testing.** Verify every page renders, every form submits, every API responds before committing.
6. **The $499 roadmap credits toward the $2,500 consultation.** This pricing logic must be reflected everywhere it's mentioned.
7. **Audio uploads store to Supabase Storage.** Never store audio in the database directly.
8. **Admin routes are protected.** Only zev330@gmail.com can access /admin.

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

## Build & Deploy
```bash
npm run dev          # Local development (usually port 3000)
npm run build        # Production build — must pass before committing
npm run lint         # Linting
vercel --prod        # Deploy to production (only when explicitly told)
```

## Git Workflow
- Always commit with descriptive messages: `feat:`, `fix:`, `docs:`, `test:`
- Push to main branch
- Vercel auto-deploys from main (be careful — every push is a deploy and costs build minutes)

## MCP Servers Available
Verify with `claude mcp list`. Expected:
- context7 — live library docs for Next.js, Supabase, Tailwind
- playwright — headless browser testing for post-deploy verification

## What NOT to Touch
- `supabase/migrations/` — never modify existing migrations, only add new ones
- `.env.local` — contains secrets, never commit
- `node_modules/` — managed by npm
- Existing Edge Functions in Supabase — they work, don't break them

## Session Protocol
1. Start with `/clear` for fresh context
2. Read this file first
3. Understand the task before writing code
4. Plan the approach (which files to create/modify)
5. Build with tests or verification steps
6. Run `npm run build` before committing
7. Commit with descriptive message
8. Push only when verified
