'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function Vortex({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const turns = 4;
  const points = 120;

  // Generate Archimedean spiral path
  const spiralPath = Array.from({ length: points }, (_, i) => {
    const t = (i / points) * turns * Math.PI * 2;
    const r = (i / points) * maxR;
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  const opacity = state === 'idle' ? 0.4 : state === 'active' ? 0.85 : 0.6;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${animate ? 'animate-geometry-rotate' : ''} ${className}`}
      style={animate ? { animationDuration: state === 'active' ? '6s' : '15s' } : undefined}
      aria-hidden="true"
    >
      <motion.path
        d={spiralPath}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity }}
        transition={{ duration: animate ? 1.5 : 0, ease: 'easeOut' }}
      />
      {/* Center dot */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={size * 0.015}
        fill={color}
        animate={{ opacity: state === 'active' ? 1 : 0.5 }}
      />
      {/* Outer circle reference */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={maxR}
        fill="none"
        stroke={color}
        strokeWidth={0.4}
        animate={{ opacity: opacity * 0.3 }}
      />
    </svg>
  );
}
