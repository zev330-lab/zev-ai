'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/particle-field';
import { TypingEffect } from '@/components/typing-effect';
import { AnimatedCounter } from '@/components/animated-counter';
import { Section, SectionHeader } from '@/components/section';
import { CAPABILITIES, STATS } from '@/lib/constants';

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  globe: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  workflow: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  dashboard: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  chat: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
  content: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  data: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
};

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  },
};

export default function Home() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticleField />
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 grid-pattern opacity-50" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="mb-6 text-sm font-medium tracking-widest text-accent uppercase font-[family-name:var(--font-mono)]">
              AI Implementation Consultant
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-[family-name:var(--font-display)] tracking-tight leading-[1.1]">
              I don&apos;t advise on AI.
              <br />
              <span className="gradient-text">I build it.</span>
            </h1>
            <div className="mt-6 text-xl md:text-2xl text-muted-light h-10 font-[family-name:var(--font-display)]">
              <TypingEffect />
            </div>
            <p className="mt-8 max-w-2xl mx-auto text-muted-light leading-relaxed">
              Custom AI systems, automated workflows, and intelligent platforms
              for businesses ready to stop talking about AI and start using it.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/contact"
              className="group relative inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:bg-accent-light hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
            >
              Book a Discovery Call
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 rounded-full border border-surface-border px-8 py-4 text-base font-medium text-foreground transition-all duration-300 hover:border-accent/50 hover:bg-surface-light"
            >
              See My Work
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-2 text-muted">
              <span className="text-xs tracking-widest uppercase">Scroll</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-5 h-8 rounded-full border border-surface-border flex items-start justify-center p-1"
              >
                <div className="w-1 h-2 rounded-full bg-accent" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAR ─── */}
      <Section className="py-16 md:py-20 border-y border-surface-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm text-muted mb-10 tracking-wider uppercase">
            Trusted By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
            {['William Raveis Real Estate', 'Steinmetz Real Estate'].map((name) => (
              <div key={name} className="text-lg md:text-xl font-semibold text-muted-light/60 font-[family-name:var(--font-display)] hover:text-foreground transition-colors duration-300">
                {name}
              </div>
            ))}
            {['Rosen Media Group', 'CustomMade.com', 'International Gem Society'].map((name) => (
              <div key={name} className="text-lg md:text-xl font-semibold text-muted/30 font-[family-name:var(--font-display)]">
                {name}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── WHAT I BUILD ─── */}
      <Section>
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Capabilities"
            title="What I Build"
            description="Production AI systems that transform how your business operates — not prototypes, not proofs of concept, but real software running in production."
          />

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {CAPABILITIES.map((cap) => (
              <motion.div
                key={cap.title}
                variants={stagger.item}
                className="group relative rounded-2xl border border-surface-border bg-surface p-8 transition-all duration-300 hover:border-accent/30 hover:bg-surface-light"
              >
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                  {CAPABILITY_ICONS[cap.icon]}
                </div>
                <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2">
                  {cap.title}
                </h3>
                <p className="text-sm text-muted-light leading-relaxed">
                  {cap.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ─── THE PROOF ─── */}
      <Section className="bg-surface/50 border-y border-surface-border">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Case Study"
            title="The Proof"
            description="SteinmetzRealEstate.com — a full enterprise platform built entirely with AI-assisted development."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={'prefix' in stat ? stat.prefix : undefined} />
                </div>
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {[
              'Automated SOI nurture system with personalized emails',
              'AI-powered neighborhood concierge with streaming chat',
              'Automated reputation & review management',
              'Lead scoring engine (0-100) with intelligent routing',
              'Role-based dashboards with real-time data',
              'Full Supabase backend with row-level security',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface p-4"
              >
                <svg className="w-5 h-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-muted-light">{feature}</span>
              </div>
            ))}
          </motion.div>

          <div className="mt-12 text-center">
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-light transition-colors text-sm font-medium"
            >
              Read the full case study
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </Section>

      {/* ─── HOW I WORK ─── */}
      <Section>
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Process"
            title="How I Work"
            description="A streamlined process designed to deliver real results, fast."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discovery',
                description: 'We map your operations, identify bottlenecks, and score every process for AI potential. You get a clear roadmap with ROI projections.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Build',
                description: 'I build your AI systems with the same tools I use for my own projects — Claude, modern frameworks, and battle-tested automation patterns.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3.27 15.17A7.5 7.5 0 0012 19.5a7.5 7.5 0 008.73-4.33" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Optimize',
                description: 'Post-launch, I monitor performance, train your team, and continuously identify new automation opportunities. The system gets smarter over time.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative rounded-2xl border border-surface-border bg-surface p-8 text-center"
              >
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 text-accent">
                  {item.icon}
                </div>
                <div className="text-xs font-mono text-accent mb-2">{item.step}</div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-display)] mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-light leading-relaxed">
                  {item.description}
                </p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-surface-border" aria-hidden="true">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section className="border-t border-surface-border">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight">
              Ready to build something{' '}
              <span className="gradient-text">extraordinary</span>?
            </h2>
            <p className="mt-6 text-lg text-muted-light max-w-2xl mx-auto">
              Book a free discovery call. We&apos;ll map your highest-ROI AI opportunities
              and I&apos;ll show you exactly what&apos;s possible.
            </p>
            <div className="mt-10">
              <Link
                href="/contact"
                className="group relative inline-flex items-center gap-2 rounded-full bg-accent px-10 py-4 text-lg font-medium text-white transition-all duration-300 hover:bg-accent-light hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
              >
                Book a Discovery Call
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
