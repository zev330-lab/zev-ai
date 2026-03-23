'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';

const SERVICES = [
  {
    num: '01',
    name: 'Insight Report',
    problem: 'You want to understand exactly where AI can move the needle in your business — specific opportunities, real numbers, no fluff.',
    whatWeDo: [
      'Map your workflows, tools, and the biggest friction points',
      'Analyze your market for AI adoption opportunities',
      'Score each opportunity by ROI potential and implementation complexity',
      'Deliver a detailed assessment of your current digital footprint',
      'Identify quick wins vs. longer-term infrastructure plays',
    ],
    whatYouGet: 'A comprehensive AI Insight Report — a detailed, personalized analysis of your business, your market, and where AI creates real leverage. Delivered within 48 hours.',
    timeline: '48 hours',
    price: '$499',
    note: 'Credited 100% toward your build if you move forward.',
    cta: 'Get your insight report',
  },
  {
    num: '02',
    name: 'Strategy Session',
    problem: 'You\'ve seen the report. Now you need a real conversation — someone who can look at your specific situation, answer hard questions, and tell you exactly what to build.',
    whatWeDo: [
      'One hour with Zev, prepared with your report and market research',
      'Walk through your specific opportunities and constraints',
      'Define the exact scope, timeline, and investment for your build',
      'Answer every question before you commit to anything',
      'Leave with a clear decision and a path forward',
    ],
    whatYouGet: 'A 60-minute strategy session where you get real answers, not slides. By the end, you\'ll know exactly what to build and whether it makes sense for your business.',
    timeline: '1 hour',
    price: '$2,500',
    note: 'Credited 100% toward your build if you move forward.',
    cta: 'Book a strategy session',
  },
  {
    num: '03',
    name: 'Build',
    problem: 'You\'re ready. You know what needs to be built. Now you need someone to design, build, and deploy a production AI system that actually works.',
    whatWeDo: [
      'Design a multi-agent AI architecture tailored to your needs',
      'Build and test the complete system end-to-end',
      'Integrate with your existing tools, databases, and workflows',
      'Deploy to production with monitoring and health checks',
      'Deliver your first working feature within 7 days of kickoff',
      '30 days post-launch support included',
    ],
    whatYouGet: 'A production AI system — live, integrated, and running. Multi-agent workflows, real dashboards, and agents that work 24/7 without you.',
    timeline: '4–8 weeks',
    price: '$15,000',
    note: 'Payment in milestones: 50% on signing, 25% at Month 1, 25% at Month 2.',
    cta: 'Start your build',
    examples: [
      'Lead generation and outreach pipelines',
      'Content creation and distribution systems',
      'Customer service automation',
      'Business intelligence dashboards',
      'Sales operations platforms',
    ],
  },
  {
    num: '04',
    name: 'Growth',
    featured: true,
    problem: 'Your system is live. Now you need it to keep improving — new agents, better performance, and a partner who knows your business inside out.',
    whatWeDo: [
      'Weekly performance reports with what\'s working and what to improve',
      'Continuous agent optimization and new capability development',
      'Monthly strategy session to review progress and set priorities',
      'Priority support for production issues',
      'First access to new frameworks and techniques',
    ],
    whatYouGet: 'A fractional AI operations partner — your system gets smarter every month, you stay ahead of what\'s coming, and you never have to worry about it falling behind.',
    timeline: 'Month-to-month',
    price: '$2,500/month',
    note: 'No lock-in. Cancel anytime.',
    cta: 'Start growth',
  },
  {
    num: '05',
    name: 'Custom Apps',
    problem: 'You need a specific tool built for your team, your clients, or yourself — something off-the-shelf doesn\'t cover and a full platform build is overkill.',
    whatWeDo: [
      'Scope the app together in a 30-minute call',
      'Design and build a focused, polished app for your exact use case',
      'Deploy it to the web or package it for mobile',
      'Built to be used — not a prototype, not an MVP with asterisks',
    ],
    whatYouGet: 'A working app, delivered. Simple as that.',
    timeline: '1–4 weeks depending on complexity',
    price: 'From $1,000',
    note: '',
    cta: 'Tell us what you need',
    examples: [
      'Custody log and co-parenting documentation tool ($1,000)',
      'Daily habit or accountability tracker ($1,000)',
      'Client intake and onboarding workflow ($2,500)',
      'Internal reporting dashboard for a small team ($2,500)',
      'Multi-user platform with logins and data persistence ($5,000)',
    ],
    tiers: [
      { label: 'Simple Utility', price: '$1,000', desc: 'Single-purpose tool, one user or shared. Examples: daily tracker, log tool, simple calculator or calculator.' },
      { label: 'Standard', price: '$2,500', desc: 'Multi-screen app with data storage, forms, or workflows. Examples: client onboarding, internal dashboard, reporting tool.' },
      { label: 'Complex', price: '$5,000', desc: 'Multi-user, custom logic, integrations. Examples: team platform, client-facing tool with accounts, automated workflows.' },
    ],
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
              From a quick insight report to a full AI operations platform — and custom apps 
              for anything in between. Every engagement delivers real, working software.
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

                    {'tiers' in svc && svc.tiers && (
                      <div className="mb-10">
                        <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-4">
                          Pricing tiers
                        </h3>
                        <div className="space-y-3">
                          {(svc.tiers as {label: string; price: string; desc: string}[]).map((tier) => (
                            <div key={tier.label} className="flex gap-4 p-4 rounded-xl border border-border/60 bg-border/5">
                              <div className="min-w-[100px]">
                                <p className="text-sm font-medium text-foreground-strong">{tier.label}</p>
                                <p className="text-accent font-medium text-sm">{tier.price}</p>
                              </div>
                              <p className="text-sm text-muted-light leading-relaxed">{tier.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {'examples' in svc && svc.examples && !('tiers' in svc) && (
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
