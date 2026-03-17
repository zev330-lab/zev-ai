'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { HeroGradient } from '@/components/hero-gradient';
import { TreeOfLife } from '@/components/tree-of-life';
import { SeedOfLife, MetatronsCube, SriYantra } from '@/components/sacred-geometry';

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const heroY = useTransform(heroScroll, [0, 0.8], [0, -60]);

  return (
    <>
      {/* ═══ SECTION 1 — HERO WITH TREE OF LIFE ═══ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <HeroGradient />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-12 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-center">
            {/* Left — text + CTAs */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.05] tracking-tight font-light max-w-xl">
                  AI agent systems
                  <br />
                  <span className="italic text-accent">built on sacred geometry.</span>
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="mt-8 text-lg text-muted-light max-w-md leading-relaxed">
                  11 specialized agents. 9 geometry engines. 22 structured communication
                  paths. The TOLA framework builds, deploys, and runs multi-agent AI
                  systems — not slide decks.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className="mt-12 flex flex-wrap items-center gap-6"
              >
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
                  href="/tola"
                  className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground-strong transition-colors duration-300"
                >
                  See the framework
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </Link>
              </motion.div>
            </div>

            {/* Right — Tree of Life (hero mode) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="w-[340px] h-[510px]">
                <TreeOfLife mode="hero" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Mobile: Tree behind text as ambient element */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[280px] h-[420px] opacity-[0.06] pointer-events-none lg:hidden" aria-hidden="true">
          <TreeOfLife mode="hero" />
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-9 rounded-full border border-muted/30 flex justify-center pt-2"
          >
            <div className="w-[2px] h-2.5 bg-muted/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 2 — THE PROBLEM ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-10 md:mb-14">
              The reality
            </p>
          </Reveal>

          <StaggerReveal className="space-y-0">
            <StaggerChild>
              <div className="max-w-[680px] pb-10 md:pb-14">
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                  Everyone&apos;s talking about AI agents.
                  <br />
                  Almost nobody&apos;s shipping them.
                </h2>
                <p className="text-muted-light text-lg leading-relaxed">
                  You&apos;ve seen the demos. Sat through the pitches. And yet your team still
                  copy-pastes the same data between three spreadsheets every Monday.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-10 md:pt-14 pb-10 md:pb-14">
                <div className="max-w-[680px] md:ml-auto md:text-right">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    You got a strategy deck
                    <br />
                    when you needed agents.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed md:ml-auto">
                    Most AI consultants deliver a PDF and a roadmap. Six figures later,
                    you still need to hire someone to build the thing. I skip the deck
                    and ship the system.
                  </p>
                </div>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-10 md:pt-14">
                <div className="max-w-[680px]">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    You don&apos;t need more advice.
                    <br />
                    You need a builder.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed">
                    Someone who understands multi-agent orchestration, builds the system,
                    deploys it with persistent runtime agents, and proves it works
                    before you pay full price.
                  </p>
                </div>
              </div>
            </StaggerChild>
          </StaggerReveal>
        </div>
      </section>

      {/* ═══ SECTION 3 — THE APPROACH (TOLA) ═══ */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              The TOLA framework
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
              Sacred geometry orchestration.
              <br />
              <span className="italic text-accent">Not another chatbot.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
            {[
              {
                num: '01',
                title: 'Assess',
                body: '13-dimension research engine analyzes your business, industry, and operations. Constraint-based planning ensures every recommendation is grounded in reality.',
                icon: MetatronsCube,
              },
              {
                num: '02',
                title: 'Build',
                body: '11 specialized agents orchestrated through the Tree of Life — each with a sacred geometry engine that defines how it processes information. Production code, deployed and running.',
                icon: SeedOfLife,
              },
              {
                num: '03',
                title: 'Operate',
                body: 'Persistent runtime agents monitor, optimize, and evolve your system 24/7. Kill switches, audit logging, and 3-tier human oversight keep everything under control.',
                icon: SriYantra,
              },
            ].map((phase, i) => (
              <Reveal key={phase.num} delay={i * 0.1}>
                <div className="relative">
                  <div className="mb-4">
                    <phase.icon size={48} animate={true} state="idle" />
                  </div>
                  <span className="text-[5rem] md:text-[6rem] font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">
                    {phase.num}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight mt-4 mb-4 text-foreground-strong">
                    {phase.title}
                  </h3>
                  <p className="text-muted-light leading-relaxed">
                    {phase.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-16 md:mt-20">
              <Link
                href="/tola"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300"
              >
                Learn how the framework works
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ SECTION 4 — PACKAGES ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">Packages</p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
              Four ways to work together
            </h2>
          </Reveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Assess', desc: 'Deep-dive analysis to find where AI creates real leverage. 13-dimension research + constraint-based roadmap.', nodes: '4 agents', price: 'From $2,500' },
              { name: 'Build', desc: 'Full design, development, and deployment of a multi-agent AI system integrated into your operations.', nodes: '11 agents', price: '$5k\u2013$25k' },
              { name: 'Optimize', desc: 'Ongoing AI leadership. Continuous development, monitoring, and iteration with full runtime agents.', nodes: '11+ agents', price: '$5k\u2013$10k/mo' },
              { name: 'Scale', desc: 'Multi-system deployment across your organization. Shared intelligence, unified dashboard, cross-product orchestration.', nodes: 'Unlimited', price: 'Custom' },
            ].map((pkg) => (
              <StaggerChild key={pkg.name}>
                <div className="border border-border rounded-2xl p-8 h-full transition-all duration-500 hover:border-accent/20">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground-strong mb-2">{pkg.name}</h3>
                  <p className="text-sm text-accent font-medium mb-4">{pkg.nodes} active</p>
                  <p className="text-muted-light leading-relaxed text-sm mb-6">{pkg.desc}</p>
                  <p className="text-sm font-medium text-foreground-strong">{pkg.price}</p>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>

          <Reveal>
            <div className="mt-12">
              <Link href="/services" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300">
                See full package details
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ SECTION 5 — SELF-REFERENTIAL PROOF ═══ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">The proof</p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-3xl mb-8">
              This site runs on TOLA. <span className="italic text-accent">Right now.</span>
            </h2>
            <p className="text-muted-light text-lg max-w-[640px] leading-relaxed mb-12">
              zev.ai was built by TOLA and runs on TOLA. 11 persistent agents
              monitor this site, research prospects, and maintain system health — all
              visible in the admin dashboard. The framework that builds is the
              framework that runs is the framework being sold.
            </p>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {[
                { label: 'Persistent agents', value: '11' },
                { label: 'Geometry engines', value: '9' },
                { label: 'Communication paths', value: '22' },
                { label: 'Uptime target', value: '99.9%' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[clamp(2rem,5vw,3rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <Link href="/work" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300">
              See the full case study
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══ SECTION 6 — BELIEFS ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <Reveal>
                <p className="text-xs tracking-[0.2em] uppercase text-muted-light">What I believe</p>
              </Reveal>
            </div>
            <div className="lg:col-span-9 max-w-2xl">
              <StaggerReveal className="divide-y divide-surface-light-border">
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 first:pt-0">
                    AI should build systems, not just answer questions.
                  </p>
                </StaggerChild>
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8">
                    The best AI strategy is a working prototype with agents running.
                  </p>
                </StaggerChild>
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 last:pb-0">
                    Small teams with sacred geometry orchestration beat big teams without it.
                  </p>
                </StaggerChild>
              </StaggerReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7 — CTA ═══ */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-8">
                Tell me what&apos;s broken.
                <br />
                I&apos;ll show you the agents I&apos;d build.
              </h2>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start your AI assessment
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </Link>
                <a href="mailto:zev330@gmail.com" className="text-sm text-muted-light hover:text-foreground-strong transition-colors duration-300 py-3.5">
                  or email zev330@gmail.com
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
