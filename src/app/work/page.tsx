'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { AnimatedNumber } from '@/components/animated-number';

const CASE_STUDIES = [
  {
    num: '01',
    company: 'Steinmetz Real Estate',
    industry: 'Real Estate / William Raveis',
    headline: '18 AI agents running a 2,000+ page real estate platform.',
    problem: 'A growing real estate practice needed technology that didn\'t exist — market analysis across dozens of neighborhoods, automated property research, client communication at scale, and business intelligence that kept pace with a fast-moving market.',
    process: [
      'Built a complete real estate platform from scratch using the multi-agent framework',
      'Deployed 18 specialized AI agents across market analysis, property research, client communication, and operations',
      'Integrated with MLS data, public records, market APIs, and communication tools',
      'Created neighborhood-specific intelligence covering pricing, schools, demographics, and market trends',
    ],
    results: [
      { metric: '18', label: 'AI agents deployed' },
      { metric: '2,000+', label: 'pages of content' },
      { metric: '30+', label: 'neighborhoods covered' },
      { metric: '24/7', label: 'system uptime' },
    ],
    payoff: 'A complete AI-powered real estate operation — from lead capture to market analysis to client communication — running autonomously 24/7. The platform that proved the framework works in production.',
  },
  {
    num: '02',
    company: 'Blank Industries',
    industry: 'Manufacturing / Business Intelligence',
    headline: 'Unified intelligence from 6 disconnected systems.',
    problem: 'Critical business data trapped in 6 disconnected systems — ERP, CRM, inventory, shipping, accounting, and HR. Leadership making decisions on gut feel instead of data. Monthly reporting took a full-time analyst 2 weeks to compile.',
    process: [
      'Assessed all 6 data sources, mapped dependencies, and identified the highest-value integration points',
      'Built AI agents that pull, normalize, and cross-reference data from all systems in real time',
      'Deployed an executive dashboard with AI-generated weekly insights and anomaly detection',
      'Created automated alerts for inventory thresholds, cash flow projections, and operational KPIs',
    ],
    results: [
      { metric: '6→1', label: 'unified data source' },
      { metric: '90%', label: 'faster reporting' },
      { metric: 'Weekly', label: 'AI-generated insights' },
      { metric: 'Real-time', label: 'anomaly detection' },
    ],
    payoff: 'Leadership went from monthly gut-feel decisions to weekly data-driven strategy. The analyst who used to compile reports now focuses on strategic analysis.',
  },
  {
    num: '03',
    company: 'KabbalahQ.ai',
    industry: 'Education / AI Learning Platform',
    headline: 'An AI-powered learning platform that adapts to each student.',
    problem: 'A complex educational domain with thousands of interconnected concepts, but no way to guide learners through it effectively. Traditional course structures didn\'t work — every learner needed a different path.',
    process: [
      'Mapped the entire knowledge domain into a structured graph of concepts and relationships',
      'Built AI agents that assess each learner\'s current knowledge and generate personalized learning paths',
      'Created an adaptive quiz system that adjusts difficulty based on demonstrated understanding',
      'Deployed content generation agents that produce explanations tailored to each learner\'s background',
    ],
    results: [
      { metric: '1,000+', label: 'interconnected concepts' },
      { metric: 'Adaptive', label: 'learning paths' },
      { metric: 'AI-powered', label: 'content generation' },
      { metric: 'Personalized', label: 'per learner' },
    ],
    payoff: 'A learning platform where no two students have the same experience. AI agents continuously adapt content, pacing, and difficulty to match each learner\'s progress and style.',
  },
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
              Real systems.
              <br />
              <span className="italic text-accent">Measurable results.</span>
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              Every project follows the same pattern: understand the problem, build
              the system, prove it works. Here&apos;s what that looks like in practice.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Aggregate stats */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { value: 30, suffix: '+', label: 'AI agents deployed' },
                { value: 3, suffix: '+', label: 'industries served' },
                { value: 5000, suffix: '+', label: 'pages of content generated' },
                { value: 99.9, suffix: '%', label: 'system uptime' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-[clamp(2rem,5vw,3.5rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-3 text-sm text-muted-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Case Studies */}
      {CASE_STUDIES.map((study, i) => (
        <section key={study.num} className={i % 2 === 0 ? '' : 'section-light'}>
          <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
            <Reveal>
              <div className="mb-12">
                <span className="text-[4rem] font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">
                  {study.num}
                </span>
                <div className="mt-4 mb-2">
                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {study.company}
                  </h2>
                  <p className="text-sm text-accent font-medium mt-1">{study.industry}</p>
                </div>
                <p className="font-[family-name:var(--font-serif)] text-xl md:text-2xl italic text-muted-light leading-relaxed mt-4 max-w-2xl">
                  {study.headline}
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              <div className="lg:col-span-5">
                <Reveal>
                  <div className="mb-10">
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-4">
                      The problem
                    </p>
                    <p className="text-muted-light text-lg leading-relaxed">
                      {study.problem}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {study.results.map((r) => (
                      <div key={r.label}>
                        <p className="text-[clamp(1.5rem,3vw,2rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                          {r.metric}
                        </p>
                        <p className="mt-1 text-xs text-muted-light">{r.label}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-7">
                <Reveal>
                  <div className="mb-10">
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-4">
                      The process
                    </p>
                    <StaggerReveal className="space-y-4">
                      {study.process.map((step) => (
                        <StaggerChild key={step}>
                          <div className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 shrink-0" />
                            <p className="text-muted-light leading-relaxed">{step}</p>
                          </div>
                        </StaggerChild>
                      ))}
                    </StaggerReveal>
                  </div>

                  <div>
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-4">
                      The payoff
                    </p>
                    <p className="text-muted-light text-lg leading-relaxed">
                      {study.payoff}
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className={CASE_STUDIES.length % 2 === 0 ? 'section-light' : ''}>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-4 max-w-xl">
              Your business could be
              <br />
              the next case study.
            </h2>
            <p className="text-muted-light text-lg leading-relaxed mb-8 max-w-xl">
              Every project starts with a discovery — a clear-eyed look at your biggest
              opportunities and the fastest path to results.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Your Discovery
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
