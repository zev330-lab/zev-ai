import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { HomeHero } from '@/components/home-hero';
import { HomeFaqSchema } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'zev.ai — AI Consulting & Multi-Agent Systems for Business',
  description: 'Production AI systems built for businesses. From AI readiness assessments to multi-agent implementation. 30+ agents deployed across D2C, manufacturing, and media. Starting from $2,500.',
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
                body: 'You tell me what\'s going on — your business, your frustrations, what\'s taking too long. I do the research. You get a clear picture of where AI would actually move the needle for your specific situation.',
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

      {/* ═══ SECTION 4 — SOCIAL PROOF ═══ */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">What we&apos;ve built</p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight max-w-2xl mb-4">
              Real problems.
              <br />
              Real outcomes.
            </h2>
            <p className="text-sm text-muted-light mb-16 md:mb-20">
              Built for actual businesses — including my own real estate practice, which still runs on the same system I build for clients.
            </p>
          </Reveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[

              {
                company: 'Blank Industries',
                industry: 'Manufacturing / Business Intelligence',
                problem: 'Critical business data trapped in 6 disconnected systems. Leadership making decisions on gut feel instead of data.',
                result: 'Unified intelligence dashboard pulling from all systems. AI agents generate weekly insights and flag anomalies before they become problems.',
                metric: '6→1',
                metricLabel: 'unified data source',
              },

            ].map((study) => (
              <StaggerChild key={study.company}>
                <div className="border border-border rounded-2xl p-8 h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground-strong">{study.company}</h3>
                    <p className="text-xs text-accent font-medium mt-1">{study.industry}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-2">Challenge</p>
                    <p className="text-sm text-muted-light leading-relaxed">{study.problem}</p>
                  </div>

                  <div className="mb-6 flex-1">
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-2">Result</p>
                    <p className="text-sm text-muted-light leading-relaxed">{study.result}</p>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <p className="text-[clamp(2rem,4vw,2.5rem)] font-[family-name:var(--font-serif)] font-light text-accent leading-none">
                      {study.metric}
                    </p>
                    <p className="mt-1 text-xs text-muted-light">{study.metricLabel}</p>
                  </div>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>

          <Reveal>
            <div className="mt-12">
              <Link href="/work" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300">
                See all case studies
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
              Questions we hear from
              <br />
              <span className="italic text-accent">every new client.</span>
            </h2>
          </Reveal>

          <StaggerReveal className="max-w-3xl space-y-0 divide-y divide-border">
            {[
              {
                q: 'How much does AI consulting cost?',
                a: 'Our engagements start at $2,500 for a 2-3 week AI readiness assessment. Build projects typically range from $5,000-$25,000 depending on scope. Ongoing optimization starts at $5,000/month. Every engagement begins with a free discovery conversation so you know exactly what you\'re investing in before committing.',
              },
              {
                q: 'What does an AI consultant actually do?',
                a: 'We build and deploy production AI systems — not strategy decks. That means identifying high-leverage automation opportunities, designing multi-agent architectures, building the software, integrating it into your operations, and ensuring it delivers measurable ROI. You get working software, not a PowerPoint.',
              },
              {
                q: 'How long does AI implementation take?',
                a: 'An AI readiness assessment takes 2-3 weeks. Building and deploying a production AI system typically takes 4-12 weeks depending on complexity. Most clients see their first measurable results within 6 weeks of starting a build engagement.',
              },
              {
                q: 'Do I need a technical team to work with you?',
                a: 'No. We handle the entire technical build — architecture, development, deployment, and monitoring. Your team provides business context and feedback. We deploy on managed infrastructure (Supabase, Vercel) so there\'s nothing for your IT team to maintain.',
              },
              {
                q: 'What industries do you work with?',
                a: 'We\'ve built AI systems for D2C brands, manufacturing, media companies, real estate, and professional services. The multi-agent architecture adapts to any domain — the coordination patterns are universal, while the agents are specialized for your industry.',
              },
              {
                q: 'How is this different from hiring a big consulting firm?',
                a: 'Big firms hand you a roadmap and bill $250K+ for it. Then you need to hire someone else to build the system. We design it, build it, deploy it, and prove it works — all in one engagement. You work directly with the person building your system, not a junior associate.',
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
