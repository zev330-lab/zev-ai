'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const C = {
  bg: '#0f1328',
  sage: '#7c9bf5',
  gold: '#d4b87a',
  charcoal: '#f0f0f5',
  charcoalLight: '#c4b5e0',
  charcoalLighter: '#6a6e80',
  rose: '#f5a0a0',
} as const;

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function RoadmapPurchasePage() {
  return (
    <Suspense fallback={<PurchaseShell loading />}>
      <PurchaseContent />
    </Suspense>
  );
}

function PurchaseContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!leadId) {
      setError('Missing lead reference. Please use the link from your email.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/funnel/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <PurchaseShell>
      <div className="text-center">
        <button
          onClick={handleCheckout}
          disabled={loading || !leadId}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          style={{ background: C.gold, color: '#fff' }}
        >
          {loading ? 'Redirecting to checkout...' : 'Get Your Roadmap — $499'}
          {!loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
        <p className="text-xs mt-3" style={{ color: C.charcoalLighter }}>
          Credits toward any future consulting engagement
        </p>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-center"
          style={{ color: C.rose }}
        >
          {error}
        </motion.p>
      )}
    </PurchaseShell>
  );
}

function PurchaseShell({ children, loading: isLoading }: { children?: React.ReactNode; loading?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bg }}>
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center"
        >
          <h1
            className="font-[family-name:var(--font-source-serif)] text-[clamp(1.6rem,5vw,2.4rem)] leading-[1.15] tracking-tight"
            style={{ color: C.charcoal }}
          >
            Your AI Implementation Roadmap
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: C.charcoalLight }}>
            A personalized, step-by-step implementation plan built from what you shared. Specific tools, realistic timelines, and clear decision points — delivered within minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mt-10 p-8 rounded-2xl"
          style={{ background: '#161a30', border: `1px solid #1e2340` }}
        >
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium" style={{ background: `${C.sage}15`, color: C.sage }}>1</div>
              <p className="text-[15px] leading-relaxed" style={{ color: C.charcoalLight }}>Current state analysis — your pain reframed, industry context, hidden costs</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium" style={{ background: `${C.sage}15`, color: C.sage }}>2</div>
              <p className="text-[15px] leading-relaxed" style={{ color: C.charcoalLight }}>Future vision — concrete outcomes, metrics, and timeline</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium" style={{ background: `${C.sage}15`, color: C.sage }}>3</div>
              <p className="text-[15px] leading-relaxed" style={{ color: C.charcoalLight }}>4 implementation phases — each with DIY, Guided, and Done-For-You options</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium" style={{ background: `${C.sage}15`, color: C.sage }}>4</div>
              <p className="text-[15px] leading-relaxed" style={{ color: C.charcoalLight }}>Real tools, real costs, and a clear path forward</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center">
              <div className="inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${C.gold} transparent ${C.gold} ${C.gold}` }} />
            </div>
          ) : children}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-xs"
          style={{ color: C.charcoalLighter }}
        >
          Secure payment powered by Stripe. Questions? Reply to your email or reach out at hello@askzev.ai.
        </motion.p>
      </div>
    </div>
  );
}
