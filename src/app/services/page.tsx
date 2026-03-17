'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';

const PACKAGES = [
  {
    num: '01',
    name: 'Assess',
    headline: 'A 13-dimension deep-dive into your business to find where AI agents create real value.',
    duration: '2-3 weeks',
    price: 'Starting at $2,500',
    deliverable: 'AI Opportunity Roadmap with prioritized agent recommendations',
    agents: [
      { name: 'Crown', engine: 'Seed of Life', role: 'Decision authority — defines scope and priorities' },
      { name: 'Visionary', engine: "Metatron's Cube", role: '13-dimension research — competitors, market, technology' },
      { name: 'Architect', engine: 'Sri Yantra', role: 'Constraint-based planning — feasibility + architecture' },
      { name: 'Oracle', engine: 'Torus', role: 'Iterative synthesis — converges research into roadmap' },
    ],
    includes: [
      'Full process and workflow mapping',
      'Technology and tool audit',
      'AI opportunity scoring by ROI potential',
      'Prioritized implementation roadmap',
      '90-day action plan with clear next steps',
    ],
  },
  {
    num: '02',
    name: 'Build',
    headline: 'Full design, development, and deployment of a multi-agent AI system integrated into your operations.',
    duration: 'Custom scoped per project',
    price: 'Projects typically $5,000-$25,000',
    deliverable: 'Production AI system with persistent runtime agents',
    agents: [
      { name: 'All 11 agents', engine: 'Full pipeline', role: 'Complete TOLA framework activation' },
    ],
    includes: [
      'Architecture design with sacred geometry orchestration',
      'Full development, testing, and deployment',
      'Persistent runtime agents (event-driven + scheduled)',
      'Admin dashboard with Tree of Life visualization',
      'Team training and documentation',
      '30-day post-launch support and monitoring',
    ],
    examples: [
      'Multi-agent customer service systems',
      'Automated content generation pipelines',
      'Intelligent lead scoring and routing',
      'Custom dashboards with real-time agent data',
    ],
  },
  {
    num: '03',
    name: 'Optimize',
    headline: 'Ongoing AI leadership embedded in your team. Strategy, implementation, and iteration.',
    duration: 'Monthly engagement',
    price: '$5,000-$10,000/month',
    deliverable: 'Continuous AI transformation with fractal agent scaling',
    agents: [
      { name: '11+ agents', engine: 'Full + sub-agents', role: 'Fractal scaling — agents contain their own agents' },
    ],
    includes: [
      'Weekly strategy and implementation sessions',
      'Continuous system development and deployment',
      'Agent performance optimization and tuning',
      'New agent development for emerging needs',
      'Sub-agent architecture for complex tasks',
      'Performance monitoring via Sentinel health checks',
    ],
  },
  {
    num: '04',
    name: 'Scale',
    headline: 'Multi-system deployment across your organization with shared intelligence.',
    duration: 'Engagement-dependent',
    price: 'Custom pricing',
    deliverable: 'Enterprise agent infrastructure with unified oversight',
    featured: true,
    agents: [
      { name: 'Multi-instance', engine: 'Cross-product', role: 'Shared Oracle, shared Crown, independent execution' },
    ],
    includes: [
      'Multiple TOLA instances across products/divisions',
      'Shared knowledge base via Oracle cross-learning',
      'Unified admin dashboard governing all deployments',
      'Cross-system Nexus routing across product boundaries',
      'Enterprise security, audit trails, and RBAC',
      'Transparent reporting on system-wide impact',
    ],
    idealFor: 'Organizations ready to deploy AI agent infrastructure at scale, with multiple products or divisions that benefit from shared intelligence.',
  },
];

export default function ServicesPage() {
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
              Services
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Pick your depth.
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              Four levels of engagement — from a focused assessment to
              enterprise-wide agent infrastructure. Every engagement delivers
              real, deployed systems powered by TOLA&apos;s sacred geometry orchestration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Packages */}
      {PACKAGES.map((pkg, i) => {
        const isFeatured = 'featured' in pkg && pkg.featured;
        return (
          <section
            key={pkg.num}
            className={i % 2 === 1 ? 'section-light' : ''}
          >
            <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
              <Reveal>
                {isFeatured && (
                  <div className="mb-8">
                    <span className="inline-block text-[11px] tracking-[0.2em] uppercase font-medium text-accent border border-accent/30 rounded-full px-4 py-1.5">
                      Enterprise
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                  {/* Left — title + price */}
                  <div className="lg:col-span-5">
                    <span className="text-[4rem] font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">
                      {pkg.num}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-4 mb-3">
                      {pkg.name}
                    </h2>
                    <p className="font-[family-name:var(--font-serif)] text-lg italic text-muted-light leading-relaxed mb-8">
                      {pkg.headline}
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-border pb-3">
                        <span className="text-muted-light">Timeline</span>
                        <span>{pkg.duration}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-3">
                        <span className="text-muted-light">Investment</span>
                        <span className="text-accent font-medium">{pkg.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-light">Deliverable</span>
                        <span className="text-right max-w-[220px]">{pkg.deliverable}</span>
                      </div>
                    </div>

                    {/* TOLA nodes activated */}
                    <div className="mt-8 pt-6 border-t border-border">
                      <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-4">
                        TOLA agents activated
                      </p>
                      <div className="space-y-2">
                        {pkg.agents.map((agent) => (
                          <div key={agent.name} className="flex items-center gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                            <span className="font-medium text-foreground-strong">{agent.name}</span>
                            <span className="text-muted-light text-xs">({agent.engine})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right — includes */}
                  <div className="lg:col-span-7">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
                      What&apos;s included
                    </h3>
                    <StaggerReveal className="space-y-4 mb-10">
                      {pkg.includes.map((item) => (
                        <StaggerChild key={item}>
                          <div className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 shrink-0" />
                            <p className="text-muted-light leading-relaxed">{item}</p>
                          </div>
                        </StaggerChild>
                      ))}
                    </StaggerReveal>

                    {'examples' in pkg && pkg.examples && (
                      <>
                        <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
                          Examples
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {pkg.examples.map((ex: string) => (
                            <span
                              key={ex}
                              className="text-sm px-4 py-2 rounded-full border border-border text-muted-light"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    {'idealFor' in pkg && pkg.idealFor && (
                      <div className="mt-10">
                        <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-3">
                          Ideal for
                        </h3>
                        <p className="text-muted-light leading-relaxed">{pkg.idealFor as string}</p>
                      </div>
                    )}

                    <div className="mt-10">
                      <Link
                        href="/discover"
                        className={isFeatured
                          ? 'inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]'
                          : 'inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300'
                        }
                      >
                        {i === 0 ? 'Start your assessment' : i === 1 ? 'Tell me about your project' : i === 2 ? 'Explore optimization' : 'Discuss enterprise scale'}
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
        );
      })}

      {/* CTA */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-8 max-w-xl">
              Not sure which engagement fits?
              <br />
              The assessment will tell you.
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
