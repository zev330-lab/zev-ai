'use client';

import { motion } from 'framer-motion';

export function HeroGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #5ba8b5 0%, transparent 70%)',
          top: '-20%',
          right: '-10%',
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 10, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, #5ba8b5 0%, transparent 70%)',
          bottom: '-10%',
          left: '-10%',
        }}
        animate={{
          x: [0, -20, 30, 0],
          y: [0, 20, -15, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
