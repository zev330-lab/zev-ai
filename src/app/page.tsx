import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { HomeHero } from '@/components/home-hero';
import { HomeFaqSchema } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'zev.ai — Custom AI Systems That Actually Work',
  description: 'Custom AI systems for businesses, freelancers, and anyone with a problem that keeps repeating. From first conversation to working system. Real implementation, real results.',
  alternates: { canonical: 'https://askzev.ai' },
};

export default function Home() {
  return (
    <>
      <HomeFaqSchema />

      {/* ═══ SECTION 1 — HERO (client component for scroll parallax) ═══ */}
      <HomeHero />

      {/* ═══ SECTION 2 — THE PROBLEM ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-10 md:mb-14">
              What I&apos;ve noticed
            </p>
          </Reveal>

          <StaggerReveal className="space-y-0">
            <StaggerChild>
              <div className="max-w-[680px] pb-10 md:pb-14">
                <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                  You&apos;ve tried the tools.
                  <br />
                  Something didn&apos;t click.
                </h2>
                <p className="text-muted-light text-lg leading-relaxed">
                  ChatGPT gave you a generic answer. The AI assistant felt gimmicky.
                  You closed the tab and went back to doing it yourself. That&apos;s not a
                  failure on your part — that&apos;s what happens when a powerful tool has
                  no one to show you how it actually applies to your specific situation.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-10 md:pt-14 pb-10 md:pb-14">
                <div className="max-w-[680px] md:ml-auto md:text-right">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    This isn&apos;t just
                    <br />
                    for businesses.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed md:ml-auto">
                    I work with business owners, freelancers, real estate agents, parents
                    trying to get more organized, students figuring out how to actually
                    learn faster. If you have a problem that repeats itself, there&apos;s
                    probably a better way to handle it.
                  </p>
                </div>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-10 md:pt-14 pb-10 md:pb-14">
                <div className="max-w-[680px]">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    I didn&apos;t start in tech.
                    <br />
                    I started in real estate.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed">
                    I was a William Raveis agent drowning in follow-ups, paperwork, and
                    things that felt like they should be automatic. So I built AI systems
                    to handle the work I hated. It worked. Then people started asking me
                    to build the same thing for them. That&apos;s what I do now — and my
                    real estate business still runs on the same system I build for clients.
                  </p>
                </div>
              </div>
            </StaggerChild>

            <StaggerChild>
              <div className="border-t border-accent/25 pt-10 md:pt-14">
                <div className="max-w-[680px] md:ml-auto md:text-right">
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-3">
                    You don&apos;t need to
                    <br />
                    understand AI. I do.
                  </h2>
                  <p className="text-muted-light text-lg leading-relaxed md:ml-auto">
                    You tell me what&apos;s frustrating, what&apos;s taking too long, what keeps
                    falling through the cracks. I figure out which parts AI can actually
                    fix — and build the thing that fixes it. No CS degree required.
                  </p>
                </div>
              </div>
            </StaggerChild>
          </StaggerReveal>
        </div>
      </section>

      {/* ═══ SECTION 3 — THE JOURNEY ═══ */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              How it works
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-16 md:mb-20">
              From conversation to
              <br />
              <span className="italic text-accent">something that actually works.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: '01',
                title: 'Discover',
                body: 'You tell me what\'s going on — your frustrations, what\'s taking too long, what keeps falling through the cracks. I do the research. You get a clear picture of where AI could actually help your specific situation.',
                outcome: 'Free personalized summary',
              },
              {
                num: '02',
                title: 'Plan',
                body: 'The Insight Report is the full picture — exactly what to build, what each piece does, what it would take to make it real. Delivered in 48 hours. No generic roadmap — yours, specifically.',
                outcome: 'Insight Report · $499',
              },
              {
                num: '03',
                title: 'Build',
                body: 'I design it, build it, deploy it, and stay accountable to whether it works. Production systems, not prototypes. Integrated into how you actually work — not bolted on afterward.',
                outcome: 'Working system · from $15K',
              },
              {
                num: '04',
                title: 'Improve',
                body: 'The system gets smarter over time. Monthly check-ins, performance tuning, new capabilities as your needs grow. Month-to-month — no contract, no lock-in.',
                outcome: 'Ongoing · $2,500/month',
              },
            ].map((phase, i) => (
              <Reveal key={phase.num} delay={i * 0.1}>
                <div className="relative border border-border rounded-2xl p-8 h-full transition-all duration-500 hover:border-accent/20">
                  <span className="text-[4rem] font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">
                    {phase.num}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight mt-4 mb-4 text-foreground-strong">
                    {phase.title}
                  </h3>
                  <p className="text-muted-light leading-relaxed text-sm mb-6">
                    {phase.body}
                  </p>
                  <p className="text-xs text-accent font-medium tracking-wide uppercase">
                    {phase.outcome}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-12">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300"
              >
                See full service details
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ SECTION 4 — WHAT I USE ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">What I use every day</p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-4">
              Built for myself first.
            </h2>
            <p className="text-muted-light text-lg max-w-2xl leading-relaxed mb-12">
              The AI system that runs this practice — from the moment you submit
              a discovery form through research, analysis, and delivery — is the
              same framework I build for others. I don&apos;t sell anything I don&apos;t
              use myself.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Reveal>
              <div className="border border-border rounded-2xl p-8 h-full">
                <h3 className="text-lg font-semibold tracking-tight text-foreground-strong mb-2">My real estate business</h3>
                <p className="text-xs text-accent font-medium mb-4">William Raveis &middot; Boston area</p>
                <p className="text-sm text-muted-light leading-relaxed">
                  18 AI agents managing market analysis, property research, client
                  communication, and daily operations across 30+ neighborhoods.
                  Built it because I needed it. Still runs every day.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="border border-border rounded-2xl p-8 h-full">
                <h3 className="text-lg font-semibold tracking-tight text-foreground-strong mb-2">This website</h3>
                <p className="text-xs text-accent font-medium mb-4">askzev.ai &middot; live right now</p>
                <p className="text-sm text-muted-light leading-relaxed">
                  The discovery pipeline, content engine, and operations dashboard
                  all run on the same multi-agent framework. 11 agents, 22
                  communication paths, running in production right now.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="mt-12">
              <Link href="/work" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300">
                See the full story
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ SECTION 5 — PRINCIPLES ═══ */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-3">
              <Reveal>
                <p className="text-xs tracking-[0.2em] uppercase text-muted">What we believe</p>
              </Reveal>
            </div>
            <div className="lg:col-span-9 max-w-2xl">
              <StaggerReveal className="divide-y divide-border">
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 first:pt-0 text-foreground-strong">
                    The goal is never &ldquo;more AI.&rdquo; The goal is less friction in your actual life.
                  </p>
                </StaggerChild>
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 text-foreground-strong">
                    If I can&apos;t explain it plainly, I haven&apos;t understood your problem yet.
                  </p>
                </StaggerChild>
                <StaggerChild>
                  <p className="font-[family-name:var(--font-serif)] italic text-[clamp(1.25rem,3vw,2rem)] leading-[1.4] tracking-tight py-8 last:pb-0 text-foreground-strong">
                    You shouldn&apos;t need a technical background to benefit from a technical tool.
                  </p>
                </StaggerChild>
              </StaggerReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — FAQ (AEO: targets common AI consulting search queries) ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
              Frequently asked questions
            </p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3rem)] leading-[1.1] tracking-tight max-w-2xl mb-16">
              Questions I hear most.
            </h2>
          </Reveal>

          <StaggerReveal className="max-w-3xl space-y-0 divide-y divide-border">
            {[
              {
                q: 'I\'m not a business. Can this help me?',
                a: 'Yes. I work with individuals, families, freelancers, students — anyone who has something in their life that repeats itself and shouldn\'t have to. Organizing a household, managing a side project, learning something faster, automating the tedious parts of a hobby. If it\'s a pattern, there\'s probably a system for it.',
              },
              {
                q: 'What kind of things can you build?',
                a: 'Custom apps, automated workflows, dashboards, research tools, content systems, personal assistants — anything where AI can do real work instead of just generating text. The range goes from a simple tracking tool ($1,000) to a full multi-agent system for a business ($15K+). It depends on what you need.',
              },
              {
                q: 'What makes this different from just using ChatGPT?',
                a: 'ChatGPT is a general tool. What I build are systems designed for your specific situation — they connect to your data, run on their own schedule, and do actual work without you having to prompt them every time. The difference is between a search engine and an assistant who already knows your situation.',
              },
              {
                q: 'How much does this cost?',
                a: 'The initial discovery conversation is free. Custom apps start at $1,000. Full AI system builds start at $15,000. Ongoing support starts at $2,500/month. Everything starts with a conversation so you know exactly what you\'re getting into before committing.',
              },
              {
                q: 'Do I need to be technical?',
                a: 'Not at all. I handle the entire technical side — design, build, deployment, and maintenance. You provide context about your situation and feedback on what\'s working. No coding, no jargon, no IT team required.',
              },
              {
                q: 'How long does it take?',
                a: 'A simple custom app can be done in 1-2 weeks. A full AI system build typically takes 4-8 weeks depending on scope. You\'ll see the first working version within the first week of a build engagement — not a mockup, working software.',
              },
            ].map((faq) => (
              <StaggerChild key={faq.q}>
                <div className="py-8">
                  <h3 className="text-lg font-semibold text-foreground-strong mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-muted-light leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ═══ SECTION 7 — CTA ═══ */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-4">
                Not sure if this is for you?
                <br />
                <span className="italic text-accent">That&apos;s exactly who it&apos;s for.</span>
              </h2>
              <p className="text-muted-light text-lg leading-relaxed mb-10 max-w-xl">
                Start with a free discovery — tell me what&apos;s going on, and I&apos;ll give
                you an honest read on where AI could actually help. No commitment,
                no pitch. If there&apos;s nothing to build, I&apos;ll tell you that too.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start a free discovery
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </Link>
                <a href="mailto:hello@askzev.ai" className="text-sm text-muted-light hover:text-foreground-strong transition-colors duration-300 py-3.5">
                  or email hello@askzev.ai
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
