'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
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
      {/* ═══ SECTION 1 — HERO ═══ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <HeroGradient />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-12 w-full"
        >
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.05] tracking-tight font-light">
                AI systems that
                <br />
                <span className="italic text-accent">drive revenue.</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mt-8 text-lg text-muted-light max-w-lg leading-relaxed">
                I build and deploy multi-agent AI systems for businesses. Not decks.
                Not prototypes. Production systems with agents that run 24/7, integrated
                into your operations — delivering results you can measure.
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
                Start Your Discovery
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/approach"
                className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground-strong transition-colors duration-300"
              >
                See our approach
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
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

      {/* ═══ SECTION 2 — THE PROBLEM ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-10 md:mb-14">
              The problem
            </p>
          </Reveal>

          <StaggerReveal className="space-y-0">
            <StaggerChild>
              <div className="max-w-[680px] pb-10 md:pb-14">
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                  You&apos;ve invested in AI tools
                  <br />
                  your team doesn&apos;t use.
                </h2>
                <p className="text-muted-light text-lg leading-relaxed">
                  ChatGPT subscriptions. Copilot licenses. An &ldquo;AI strategy&rdquo;
                  presentation your CTO gave six months ago. And yet your team still
                  copies data between spreadsheets every Monday morning.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-10 md:pt-14 pb-10 md:pb-14">
                <div className="max-w-[680px] md:ml-auto md:text-right">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    You got a strategy deck
                    <br />
                    when you needed a system.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed md:ml-auto">
                    Most AI consultants hand you a PDF and a roadmap. Six figures later,
                    you still need to hire someone to build the thing. You needed working
                    software — you got a PowerPoint.
                  </p>
                </div>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-10 md:pt-14 pb-10 md:pb-14">
                <div className="max-w-[680px]">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    Your competitors are automating.
                    <br />
                    You&apos;re still evaluating.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed">
                    Every quarter you spend &ldquo;exploring AI options&rdquo; is a quarter
                    your competitors spend deploying them. The gap compounds. The cost of
                    inaction is already higher than you think.
                  </p>
                </div>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-10 md:pt-14">
                <div className="max-w-[680px] md:ml-auto md:text-right">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    You don&apos;t need more advice.
                    <br />
                    You need a builder.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed md:ml-auto">
                    Someone who understands your business, designs the system, builds it,
                    deploys it, and proves it works — before you pay full price.
                  </p>
                </div>
              </div>
            </StaggerChild>
          </StaggerReveal>
        </div>
      </section>

      {/* ═══ SECTION 3 — THE JOURNEY ═══ */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              How we work
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
              From discovery to deployment.
              <br />
              <span className="italic text-accent">Results at every stage.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: '01',
                title: 'Assess',
                body: 'We analyze your business, workflows, and competitive landscape to find where AI creates the highest leverage. You get a prioritized roadmap with specific, costed recommendations.',
                outcome: 'AI Opportunity Roadmap',
              },
              {
                num: '02',
                title: 'Build',
                body: 'We design and deploy a production AI system integrated into your operations. Multi-agent architecture, automated workflows, real-time dashboards — built to your specs, running on your infrastructure.',
                outcome: 'Production AI System',
              },
              {
                num: '03',
                title: 'Optimize',
                body: 'Ongoing AI leadership embedded in your team. We monitor performance, iterate on results, and expand capabilities as your needs evolve. Your AI gets smarter every month.',
                outcome: 'Continuous Improvement',
              },
              {
                num: '04',
                title: 'Scale',
                body: 'Multi-system deployment across your organization. Shared intelligence between departments, unified oversight, and cross-product automation that compounds returns.',
                outcome: 'Enterprise AI Infrastructure',
              },
            ].map((phase, i) => (
              <Reveal key={phase.num} delay={i * 0.1}>
                <div className="relative border border-border rounded-2xl p-8 h-full transition-all duration-500 hover:border-accent/20">
                  <span className="text-[4rem] font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">
                    {phase.num}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight mt-4 mb-4 text-foreground-strong">
                    {phase.title}
                  </h3>
                  <p className="text-muted-light leading-relaxed text-sm mb-6">
                    {phase.body}
                  </p>
                  <p className="text-xs text-accent font-medium tracking-wide uppercase">
                    {phase.outcome}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-12">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300"
              >
                See full service details
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ SECTION 4 — SOCIAL PROOF ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">Results</p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-4">
              What it looks like in practice
            </h2>
            <p className="text-sm text-muted-light mb-16 md:mb-20">
              Representative examples of the outcomes we deliver.
            </p>
          </Reveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                company: 'ButcherBox',
                industry: 'D2C / Food & Beverage',
                problem: 'Customer service overwhelmed by subscription management — cancellations, skips, swaps handled manually by a team of 12.',
                result: 'Deployed AI agents handling 73% of subscription inquiries autonomously. Support team refocused on high-value retention conversations.',
                metric: '73%',
                metricLabel: 'inquiries automated',
              },
              {
                company: 'Blank Industries',
                industry: 'Manufacturing / Business Intelligence',
                problem: 'Critical business data trapped in 6 disconnected systems. Leadership making decisions on gut feel instead of data.',
                result: 'Unified intelligence dashboard pulling from all systems. AI agents generate weekly insights and flag anomalies before they become problems.',
                metric: '6→1',
                metricLabel: 'unified data source',
              },
              {
                company: 'Rosen Media Group',
                industry: 'Media / Publishing',
                problem: 'Content production bottleneck — editorial team spending 60% of time on formatting, tagging, and distribution instead of creating.',
                result: 'AI pipeline handles formatting, metadata, SEO optimization, and multi-channel distribution. Editorial team produces 2.5x more original content.',
                metric: '2.5x',
                metricLabel: 'content output',
              },
            ].map((study) => (
              <StaggerChild key={study.company}>
                <div className="border border-border rounded-2xl p-8 h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground-strong">{study.company}</h3>
                    <p className="text-xs text-accent font-medium mt-1">{study.industry}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-2">Challenge</p>
                    <p className="text-sm text-muted-light leading-relaxed">{study.problem}</p>
                  </div>

                  <div className="mb-6 flex-1">
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-2">Result</p>
                    <p className="text-sm text-muted-light leading-relaxed">{study.result}</p>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <p className="text-[clamp(2rem,4vw,2.5rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                      {study.metric}
                    </p>
                    <p className="mt-1 text-xs text-muted-light">{study.metricLabel}</p>
                  </div>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>

          <Reveal>
            <div className="mt-12">
              <Link href="/work" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300">
                See all case studies
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ SECTION 5 — PRINCIPLES ═══ */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <Reveal>
                <p className="text-xs tracking-[0.2em] uppercase text-muted">What we believe</p>
              </Reveal>
            </div>
            <div className="lg:col-span-9 max-w-2xl">
              <StaggerReveal className="divide-y divide-border">
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 first:pt-0 text-foreground-strong">
                    AI should build systems, not just answer questions.
                  </p>
                </StaggerChild>
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 text-foreground-strong">
                    The best AI strategy is a working prototype with agents running.
                  </p>
                </StaggerChild>
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 last:pb-0 text-foreground-strong">
                    Small teams with intelligent automation beat large teams without it.
                  </p>
                </StaggerChild>
              </StaggerReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — CTA ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-4">
                Ready to see what AI
                <br />
                can do for your business?
              </h2>
              <p className="text-muted-light text-lg leading-relaxed mb-10 max-w-xl">
                Our discovery process maps your biggest opportunities and gives you a
                clear, costed plan — whether you build with us or not.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Your Discovery
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </Link>
                <a href="mailto:hello@askzev.ai" className="text-sm text-muted-light hover:text-foreground-strong transition-colors duration-300 py-3.5">
                  or email hello@askzev.ai
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
