# zev.ai — AI Consulting Website

## Overview
Flagship website for Zev Steinmetz's AI consulting practice. Apple.com-quality cinematic scroll experience. 6 pages (5 public + 1 private) with alternating dark/light sections, scroll-triggered animations, and large confident typography.

## Stack
- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4 (inline @theme)
- **Animations:** Framer Motion (useScroll, useTransform, useInView, stagger reveals, parallax)
- **Fonts:** Sora (sans, body) + Source Serif 4 (serif, headings/editorial)
- **Deployment:** Vercel
- **Domain:** zev.ai (pending DNS setup)

## Design System
- **Background:** near-black (#0a0a0a)
- **Foreground:** warm off-white (#e8e4de), strong (#fafaf8)
- **Accent:** warm gold (#c8a55e), hover (#d9b96f)
- **Muted:** #525250, light (#9a9a96)
- **Borders:** #1a1a1a
- **Surface:** #111111 (dark), #fafaf8 (light sections)
- **Sections:** Alternating dark/light via `.section-light` CSS utility
- **CTA style:** Gold rounded-full buttons with arrow icons
- **Easing:** `[0.22, 1, 0.36, 1]` throughout

## Pages (6 total)
- `/` — 7 cinematic sections: Hero (parallax + gradient orbs + scroll hint), Problem (light, 4 staggered statements), Approach (3 numbered phases), Capabilities (light, 6 items with gold dots), Scale (3 cards: Starter/Growth/Enterprise with floor statement), Difference (light, 3 beliefs with dividers), CTA
- `/services` — 4 service tiers (AI Readiness $2.5K, AI Implementation $5-25K, Fractional AI Officer $5-10K/mo, Performance Partnership base+10-25% impact). "Most aligned" badge on tier 4. Pricing transparency rationale.
- `/work` — Featured project narrative: real estate platform. Stats (2000+ pages, 18 agents, 28+ tables, 25 SOPs). 4 aspect deep-dives (Scale, Intelligence, Infrastructure, Automation). Tech stack.
- `/about` — Philosophy-first editorial prose. Implementation over strategy. Builder section (Zev's background). Technology stack ecosystem.
- `/contact` — 12-col grid: form (name, email, company optional, message) + sidebar (email, location, response time).
- `/discover` — **Private** (not in nav, noindex). Typeform-style multi-step client discovery intake form. 11 questions (one per screen), animated transitions, selection chips, review screen, mailto submission + clipboard fallback. Formspree endpoint placeholder ready to enable. Sent to prospects before meetings.

## Key Components
- `Navbar` — Sticky, 5 links + gold CTA button. Desktop at lg (1024px+), hamburger below. Transparent on hero, blur backdrop on scroll. Mobile full-screen overlay with serif links.
- `Footer` — Logo, description, email, LinkedIn, copyright.
- `Reveal` / `StaggerReveal` / `StaggerChild` — Scroll-triggered animation wrappers using useInView.
- `AnimatedNumber` — Count-up animation triggered on scroll into view.
- `HeroGradient` — Subtle ambient radial gradient orbs at very low opacity (0.03-0.04).
- `JsonLd` — Schema.org (Organization, WebSite, ProfessionalService with OfferCatalog).

## What's NOT Built Yet
- [ ] Backend API routes (contact form → email delivery)
- [ ] Supabase integration
- [ ] Live AI chat (real Claude API integration)
- [ ] Calendly embed
- [ ] Blog (when real content exists)
- [ ] Case studies (when 3+ real ones with permission)
- [ ] Analytics (GA, PostHog)
- [ ] Custom domain DNS

## Working Rules
- Design north star: apple.com — cinematic, confident, every animation serves the narrative
- Confidence is quiet. Desperation is loud.
- Every word earns its place or gets cut.
- Dark mode only, no light mode
- Alternating dark/light sections for rhythm and readability
- Performance target: 95+ Lighthouse scores
- Never commit .env files

## File Organization
```
src/
├── app/
│   ├── layout.tsx          # Root layout (Sora + Source Serif 4 fonts, navbar, footer, JSON-LD)
│   ├── page.tsx            # Home — 7 cinematic sections (client component)
│   ├── globals.css         # Tailwind v4 theme + .section-light utility
│   ├── sitemap.ts          # 5-page sitemap
│   ├── robots.ts           # robots.txt
│   ├── services/           # Services page + layout
│   ├── work/               # Work page + layout
│   ├── about/              # About page + layout
│   ├── contact/            # Contact page + layout
│   └── discover/           # Private client discovery intake form (not in nav)
├── components/
│   ├── navbar.tsx           # Sticky nav with 5 links + CTA
│   ├── footer.tsx           # Minimal footer
│   ├── reveal.tsx           # Reveal + StaggerReveal + StaggerChild
│   ├── animated-number.tsx  # Scroll-triggered count-up
│   ├── hero-gradient.tsx    # Ambient gradient orbs
│   └── json-ld.tsx          # Structured data with OfferCatalog
└── lib/
    ├── constants.ts         # Site config, 5 nav links
    └── utils.ts             # cn() helper
```

## Deployment
- **Repo:** github.com/zev330-lab/zev-ai
- **Host:** Vercel
- **Live URL:** https://zev-ai-swart.vercel.app
- **Vercel Team:** steinmetz-real-estate-professionlas
- **Build:** `npm run build`
- **Dev:** `npm run dev`
- **Deploy:** `vercel --prod --yes --scope steinmetz-real-estate-professionlas`
- **Status:** Phase 2.1 deployed (2026-03-13) — 4th service tier, scale spectrum, spacing refinements
