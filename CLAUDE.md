# zev.ai — AI Consulting Website

## Supabase Setup (Manual Steps)
1. Create a Supabase project at supabase.com/dashboard
2. Run `supabase-setup.sql` in the SQL Editor (creates `contacts` + `discoveries` tables with RLS)
3. Copy project URL + anon key + service role key from Settings > API
4. Set env vars in Vercel (Settings > Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY` (from resend.com)
   - `ADMIN_PASSWORD` (choose a strong password)
5. Redeploy after setting env vars: `vercel --prod --yes --scope steinmetz-real-estate-professionlas`

## Overview
Flagship website for Zev Steinmetz's AI consulting practice. Apple.com-quality cinematic scroll experience. 8 pages (5 public + 3 private) with alternating dark/light sections, scroll-triggered animations, and large confident typography. Supabase backend for form submissions + admin dashboard for lead management.

## Stack
- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4 (inline @theme)
- **Animations:** Framer Motion (useScroll, useTransform, useInView, stagger reveals, parallax)
- **Fonts:** Sora (sans, body) + Source Serif 4 (serif, headings/editorial)
- **Backend:** Supabase (PostgreSQL + RLS), Resend (email notifications)
- **Deployment:** Vercel
- **Domain:** zev.ai (pending DNS setup)

## Design System
- **Background:** dark navy (#1e2330)
- **Foreground:** off-white (#e4e7eb), strong (#f4f5f7)
- **Accent:** teal (#5ba8b5), hover (#72bec9)
- **Muted:** #5c6272, light (#9298a6)
- **Borders:** #2a3042
- **Surface:** #242a38 (dark), #f6f5f2 (light sections)
- **Sections:** Alternating dark/light via `.section-light` CSS utility
- **CTA style:** Teal rounded-full buttons with arrow icons
- **Easing:** `[0.22, 1, 0.36, 1]` throughout

## Pages
### Public (5)
- `/` — 7 cinematic sections: Hero, Problem, Approach, Capabilities, Scale, Difference, CTA
- `/services` — 4 service tiers with pricing
- `/work` — Featured project narrative + stats
- `/about` — Philosophy + builder background
- `/contact` — Form (→ Supabase `contacts` table) + sidebar. Loading/success/error states. Resend email notification to zev@zev.ai.

### Private (3) — not in nav, noindex
- `/discover` — Typeform-style multi-step client discovery intake form. 12 questions (one per screen), animated transitions, selection chips, review screen. Submits to Supabase `discoveries` table via API. Mailto fallback if API fails. "Copy all answers" backup button.
- `/admin` — Admin dashboard: contacts list, status management (new/read/replied/archived), notes, search, filter. Light theme, sidebar nav, slide-out detail panel.
- `/admin/discoveries` — Discovery submissions list with full detail view. Statuses: new/reviewed/meeting_scheduled/proposal_sent/engaged/archived.

## API Routes
- `POST /api/submit-contact` — Validates, inserts into `contacts`, sends Resend notification
- `POST /api/submit-discover` — Validates, inserts into `discoveries`, sends Resend notification
- `POST /api/admin/login` — Password check, sets httpOnly auth cookie (7-day expiry)
- `GET /api/admin/contacts` — List contacts (supports ?status= and ?search= filters)
- `PATCH /api/admin/contacts` — Update contact status/notes
- `GET /api/admin/discoveries` — List discoveries (supports ?status= and ?search= filters)
- `PATCH /api/admin/discoveries` — Update discovery status/notes

## Database (Supabase)
- **`contacts`** — id, created_at, name, email, company, message, status, notes
- **`discoveries`** — id, created_at, name, email, company, role, business_overview, team_size, pain_points, repetitive_work, ai_experience, ai_tools_detail, magic_wand, success_vision, anything_else, status, notes
- **RLS:** anon can INSERT; service_role has full access

## Admin Auth
- Simple password auth via `ADMIN_PASSWORD` env var
- Middleware redirects unauthenticated `/admin/*` requests to `/admin/login`
- Auth stored in httpOnly cookie, 7-day expiry

## Key Components
- `Navbar` — Sticky, 5 links + CTA button. Desktop at lg+, hamburger below.
- `Footer` — Logo, description, email, LinkedIn, copyright.
- `Reveal` / `StaggerReveal` / `StaggerChild` — Scroll-triggered animation wrappers.
- `AnimatedNumber` — Count-up animation on scroll.
- `HeroGradient` — Subtle ambient gradient orbs.
- `JsonLd` — Schema.org structured data.

## What's NOT Built Yet
- [ ] Live AI chat (real Claude API integration)
- [ ] Calendly embed
- [ ] Blog (when real content exists)
- [ ] Case studies (when 3+ real ones with permission)
- [ ] Analytics (GA, PostHog)
- [ ] Custom domain DNS
- [ ] Resend domain verification (currently using onboarding@resend.dev)

## Working Rules
- Design north star: apple.com — cinematic, confident, every animation serves the narrative
- Confidence is quiet. Desperation is loud.
- Every word earns its place or gets cut.
- Dark mode only, no light mode (except admin dashboard — light theme for work tool)
- Alternating dark/light sections for rhythm and readability
- Performance target: 95+ Lighthouse scores
- Never commit .env files

## File Organization
```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home
│   ├── globals.css             # Tailwind v4 @theme
│   ├── sitemap.ts / robots.ts
│   ├── services/               # Services page
│   ├── work/                   # Work page
│   ├── about/                  # About page
│   ├── contact/                # Contact form (wired to API)
│   ├── discover/               # Multi-step intake form (wired to API)
│   ├── admin/                  # Admin dashboard
│   │   ├── login/page.tsx      # Password login
│   │   ├── page.tsx            # Contacts view
│   │   └── discoveries/page.tsx # Discoveries view
│   └── api/
│       ├── submit-contact/     # Public form endpoint
│       ├── submit-discover/    # Public form endpoint
│       └── admin/              # Auth + CRUD endpoints
│           ├── login/
│           ├── contacts/
│           └── discoveries/
├── components/
│   ├── navbar.tsx / footer.tsx
│   ├── reveal.tsx / animated-number.tsx
│   ├── hero-gradient.tsx / json-ld.tsx
├── lib/
│   ├── constants.ts
│   ├── supabase.ts             # Client + Admin Supabase instances
│   └── utils.ts
├── middleware.ts                # Admin route protection
supabase-setup.sql              # DB schema + RLS policies
.env.example                    # All required env vars
```

## Deployment
- **Repo:** github.com/zev330-lab/zev-ai
- **Host:** Vercel
- **Live URL:** https://zev-ai-swart.vercel.app
- **Vercel Team:** steinmetz-real-estate-professionlas
- **Build:** `npm run build`
- **Dev:** `npm run dev`
- **Deploy:** `vercel --prod --yes --scope steinmetz-real-estate-professionlas`
- **Status:** Backend + admin dashboard deployed (2026-03-13). Forms wired to Supabase. Needs env vars set in Vercel to go live.
