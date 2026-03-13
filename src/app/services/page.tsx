'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Section, SectionHeader } from '@/components/section';
import { SERVICES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-sm font-medium tracking-widest text-accent uppercase font-[family-name:var(--font-mono)]">
              Services
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight">
              Productized AI{' '}
              <span className="gradient-text">Solutions</span>
            </h1>
            <p className="mt-6 text-lg text-muted-light max-w-2xl mx-auto">
              Three ways to work together — from a focused assessment to an ongoing AI partnership.
              Every engagement delivers real, deployed systems.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <Section className="pt-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.tier}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  'relative rounded-2xl border p-8 flex flex-col',
                  'featured' in service && service.featured
                    ? 'border-accent/40 bg-surface-light glow-blue'
                    : 'border-surface-border bg-surface'
                )}
              >
                {'featured' in service && service.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-medium text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm font-medium text-accent mb-2 font-[family-name:var(--font-mono)] uppercase tracking-wider">
                    {service.tier}
                  </p>
                  <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                    {service.name}
                  </h2>
                  <div className="mt-4">
                    <span className="text-3xl font-bold gradient-text">{service.price}</span>
                  </div>
                  <p className="mt-4 text-sm text-muted-light leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="flex-1">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-4">
                    What&apos;s included
                  </p>
                  <ul className="space-y-3 mb-8">
                    {service.includes.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-muted-light">
                        <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>

                  {'examples' in service && service.examples && (
                    <div className="mb-8">
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                        Examples
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {service.examples.map((ex) => (
                          <span key={ex} className="inline-block rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-muted-light">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-surface border border-surface-border">
                    <p className="text-xs text-muted mb-1">Ideal for</p>
                    <p className="text-sm text-foreground">{service.ideal}</p>
                  </div>
                </div>

                <Link
                  href="/contact"
                  className={cn(
                    'mt-8 block w-full rounded-full py-3.5 text-center text-sm font-medium transition-all duration-300',
                    'featured' in service && service.featured
                      ? 'bg-accent text-white hover:bg-accent-light hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'border border-surface-border text-foreground hover:border-accent/50 hover:bg-surface-light'
                  )}
                >
                  {service.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeader
            eyebrow="FAQ"
            title="Common Questions"
          />
          <div className="space-y-6">
            {[
              {
                q: 'How long does an implementation take?',
                a: 'Most implementations take 2-6 weeks from kickoff to deployment, depending on complexity. An AI Readiness Assessment is typically delivered within 2 weeks.',
              },
              {
                q: 'Do I need technical expertise on my team?',
                a: 'No. I handle all the technical work — architecture, development, deployment, and documentation. I train your team on how to use the systems, not how to build them.',
              },
              {
                q: 'What industries do you work with?',
                a: 'AI transformation is industry-agnostic. If your business has repetitive processes, data workflows, or customer interactions, there are high-ROI AI opportunities. My flagship project is in real estate, but the patterns apply everywhere.',
              },
              {
                q: 'What happens after deployment?',
                a: 'Every implementation includes 30 days of post-launch support. For ongoing optimization, the Fractional AI Officer engagement provides continuous improvement, new automation deployment, and team training.',
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-surface-border bg-surface p-6"
              >
                <h3 className="font-semibold font-[family-name:var(--font-display)] text-foreground mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-muted-light leading-relaxed">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="border-t border-surface-border">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)]">
            Not sure which tier is right?
          </h2>
          <p className="mt-4 text-muted-light">
            Book a free discovery call. I&apos;ll help you figure out the highest-ROI starting point.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-white hover:bg-accent-light transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            Book a Discovery Call
          </Link>
        </div>
      </Section>
    </>
  );
}
