'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';

const TIERS = [
  {
    num: '01',
    name: 'AI Readiness Assessment',
    headline: 'A structured deep-dive into your business to identify where AI creates real value.',
    duration: '2–3 weeks',
    price: 'Starting at $2,500',
    deliverable: 'AI Opportunity Roadmap with prioritized recommendations',
    includes: [
      'Full process and workflow mapping',
      'Technology and tool audit',
      'AI opportunity scoring by ROI potential',
      'Prioritized implementation roadmap',
      '90-day action plan with clear next steps',
    ],
  },
  {
    num: '02',
    name: 'AI Implementation',
    headline: 'We design, build, and deploy AI systems that integrate into your existing operations.',
    duration: 'Custom scoped per project',
    price: 'Projects typically range $5,000–$25,000',
    deliverable: 'Production-ready AI system, deployed and documented',
    includes: [
      'Architecture design and planning',
      'Full development, testing, and deployment',
      'Integration with existing tools and workflows',
      'Team training and documentation',
      '30-day post-launch support',
    ],
    examples: [
      'Intelligent chatbots and AI assistants',
      'Automated content generation pipelines',
      'Lead scoring and routing systems',
      'Custom dashboards with real-time data',
    ],
  },
  {
    num: '03',
    name: 'Fractional AI Officer',
    headline: 'Ongoing AI leadership embedded in your team — strategy, implementation, and iteration.',
    duration: 'Monthly engagement',
    price: '$5,000–$10,000/month',
    deliverable: 'Continuous AI transformation',
    includes: [
      'Weekly strategy and implementation sessions',
      'Continuous system development and deployment',
      'Team training and AI upskilling',
      'New opportunity identification',
      'Performance monitoring and optimization',
    ],
  },
  {
    num: '04',
    name: 'Performance Partnership',
    headline: 'We invest in your success. A portion of our fee is tied directly to the results we deliver.',
    duration: 'Engagement-dependent',
    price: 'Base fee + 10–25% of measured impact',
    deliverable: 'Measurable business outcomes with shared upside',
    featured: true,
    includes: [
      'Reduced base fee with performance-linked compensation',
      'Jointly defined success metrics before work begins',
      'Full system design, build, and deployment',
      'Ongoing measurement and optimization',
      'Transparent reporting on financial impact',
      'Quarterly reviews and metric recalibration',
    ],
    idealFor: 'Businesses ready to commit to a meaningful engagement where both sides have skin in the game.',
    cta: 'Let\u2019s design a partnership',
  },
];

export default function ServicesPage() {
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
              Services
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              How we work
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              Four levels of engagement — from a focused assessment to a
              performance-linked partnership. Every engagement delivers real,
              deployed systems.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tiers */}
      {TIERS.map((tier, i) => {
        const isFeatured = 'featured' in tier && tier.featured;
        return (
          <section
            key={tier.num}
            className={i % 2 === 1 ? 'section-light' : ''}
          >
            <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
              <Reveal>
                {isFeatured && (
                  <div className="mb-8">
                    <span className="inline-block text-[11px] tracking-[0.2em] uppercase font-medium text-accent border border-accent/30 rounded-full px-4 py-1.5">
                      Most aligned
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                  {/* Left — title + price */}
                  <div className="lg:col-span-5">
                    <span className="text-[4rem] font-[family-name:var(--font-serif)] font-light text-border leading-none select-none">
                      {tier.num}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-4 mb-3">
                      {tier.name}
                    </h2>
                    <p className="font-[family-name:var(--font-serif)] text-lg italic text-muted-light leading-relaxed mb-8">
                      {tier.headline}
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-border pb-3">
                        <span className="text-muted-light">Timeline</span>
                        <span>{tier.duration}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-3">
                        <span className="text-muted-light">Investment</span>
                        <span className="text-accent font-medium">{tier.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-light">Deliverable</span>
                        <span className="text-right max-w-[200px]">{tier.deliverable}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right — includes + examples */}
                  <div className="lg:col-span-7">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
                      What&apos;s included
                    </h3>
                    <StaggerReveal className="space-y-4 mb-10">
                      {tier.includes.map((item) => (
                        <StaggerChild key={item}>
                          <div className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 shrink-0" />
                            <p className="text-muted-light leading-relaxed">{item}</p>
                          </div>
                        </StaggerChild>
                      ))}
                    </StaggerReveal>

                    {'examples' in tier && tier.examples && (
                      <>
                        <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-6">
                          Examples
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {tier.examples.map((ex: string) => (
                            <span
                              key={ex}
                              className="text-sm px-4 py-2 rounded-full border border-border text-muted-light"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    {'idealFor' in tier && tier.idealFor && (
                      <div className="mt-10">
                        <h3 className="text-xs tracking-[0.2em] uppercase text-muted-light mb-3">
                          Ideal for
                        </h3>
                        <p className="text-muted-light leading-relaxed">{tier.idealFor as string}</p>
                      </div>
                    )}

                    <div className="mt-10">
                      <Link
                        href="/contact"
                        className={isFeatured
                          ? 'inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.03]'
                          : 'inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors duration-300'
                        }
                      >
                        {'cta' in tier ? (tier.cta as string) : i === 0 ? 'Book a discovery call' : i === 1 ? 'Tell us about your project' : 'Learn more'}
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

      {/* CTA */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-tight mb-8 max-w-xl">
              Not sure which engagement fits?
              <br />
              Let&apos;s figure it out together.
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
