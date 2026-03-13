'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { AnimatedNumber } from '@/components/animated-number';
import { HeroGradient } from '@/components/hero-gradient';

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
      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <HeroGradient />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-12 w-full"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(3rem,8vw,7rem)] leading-[1.05] tracking-tight font-light max-w-4xl">
              AI systems that
              <br />
              <span className="italic text-accent">actually work.</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mt-8 text-lg md:text-xl text-muted-light max-w-xl leading-relaxed">
              We build production AI for businesses — intelligent agents, automated
              workflows, and custom tools that run inside your operations. Not slide
              decks. Working software.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12"
          >
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.03]"
            >
              Start a conversation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

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

      {/* ═══════════════════════════════════════════
          SECTION 2 — THE PROBLEM
          ═══════════════════════════════════════════ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-32 md:py-40">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-20 md:mb-28">
              The reality
            </p>
          </Reveal>

          <StaggerReveal className="space-y-20 md:space-y-28">
            <StaggerChild>
              <div className="max-w-3xl">
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-5">
                  Everyone&apos;s talking about AI.
                  <br />
                  Almost nobody&apos;s using it.
                </h2>
                <p className="text-muted-light text-lg leading-relaxed max-w-2xl">
                  You&apos;ve seen the demos, sat through the pitches, read the LinkedIn
                  posts about how AI will change everything. And yet your business
                  runs the same way it did two years ago.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="max-w-3xl md:ml-auto md:text-right">
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-5">
                  You&apos;ve been sold strategy
                  <br />
                  when you needed systems.
                </h2>
                <p className="text-muted-light text-lg leading-relaxed max-w-2xl md:ml-auto">
                  Most AI consultants deliver a PDF and a roadmap. You needed someone
                  who delivers working software — systems that are live, tested, and
                  running inside your operations.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="max-w-3xl">
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-5">
                  Your competitors aren&apos;t waiting.
                </h2>
                <p className="text-muted-light text-lg leading-relaxed max-w-2xl">
                  While you&apos;re evaluating, someone in your market is deploying.
                  AI adoption isn&apos;t a future trend — it&apos;s a present advantage.
                  The gap between companies that use AI and those that don&apos;t is
                  widening every quarter.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="max-w-3xl md:ml-auto md:text-right">
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-5">
                  You don&apos;t need more advice.
                  <br />
                  You need a builder.
                </h2>
                <p className="text-muted-light text-lg leading-relaxed max-w-2xl md:ml-auto">
                  Someone who understands your operations, identifies where AI
                  creates real leverage, builds the system, and proves it works.
                  That&apos;s what we do.
                </p>
              </div>
            </StaggerChild>
          </StaggerReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — THE APPROACH
          ═══════════════════════════════════════════ */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-32 md:py-40">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              How we work
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-20 md:mb-28">
              Three phases. One goal:
              <br />
              <span className="italic text-accent">systems that deliver.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
            {[
              {
                num: '01',
                title: 'Understand',
                body: 'We learn your business before we touch technology. What works, what doesn\'t, where the real leverage is. Not a surface-level audit — a deep understanding of how your operations actually run.',
              },
              {
                num: '02',
                title: 'Build',
                body: 'We don\'t write reports. We build real AI systems — agents, automations, workflows — that integrate directly into your existing operations. Production code, not prototypes.',
              },
              {
                num: '03',
                title: 'Prove',
                body: 'Every system we build has measurable impact. We track performance, optimize continuously, and identify the next opportunity. If it doesn\'t make your business measurably better, we haven\'t done our job.',
              },
            ].map((phase, i) => (
              <Reveal key={phase.num} delay={i * 0.15}>
                <div className="relative">
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — WHAT WE BUILD
          ═══════════════════════════════════════════ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-32 md:py-40">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Capabilities
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-20 md:mb-28">
              The systems we build
            </h2>
          </Reveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16 md:gap-y-20">
            {[
              {
                name: 'Intelligent Agents',
                desc: 'AI agents that handle real work — client communication, lead scoring, content generation, data analysis — running autonomously inside your business.',
              },
              {
                name: 'Workflow Automation',
                desc: 'End-to-end automation of manual processes. Not simple if-then rules — intelligent systems that adapt, learn, and handle edge cases.',
              },
              {
                name: 'AI-Powered Platforms',
                desc: 'Full-stack applications with AI at the core. Customer-facing tools, internal dashboards, data pipelines — complete systems, not bolt-on features.',
              },
              {
                name: 'Content Infrastructure',
                desc: 'AI-driven content generation at scale. SEO-optimized pages, market analysis, personalized communications — thousands of pages, not dozens.',
              },
              {
                name: 'Data & Decision Systems',
                desc: 'Automated data collection, scoring, and routing. Turn raw information into prioritized actions with intelligent decision logic.',
              },
              {
                name: 'Custom AI Tools',
                desc: 'Purpose-built AI tools designed for your specific domain. Chatbots, recommendation engines, document processors — whatever your business needs.',
              },
            ].map((cap) => (
              <StaggerChild key={cap.name}>
                <div className="group">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-accent mt-3 shrink-0 group-hover:scale-150 transition-transform duration-500" />
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight mb-2">
                        {cap.name}
                      </h3>
                      <p className="text-muted-light leading-relaxed">
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5 — PROOF
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-32 md:py-40">
          {/* Metrics */}
          <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-24 md:mb-32">
              <div>
                <div className="text-[clamp(3rem,7vw,5rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                  <AnimatedNumber value={2000} suffix="+" />
                </div>
                <p className="mt-3 text-muted-light">pages built with AI</p>
              </div>
              <div>
                <div className="text-[clamp(3rem,7vw,5rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                  <AnimatedNumber value={18} />
                </div>
                <p className="mt-3 text-muted-light">intelligent agents deployed</p>
              </div>
              <div>
                <div className="text-[clamp(3rem,7vw,5rem)] font-[family-name:var(--font-serif)] font-light text-foreground-strong leading-none">
                  100%
                </div>
                <p className="mt-3 text-muted-light">real systems, not slide decks</p>
              </div>
            </div>
          </Reveal>

          {/* Proof narrative */}
          <Reveal>
            <div className="border-t border-border pt-16 md:pt-20">
              <div className="max-w-3xl">
                <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
                  Featured project
                </p>
                <p className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl leading-[1.4] tracking-tight text-foreground-strong">
                  We built a 2,000-page real estate platform with 18 AI agents,
                  a complete database backend, automated content generation,
                  intelligent lead scoring, and client nurture systems — using the
                  same AI-native development approach we bring to every engagement.
                </p>
                <div className="mt-10">
                  <Link
                    href="/work"
                    className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300"
                  >
                    See how we built it
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6 — THE DIFFERENCE
          ═══════════════════════════════════════════ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-32 md:py-40">
          <StaggerReveal className="space-y-20 md:space-y-24 max-w-4xl mx-auto text-center">
            <StaggerChild>
              <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.35] tracking-tight">
                &ldquo;We believe AI should build things, not just analyze them.&rdquo;
              </p>
            </StaggerChild>
            <StaggerChild>
              <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.35] tracking-tight">
                &ldquo;We believe the best AI strategy is a working prototype.&rdquo;
              </p>
            </StaggerChild>
            <StaggerChild>
              <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.35] tracking-tight">
                &ldquo;We believe small teams with AI beat big teams without it.&rdquo;
              </p>
            </StaggerChild>
          </StaggerReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7 — CTA
          ═══════════════════════════════════════════ */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-32 md:py-40">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-8">
                Ready to see what AI can do
                <br />
                for your business?
              </h2>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.03]"
                >
                  Let&apos;s talk
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </Link>
                <a
                  href="mailto:zev@zev.ai"
                  className="text-sm text-muted-light hover:text-foreground-strong transition-colors duration-300 py-3.5"
                >
                  or email zev@zev.ai
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
