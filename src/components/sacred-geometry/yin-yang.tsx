'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function YinYang({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const halfR = r / 2;
  const dotR = r * 0.12;

  const opacity = state === 'idle' ? 0.5 : state === 'active' ? 0.9 : 0.7;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${animate ? 'animate-geometry-rotate' : ''} ${className}`}
      style={animate ? { animationDuration: state === 'active' ? '8s' : '20s' } : undefined}
      aria-hidden="true"
    >
      {/* Outer circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={1}
        animate={{ opacity }}
      />
      {/* S-curve divider */}
      <motion.path
        d={`M ${cx} ${cy - r} A ${halfR} ${halfR} 0 0 1 ${cx} ${cy} A ${halfR} ${halfR} 0 0 0 ${cx} ${cy + r}`}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        animate={{ opacity }}
      />
      {/* Yang dot (dark side, light dot) */}
      <motion.circle
        cx={cx}
        cy={cy - halfR}
        r={dotR}
        fill={color}
        animate={{ opacity: opacity * 0.8 }}
      />
      {/* Yin dot (light side, dark dot) */}
      <motion.circle
        cx={cx}
        cy={cy + halfR}
        r={dotR}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        animate={{ opacity: opacity * 0.8 }}
      />
    </svg>
  );
}
