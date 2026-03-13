'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { AnimatedNumber } from '@/components/animated-number';

const ASPECTS = [
  {
    label: 'Scale',
    title: '2,000+ pages of intelligent content',
    body: 'AI-generated, SEO-optimized pages covering neighborhoods, market analysis, community guides, and property data. Not templates filled in by hand — content created by AI systems that understand local real estate markets.',
  },
  {
    label: 'Intelligence',
    title: '18 AI agents running in production',
    body: 'Autonomous agents handling lead scoring, client communication, content generation, reputation management, recruiting, and operations. Each agent has a specific role, runs on a schedule, and produces measurable output.',
  },
  {
    label: 'Infrastructure',
    title: 'Full-stack production system',
    body: 'Complete backend with 28+ database tables, row-level security, automated data pipelines, role-based dashboards, and real-time reporting. Not a prototype — enterprise-grade infrastructure deployed on modern cloud platforms.',
  },
  {
    label: 'Automation',
    title: 'Systems that run themselves',
    body: 'Daily cron-driven nurture sequences that draft personalized emails and queue them for human approval. Automated reputation monitoring and response drafting. Lead scoring that rates prospects 0-100 and routes them intelligently.',
  },
];

const TECH = [
  'Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL',
  'Claude API', 'Vercel AI SDK', 'Vercel', 'Resend', 'Row-Level Security',
];

export default function WorkPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-36 md:pt-44 pb-20">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Work
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              What we&apos;ve built
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Featured project intro */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-32 md:py-40">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Featured project
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.15] tracking-tight max-w-3xl mb-8">
              A full-stack real estate platform,
              <br />
              built entirely with AI.
            </h2>
            <p className="text-lg text-muted-light max-w-2xl leading-relaxed">
              An enterprise-grade technology platform spanning thousands of pages,
              running dozens of intelligent agents, and managing every aspect of a
              real estate business — from lead generation to client nurture to
              reputation management. Built using the same AI-native development
              approach we bring to every client engagement.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { value: 2000, suffix: '+', label: 'Pages' },
                { value: 18, suffix: '', label: 'AI Agents' },
                { value: 28, suffix: '+', label: 'Database Tables' },
                { value: 25, suffix: '', label: 'SOPs Created' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-[clamp(2.5rem,6vw,4rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-3 text-sm text-muted-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Aspects — scroll-driven narrative */}
      {ASPECTS.map((aspect, i) => (
        <section
          key={aspect.label}
          className={i % 2 === 0 ? 'section-light' : ''}
        >
          <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
            <Reveal>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                <div className="lg:col-span-3">
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-light">
                    {aspect.label}
                  </p>
                </div>
                <div className="lg:col-span-9">
                  <h3 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl leading-[1.2] tracking-tight mb-5">
                    {aspect.title}
                  </h3>
                  <p className="text-muted-light text-lg leading-relaxed max-w-2xl">
                    {aspect.body}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      {/* Tech stack */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-8">
              Technology
            </p>
            <div className="flex flex-wrap gap-3">
              {TECH.map((t) => (
                <span
                  key={t}
                  className="text-sm px-4 py-2 rounded-full border border-border text-muted-light"
                >
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-8 max-w-xl">
              Let&apos;s build something
              <br />
              for your business.
            </h2>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.03]"
            >
              Start a conversation
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
