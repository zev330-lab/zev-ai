# zev.ai -- Da'at Lessons Learned Log

**Maintained by:** Da'at (Synthesis & Memory)
**Project:** zev.ai -- TOLA v3.0 Self-Referential Showcase
**Last updated:** 2026-03-17

---

## Entry 001: TOLA v3.0 Build -- Architecture & Implementation Lessons (2026-03-17)

**Phase:** Full TOLA v3.0 build pipeline (Crown -> Visionary -> Architect -> Oracle -> Nexus execution)
**Outcome:** zev.ai built and deployed as the first TOLA v3.0 project. Self-referential showcase operational -- the site describes TOLA v3.0 and runs on TOLA v3.0.

### What Worked

1. **Fat Function pattern for Supabase Edge Functions is superior to 1-function-per-agent.** A single Edge Function (`tola-agent/index.ts`) with internal routing replaces 11 separate function deployments. Benefits: shared `_shared/` utilities are colocated, deployment is atomic (one function, not 11), and the internal router provides a single entry point for all agent invocations. The KabbalahQ project (TOLA v2.0) used 9 separate Edge Functions and required a shared `_shared/agent-utils.ts` module that was fragile to path changes. The Fat Function pattern eliminates that fragility by keeping everything in one deployment unit. This should be the default pattern for all future TOLA deployments.

2. **Sacred geometry SVG components generated mathematically, not as static files.** All 9 geometry engine visualizations (Seed of Life, Metatron's Cube, Sri Yantra, Torus, Lotus, Yin-Yang, Flower of Life, Merkabah, Vortex) are computed from mathematical parameters. This means they scale to any size without artifacts, animate smoothly, and can be parameterized based on agent state (e.g., number of lit edges on Metatron's Cube reflects research progress). Static SVG files would have required a separate asset per state. The math-first approach also serves the self-referential narrative: the geometry is real, not decorative.

3. **Dual animation strategy (CSS keyframes + Framer Motion) provides the right tool for each job.** CSS keyframes handle continuous ambient animations (rotation, pulse, breathing) with zero JavaScript overhead -- these run on the compositor thread and never cause jank. Framer Motion handles state transitions (agent status changes, panel open/close, route transitions) where the animation must respond to React state. Mixing the two correctly produces fluid, performant UI without overloading either system. The key principle: if the animation is continuous and state-independent, use CSS; if it responds to data, use Framer Motion.

4. **Self-referential architecture is the strongest proof point.** The /work page case study IS the site itself. The /discover intake form says "The Visionary agent is already analyzing your responses." This is not marketing copy -- it is a factual description of what the runtime agents do. The self-referential loop means every interaction a prospect has with zev.ai is simultaneously a product demo. This eliminates the gap between "what we claim" and "what we deliver" that plagues most consulting websites.

5. **Nested layouts for theme isolation work cleanly in Next.js App Router.** `/admin/tola/layout.tsx` provides a dark theme (periwinkle/lavender palette per Crown decision) without breaking the existing `/admin` (contacts) and `/admin/discoveries` pages, which use a white/light theme as a work tool. The nested layout injects its own CSS variables scoped to the `/admin/tola/*` subtree. No global style leakage, no theme provider complexity. The pattern: each route subtree that needs a distinct visual identity gets its own layout with scoped CSS variables.

6. **React Flow 12.x custom nodes are clean with the right patterns.** Three patterns matter: (a) wrap custom node components in `memo()` to prevent re-renders when other nodes update; (b) use `Handle` components with transparent styling for invisible connection points -- visible handles add visual noise to a visualization that already has complex geometry; (c) define `nodeTypes` outside the component to prevent React Flow from recreating the registry on every render, which causes all nodes to unmount and remount (destroying animation state). These three patterns together produce a stable, performant Tree of Life visualization in the admin dashboard.

### What Broke (with Root Cause and Fix)

**Issue 1: Supabase Edge Function Deno imports break Next.js TypeScript**
- Root cause: Supabase Edge Functions run in Deno and use `jsr:` imports (e.g., `import { serve } from "jsr:@supabase/functions-js"`). TypeScript in a Next.js project cannot resolve `jsr:` protocol imports. The TypeScript compiler treats them as unresolvable modules and emits errors that block the build.
- Fix: Add `"supabase/functions"` to the `exclude` array in `tsconfig.json`. This tells TypeScript to skip the Deno files entirely while still type-checking the rest of the project.
- Lesson: **Any project mixing Next.js (Node.js) with Supabase Edge Functions (Deno) must exclude the functions directory from tsconfig.json.** This was also encountered in KabbalahQ (TOLA v2.0, lessons log Entry 002 item 4) but with `https://` URL imports instead of `jsr:` imports. The root cause is the same -- two incompatible module resolution systems in one repo. The fix is the same. This should be a standard step in any TOLA project setup, not a post-error discovery.

**Issue 2: Admin auth bypass when ADMIN_PASSWORD env var is undefined**
- Root cause: The admin auth check compared the user-supplied password against `process.env.ADMIN_PASSWORD`. When the env var is not set (common in local dev without `.env.local`, or in Vercel before env vars are configured), `process.env.ADMIN_PASSWORD` is `undefined`. The comparison `undefined === undefined` evaluates to `true`, meaning any request -- even with no password -- passes the auth check.
- Fix: Add a guard before the comparison: `if (!adminPassword) return false`. If the server has no admin password configured, no one can log in. This is the fail-closed pattern.
- Lesson: **Always guard against undefined env vars in auth checks with an explicit falsy check before the comparison.** The pattern is: `const adminPassword = process.env.ADMIN_PASSWORD; if (!adminPassword) return false; return suppliedPassword === adminPassword;`. This applies to any authentication that compares user input against an environment variable. The fail-closed default (deny access when config is missing) is always safer than the fail-open default (allow access when config is missing).

### Crown (Tier 3) Decisions

1. **Color palette override: periwinkle/lavender chosen over gold/amber.** Visionary research suggested gold/amber as the admin dashboard palette based on warmth and energy associations. Crown chose periwinkle/lavender instead. Lesson: **Crown Tier 3 decisions always override agent recommendations.** When the Visionary proposes and the Crown decides differently, implement the Crown's choice exactly without compromise. The Visionary's recommendation was reasonable, but Tier 3 exists precisely for subjective creative decisions where the human's taste is authoritative.

2. **CSS variables for admin theme separation.** `--color-admin-bg`, `--color-admin-surface`, `--color-admin-border` are scoped to the TOLA admin subtree. These variables exist alongside the public site's design tokens without collision. Crown approved this approach as the mechanism for theme isolation.

### Technical Lessons

1. **Fat Function routing is simpler than multi-function deployment.** The KabbalahQ project deployed 9 separate Edge Functions, each needing the shared `_shared/agent-utils.ts` directory and correct relative imports. The zev.ai project deploys one function (`tola-agent`) that internally routes to the correct agent handler. This eliminates: deployment ordering issues, shared import path fragility, 9x deployment commands, and per-function configuration. The internal router is just a switch on the agent ID in the request body.

2. **Supabase Realtime with dynamic imports for SSR safety.** The pattern `await import('@/lib/supabase')` keeps the Supabase client out of the server-side rendering bundle. Combined with a `hasSupabaseConfig()` guard, this allows the app to run in local development without Supabase env vars (gracefully degrading features that need the backend). The guard checks `typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL` before attempting any Supabase operation.

3. **Mathematical SVG generation scales better than static assets.** Each geometry component accepts parameters (size, color, animation state, active segments) and computes the SVG paths from formulas. For example, the Seed of Life generates 7 circles from a center point and radius, computing each circle's position with `2 * Math.PI * i / 6`. The Metatron's Cube generates 13 points and draws all 78 edges of K-13. This means: no asset pipeline, no multiple resolutions, no sprite sheets, and animations can modify geometric parameters directly rather than interpolating between pre-baked frames.

### Framework Gaps Identified

1. **The tsconfig exclusion for Supabase functions was rediscovered, not carried forward.** This exact issue was documented in KabbalahQ's lessons log (Entry 002, item 4) but was encountered again during the zev.ai build. The TOLA framework should include a project setup checklist that includes this step. The lessons log is only useful if it is consulted before building, not just written after building.

2. **No standard auth hardening checklist.** The `undefined === undefined` auth bypass is a basic security issue that should be caught by a pre-deployment security checklist. The Guardian agent should maintain a set of mandatory security checks for common patterns: env var auth (guard against undefined), JWT validation (guard against missing secret), API rate limiting (guard against abuse), CORS configuration (guard against open origins).

3. **Crown decision logging should be explicit.** The palette override (periwinkle over gold) was a Tier 3 decision, but the mechanism for recording why Crown chose differently from Visionary's recommendation is informal (conversation context). A structured Crown Decision Record (what was recommended, what was chosen, why) would make these decisions auditable and prevent future agents from re-proposing what Crown already rejected.

### Key Insights for Future Projects

1. **Self-referential products sell themselves.** When the product IS the demo, every user interaction is a sales conversation. The zev.ai pattern -- admin dashboard shows the live agents, work page describes the framework, discover form activates the agents -- eliminates the "trust gap" in consulting sales. Future TOLA products for clients should consider whether a self-referential element is possible. Even partial self-reference (e.g., "the support bot you're talking to was built using our framework") is powerful.

2. **Fat Function > many functions for Supabase Edge Functions in TOLA deployments.** The single-function pattern with internal routing should be the TOLA v3.0 standard. Reserve separate functions only for truly independent concerns (e.g., a public webhook endpoint that must have its own URL vs. the agent system).

3. **Mathematical SVG > static SVG for any geometry that needs to animate or parameterize.** The sacred geometry components are the reference implementation. Any future visualization that needs to reflect live data should be generated from math, not loaded from files. The performance characteristics are equivalent for simple shapes, and the flexibility advantage is decisive.

4. **Dual animation strategy (CSS + Framer Motion) should be the TOLA v3.0 UI standard.** CSS keyframes for continuous ambient effects. Framer Motion for state-driven transitions. Never use Framer Motion for continuous animations (it runs in the main thread and can cause jank). Never use CSS keyframes for data-driven transitions (they cannot respond to React state).

5. **Env var auth patterns must fail closed.** `if (!envVar) return false` before any comparison. This is non-negotiable for any auth flow that compares user input against an environment variable. The zev.ai fix should be extracted into a utility function (`validateEnvAuth(supplied, envVarName)`) for reuse across projects.

6. **Carry forward lessons from prior projects.** The tsconfig exclusion issue was solved in KabbalahQ but rediscovered in zev.ai. The TOLA framework needs a mechanism to surface relevant lessons from prior projects at build start time -- either a project setup checklist or an Oracle (Da'at) pre-build review that scans prior lessons logs for applicable warnings based on the tech stack being used.

---

*Log continues with future entries as the project progresses.*
