import type { Metadata } from 'next';
import { HeroReveal } from '@/components/hero-reveal';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact — Get in Touch',
  description: 'Get in touch to talk about what AI could do for your situation. Based in Newton, MA. Response within 24 hours.',
  alternates: { canonical: 'https://askzev.ai/contact' },
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-36 md:pt-44 pb-12">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <HeroReveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Contact
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Let&apos;s talk.
            </h1>
            <p className="mt-6 text-lg text-muted-light max-w-xl leading-relaxed">
              Tell me what you&apos;re working on or what you&apos;re trying to fix.
              I&apos;ll get back to you within 24 hours.
            </p>
          </HeroReveal>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
