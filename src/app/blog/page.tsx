'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/reveal';

export default function BlogPage() {
  return (
    <>
      <section className="pt-36 md:pt-44 pb-20">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">Blog</p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Coming soon.
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              Practical insights on AI implementation, multi-agent systems, and turning
              AI investment into measurable business outcomes. Subscribe to get notified
              when we publish.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.15] tracking-tight mb-6">
                Topics we&apos;ll cover
              </h2>
              <div className="space-y-4">
                {[
                  'When AI agents make sense (and when they don\'t)',
                  'Building multi-agent systems that actually ship',
                  'The real cost of AI implementation',
                  'Measuring ROI on AI investments',
                  'Lessons from deploying AI across industries',
                  'How to evaluate AI consultants and vendors',
                ].map((topic) => (
                  <div key={topic} className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 shrink-0" />
                    <p className="text-muted-light leading-relaxed">{topic}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-16">
              <p className="text-muted-light mb-6">
                In the meantime, start a conversation about your AI needs.
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
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
