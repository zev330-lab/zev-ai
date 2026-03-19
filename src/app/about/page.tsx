'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/reveal';

const STACK = [
  'Claude API', 'Next.js', 'React', 'TypeScript',
  'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Vercel',
  'Framer Motion', 'Edge Functions', 'Node.js', 'Python',
];

export default function AboutPage() {
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
              About
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Builder, not theorist.
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              I build production AI systems for businesses. Hands-on. End to end.
              The kind of systems that run 24/7 and pay for themselves.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The story */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <div className="max-w-[680px] space-y-10">
            <Reveal>
              <p className="font-[family-name:var(--font-serif)] text-xl md:text-2xl leading-[1.6] tracking-tight">
                I came to AI through building. Not through research papers, not through
                consulting engagements — through the desperate need to solve a real
                business problem.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                As a real estate professional at William Raveis in the Boston area,
                I needed technology that didn&apos;t exist. So I built it. A platform
                spanning over 2,000 pages, running 18 AI agents, managing an entire
                real estate operation — from market analysis to client communication
                to property research. Not a prototype. A full production system that
                runs every day.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                That experience taught me something most AI consultants never learn:
                the gap between &ldquo;this works in a demo&rdquo; and &ldquo;this runs
                in production&rdquo; is where 90% of AI projects die. Strategy decks
                don&apos;t close that gap. Building does.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                I developed a multi-agent framework that applies coordination patterns
                found in nature — the same fractal branching, spiral optimization, and
                self-similar scaling that biological systems have refined over billions
                of years. These patterns give AI agents structured ways to research, plan,
                build, and operate complex systems reliably.
              </p>
            </Reveal>

            <Reveal>
              <p className="text-muted-light text-lg leading-[1.8]">
                Now I help other businesses do what I did for mine: deploy AI systems
                that actually work. Not chatbots. Not copilots. Multi-agent systems
                that automate real workflows, integrate with existing tools, and deliver
                measurable results from day one.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* What makes this different */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-12">
              What makes this different
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Reveal delay={0.1}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight">
                  Hands-on builder
                </h3>
                <p className="text-muted-light leading-relaxed">
                  I don&apos;t hand you a strategy deck and wish you luck. I design the
                  system, build it, deploy it, and make sure it works. Every engagement
                  ends with software running in production.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight">
                  Business-first thinking
                </h3>
                <p className="text-muted-light leading-relaxed">
                  I built AI to solve my own business problems before I built it for
                  anyone else. Every recommendation is grounded in what actually moves
                  the needle — not what looks impressive in a pitch.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight">
                  Systems that persist
                </h3>
                <p className="text-muted-light leading-relaxed">
                  Most AI projects are one-and-done builds. Mine aren&apos;t. The agents
                  that build your system stay running after deployment — monitoring,
                  optimizing, and evolving 24/7.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Background */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-3">
                <p className="text-xs tracking-[0.2em] uppercase text-muted">
                  Background
                </p>
              </div>
              <div className="lg:col-span-9 max-w-[640px]">
                <div className="space-y-4 text-muted-light text-lg leading-[1.8]">
                  <p>
                    <span className="text-foreground-strong font-medium">Zev Steinmetz</span> —
                    Boston-based AI engineer and real estate professional at William Raveis
                    Real Estate, one of the largest independent brokerages in the Northeast.
                  </p>
                  <p>
                    Built a 2,000+ page real estate platform running 18 AI agents across
                    market analysis, property research, client communication, and business
                    operations. Developed the multi-agent coordination framework now used
                    to build AI systems for other businesses.
                  </p>
                  <p>
                    Background in real estate operations, business intelligence, and
                    full-stack engineering. Focused on practical AI implementation that
                    delivers measurable business outcomes.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stack */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-3">
                <p className="text-xs tracking-[0.2em] uppercase text-muted">
                  Technology
                </p>
              </div>
              <div className="lg:col-span-9">
                <p className="text-muted-light mb-8 max-w-xl leading-relaxed">
                  Modern, battle-tested infrastructure. Every tool chosen for
                  reliability, performance, and speed of deployment.
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
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-4 max-w-xl">
              Let&apos;s talk about what
              <br />
              AI can do for your business.
            </h2>
            <p className="text-muted-light text-lg leading-relaxed mb-8 max-w-xl">
              No pitch, no pressure. Just a conversation about your biggest opportunities.
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
