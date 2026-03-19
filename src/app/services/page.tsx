'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';

const SERVICES = [
  {
    num: '01',
    name: 'Assess',
    problem: 'You know AI could help your business but you\'re not sure where to start — or which opportunities are worth the investment.',
    whatWeDo: [
      'Map your current workflows, tools, and pain points',
      'Analyze your competitive landscape for AI adoption',
      'Score each opportunity by ROI potential and implementation complexity',
      'Deliver a prioritized roadmap with specific, costed recommendations',
      'Create a 90-day action plan with clear next steps',
    ],
    whatYouGet: 'An AI Opportunity Roadmap — a clear-eyed analysis of where AI creates real leverage in your business, what it will cost, and what you can expect in return.',
    timeline: '2–3 weeks',
    price: 'Starting from $2,500',
    cta: 'Start your assessment',
  },
  {
    num: '02',
    name: 'Build',
    problem: 'You\'ve identified the opportunity. Now you need someone to design, build, and deploy a production AI system that integrates into your existing operations.',
    whatWeDo: [
      'Design a multi-agent AI architecture tailored to your needs',
      'Build and test the complete system end-to-end',
      'Integrate with your existing tools, databases, and workflows',
      'Deploy to production with monitoring and health checks',
      'Train your team on how to work with the new system',
      'Provide 30 days of post-launch support and optimization',
    ],
    whatYouGet: 'A production AI system — live, integrated, and running. Multi-agent workflows, real-time dashboards, and persistent agents that work 24/7.',
    timeline: '4–12 weeks depending on scope',
    price: 'Starting from $5,000',
    cta: 'Tell us about your project',
    examples: [
      'Automated customer service and support triage',
      'Intelligent lead scoring and routing',
      'Content generation and distribution pipelines',
      'Business intelligence dashboards with AI insights',
      'Custom internal tools with embedded AI',
    ],
  },
  {
    num: '03',
    name: 'Optimize',
    problem: 'You have AI running but you\'re not getting the most out of it. You need ongoing expertise to iterate, expand, and keep your competitive edge.',
    whatWeDo: [
      'Weekly strategy and implementation sessions',
      'Continuous system monitoring and performance tuning',
      'Agent development for emerging needs',
      'Quarterly roadmap reviews and ROI reporting',
      'Team training and capability building',
      'Priority support for production issues',
    ],
    whatYouGet: 'A fractional AI officer embedded in your team — continuous improvement, new capabilities every month, and an AI system that gets smarter over time.',
    timeline: 'Monthly engagement',
    price: 'Starting from $5,000/mo',
    cta: 'Explore optimization',
  },
  {
    num: '04',
    name: 'Scale',
    featured: true,
    problem: 'You\'re ready to deploy AI infrastructure across multiple departments, products, or divisions — with shared intelligence and unified oversight.',
    whatWeDo: [
      'Multi-system architecture spanning your organization',
      'Shared knowledge base and cross-system intelligence',
      'Unified admin dashboard governing all deployments',
      'Cross-product automation and data pipelines',
      'Enterprise security, audit trails, and role-based access',
      'Transparent reporting on system-wide impact and ROI',
    ],
    whatYouGet: 'Enterprise AI infrastructure — multiple systems, shared intelligence, unified oversight, and compounding returns across your organization.',
    timeline: 'Engagement-dependent',
    price: 'Custom pricing',
    cta: 'Discuss enterprise scale',
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
              From discovery to deployment.
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              Four levels of engagement — from a focused assessment to enterprise-wide
              AI infrastructure. Every engagement delivers real, deployed systems
              and measurable business outcomes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      {SERVICES.map((svc, i) => {
        const isFeatured = 'featured' in svc && svc.featured;
        return (
          <section
            key={svc.num}
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
                  {/* Left — title, problem, price */}
                  <div className="lg:col-span-5">
                    <span className="text-[4rem] font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">
                      {svc.num}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-4 mb-6">
                      {svc.name}
                    </h2>

                    <div className="mb-8">
                      <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-3">
                        The problem
                      </p>
                      <p className="font-[family-name:var(--font-serif)] text-lg italic text-muted-light leading-relaxed">
                        {svc.problem}
                      </p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-border pb-3">
                        <span className="text-muted-light">Timeline</span>
                        <span>{svc.timeline}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-3">
                        <span className="text-muted-light">Investment</span>
                        <span className="text-accent font-medium">{svc.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right — what we do, what you get */}
                  <div className="lg:col-span-7">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
                      What we do
                    </h3>
                    <StaggerReveal className="space-y-4 mb-10">
                      {svc.whatWeDo.map((item) => (
                        <StaggerChild key={item}>
                          <div className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 shrink-0" />
                            <p className="text-muted-light leading-relaxed">{item}</p>
                          </div>
                        </StaggerChild>
                      ))}
                    </StaggerReveal>

                    <div className="mb-10">
                      <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-3">
                        What you get
                      </h3>
                      <p className="text-muted-light leading-relaxed">
                        {svc.whatYouGet}
                      </p>
                    </div>

                    {'examples' in svc && svc.examples && (
                      <div className="mb-10">
                        <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-4">
                          Common projects
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {svc.examples.map((ex: string) => (
                            <span
                              key={ex}
                              className="text-sm px-4 py-2 rounded-full border border-border text-muted-light"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
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
                        {svc.cta}
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
      <section className={SERVICES.length % 2 === 0 ? 'section-light' : ''}>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-4 max-w-xl">
              Not sure which engagement fits?
            </h2>
            <p className="text-muted-light text-lg leading-relaxed mb-8 max-w-xl">
              Start with the assessment. It gives you a clear picture of your opportunities
              and the best path forward — whether that&apos;s working with us or not.
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
