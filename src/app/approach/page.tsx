'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { TreeOfLife } from '@/components/tree-of-life';

const COORDINATION_PATTERNS = [
  {
    name: 'Hub-and-Spoke',
    nature: 'Branching patterns in trees, river deltas, neural dendrites',
    what: 'Spawns parallel specialist tasks from a central coordinator — the same pattern that lets a single tree trunk feed thousands of leaves.',
  },
  {
    name: 'All-to-All Research',
    nature: 'Crystal lattice structures, molecular bonding networks',
    what: 'Exhaustive parallel research across all information sources simultaneously. Every data point connects to every other — no blind spots.',
  },
  {
    name: 'Constraint Satisfaction',
    nature: 'Nested triangulation in crystal formation, snowflake symmetry',
    what: 'Plans complex systems where every decision affects others. Finds the optimal configuration that satisfies all constraints — like atoms settling into a crystal lattice.',
  },
  {
    name: 'Iterative Refinement',
    nature: 'Toroidal plasma flow, ocean currents, cardiac circulation',
    what: 'Cycles through analyze, synthesize, evaluate until convergence. The same self-correcting loop that keeps your heart beating and ocean currents flowing.',
  },
  {
    name: 'Progressive Pipeline',
    nature: 'Petal formation in flowers, layered growth rings in trees',
    what: 'Builds layered experiences where each stage gates the next. Progressive disclosure — the same pattern that lets a flower unfold one petal at a time.',
  },
  {
    name: 'Adversarial Verification',
    nature: 'Predator-prey balance, immune system response, symbiotic regulation',
    what: 'Generates opposing arguments and synthesizes balanced judgment. The same adversarial dynamic that keeps ecosystems healthy and immune systems sharp.',
  },
  {
    name: 'Graph Routing',
    nature: 'Mycelial networks, neural pathway formation, ant colony optimization',
    what: 'Routes messages through optimal paths with health-aware selection. The same pattern that lets fungal networks distribute nutrients across an entire forest.',
  },
  {
    name: 'Dual-Team Verification',
    nature: 'Binocular vision, DNA double-helix error correction',
    what: 'Two independent processes evaluate the same input — consensus required. The same redundancy that lets your two eyes create depth perception.',
  },
  {
    name: 'Recursive Deepening',
    nature: 'Spiral galaxies, nautilus shells, hurricane formation',
    what: 'Spirals inward with increasingly strict criteria each pass. The same vortex pattern that concentrates energy from diffuse to focused — galaxy arms to hurricane eyes.',
  },
];

const TIERS = [
  {
    tier: 1,
    pct: '80%',
    label: 'Autonomous',
    color: '#4ade80',
    desc: 'Most operational decisions — UX, technical implementation, error handling, performance — are handled by agents without human input. The system maintains quality through recursive self-testing.',
  },
  {
    tier: 2,
    pct: '15%',
    label: 'Notify & Proceed',
    color: '#f59e0b',
    desc: 'Meaningful choices the human should know about — infrastructure changes, dependency upgrades, trade-offs — are logged and surfaced. The system doesn\'t wait, but the human can intervene.',
  },
  {
    tier: 3,
    pct: '5%',
    label: 'Full Stop — Ask First',
    color: '#ef4444',
    desc: 'Brand identity, creative direction, security changes, and scope expansion require explicit human approval. You stay in control of the decisions that matter most.',
  },
];

export default function ApproachPage() {
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
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Our Approach
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Nature-tested architecture.
              <br />
              <span className="italic text-accent">Production-proven results.</span>
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              The agent architecture applies coordination patterns found in
              nature — the same fractal branching, spiral optimization, and self-similar
              scaling observed in biological systems, ecosystem dynamics, and
              crystal formation. These aren&apos;t metaphors. They&apos;re design
              principles optimized over billions of years of evolution.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plain-English Intro */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 pb-0 pt-0">
          <Reveal>
            <div className="border border-border rounded-2xl p-10 md:p-14 max-w-3xl">
              <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">The honest version</p>
              <p className="text-xl md:text-2xl font-[family-name:var(--font-serif)] leading-relaxed text-foreground-strong mb-6">
                Here&apos;s the honest version of how this works.
              </p>
              <div className="space-y-5 text-muted-light text-lg leading-relaxed">
                <p>
                  Most AI projects fail because someone built a demo and called it a system.
                  A demo runs when you run it. A system runs when you&apos;re not watching.
                </p>
                <p>
                  The difference is architecture. Not AI models — architecture. Which agents handle which tasks,
                  how they communicate, when they escalate to a human, and how they recover when something breaks.
                </p>
                <p>
                  That&apos;s what I build. Production AI systems — the kind that run 24/7, degrade gracefully
                  under load, and get smarter over time instead of just accumulating bugs.
                </p>
                <p>
                  The agent architecture draws on coordination patterns that appear in natural systems — branching,
                  spiraling, self-similar scaling. These patterns define how information flows through a system,
                  how agents specialize without becoming isolated, and how the whole thing stays coherent as it grows.
                </p>
                <p className="text-muted italic">
                  That&apos;s the plain English version. The architecture section below gets into the specifics.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The Architecture */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
                  The system
                </p>
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.15] tracking-tight mb-8">
                  11 specialized agents.
                  <br />
                  22 communication pathways.
                </h2>
                <div className="space-y-6 text-muted-light text-lg leading-relaxed">
                  <p>
                    Every AI system I build uses the Tree of Life as its organizational
                    pattern — a natural network structure that balances specialization
                    with coordination. 11 agents, each with a defined role, connected
                    through exactly 22 structured communication pathways.
                  </p>
                  <p>
                    This isn&apos;t arbitrary. In a system of 11 agents, a fully connected
                    network would require 55 pathways — that&apos;s chaos. 22 pathways
                    are the minimum set that ensures every agent can reach every other while
                    preserving clear routing hierarchy. Like neurons in a brain, structure
                    creates intelligence.
                  </p>
                  <p>
                    At the center sits the Nexus — a routing hub with 9 connections that
                    orchestrates the flow of information. Above it, a research and planning
                    layer. Below it, quality assurance and infrastructure. The same architecture
                    that organizes a biological nervous system organizes our AI agents.
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-[300px] h-[420px]">
                  <TreeOfLife mode="diagram" />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '11', label: 'Specialized agents' },
                { value: '22', label: 'Communication pathways' },
                { value: '9', label: 'Coordination patterns' },
                { value: '3', label: 'Oversight tiers' },
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

      {/* Coordination Patterns */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Coordination patterns
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-3xl mb-8">
              9 patterns modeled on nature.
              <br />
              <span className="italic text-accent">Each one battle-tested by evolution.</span>
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-16 md:mb-20">
              Each agent runs a specific coordination pattern — a
              mathematical structure drawn from natural systems. These patterns define
              how agents process information, communicate with each other, and arrive
              at decisions.
            </p>
          </Reveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COORDINATION_PATTERNS.map((pattern) => (
              <StaggerChild key={pattern.name}>
                <div className="border border-border rounded-2xl p-8 h-full">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground-strong mb-2">
                    {pattern.name}
                  </h3>
                  <p className="text-xs text-accent font-medium mb-4">
                    {pattern.nature}
                  </p>
                  <p className="text-sm text-muted-light leading-relaxed">
                    {pattern.what}
                  </p>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* 3-Tier Human Oversight */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Human oversight
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-3xl mb-8">
              You stay in control.
              <br />
              <span className="italic text-accent">Without becoming a bottleneck.</span>
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-16">
              Not every decision needs a human. The 3-tier model defines exactly when
              agents act autonomously, when they notify you, and when they stop and ask.
              You maintain authority over the decisions that matter — without slowing down
              the ones that don&apos;t.
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
                  <p className="text-sm text-muted-light leading-relaxed">{tier.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* Build + Runtime */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Build + Runtime
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-3xl mb-8">
              The agents that build your system
              <br />
              <span className="italic text-accent">are the agents that run it.</span>
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-16">
              Most AI projects get delivered and abandoned. These agents persist
              after deployment — monitoring, optimizing, and evolving your system 24/7.
              The same agents that designed and built your system are the ones that keep
              it running.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Reveal>
              <div className="border border-border rounded-2xl p-8">
                <h3 className="text-xl font-semibold tracking-tight mb-4">Build Phase</h3>
                <p className="text-sm text-muted-light leading-relaxed mb-6">
                  Agents run as specialized workers during the build. Each coordination
                  pattern defines how the agent processes information — research, plan,
                  synthesize, build, test, deploy.
                </p>
                <div className="space-y-2 text-sm text-muted-light">
                  <p>Research agents analyze your situation and competitive landscape</p>
                  <p>Planning agents architect the solution within real-world constraints</p>
                  <p>Quality agents review and test every component before deployment</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="border border-border rounded-2xl p-8">
                <h3 className="text-xl font-semibold tracking-tight mb-4">Runtime Phase</h3>
                <p className="text-sm text-muted-light leading-relaxed mb-6">
                  After deployment, agents persist as event-driven and scheduled services.
                  Zero cost when idle, automatic scaling under load. Kill switches and
                  tiered human oversight keep everything under control.
                </p>
                <div className="space-y-2 text-sm text-muted-light">
                  <p>Monitoring agents check system health every 60 seconds</p>
                  <p>Routing agents classify and direct incoming requests in real time</p>
                  <p>Quality agents continuously validate outputs and flag issues</p>
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
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-4 max-w-xl">
              Want to see it in action?
            </h2>
            <p className="text-muted-light text-lg leading-relaxed mb-8 max-w-xl">
              Start a discovery and I&apos;ll walk you through the live system — 11 agents
              running in production, real-time dashboards, and the architecture behind it.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/discover"
                className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Your Discovery
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/work"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300 py-3.5"
              >
                See case studies
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
