'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function FlowerOfLife({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.13;

  // 19 circles: 1 center + 6 inner ring + 12 outer ring (partial)
  const circles = [
    { x: cx, y: cy },
    ...Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    }),
    ...Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      return { x: cx + r * 2 * Math.cos(angle), y: cy + r * 2 * Math.sin(angle) };
    }),
    ...Array.from({ length: 6 }, (_, i) => {
      const angle = ((i * 60 + 30) - 90) * (Math.PI / 180);
      return { x: cx + r * Math.sqrt(3) * Math.cos(angle), y: cy + r * Math.sqrt(3) * Math.sin(angle) };
    }),
  ];

  const opacity = state === 'idle' ? 0.35 : state === 'active' ? 0.75 : 0.55;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${animate && state === 'active' ? 'animate-geometry-breathe' : ''} ${className}`}
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
          strokeWidth={0.6}
          initial={{ opacity: 0 }}
          animate={{ opacity: i < 7 ? opacity : opacity * 0.6 }}
          transition={{ duration: 0.5, delay: animate ? i * 0.025 : 0 }}
        />
      ))}
    </svg>
  );
}
