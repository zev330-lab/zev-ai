'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { HeroGradient } from '@/components/hero-gradient';
import { cn } from '@/lib/utils';

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
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-16 md:py-24">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-10 md:mb-14">
              The reality
            </p>
          </Reveal>

          <StaggerReveal className="space-y-0">
            <StaggerChild>
              <div className="max-w-[680px] pb-8 md:pb-12">
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                  Everyone&apos;s talking about AI.
                  <br />
                  Almost nobody&apos;s using it.
                </h2>
                <p className="text-muted-light text-lg leading-relaxed">
                  You&apos;ve seen the demos, sat through the pitches, read the LinkedIn
                  posts about how AI will change everything. And yet your business
                  runs the same way it did two years ago.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-8 md:pt-12 pb-8 md:pb-12">
                <div className="max-w-[680px] md:ml-auto md:text-right">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    You&apos;ve been sold strategy
                    <br />
                    when you needed systems.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed md:ml-auto">
                    Most AI consultants deliver a PDF and a roadmap. You needed someone
                    who delivers working software — systems that are live, tested, and
                    running inside your operations.
                  </p>
                </div>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-8 md:pt-12 pb-8 md:pb-12">
                <div className="max-w-[680px]">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    Your competitors aren&apos;t waiting.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed">
                    While you&apos;re evaluating, someone in your market is deploying.
                    AI adoption isn&apos;t a future trend — it&apos;s a present advantage.
                    The gap between companies that use AI and those that don&apos;t is
                    widening every quarter.
                  </p>
                </div>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-8 md:pt-12">
                <div className="max-w-[680px] md:ml-auto md:text-right">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    You don&apos;t need more advice.
                    <br />
                    You need a builder.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed md:ml-auto">
                    Someone who understands your operations, identifies where AI
                    creates real leverage, builds the system, and proves it works.
                    That&apos;s what we do.
                  </p>
                </div>
              </div>
            </StaggerChild>
          </StaggerReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — THE APPROACH
          ═══════════════════════════════════════════ */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              How we work
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
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
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Capabilities
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
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
          SECTION 5 — WHAT AI SYSTEMS LOOK LIKE
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Scale
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
              AI systems built to your scale
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mb-16 md:mb-20">
            {[
              {
                tier: 'Starter System',
                tagline: 'Ideal for teams exploring AI\u2019s impact',
                items: [
                  '5–10 AI-powered workflows',
                  'Process automation + content generation',
                  'Integration with existing tools',
                ],
              },
              {
                tier: 'Growth Engine',
                tagline: 'For businesses ready to scale with AI',
                items: [
                  '50–200 pages of AI-generated content',
                  '5–10 intelligent agents',
                  'Custom dashboards + analytics',
                  'Full backend infrastructure',
                ],
              },
              {
                tier: 'Enterprise Platform',
                tagline: 'Full-stack AI transformation',
                items: [
                  '1,000+ pages of dynamic content',
                  '15–25+ specialized AI agents',
                  'Multi-system integrations',
                  'Complete data infrastructure',
                  'Ongoing optimization + monitoring',
                ],
              },
            ].map((scale, i) => (
              <Reveal key={scale.tier} delay={i * 0.12}>
                <div className={cn(
                  'relative border border-border rounded-2xl p-8 md:p-10 h-full transition-all duration-500',
                  i === 2 ? 'md:scale-[1.03] border-accent/20' : ''
                )}>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground-strong mb-2">
                    {scale.tier}
                  </h3>
                  <p className="text-sm text-accent font-medium mb-6">
                    {scale.tagline}
                  </p>
                  <ul className="space-y-3">
                    {scale.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-muted-light leading-relaxed">
                        <div className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="border-t border-border pt-10">
              <p className="text-muted-light max-w-[680px] leading-relaxed">
                Our largest system to date: a full-stack platform with thousands of pages
                and dozens of AI agents, built entirely with AI-native development.{' '}
                <Link
                  href="/work"
                  className="text-accent hover:text-accent-hover transition-colors duration-300 inline-flex items-center gap-1"
                >
                  See the details
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6 — THE DIFFERENCE
          ═══════════════════════════════════════════ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <Reveal>
                <p className="text-xs tracking-[0.2em] uppercase text-muted-light">
                  What we believe
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-9 max-w-2xl">
              <StaggerReveal className="divide-y divide-surface-light-border">
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 first:pt-0">
                    AI should build things, not just analyze them.
                  </p>
                </StaggerChild>
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8">
                    The best AI strategy is a working prototype.
                  </p>
                </StaggerChild>
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 last:pb-0">
                    Small teams with AI beat big teams without it.
                  </p>
                </StaggerChild>
              </StaggerReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7 — CTA
          ═══════════════════════════════════════════ */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
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
