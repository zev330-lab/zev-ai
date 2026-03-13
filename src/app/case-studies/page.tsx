'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Section, SectionHeader } from '@/components/section';
import { AnimatedCounter } from '@/components/animated-counter';

const TECH_STACK = [
  'Next.js 15', 'TypeScript', 'Tailwind CSS v4', 'Supabase', 'Vercel',
  'Claude API', 'Vercel AI SDK', 'Resend', 'PostgreSQL', 'Row-Level Security',
];

const COMING_SOON = [
  {
    category: 'Multi-Location Business',
    challenge: 'Scaling operations across multiple locations with inconsistent processes and no centralized data.',
    metrics: ['Process automation', 'Centralized dashboards', 'AI-driven reporting'],
  },
  {
    category: 'Professional Services Firm',
    challenge: 'Manual client intake, document processing, and follow-up consuming 40% of team capacity.',
    metrics: ['Document processing AI', 'Automated intake', 'Client portal'],
  },
  {
    category: 'E-Commerce Operation',
    challenge: 'Content creation bottleneck limiting catalog growth and SEO performance.',
    metrics: ['AI content engine', 'SEO automation', 'Inventory intelligence'],
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-sm font-medium tracking-widest text-accent uppercase font-[family-name:var(--font-mono)]">
              Case Studies
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight">
              Real Systems.{' '}
              <span className="gradient-text">Real Results.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-light max-w-2xl mx-auto">
              Production AI systems deployed and running. Not concepts — working software.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Flagship Case Study */}
      <Section className="pt-8">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-accent/20 bg-surface overflow-hidden glow-blue"
          >
            {/* Header */}
            <div className="p-8 md:p-12 border-b border-surface-border">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-accent font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2">
                    Flagship Project
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)]">
                    Steinmetz Real Estate
                  </h2>
                  <p className="mt-2 text-muted-light">
                    A full enterprise-grade real estate platform built entirely with AI-assisted development.
                  </p>
                  <a
                    href="https://steinmetzrealestate.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:text-accent-light transition-colors"
                  >
                    steinmetzrealestate.com
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 md:gap-8">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold gradient-text">
                      <AnimatedCounter value={2000} suffix="+" />
                    </div>
                    <p className="text-xs text-muted mt-1">Pages</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold gradient-text">
                      <AnimatedCounter value={18} />
                    </div>
                    <p className="text-xs text-muted mt-1">AI Agents</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold gradient-text">
                      <AnimatedCounter value={28} suffix="+" />
                    </div>
                    <p className="text-xs text-muted mt-1">DB Tables</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold gradient-text">
                      <AnimatedCounter value={10} />
                    </div>
                    <p className="text-xs text-muted mt-1">Agent Types</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'AI Neighborhood Concierge', desc: 'Streaming chat with deep knowledge of local neighborhoods — Newton, Brookline, Needham, and MetroWest MA.' },
                { title: 'Automated Lead Scoring', desc: 'Scores prospects 0-100 based on behavior and engagement, with intelligent routing logic.' },
                { title: 'SOI Nurture Engine', desc: 'Daily cron-driven system drafts personalized emails and queues them for human approval before sending.' },
                { title: 'Reputation Management', desc: 'Automated review monitoring, response drafting, and reputation tracking across platforms.' },
                { title: 'Role-Based Dashboards', desc: 'Team dashboards with 25 SOPs, filtered by role — Sarina, Zev, Allan, and technical operations.' },
                { title: 'Recruiting Pipeline', desc: 'Full recruiting system with candidate tracking, automated outreach templates, and activity logging.' },
                { title: 'Communication Agents', desc: 'Automated email sequences, follow-up scheduling, and multi-channel communication management.' },
                { title: 'SEO Content Engine', desc: '2,000+ pages of SEO-optimized content — neighborhood guides, market data, and community pages at scale.' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: (i % 2) * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <svg className="w-5 h-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted mt-0.5">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tech stack */}
            <div className="px-8 md:px-12 pb-8 md:pb-12">
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map((tech) => (
                  <span key={tech} className="rounded-full border border-surface-border bg-surface-light px-3 py-1 text-xs text-muted-light font-[family-name:var(--font-mono)]">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Coming Soon */}
      <Section>
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="In Progress"
            title="Coming Soon"
            description="Active engagements and upcoming case studies."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COMING_SOON.map((item, i) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-surface-border bg-surface p-8 relative overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent font-medium">
                    Coming Soon
                  </span>
                </div>
                <h3 className="text-lg font-bold font-[family-name:var(--font-display)] text-foreground mb-3 pr-20">
                  {item.category}
                </h3>
                <p className="text-sm text-muted-light leading-relaxed mb-6">
                  {item.challenge}
                </p>
                <div className="space-y-2">
                  {item.metrics.map((metric) => (
                    <div key={metric} className="flex items-center gap-2 text-xs text-muted">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                      {metric}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="border-t border-surface-border">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)]">
            Your business could be the{' '}
            <span className="gradient-text">next case study</span>
          </h2>
          <p className="mt-4 text-muted-light">
            Let&apos;s talk about what AI can do for your operations.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-white hover:bg-accent-light transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            Book a Discovery Call
          </Link>
        </div>
      </Section>
    </>
  );
}
