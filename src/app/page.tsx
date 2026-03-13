'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/reveal';

export default function Home() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="min-h-[90vh] flex flex-col justify-center">
        <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:pt-40 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1 className="font-[family-name:var(--font-serif)] text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15]">
              zev.ai
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-light max-w-lg leading-relaxed">
              AI systems that run your business.
            </p>
            <div className="mt-12">
              <Link
                href="/contact"
                className="inline-block border-b border-accent text-accent text-sm tracking-wide pb-1 hover:text-accent-hover hover:border-accent-hover transition-colors"
              >
                Start a conversation
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── THE PROBLEM ─── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <Reveal>
            <p className="text-sm text-muted tracking-wide uppercase mb-16">
              The reality
            </p>
          </Reveal>

          <div className="space-y-16 md:space-y-20">
            <Reveal delay={0.1}>
              <div>
                <h2 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl tracking-tight mb-4">
                  Everyone&apos;s talking about AI. Almost nobody&apos;s using it.
                </h2>
                <p className="text-muted-light leading-relaxed max-w-2xl">
                  You&apos;ve sat through the pitches. You&apos;ve seen the demos. You&apos;ve read
                  the LinkedIn posts about how AI will change everything. And yet your
                  business runs the same way it did two years ago.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div>
                <h2 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl tracking-tight mb-4">
                  The gap isn&apos;t strategy. It&apos;s implementation.
                </h2>
                <p className="text-muted-light leading-relaxed max-w-2xl">
                  Most AI consultants deliver a report and a roadmap. You need someone
                  who delivers working software. Systems that are live, tested, and
                  running inside your business — not concepts on a slide.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div>
                <h2 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl tracking-tight mb-4">
                  You don&apos;t need an AI strategy. You need an AI builder.
                </h2>
                <p className="text-muted-light leading-relaxed max-w-2xl">
                  Someone who understands your operations, identifies what AI can
                  actually improve, and builds it. Then proves it works. Then
                  finds the next opportunity.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── THE APPROACH ─── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <Reveal>
            <p className="text-sm text-muted tracking-wide uppercase mb-16">
              How it works
            </p>
          </Reveal>

          <div className="space-y-12">
            <Reveal delay={0.1}>
              <div className="flex gap-8 items-baseline">
                <span className="text-sm text-accent tabular-nums shrink-0">01</span>
                <div>
                  <h3 className="font-[family-name:var(--font-serif)] text-xl md:text-2xl tracking-tight mb-2">
                    We learn your business
                  </h3>
                  <p className="text-muted-light leading-relaxed">
                    Your operations, your bottlenecks, your team&apos;s actual workflow —
                    not what it says on the org chart, but what happens on a Tuesday
                    afternoon.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="flex gap-8 items-baseline">
                <span className="text-sm text-accent tabular-nums shrink-0">02</span>
                <div>
                  <h3 className="font-[family-name:var(--font-serif)] text-xl md:text-2xl tracking-tight mb-2">
                    We identify what AI can actually improve
                  </h3>
                  <p className="text-muted-light leading-relaxed">
                    Not every problem needs AI. We find the ones that do — the
                    repetitive, the high-volume, the ones where a system can be
                    smarter, faster, or more consistent than a person.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="flex gap-8 items-baseline">
                <span className="text-sm text-accent tabular-nums shrink-0">03</span>
                <div>
                  <h3 className="font-[family-name:var(--font-serif)] text-xl md:text-2xl tracking-tight mb-2">
                    We build it and prove it works
                  </h3>
                  <p className="text-muted-light leading-relaxed">
                    Real software, deployed in your business, doing real work.
                    Not a prototype. Not a proof of concept. A production system
                    you rely on.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl tracking-tight mb-6">
              Let&apos;s talk about what AI can do for your business.
            </h2>
            <Link
              href="/contact"
              className="inline-block border-b border-accent text-accent text-sm tracking-wide pb-1 hover:text-accent-hover hover:border-accent-hover transition-colors"
            >
              Start a conversation
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
