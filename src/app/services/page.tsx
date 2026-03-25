import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroReveal } from '@/components/hero-reveal';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';

export const metadata: Metadata = {
  title: 'Services — From First Look to Working System',
  description: 'AI services for businesses and individuals. Free discovery, $499 Insight Report, custom apps from $1,000, full system builds. Real implementation, not strategy decks.',
  alternates: { canonical: 'https://askzev.ai/services' },
};

const SERVICES = [
  {
    num: '01',
    name: 'Free Summary',
    tag: 'No cost',
    problem: 'You\'ve heard a lot about AI. You\'re not sure what\'s real, what\'s hype, and whether any of it actually applies to your situation.',
    whatWeDo: [
      'You tell me what\'s going on — takes about 5 minutes',
      'I look at what you\'re dealing with and where you\'re trying to go',
      'I send back a clear picture of what AI could actually do for you',
    ],
    whatYouGet: 'A straightforward summary — specific to your situation, not a generic AI pitch. What could help, what probably won\'t, and whether it\'s worth going further. No cost. No commitment.',
    timeline: 'Within 24 hours',
    price: 'Free',
    note: '',
    cta: 'Get your free summary',
  },
  {
    num: '02',
    name: 'Insight Report',
    tag: '$499',
    problem: 'You\'re serious about this. You want to know exactly what to build, what it would cost, and what it would realistically take — before you commit to anything.',
    whatWeDo: [
      'Deep analysis of your situation, your goals, and what\'s realistic',
      'Specific AI opportunities ranked by impact and implementation complexity',
      'A detailed roadmap: what to build, in what order, with what tools',
      'Honest tradeoffs at every major decision point',
    ],
    whatYouGet: 'A detailed Insight Report — the full picture of what AI would look like for your specific situation. Specific enough that you could attempt it yourself. Honest enough that you\'ll know exactly what you\'re getting into.',
    timeline: 'Delivered within 24 hours of submission',
    price: '$499',
    note: '',
    cta: 'Get the full report',
  },
  {
    num: '03',
    name: 'Strategy Session',
    tag: 'Starting from $2,500',
    problem: 'You have a clear picture of the opportunity. Now you need to figure out what makes sense for your specific situation — your constraints, your budget, your goals.',
    whatWeDo: [
      'One hour with Zev — prepared on your situation before the call',
      'Walk through what you\'re dealing with and figure out what actually fits',
      'Identify which tools and approaches match your specific constraints',
      'Define what a realistic path forward looks like for you',
      'Leave with clarity — not a deck, not a proposal, just a clear direction',
    ],
    whatYouGet: 'A focused working session. An hour of real thinking about your situation from someone who has built these systems in production. Worth it if you\'re serious. Not worth it if you\'re still just exploring.',
    timeline: '1-hour session + follow-up notes',
    price: 'Starting from $2,500',
    note: '',
    cta: 'Book a session',
  },
  {
    num: '04',
    name: 'Build',
    tag: 'Starting from $15,000',
    problem: 'You know what needs to be built. You\'ve thought it through. Now you need someone who can actually build it — not a prototype, not a demo — a production system.',
    whatWeDo: [
      'Design and build a multi-agent AI system tailored to your operations',
      'Integrate with your existing tools, data, and workflows',
      'Deploy to production with monitoring, health checks, and documentation',
      'First working deliverable within 7 days of kickoff',
      '30 days of post-launch support included',
    ],
    whatYouGet: 'A production AI system — live, integrated, and running. The kind that works on a Tuesday morning when nobody\'s watching.',
    timeline: '4–8 weeks depending on scope',
    price: 'Starting from $15,000',
    note: '',
    cta: 'Start a build',
    examples: [
      'Lead generation and outbound automation',
      'Content creation and distribution pipelines',
      'Customer service and support systems',
      'Business intelligence and reporting dashboards',
      'Custom sales and operations platforms',
    ],
  },
  {
    num: '05',
    name: 'Ongoing Partnership',
    tag: 'Starting from $2,500/mo',
    featured: true,
    problem: 'You have AI running. You want it to keep getting better — new capabilities, better performance, and a partner who knows your situation and your system inside out.',
    whatWeDo: [
      'Weekly performance reports: what\'s working, what needs attention',
      'Continuous system improvements and new agent development',
      'Monthly strategy session to review priorities and direction',
      'Priority support when production issues arise',
      'Early access to new techniques and frameworks as they mature',
    ],
    whatYouGet: 'A long-term AI partner embedded in your operations. Your system compounds over time instead of degrading. You stay ahead instead of catching up.',
    timeline: 'Month-to-month',
    price: 'Starting from $2,500/month',
    note: '',
    cta: 'Talk about a partnership',
  },
  {
    num: '06',
    name: 'Custom Apps',
    tag: 'Starting from $1,000',
    problem: 'You need a specific tool built — something focused, something polished, something that solves one real problem well. For yourself, your family, or your work.',
    whatWeDo: [
      'Scope the app in a short call or message',
      'Design and build it for your exact use case',
      'Deploy to web or package for mobile',
      'Built to actually be used, not to sit in a backlog',
    ],
    whatYouGet: 'A working app, delivered. Not a template with your name on it. Personal projects welcome — you don\'t need to be a business to have a good idea for a tool.',
    timeline: '1–4 weeks depending on complexity',
    price: 'Starting from $1,000',
    note: '',
    cta: 'Tell me what you need',
    tiers: [
      { label: 'Simple Utility', price: '$1,000', desc: 'Single-purpose tool. One user or shared. Examples: tracking log, daily habit app, family organizer, simple calculator.' },
      { label: 'Standard App', price: '$2,500', desc: 'Multi-screen with data storage, forms, or workflows. Examples: personal dashboard, intake form, reporting tool, learning tracker.' },
      { label: 'Complex Platform', price: '$5,000', desc: 'Multi-user, custom logic, third-party integrations. Examples: client-facing tools, automated workflows, community platforms.' },
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-36 md:pt-44 pb-20">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <HeroReveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Services
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              From first look to full deployment.
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              Start with a free summary. Go as far as makes sense for your situation.
              Every engagement is designed to deliver something real — not a roadmap for later.
            </p>
          </HeroReveal>
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
                      Most popular
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                  {/* Left */}
                  <div className="lg:col-span-5">
                    <span className="text-[4rem] font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">
                      {svc.num}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-4 mb-2">
                      {svc.name}
                    </h2>
                    <p className="text-accent font-medium text-sm mb-6">{svc.tag}</p>

                    <div className="mb-8">
                      <p className="text-xs tracking-[0.15em] uppercase text-muted-light font-medium mb-3">
                        The situation
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

                  {/* Right */}
                  <div className="lg:col-span-7">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
                      What's involved
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
                              <div className="min-w-[110px]">
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
                          {(svc.examples as string[]).map((ex) => (
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

      {/* FAQ */}
      <section className={SERVICES.length % 2 === 0 ? 'section-light' : ''}>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">FAQ</p>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.1] tracking-tight mb-12 max-w-xl">
              Common questions about working together
            </h2>
          </Reveal>
          <StaggerReveal className="max-w-3xl space-y-0 divide-y divide-border">
            {[
              { q: 'Can I just get the free summary and stop there?', a: 'Absolutely. The free summary is designed to stand on its own. You get an honest take on where AI could help, whether you work with me or not. No follow-up pressure.' },
              { q: 'I\'m not a business — just a person with an idea for an app. Is that okay?', a: 'More than okay. Custom Apps start at $1,000 and are designed for exactly this — personal tools, family organizers, hobby projects, learning aids. You don\'t need a company to have a good use case.' },
              { q: 'What if my project is really small?', a: 'Custom Apps start at $1,000 for simple utilities. If you just want to talk through whether AI could help your situation, the discovery conversation is free. Start there and we\'ll figure out the right scope together.' },
              { q: 'Do you work with people outside the US?', a: 'Yes. All work is remote-first. I can accommodate anyone in compatible time zones.' },
              { q: 'How do you handle data security?', a: 'I deploy on enterprise-grade infrastructure (Supabase, Vercel) with row-level security and encrypted connections. Your data stays in your infrastructure — I never train AI models on client data.' },
              { q: 'What happens if it doesn\'t work?', a: 'Every Build engagement includes 30 days of post-launch support. If the system isn\'t doing what we agreed it would, I iterate until it does. I don\'t ship and disappear.' },
              { q: 'Can I pause or cancel ongoing work?', a: 'Yes. The ongoing partnership is month-to-month with no lock-in. You can pause or end with 30 days notice. I want you to stay because it\'s working, not because of a contract.' },
            ].map((faq) => (
              <StaggerChild key={faq.q}>
                <div className="py-8">
                  <h3 className="text-lg font-semibold text-foreground-strong mb-3">{faq.q}</h3>
                  <p className="text-muted-light leading-relaxed">{faq.a}</p>
                </div>
              </StaggerChild>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-28 md:py-36">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-4 max-w-xl">
              Not sure where to start?
            </h2>
            <p className="text-muted-light text-lg max-w-xl leading-relaxed mb-10">
              The free summary costs nothing and takes 5 minutes. It&apos;s the clearest way to find out whether any of this makes sense for your situation.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
            >
              Get your free summary
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
