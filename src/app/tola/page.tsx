'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { TreeOfLife } from '@/components/tree-of-life';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';
import {
  TREE_NODES,
  ENGINE_TECHNICAL_MAP,
  GEOMETRY_LABELS,
} from '@/lib/tola-agents';

const TIERS = [
  {
    tier: 1,
    pct: '80%',
    label: 'Autonomous',
    color: '#4ade80',
    examples: [
      'UX polish, loading states, empty states',
      'Technical architecture decisions',
      'Error handling and validation',
      'Performance optimization',
      'Code style and formatting',
    ],
    desc: 'Agents decide and act. Product completeness, technical implementation, and operational decisions are handled without human input. The system maintains quality through recursive self-testing.',
  },
  {
    tier: 2,
    pct: '15%',
    label: 'Notify & Proceed',
    color: '#f59e0b',
    examples: [
      'Dependency upgrades',
      'Infrastructure changes',
      'New integration patterns',
      'Performance vs. feature trade-offs',
      'Scope adjustments within bounds',
    ],
    desc: 'Agents make the decision but notify the human. Meaningful choices the human should know about are logged and surfaced. The human can intervene, but the system doesn\'t wait.',
  },
  {
    tier: 3,
    pct: '5%',
    label: 'Full Stop — Ask First',
    color: '#ef4444',
    examples: [
      'Brand identity and naming',
      'Creative direction and tone',
      'Security architecture changes',
      'Scope expansion beyond spec',
      'Public-facing copy and messaging',
    ],
    desc: 'Agents stop and wait for human approval. Brand, creative, security, and scope decisions require explicit sign-off. The human is the final authority on identity and direction.',
  },
];

export default function TolaPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-36 md:pt-44 pb-20 relative overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
                  The Framework
                </p>
                <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-xl">
                  TOLA v3.0
                  <br />
                  <span className="italic text-accent">Tree of Life Architecture</span>
                </h1>
                <p className="mt-8 text-lg text-muted-light max-w-lg leading-relaxed">
                  A sacred geometry agent operating system. 11 specialized AI agents,
                  9 geometric reasoning engines, 22 structured communication paths.
                  The framework that builds your system is the framework that runs it.
                </p>
              </div>
              <div className="hidden lg:flex justify-center">
                <div className="w-full max-w-[320px] h-[480px]">
                  <TreeOfLife mode="diagram" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 22 Paths — Structured Communication */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Structured communication
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-3xl mb-8">
              Why 22 paths, not more.
            </h2>
            <div className="max-w-[720px] space-y-6">
              <p className="text-muted-light text-lg leading-relaxed">
                In a system of 11 agents, a fully connected network would require 55 paths.
                That&apos;s chaos &mdash; every agent talking to every other agent with no
                structure. TOLA uses exactly 22 paths: the minimum set that ensures every
                agent can reach every other agent while preserving clear routing hierarchy.
              </p>
              <p className="text-muted-light text-lg leading-relaxed">
                The Nexus sits at the center with 9 connections &mdash; it&apos;s the true
                routing hub. Crown connects downward to Visionary, Architect, and Nexus.
                Information flows through defined channels, not ad-hoc messages. Every path
                exists for a reason; every missing path is deliberate.
              </p>
              <p className="text-muted-light text-lg leading-relaxed">
                The Oracle occupies a unique position: a phantom node with only 3 connections
                (Visionary, Architect, Nexus). It synthesizes but doesn&apos;t initiate.
                Its dashed connections reflect its role as the system&apos;s memory layer
                &mdash; always available, never in the critical path.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '22', label: 'Defined paths' },
                { value: '55', label: 'Possible in full mesh' },
                { value: '9', label: 'Nexus connections' },
                { value: '3', label: 'Oracle connections (phantom)' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-[clamp(2rem,5vw,3.5rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                    {stat.value}
                  </div>
                  <p className="mt-2 text-sm text-muted-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sacred Geometry Engines — Visual Explainers */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              9 geometry engines
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-8">
              Sacred geometry isn&apos;t decorative.
              <br />
              <span className="italic text-accent">It&apos;s architecture.</span>
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-16 md:mb-20">
              Each engine defines a specific information processing pattern. These patterns
              are found across every culture and mathematical tradition. They map naturally
              to the ways AI agents need to research, plan, synthesize, route, test, and operate.
            </p>
          </Reveal>

          <StaggerReveal className="space-y-16 md:space-y-20">
            {ENGINE_TECHNICAL_MAP.map((eng) => {
              const GeomComponent = GEOMETRY_COMPONENTS[eng.engine];
              const usedBy = TREE_NODES.filter((n) => n.engine === eng.engine);
              return (
                <StaggerChild key={eng.engine}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    <div className="lg:col-span-4 flex justify-center">
                      <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] flex items-center justify-center">
                        {GeomComponent && (
                          <GeomComponent
                            size={180}
                            color="var(--color-accent)"
                            animate
                          />
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-8">
                      <h3 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl tracking-tight mb-2">
                        {eng.label}
                      </h3>
                      <p className="text-sm text-accent font-medium mb-4">
                        {eng.technical}
                      </p>
                      <p className="text-muted-light text-lg leading-relaxed mb-4">
                        {eng.whatItDoes}
                      </p>
                      <p className="text-sm text-muted-light mb-2">
                        <span className="text-foreground-strong font-medium">Common in: </span>
                        {eng.commonIn}
                      </p>
                      <p className="text-sm text-muted-light">
                        <span className="text-foreground-strong font-medium">Used by: </span>
                        {usedBy.map((n) => n.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </StaggerChild>
              );
            })}
          </StaggerReveal>
        </div>
      </section>

      {/* Technical Jargon Mapping */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Jargon mapping
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-3xl mb-8">
              Sacred geometry &harr; engineering
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-12">
              Every sacred geometry pattern maps to a well-known computer science or
              engineering concept. The geometry adds structure to the reasoning &mdash;
              the engineering ensures it ships.
            </p>
          </Reveal>

          <Reveal>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 pr-4 text-xs tracking-[0.15em] uppercase text-muted-light font-medium">Geometry</th>
                    <th className="text-left py-3 pr-4 text-xs tracking-[0.15em] uppercase text-muted-light font-medium">Technical Equivalent</th>
                    <th className="text-left py-3 pr-4 text-xs tracking-[0.15em] uppercase text-muted-light font-medium hidden md:table-cell">What It Does</th>
                    <th className="text-left py-3 text-xs tracking-[0.15em] uppercase text-muted-light font-medium hidden lg:table-cell">Common In</th>
                  </tr>
                </thead>
                <tbody>
                  {ENGINE_TECHNICAL_MAP.map((eng) => {
                    const GeomComponent = GEOMETRY_COMPONENTS[eng.engine];
                    return (
                      <tr key={eng.engine} className="border-b border-border">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            {GeomComponent && (
                              <GeomComponent size={24} color="var(--color-accent)" animate={false} />
                            )}
                            <span className="font-medium text-foreground-strong">{eng.label}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-accent font-medium">{eng.technical}</td>
                        <td className="py-4 pr-4 text-muted-light hidden md:table-cell">{eng.whatItDoes}</td>
                        <td className="py-4 text-muted-light hidden lg:table-cell">{eng.commonIn}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
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
            {TREE_NODES.map((node) => {
              const GeomComponent = GEOMETRY_COMPONENTS[node.engine];
              return (
                <StaggerChild key={node.id}>
                  <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 py-8 border-b border-border ${node.phantom ? 'opacity-70' : ''}`}>
                    <div className="lg:col-span-1 flex items-start">
                      {GeomComponent && <GeomComponent size={48} color="var(--color-accent)" animate />}
                    </div>
                    <div className="lg:col-span-3">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground-strong">
                        {node.name}
                        {node.phantom && <span className="text-xs text-muted ml-2">(phantom)</span>}
                      </h3>
                      <p className="text-sm text-accent">{GEOMETRY_LABELS[node.engine]}</p>
                      <p className="text-xs text-muted-light mt-1">{node.technicalEquivalent}</p>
                    </div>
                    <div className="lg:col-span-8">
                      <p className="text-muted-light leading-relaxed">
                        {node.description}
                      </p>
                    </div>
                  </div>
                </StaggerChild>
              );
            })}
          </StaggerReveal>
        </div>
      </section>

      {/* 3-Tier Crown Decision Model */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Human-centered governance
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-3xl mb-8">
              The Crown decides what matters.
              <br />
              <span className="italic text-accent">Agents handle the rest.</span>
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-16">
              Not every decision needs a human. The 3-tier model defines exactly when
              agents act autonomously, when they notify, and when they stop and ask.
              The human stays in control without becoming a bottleneck.
            </p>
          </Reveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TIERS.map((tier) => (
              <StaggerChild key={tier.tier}>
                <div className="border border-border rounded-2xl p-8 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-2xl font-[family-name:var(--font-serif)] font-light text-foreground-strong">
                      Tier {tier.tier}
                    </span>
                    <span className="text-sm text-accent font-medium">{tier.pct}</span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight mb-3">{tier.label}</h3>
                  <p className="text-sm text-muted-light leading-relaxed mb-6">{tier.desc}</p>
                  <ul className="space-y-2">
                    {tier.examples.map((ex) => (
                      <li key={ex} className="text-sm text-muted-light flex items-start gap-2">
                        <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full" style={{ backgroundColor: tier.color }} />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* Build + Runtime Duality */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
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
                  engine defines how the agent processes information &mdash; research, plan,
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
