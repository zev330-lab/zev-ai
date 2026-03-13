# zev.ai — AI Consulting Website

## Overview
Flagship website for Zev Steinmetz's AI consulting practice. The site IS the portfolio piece — every visitor should think "If he built THIS for himself, imagine what he could build for me."

## Stack
- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4 (inline @theme)
- **Animations:** Framer Motion
- **Fonts:** Inter (body), JetBrains Mono (code), Space Grotesk (display headings)
- **Deployment:** Vercel
- **Domain:** zev.ai (pending DNS setup)

## Pages
- `/` — Home (hero with particle field, typing effect, capabilities grid, stats, process, CTA)
- `/services` — Three pricing tiers (Assessment, Implementation, Fractional AI Officer) + FAQ
- `/about` — Zev's story, philosophy, what he built for Steinmetz RE
- `/case-studies` — Flagship Steinmetz RE case study + 3 coming-soon cards
- `/contact` — Contact form (console.log for now) + Calendly placeholder
- `/blog` — 3 placeholder articles with slug pages

## Key Components
- `Navbar` — Sticky glassmorphism, mobile hamburger with Framer Motion
- `Footer` — Links, social icons, "Built with AI" badge
- `AITerminal` — Floating chat widget with pre-programmed Q&A (bottom-right)
- `ParticleField` — Canvas-based particle system with mouse interaction (hero)
- `TypingEffect` — Rotating phrases with cursor animation
- `AnimatedCounter` — Scroll-triggered number animation
- `Section` / `SectionHeader` — Reusable section wrapper with scroll-in animation
- `JsonLd` — Schema.org structured data (Organization, WebSite, Service)

## Design System
- **Theme:** Near-black background (#050508), electric blue accent (#3b82f6), cyan (#06b6d4), violet (#8b5cf6)
- **CSS Classes:** `glass`, `glass-strong`, `gradient-text`, `glow-blue`, `glow-border`, `mesh-gradient`, `grid-pattern`
- **Aesthetic:** Premium dark mode, glassmorphism, subtle gradients, depth layers

## What's NOT Built Yet
- [ ] Backend API routes (contact form submission)
- [ ] Supabase integration
- [ ] Live AI chat (currently uses pre-programmed responses)
- [ ] Calendly embed (placeholder UI exists)
- [ ] Blog content (placeholder pages)
- [ ] Analytics (GA, PostHog)
- [ ] Real photography / headshot
- [ ] Custom domain DNS

## Working Rules
- All stats about Steinmetz Real Estate must be accurate: 2,000+ pages, 18 AI agents, Supabase backend
- NO "AI" branding that's cheesy — technology is sophisticated but subtle
- Dark mode only — no light mode toggle
- Performance target: 95+ Lighthouse scores
- Never commit .env files

## File Organization
```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts, navbar, footer, AI terminal
│   ├── page.tsx            # Home page (client component)
│   ├── globals.css         # Tailwind v4 theme + utility classes
│   ├── sitemap.ts          # Auto-generated sitemap
│   ├── robots.ts           # robots.txt
│   ├── services/           # Services page + layout (metadata)
│   ├── about/              # About page + layout
│   ├── case-studies/       # Case studies page + layout
│   ├── contact/            # Contact form page + layout
│   └── blog/               # Blog listing + [slug] pages
├── components/             # Shared components
└── lib/
    ├── constants.ts        # Site config, nav links, services, stats
    └── utils.ts            # cn() helper
```

## Deployment
- **Repo:** github.com/zev330-lab/zev-ai
- **Host:** Vercel
- **Live URL:** https://zev-ai-swart.vercel.app
- **Vercel Team:** steinmetz-real-estate-professionlas
- **Build:** `npm run build`
- **Dev:** `npm run dev`
- **Deploy:** `vercel --prod --yes --scope steinmetz-real-estate-professionlas`
- **Status:** Deployed and live (2026-03-13)
