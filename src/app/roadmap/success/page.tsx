'use client';

import { motion } from 'framer-motion';

const C = {
  bg: '#0f1328',
  sage: '#7c9bf5',
  sageDark: '#5a7ad4',
  gold: '#d4b87a',
  charcoal: '#f0f0f5',
  charcoalLight: '#c4b5e0',
  charcoalLighter: '#6a6e80',
} as const;

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function RoadmapSuccessPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: C.bg }}
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-8"
          style={{ borderColor: C.sage }}
        >
          <motion.svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke={C.sage}
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
          className="font-[family-name:var(--font-source-serif)] text-[clamp(1.6rem,5vw,2.2rem)] leading-[1.15] tracking-tight"
          style={{ color: C.charcoal }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
        >
          Payment received — your roadmap is being built.
        </motion.h1>

        <motion.p
          className="mt-4 text-base leading-relaxed"
          style={{ color: C.charcoalLight }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
        >
          I&apos;m generating your personalized AI Implementation Roadmap right now. It&apos;s built from everything you shared — your situation, your goals, and the research I&apos;ve done on your industry.
        </motion.p>

        <motion.p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: C.charcoalLighter }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
        >
          You&apos;ll receive an email with your unique roadmap link within the next few minutes. Check your inbox (and spam folder, just in case).
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: EASE }}
          className="mt-10 p-5 rounded-2xl text-left"
          style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}25` }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: C.gold }}>
            What to expect
          </p>
          <ul className="space-y-2 text-sm leading-relaxed" style={{ color: C.charcoalLight }}>
            <li className="flex gap-2">
              <span style={{ color: C.sage }}>1.</span>
              Current state analysis — your pain points reframed professionally
            </li>
            <li className="flex gap-2">
              <span style={{ color: C.sage }}>2.</span>
              Future vision — concrete outcomes and metrics for your situation
            </li>
            <li className="flex gap-2">
              <span style={{ color: C.sage }}>3.</span>
              4 implementation phases — each with DIY, Guided, and Professional options
            </li>
            <li className="flex gap-2">
              <span style={{ color: C.sage }}>4.</span>
              Real tools, real timelines, real cost estimates
            </li>
          </ul>
        </motion.div>

        <motion.a
          href="/"
          className="inline-block mt-8 text-sm transition-colors"
          style={{ color: C.charcoalLighter }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Back to askzev.ai
        </motion.a>
      </div>
    </div>
  );
}
