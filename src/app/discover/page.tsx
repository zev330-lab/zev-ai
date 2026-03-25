'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;
const FRIENDS_FAMILY_CODE = 'ZevGT3';

export default function DiscoverPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [discoveryId, setDiscoveryId] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && message.trim().length > 0;
  const isFriendsFamily = promoCode.toUpperCase() === FRIENDS_FAMILY_CODE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || status === 'submitting') return;
    setStatus('submitting');

    try {
      const res = await fetch('/api/submit-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: '',
          company: '',
          role: '',
          business: message,
          teamSize: '',
          painPoints: message,
          repetitiveWork: '',
          aiExperience: '',
          aiDetails: '',
          magicWand: '',
          success: '',
          anythingElse: '',
          promoCode,
        }),
      });

      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json();
      if (data.discovery_id) setDiscoveryId(data.discovery_id);
    } catch {
      const subject = encodeURIComponent(`Discovery — ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:hello@askzev.ai?subject=${subject}&body=${body}`;
    } finally {
      setStatus('done');
    }
  };

  if (status === 'done') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 md:px-12">
        <div className="w-full max-w-xl">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-16 h-16 rounded-full border-2 border-accent flex items-center justify-center mb-8"
          >
            <motion.svg
              className="w-8 h-8 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
              />
            </motion.svg>
          </motion.div>

          <motion.h1
            className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
          >
            Thank you, {name || 'friend'}.
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-muted-light max-w-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
          >
            I&apos;ll read through what you&apos;ve shared and get back to you
            with an honest take on where AI could help.
          </motion.p>

          {discoveryId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
              className="mt-6 p-4 rounded-xl border border-accent/30 bg-accent/5 max-w-lg"
            >
              <p className="text-xs tracking-[0.15em] uppercase text-accent font-medium mb-2">
                Your personalized summary
              </p>
              <p className="text-sm text-muted-light mb-3 leading-relaxed">
                Once the analysis completes (usually a few minutes), you&apos;ll have
                a personalized page with what I see in your situation.
              </p>
              <a
                href={`/discovery/${discoveryId}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
              >
                View your page &rarr;
              </a>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
            className="mt-10"
          >
            <p className="text-sm text-muted">
              Questions?{' '}
              <a
                href="mailto:hello@askzev.ai"
                className="text-accent hover:text-accent-hover transition-colors duration-300"
              >
                hello@askzev.ai
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 md:px-12 py-24 md:py-32">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-3">
            Tell me what&apos;s going on.
          </h1>
          <p className="text-muted-light text-lg mb-10 leading-relaxed">
            No pitch, no sales funnel. Just tell me what you&apos;re dealing with
            and I&apos;ll give you an honest take.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="space-y-8"
        >
          <div>
            <label htmlFor="discover-name" className="block text-sm text-muted-light mb-2">
              Your name
            </label>
            <input
              id="discover-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-border px-0 py-3 text-lg text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300"
              placeholder="First name"
              autoComplete="given-name"
            />
          </div>

          <div>
            <label htmlFor="discover-email" className="block text-sm text-muted-light mb-2">
              Email <span className="text-muted">(optional — so I can send you a summary)</span>
            </label>
            <input
              id="discover-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-border px-0 py-3 text-lg text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="discover-message" className="block text-sm text-muted-light mb-2">
              What&apos;s going on?
            </label>
            <textarea
              id="discover-message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-transparent border-b border-border px-0 py-3 text-lg text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300 resize-none"
              placeholder="What's frustrating? What takes too long? What would you fix if you could? Business or personal — whatever's on your mind."
            />
            <p className="mt-2 text-sm text-muted">
              The more specific, the more useful my response will be.
            </p>
          </div>

          <div className="max-w-xs">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Have a code? (optional)"
              className="w-full bg-transparent border-b border-border/40 px-0 py-2 text-sm text-muted placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors duration-300"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {isFriendsFamily && (
              <p className="mt-1.5 text-xs text-accent">
                &#10003; Friends &amp; family — Insight Report included, on us.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <button
              type="submit"
              disabled={!canSubmit || status === 'submitting'}
              className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
            >
              {status === 'submitting' ? 'Sending...' : 'Send it over'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </button>
            <p className="text-sm text-muted">
              or email{' '}
              <a
                href="mailto:hello@askzev.ai"
                className="text-accent hover:text-accent-hover transition-colors duration-300"
              >
                hello@askzev.ai
              </a>
            </p>
          </div>

          <p className="text-xs text-muted pt-2">
            Your responses go directly to Zev. No one else sees them. Free, no commitment.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
