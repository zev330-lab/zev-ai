'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Section } from '@/components/section';

const BUDGET_OPTIONS = [
  'Under $5K',
  '$5K–$15K',
  '$15K–$50K',
  '$50K+',
  'Not sure yet',
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    challenge: '',
    budget: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission:', formData);
    setSubmitted(true);
  };

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
              Contact
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight">
              Let&apos;s Build{' '}
              <span className="gradient-text">Together</span>
            </h1>
            <p className="mt-6 text-lg text-muted-light max-w-2xl mx-auto">
              Tell me about your business and the challenges you&apos;re facing.
              I&apos;ll show you what&apos;s possible with AI.
            </p>
          </motion.div>
        </div>
      </section>

      <Section className="pt-0">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              {submitted ? (
                <div className="rounded-2xl border border-accent/20 bg-surface p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-2">
                    Message Received
                  </h2>
                  <p className="text-muted-light">
                    I&apos;ll review your information and get back to you within 24 hours
                    to schedule a discovery call.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Name <span className="text-accent">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email <span className="text-accent">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                      Company / Organization
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="challenge" className="block text-sm font-medium text-foreground mb-2">
                      What&apos;s your biggest operational challenge? <span className="text-accent">*</span>
                    </label>
                    <textarea
                      id="challenge"
                      required
                      rows={5}
                      value={formData.challenge}
                      onChange={(e) => setFormData(prev => ({ ...prev, challenge: e.target.value }))}
                      className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                      placeholder="Describe the processes, workflows, or pain points you'd like to address with AI..."
                    />
                  </div>

                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-foreground mb-2">
                      Budget Range
                    </label>
                    <select
                      id="budget"
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors appearance-none"
                    >
                      <option value="">Select a range</option>
                      {BUDGET_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-accent py-4 text-base font-medium text-white hover:bg-accent-light transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Calendly placeholder */}
              <div className="rounded-2xl border border-surface-border bg-surface p-8">
                <h3 className="font-semibold font-[family-name:var(--font-display)] text-foreground mb-2">
                  Book a Discovery Call
                </h3>
                <p className="text-sm text-muted-light mb-6">
                  Prefer to jump straight to a conversation? Schedule a 30-minute
                  discovery call.
                </p>
                <div className="rounded-xl border border-dashed border-surface-border bg-surface-light p-8 text-center">
                  <svg className="w-10 h-10 text-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <p className="text-sm text-muted">Calendly scheduling coming soon</p>
                </div>
              </div>

              {/* Quick info */}
              <div className="rounded-2xl border border-surface-border bg-surface p-8 space-y-6">
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Email</p>
                  <a href="mailto:zev@zev.ai" className="text-sm text-accent hover:text-accent-light transition-colors">
                    zev@zev.ai
                  </a>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Location</p>
                  <p className="text-sm text-muted-light">Newton, MA</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Response Time</p>
                  <p className="text-sm text-muted-light">Within 24 hours</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>
    </>
  );
}
