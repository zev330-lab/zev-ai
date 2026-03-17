'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { AnimatedNumber } from '@/components/animated-number';
import { TreeOfLife } from '@/components/tree-of-life';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';

const STATS = [
  { value: 11, suffix: '', label: 'Runtime Agents' },
  { value: 9, suffix: '', label: 'Geometry Engines' },
  { value: 22, suffix: '', label: 'Communication Paths' },
  { value: 4, suffix: '', label: 'Build Phases' },
];

const ASPECTS = [
  {
    label: 'Self-Referential',
    title: 'Built by the system it describes',
    body: 'This website was designed, developed, tested, and deployed by TOLA agents. The Visionary researched the landscape. The Architect planned the implementation. The Guardian reviewed every component. The Prism tested every page. The same agents that built it now run it.',
    engine: 'metatrons_cube' as const,
  },
  {
    label: 'Sacred Geometry',
    title: 'Mathematical patterns mapped to reasoning structures',
    body: "Each of TOLA's 9 geometry engines encodes a specific cognitive pattern. The Torus models iterative refinement. The Sri Yantra models constraint satisfaction. The Vortex models recursive deepening. These aren't metaphors \u2014 they're operational architectures that shape how agents think.",
    engine: 'sri_yantra' as const,
  },
  {
    label: 'Build + Runtime',
    title: 'Agents that persist after deployment',
    body: "Most AI consultancies deliver a system and walk away. TOLA agents don't stop when the build ends. The Sentinel monitors health every 60 seconds. The Catalyst nurtures leads continuously. The Nexus routes inquiries in real time. Build and runtime are the same system.",
    engine: 'merkabah' as const,
  },
  {
    label: 'Recursive Quality',
    title: 'Every output passes through the Vortex',
    body: "The Prism agent runs a 4-pass spiral test on every deliverable: smoke, feature, edge case, regression. The Guardian enforces brand and quality constraints adversarially. Nothing ships until both agents sign off.",
    engine: 'vortex' as const,
  },
];

const TECH = [
  'Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4',
  'Supabase', 'PostgreSQL', 'Framer Motion',
  'Claude API', 'Supabase Edge Functions', 'Vercel',
];

export default function WorkPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-36 md:pt-44 pb-20">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">Work</p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Live implementation: this site.
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              You&apos;re looking at a live TOLA deployment. Every page you&apos;ve
              visited was built by the same agents that power client engagements.
              The framework isn&apos;t theoretical &mdash; it&apos;s running right now.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tree of Life — how TOLA built this site */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">Case study</p>
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.15] tracking-tight mb-8">
                  How TOLA built this website
                </h2>
                <p className="text-lg text-muted-light leading-relaxed mb-8">
                  11 specialized agents. 9 sacred geometry engines. 22 structured
                  communication paths. A complete design system, 7 public pages,
                  a real-time admin dashboard, and persistent runtime agents &mdash;
                  all orchestrated through the Tree of Life.
                </p>
                <p className="text-muted-light leading-relaxed">
                  The diagram shows every agent that participated in the build and
                  now runs in production. Each node is a specialized agent with its
                  own sacred geometry reasoning engine. The 22 paths between them
                  define exactly how they communicate.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-[300px] h-[525px]">
                  <TreeOfLife mode="diagram" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className="text-[clamp(2.5rem,6vw,4rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-3 text-sm text-muted-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Aspects */}
      {ASPECTS.map((aspect, i) => {
        const GeometryIcon = GEOMETRY_COMPONENTS[aspect.engine];
        return (
          <section key={aspect.label} className={i % 2 === 0 ? 'section-light' : ''}>
            <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
              <Reveal>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                  <div className="lg:col-span-3 flex items-center gap-4">
                    {GeometryIcon && <GeometryIcon size={32} color="var(--color-accent)" animate />}
                    <p className="text-xs tracking-[0.2em] uppercase text-muted-light">{aspect.label}</p>
                  </div>
                  <div className="lg:col-span-9">
                    <h3 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl leading-[1.2] tracking-tight mb-5">{aspect.title}</h3>
                    <p className="text-muted-light text-lg leading-relaxed max-w-[640px]">{aspect.body}</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      {/* Build phases */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-8">Build phases</p>
            <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { phase: 'A', name: 'Assessment', agents: 'Visionary, Architect, Oracle', desc: 'Research across 13 dimensions, architecture planning, synthesis into actionable spec' },
                { phase: 'B', name: 'Build', agents: 'Foundation, Gateway, all 11', desc: 'Database tables, design system, 9 geometry components, 7 pages, runtime hooks' },
                { phase: 'C', name: 'Deploy', agents: 'Foundation, Sentinel, Nexus', desc: 'Edge Functions, real-time subscriptions, admin dashboard, kill switches' },
                { phase: 'D', name: 'Test', agents: 'Prism, Guardian, Sentinel', desc: '4-pass Vortex spiral: smoke, feature, edge case, regression' },
              ].map((p) => (
                <StaggerChild key={p.phase}>
                  <div className="border border-border rounded-xl p-6 h-full">
                    <span className="text-3xl font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">{p.phase}</span>
                    <h4 className="text-lg font-semibold mt-3 mb-2">{p.name}</h4>
                    <p className="text-sm text-accent mb-3">{p.agents}</p>
                    <p className="text-sm text-muted-light leading-relaxed">{p.desc}</p>
                  </div>
                </StaggerChild>
              ))}
            </StaggerReveal>
          </Reveal>
        </div>
      </section>

      {/* Tech stack */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-8">Technology</p>
            <div className="flex flex-wrap gap-3">
              {TECH.map((t) => (
                <span key={t} className="text-sm px-4 py-2 rounded-full border border-border text-muted-light">{t}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-8 max-w-xl">
              See what TOLA can build<br />for your business.
            </h2>
            <Link
              href="/discover"
              className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
            >
              Start your AI assessment
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
