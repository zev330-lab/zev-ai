'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/reveal';

const STACK = [
  'Claude', 'Claude Code', 'Next.js', 'TypeScript', 'Tailwind CSS',
  'Supabase', 'PostgreSQL', 'Vercel', 'Vercel AI SDK', 'Framer Motion',
];

export default function AboutPage() {
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
              About
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Built, not theorized.
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-32 md:py-40">
          <div className="max-w-3xl space-y-10">
            <Reveal>
              <p className="font-[family-name:var(--font-serif)] text-xl md:text-2xl leading-[1.6] tracking-tight">
                The AI consulting industry is broken. Most firms deliver strategy
                decks and roadmaps — documents that describe what you could do,
                then leave you to figure out how. You pay for advice and still
                need to hire someone to build.
              </p>
            </Reveal>

            <Reveal>
              <p className="font-[family-name:var(--font-serif)] text-xl md:text-2xl leading-[1.6] tracking-tight">
                We skip the deck. We build the system.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                Our approach is rooted in a simple belief: the fastest path
                from &ldquo;AI could help us&rdquo; to &ldquo;AI is helping us&rdquo; is building
                real software and deploying it into your operations. Not in
                six months. Not after a strategy phase and a vendor selection
                process. In weeks.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                The tools exist today to build production AI systems faster and
                more affordably than most businesses realize. Intelligent agents
                that handle real work. Automated workflows that run without
                supervision. Custom platforms that grow with your business.
                The gap isn&apos;t technology — it&apos;s knowing how to apply it.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                That&apos;s what we do. We bring enterprise-grade AI capabilities
                to businesses that think they can&apos;t afford them. We build
                systems, deploy them, train your team, and then find the
                next opportunity.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The builder */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-3">
                <p className="text-xs tracking-[0.2em] uppercase text-muted">
                  The builder
                </p>
              </div>
              <div className="lg:col-span-9 max-w-2xl">
                <p className="text-muted-light text-lg leading-[1.8] mb-6">
                  Zev Steinmetz came to AI implementation through building.
                  As a real estate professional in Newton, Massachusetts, he
                  needed technology that didn&apos;t exist — so he built it.
                  A platform spanning thousands of pages, running dozens of
                  AI agents, managing an entire business operation. A full
                  production system, not a prototype.
                </p>
                <p className="text-muted-light text-lg leading-[1.8]">
                  That experience — building real systems with real constraints
                  for a real business — is the foundation of everything we do
                  at zev.ai. Builder, not theorist. Implementation, not advice.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stack */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-3">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-light">
                  The stack
                </p>
              </div>
              <div className="lg:col-span-9">
                <p className="text-muted-light mb-8 max-w-xl leading-relaxed">
                  We build on modern, battle-tested infrastructure. Every tool
                  in our stack is chosen for reliability, performance, and
                  developer velocity.
                </p>
                <div className="flex flex-wrap gap-3">
                  {STACK.map((t) => (
                    <span
                      key={t}
                      className="text-sm px-4 py-2 rounded-full border border-border"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-8 max-w-xl">
              Want to work together?
            </h2>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.03]"
            >
              Get in touch
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
