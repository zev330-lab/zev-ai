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
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission:', formData);
    setSubmitted(true);
  };

  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="text-sm text-muted tracking-wide uppercase mb-8">
            Contact
          </p>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl tracking-tight leading-[1.2] mb-4">
            Tell me about your business.
          </h1>
          <p className="text-muted-light mb-12">
            I&apos;ll get back to you within a day.
          </p>
        </motion.div>

        {submitted ? (
          <Reveal>
            <div className="py-16">
              <h2 className="font-[family-name:var(--font-serif)] text-2xl tracking-tight mb-3">
                Message received.
              </h2>
              <p className="text-muted-light">
                I&apos;ll review what you&apos;ve shared and get back to you
                within 24 hours.
              </p>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm text-muted-light mb-2"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-muted-light mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="block text-sm text-muted-light mb-2"
                >
                  Company{' '}
                  <span className="text-muted">(optional)</span>
                </label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                  className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                  placeholder="Your company"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm text-muted-light mb-2"
                >
                  Tell me about your business and what you&apos;re exploring with AI
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="What does your business do? What processes feel manual or inefficient? What have you tried so far?"
                />
              </div>

              <button
                type="submit"
                className="inline-block border-b border-accent text-accent text-sm tracking-wide pb-1 hover:text-accent-hover hover:border-accent-hover transition-colors"
              >
                Send message
              </button>
            </form>
          </Reveal>
        )}

        <Reveal delay={0.3}>
          <div className="mt-16 pt-16 border-t border-border">
            <p className="text-sm text-muted-light">
              Or email directly:{' '}
              <a
                href={`mailto:${SITE.email}`}
                className="text-foreground hover:text-accent transition-colors"
              >
                {SITE.email}
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
