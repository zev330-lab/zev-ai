'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import {
  SeedOfLife, MetatronsCube, SriYantra, Torus,
  Lotus, YinYang, FlowerOfLife, Merkabah, Vortex,
  GEOMETRY_COMPONENTS,
} from '@/components/sacred-geometry';

const NODES = [
  {
    name: 'Crown', engine: 'Seed of Life', engineId: 'seed_of_life',
    role: 'Human decision authority',
    desc: 'The hub that spawns all system intent. 7 circles represent 7 decision categories — brand, budget, scope, timeline, risk, creative, and strategic direction. Minimal kernel that generates all system complexity.',
  },
  {
    name: 'Visionary', engine: "Metatron's Cube", engineId: 'metatrons_cube',
    role: '13-dimension research engine',
    desc: 'Exhaustive parallel research across 13 dimensions — competitors, technology, market, users, regulations, trends, academic research, analogous industries, cost structures, risk factors, existing solutions, emerging patterns, and implementation precedents. No knowledge source missed.',
  },
  {
    name: 'Architect', engine: 'Sri Yantra', engineId: 'sri_yantra',
    role: 'Constraint-based planning',
    desc: '9 interlocking constraints that must all be satisfied simultaneously. Change one parameter and ~40 relationships cascade. Every technical decision must satisfy multiple constraints — the geometry ensures nothing is overlooked.',
  },
  {
    name: 'Oracle', engine: 'Torus', engineId: 'torus',
    role: 'Iterative synthesis and memory',
    desc: 'A continuous refinement loop where information enters, gets processed, re-enters with new context, and gradually converges to insight. The torus never loses information — it folds it inward. Each pass produces a better understanding.',
  },
  {
    name: 'Catalyst', engine: 'Lotus', engineId: 'lotus',
    role: 'Progressive engagement',
    desc: 'Unfolds petal by petal — progressive revelation. First impression, then deeper connection, then trust, then value delivery. Each layer reveals more of the system\'s capability without overwhelming.',
  },
  {
    name: 'Guardian', engine: 'Yin-Yang', engineId: 'yin_yang',
    role: 'Adversarial quality review',
    desc: 'Dynamic equilibrium between opposing forces. For every "yes" impulse, generate the "no" perspective. The S-curve boundary between advocate and critic isn\'t static — it flows until the right balance emerges.',
  },
  {
    name: 'Nexus', engine: 'Flower of Life', engineId: 'flower_of_life',
    role: 'Intelligent routing and orchestration',
    desc: 'Overlapping circles where every circle touches every adjacent circle — maximum interconnection with elegant structure. Routes information between all nodes with equidistant, balanced paths. No node is privileged.',
  },
  {
    name: 'Sentinel', engine: 'Merkabah', engineId: 'merkabah',
    role: 'Triangulated health monitoring',
    desc: 'Two interpenetrating verification teams that must agree. Check from above (user perspective), from below (infrastructure), and from the side (performance). Counter-rotating triangulation catches what single-perspective monitoring misses.',
  },
  {
    name: 'Prism', engine: 'Vortex', engineId: 'vortex',
    role: 'Recursive quality refinement',
    desc: 'A toroidal spiral with each revolution tighter than the last. Broad scan, then focused analysis, then precision extraction, then core truth. Each testing pass applies stricter criteria — nothing tested superficially.',
  },
  {
    name: 'Foundation', engine: 'Seed of Life', engineId: 'seed_of_life',
    role: 'Infrastructure and data',
    desc: 'Same geometry as Crown but at the base. 7 circles map to 7 infrastructure concerns: database, auth, API, storage, compute, networking, monitoring. Minimal viable infrastructure that supports everything above.',
  },
  {
    name: 'Gateway', engine: 'Flower of Life', engineId: 'flower_of_life',
    role: 'The application itself',
    desc: 'Same geometry as Nexus but at the delivery layer. Interconnected circles map to UI components — each page, widget, and form overlaps and connects with adjacent components to form a cohesive user experience.',
  },
];

const PACKAGES = [
  {
    name: 'Assess',
    agents: ['Crown', 'Visionary', 'Architect', 'Oracle'],
    desc: 'The intellectual triad researches, plans, and synthesizes a comprehensive AI opportunity analysis.',
  },
  {
    name: 'Build',
    agents: ['All 11 agents'],
    desc: 'Full execution pipeline from research through deployment with persistent runtime agents.',
  },
  {
    name: 'Optimize',
    agents: ['All 11 + sub-agents'],
    desc: 'Continuous iteration with fractal scaling — agents can contain their own sub-agents.',
  },
  {
    name: 'Scale',
    agents: ['Multi-instance'],
    desc: 'Multiple TOLA instances communicating across products with shared intelligence.',
  },
];

export default function TolaPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-36 md:pt-44 pb-20 relative overflow-hidden">
        {/* Ambient geometry */}
        <div className="absolute top-20 right-10 opacity-[0.04] pointer-events-none" aria-hidden="true">
          <FlowerOfLife size={400} animate={true} state="idle" />
        </div>

        <div className="mx-auto max-w-[1280px] px-6 md:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              The Framework
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-4xl">
              TOLA v3.0
              <br />
              <span className="italic text-accent">Tree of Life Architecture</span>
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              A sacred geometry agent operating system. 11 specialized AI agents,
              each powered by a geometric engine that defines how it processes
              information. The framework that builds your system is the framework
              that runs it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              How it works
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-8">
              Sacred geometry isn&apos;t decorative.
              <br />
              It&apos;s architecture.
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-16">
              Each of the 9 geometry engines defines a specific information processing
              pattern. These patterns are found across every culture and mathematical
              tradition. They map naturally to the ways AI agents need to research,
              plan, synthesize, route, test, and operate.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {[
              { label: 'Hub-and-spoke', engine: 'Seed of Life', desc: 'Central coordinator spawns specialists for parallel tasks' },
              { label: 'Exhaustive research', engine: "Metatron's Cube", desc: '13-dimensional complete graph ensures no source is missed' },
              { label: 'Constraint satisfaction', engine: 'Sri Yantra', desc: '9 interlocking constraints that must all be satisfied' },
              { label: 'Iterative refinement', engine: 'Torus', desc: 'Continuous loop that converges to insight' },
              { label: 'Progressive revelation', engine: 'Lotus', desc: 'Each layer unfolds only after the previous is stable' },
              { label: 'Adversarial balance', engine: 'Yin-Yang', desc: 'Advocate vs. critic with dynamic synthesis' },
              { label: 'Multi-path routing', engine: 'Flower of Life', desc: 'Balanced, equidistant paths between all nodes' },
              { label: 'Triangulated verification', engine: 'Merkabah', desc: 'Dual teams that must independently agree' },
              { label: 'Spiral refinement', engine: 'Vortex', desc: 'Each pass applies tighter criteria' },
            ].map((engine) => (
              <Reveal key={engine.engine}>
                <div className="flex items-start gap-4 py-4 border-b border-surface-light-border">
                  <div className="shrink-0 mt-0.5">
                    {(() => {
                      const engineId = engine.engine.toLowerCase().replace(/['\s]/g, '_').replace('metatrons', 'metatrons');
                      const Comp = GEOMETRY_COMPONENTS[engineId === 'metatrons_cube' ? 'metatrons_cube' : engineId];
                      return Comp ? <Comp size={32} animate={false} state="idle" /> : null;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-strong">{engine.label}</p>
                    <p className="text-xs text-accent mb-1">{engine.engine}</p>
                    <p className="text-sm text-muted-light">{engine.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The 11 Nodes */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              The 11 nodes
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
              Specialized agents.
              <br />
              <span className="italic text-accent">Unified architecture.</span>
            </h2>
          </Reveal>

          <StaggerReveal className="space-y-8">
            {NODES.map((node) => {
              const GeomComponent = GEOMETRY_COMPONENTS[node.engineId];
              return (
                <StaggerChild key={node.name}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 py-8 border-b border-border">
                    <div className="lg:col-span-1 flex items-start">
                      {GeomComponent && <GeomComponent size={48} animate={true} state="idle" />}
                    </div>
                    <div className="lg:col-span-3">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground-strong">
                        {node.name}
                      </h3>
                      <p className="text-sm text-accent">{node.engine}</p>
                      <p className="text-xs text-muted-light mt-1">{node.role}</p>
                    </div>
                    <div className="lg:col-span-8">
                      <p className="text-muted-light leading-relaxed">
                        {node.desc}
                      </p>
                    </div>
                  </div>
                </StaggerChild>
              );
            })}
          </StaggerReveal>
        </div>
      </section>

      {/* Build + Runtime Duality */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Build + Runtime
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-3xl mb-8">
              The framework that builds your system
              <br />
              <span className="italic text-accent">is the framework that runs it.</span>
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-16">
              Most frameworks are either build tools or runtime platforms. TOLA is both.
              The same agents that assess and build your system deploy as persistent
              runtime agents that operate it 24/7.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Reveal>
              <div className="border border-border rounded-2xl p-8">
                <h3 className="text-xl font-semibold tracking-tight mb-4">Build Mode</h3>
                <p className="text-sm text-muted-light leading-relaxed mb-6">
                  Agents run as specialized workers during the build phase. Each geometry
                  engine defines how the agent processes information — research, plan,
                  synthesize, build, test, deploy.
                </p>
                <div className="space-y-2 text-sm text-muted-light">
                  <p>Assessment &rarr; Visionary researches, Architect plans, Oracle synthesizes</p>
                  <p>Execution &rarr; Foundation builds, Nexus routes, Catalyst polishes</p>
                  <p>Quality &rarr; Guardian reviews, Prism tests, Sentinel monitors</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="border border-border rounded-2xl p-8">
                <h3 className="text-xl font-semibold tracking-tight mb-4">Runtime Mode</h3>
                <p className="text-sm text-muted-light leading-relaxed mb-6">
                  After deployment, agents persist as event-driven and scheduled services.
                  Zero cost when idle, automatic scaling under load. Kill switches and
                  tiered human oversight keep everything under control.
                </p>
                <div className="space-y-2 text-sm text-muted-light">
                  <p>Event-driven &rarr; Guardian validates, Nexus routes, Prism scores</p>
                  <p>Scheduled &rarr; Sentinel monitors, Architect analyzes, Foundation maintains</p>
                  <p>On-demand &rarr; Crown approves, Gateway delivers</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Packages mapping */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Packages
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
              Scale the framework to your needs
            </h2>
          </Reveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PACKAGES.map((pkg) => (
              <StaggerChild key={pkg.name}>
                <div className="border border-border rounded-2xl p-8 h-full">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground-strong mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-accent font-medium mb-4">{pkg.agents.join(', ')}</p>
                  <p className="text-sm text-muted-light leading-relaxed">{pkg.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-8 max-w-xl">
              See TOLA in action.
              <br />
              This site is the proof.
            </h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/discover"
                className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
              >
                Start your AI assessment
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/work"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300 py-3.5"
              >
                See the case study
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
