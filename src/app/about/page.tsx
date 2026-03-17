'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/reveal';
import { SeedOfLife, Torus, Vortex } from '@/components/sacred-geometry';

const STACK = [
  'Claude', 'Claude Code', 'Next.js 16', 'React 19', 'TypeScript',
  'Tailwind CSS v4', 'Supabase', 'PostgreSQL', 'Vercel',
  'Framer Motion', 'React Flow', 'Supabase Edge Functions',
];

export default function AboutPage() {
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
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              About
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Built, not theorized.
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <div className="max-w-[680px] space-y-10">
            <Reveal>
              <p className="font-[family-name:var(--font-serif)] text-xl md:text-2xl leading-[1.6] tracking-tight">
                The AI consulting industry has a problem. Most firms deliver strategy
                decks and roadmaps — documents that describe what you could do,
                then leave you to figure out how.
              </p>
            </Reveal>

            <Reveal>
              <p className="font-[family-name:var(--font-serif)] text-xl md:text-2xl leading-[1.6] tracking-tight">
                I built a framework that skips the deck and builds the system.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                TOLA — the Tree of Life Architecture — is a multi-agent AI operating
                system. 11 specialized agents, each powered by a sacred geometry
                reasoning engine, orchestrated through the Tree of Life.
                It sounds esoteric. It&apos;s not. It&apos;s a production framework
                that builds, runs, and continuously improves real software systems.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                The geometry isn&apos;t decorative — it&apos;s operational. A Torus
                models iterative refinement. A Sri Yantra models constraint
                satisfaction. A Vortex models recursive deepening. These patterns
                give agents structured ways to reason about complex problems
                instead of generating text and hoping for the best.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                The result: AI systems that ship to production in weeks, not months.
                Systems where agents persist after deployment — monitoring, nurturing,
                routing, testing — continuously. Not a one-time build. A living system.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The three pillars */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-12">
              Three principles
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Reveal delay={0.1}>
              <div className="space-y-4">
                <SeedOfLife size={40} color="var(--color-accent)" animate />
                <h3 className="text-lg font-semibold tracking-tight">
                  Sacred geometry as architecture
                </h3>
                <p className="text-muted-light leading-relaxed">
                  9 mathematical patterns — from the Seed of Life to the Vortex —
                  encode specific reasoning strategies. Each agent inherits a geometry
                  engine that shapes how it processes information.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-4">
                <Torus size={40} color="var(--color-accent)" animate />
                <h3 className="text-lg font-semibold tracking-tight">
                  Build and runtime are one system
                </h3>
                <p className="text-muted-light leading-relaxed">
                  TOLA agents don&apos;t stop when the build ends. The same agents that
                  design and develop your system persist as runtime processes —
                  monitoring, responding, improving.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="space-y-4">
                <Vortex size={40} color="var(--color-accent)" animate />
                <h3 className="text-lg font-semibold tracking-tight">
                  Recursive quality, not manual QA
                </h3>
                <p className="text-muted-light leading-relaxed">
                  The Prism agent runs 4-pass spiral tests on every deliverable.
                  The Guardian enforces constraints adversarially. The human reviews
                  outcomes, not bugs.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The builder */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-3">
                <p className="text-xs tracking-[0.2em] uppercase text-muted">
                  The builder
                </p>
              </div>
              <div className="lg:col-span-9 max-w-[640px]">
                <p className="text-muted-light text-lg leading-[1.8] mb-6">
                  I came to AI agent systems through building. As a real estate
                  professional in Newton, Massachusetts, I needed technology that
                  didn&apos;t exist — so I built it. A platform spanning thousands
                  of pages, running dozens of AI agents, managing an entire business
                  operation. Not a prototype. A full production system.
                </p>
                <p className="text-muted-light text-lg leading-[1.8] mb-6">
                  TOLA emerged from that experience — a realization that multi-agent
                  systems need structure beyond prompt engineering. The Tree of Life
                  provided the architecture. Sacred geometry provided the reasoning
                  patterns. The result was a framework that could build complex systems
                  reliably, and keep running them after deployment.
                </p>
                <p className="text-muted-light text-lg leading-[1.8]">
                  Builder, not theorist. The framework proves itself by running
                  in production — including on the site you&apos;re reading right now.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stack */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-3">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-light">
                  The stack
                </p>
              </div>
              <div className="lg:col-span-9">
                <p className="text-muted-light mb-8 max-w-xl leading-relaxed">
                  Modern, battle-tested infrastructure. Every tool chosen for
                  reliability, performance, and speed of deployment.
                </p>
                <div className="flex flex-wrap gap-3">
                  {STACK.map((t) => (
                    <span
                      key={t}
                      className="text-sm px-4 py-2 rounded-full border border-border"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-8 max-w-xl">
              Want to see what TOLA
              <br />
              can build for you?
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
