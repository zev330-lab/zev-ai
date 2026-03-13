# zev.ai — AI Consulting Website

## Overview
Flagship website for Zev Steinmetz's AI consulting practice. Ultra-refined dark minimalism — the restraint IS the statement. Three pages, clean typography, no flashy effects.

## Stack
- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4 (inline @theme)
- **Animations:** Framer Motion (subtle scroll reveals only)
- **Fonts:** Newsreader (serif, headings/logo) + Geist (sans, body)
- **Deployment:** Vercel
- **Domain:** zev.ai (pending DNS setup)

## Design System
- **Background:** near-black (#09090b)
- **Foreground:** warm off-white (#fafaf9)
- **Accent:** warm gold (#c8a26e)
- **Borders:** subtle dark (#1c1c22)
- **Aesthetic:** Type-driven, generous whitespace, no glassmorphism/gradients/glow/particles
- **CTA style:** underlined text links, not buttons — confidence is quiet

## Pages (3 total)
- `/` — Hero (name + statement + CTA), Problem section (visitor's pain, 3 blocks), Approach (3 numbered steps), Final CTA
- `/about` — Philosophy-first prose. Implementation over strategy. Brief human touch (Newton, MA, builder not theorist). No headshot, no bio card, no component breakdowns.
- `/contact` — Clean form (name, email, company optional, message textarea). Underlined inputs. Direct email fallback below.

## Removed in Phase 1.5
- `/services` — pricing on a public site at this stage makes us look small
- `/case-studies` — 1 real + 3 "coming soon" = padding
- `/blog` — placeholder posts are worse than no blog
- AI chat widget — canned responses undermine "real AI" message
- Particle field, typing effect, animated counters, glassmorphism, gradient text, glow effects

## Key Components
- `Navbar` — Sticky, minimal. Logo left (serif italic "zev" + gold ".ai"), About + Contact links right. Clean mobile slide-out.
- `Footer` — Copyright, email, LinkedIn. That's it.
- `Reveal` — Subtle scroll-triggered opacity+Y animation wrapper.
- `JsonLd` — Schema.org (Organization, WebSite, ProfessionalService)

## What's NOT Built Yet
- [ ] Backend API routes (contact form → email)
- [ ] Supabase integration
- [ ] Live AI chat (Phase 2 — real Claude API integration)
- [ ] Calendly embed
- [ ] Blog (when real content exists)
- [ ] Case studies (when 3+ real ones with permission)
- [ ] Services page (when ready for public pricing)
- [ ] Analytics (GA, PostHog)
- [ ] Custom domain DNS

## Working Rules
- Confidence is quiet. Desperation is loud.
- Never promote. Never explain. Never justify.
- If it needs a label saying "premium," it's not premium.
- Every word earns its place or gets cut.
- We solve THEIR problems. We don't talk about ourselves.
- Dark mode only, no light mode
- Performance target: 95+ Lighthouse scores
- Never commit .env files

## File Organization
```
src/
├── app/
│   ├── layout.tsx          # Root layout (Newsreader + Geist fonts, navbar, footer, JSON-LD)
│   ├── page.tsx            # Home (client component)
│   ├── globals.css         # Tailwind v4 theme (minimal)
│   ├── sitemap.ts          # 3-page sitemap
│   ├── robots.ts           # robots.txt
│   ├── about/              # About page + layout
│   └── contact/            # Contact page + layout
├── components/
│   ├── navbar.tsx           # Minimal sticky nav
│   ├── footer.tsx           # Minimal footer
│   ├── reveal.tsx           # Scroll animation wrapper
│   └── json-ld.tsx          # Structured data
└── lib/
    ├── constants.ts         # Site config, nav links (3 items only)
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
- **Status:** Phase 1.5 deployed (2026-03-13)
