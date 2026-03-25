'use client';

import { useState } from 'react';

interface EmailCaptureProps {
  source?: string;
  heading?: string;
  description?: string;
  className?: string;
}

export function EmailCapture({ heading, description, className }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`text-center py-4 ${className ?? ''}`}>
        <p className="text-sm text-emerald-400">You&apos;re in. Talk soon.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 ${className ?? ''}`}>
      {heading && <h3 className="text-base font-semibold mb-1">{heading}</h3>}
      {description && <p className="text-sm text-[var(--color-muted)] mb-4">{description}</p>}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
