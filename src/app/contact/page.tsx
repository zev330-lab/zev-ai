'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/reveal';
import { SITE } from '@/lib/constants';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/submit-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const update = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const isValid = formData.name.trim() && formData.email.trim() && formData.message.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  return (
    <>
      {/* Hero */}
      <section className="pt-36 md:pt-44 pb-12">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">
              Contact
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              Let&apos;s talk.
            </h1>
            <p className="mt-6 text-lg text-muted-light max-w-xl leading-relaxed">
              Tell me about your business and what you&apos;re looking to improve.
              I&apos;ll get back to you within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7">
              {status === 'success' ? (
                <Reveal>
                  <div className="py-20">
                    <h2 className="font-[family-name:var(--font-serif)] text-3xl tracking-tight mb-4">
                      Thank you.
                    </h2>
                    <p className="text-muted-light text-lg">
                      I&apos;ll review what you&apos;ve shared and get back to
                      you within 24 hours.
                    </p>
                  </div>
                </Reveal>
              ) : (
                <Reveal>
                  <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      <div>
                        <label htmlFor="name" className="block text-sm text-muted-light mb-3">
                          Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={update('name')}
                          className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm text-muted-light mb-3">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={update('email')}
                          className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300"
                          placeholder="you@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm text-muted-light mb-3">
                        Company <span className="text-muted">(optional)</span>
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={update('company')}
                        className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300"
                        placeholder="Your company"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm text-muted-light mb-3">
                        What&apos;s on your mind?
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={update('message')}
                        className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300 resize-none"
                        placeholder="Tell me about your business, what processes feel manual, what you've tried so far..."
                      />
                    </div>

                    {status === 'error' && (
                      <p className="text-sm text-red-400">
                        Something went wrong. Email me directly at{' '}
                        <a href={`mailto:${SITE.email}`} className="text-accent hover:text-accent-hover underline">
                          {SITE.email}
                        </a>
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'loading' || !isValid}
                      className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {status === 'loading' ? 'Sending...' : 'Send message'}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                      </svg>
                    </button>
                  </form>
                </Reveal>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 lg:col-start-9">
              <Reveal delay={0.2}>
                <div className="space-y-10 lg:pt-12">
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
                      Email
                    </p>
                    <a
                      href={`mailto:${SITE.email}`}
                      className="text-foreground-strong hover:text-accent transition-colors duration-300"
                    >
                      {SITE.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
                      Location
                    </p>
                    <p className="text-muted-light">Newton, Massachusetts</p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
                      Response time
                    </p>
                    <p className="text-muted-light">Within 24 hours</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
