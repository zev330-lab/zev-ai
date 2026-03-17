'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function SeedOfLife({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const r = size * 0.18;
  const cx = size / 2;
  const cy = size / 2;

  // 7 circles: 1 center + 6 surrounding
  const circles = [
    { x: cx, y: cy }, // center
    ...Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    }),
  ];

  const opacity = state === 'idle' ? 0.5 : state === 'active' ? 0.9 : 0.7;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${animate ? 'animate-geometry-pulse' : ''} ${className}`}
      aria-hidden="true"
    >
      {circles.map((c, i) => (
        <motion.circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={1}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: i === 0 && state === 'active' ? 1 : opacity }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
        />
      ))}
    </svg>
  );
}
