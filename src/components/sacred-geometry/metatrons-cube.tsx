'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function MetatronsCube({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.4;
  const innerR = size * 0.2;

  // 13 circles: 1 center + 6 inner ring + 6 outer ring
  const circles = [
    { x: cx, y: cy },
    ...Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      return { x: cx + innerR * Math.cos(angle), y: cy + innerR * Math.sin(angle) };
    }),
    ...Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      return { x: cx + outerR * Math.cos(angle), y: cy + outerR * Math.sin(angle) };
    }),
  ];

  // Key connecting lines (subset for visual clarity — not all 78)
  const lines: [number, number][] = [];
  // Inner to center
  for (let i = 1; i <= 6; i++) lines.push([0, i]);
  // Inner ring
  for (let i = 1; i <= 6; i++) lines.push([i, i === 6 ? 1 : i + 1]);
  // Inner to outer
  for (let i = 1; i <= 6; i++) lines.push([i, i + 6]);
  // Outer ring
  for (let i = 7; i <= 12; i++) lines.push([i, i === 12 ? 7 : i + 1]);
  // Cross-connections (star pattern)
  for (let i = 7; i <= 12; i++) {
    const opposite = ((i - 7 + 3) % 6) + 7;
    if (i < opposite) lines.push([i, opposite]);
  }

  const opacity = state === 'idle' ? 0.4 : state === 'active' ? 0.85 : 0.6;
  const dotR = size * 0.015;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${animate && state === 'active' ? 'animate-geometry-pulse' : ''} ${className}`}
      aria-hidden="true"
    >
      {lines.map(([a, b], i) => (
        <motion.line
          key={`l${i}`}
          x1={circles[a].x}
          y1={circles[a].y}
          x2={circles[b].x}
          y2={circles[b].y}
          stroke={color}
          strokeWidth={0.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: opacity * 0.6 }}
          transition={{ duration: 0.4, delay: i * 0.02 }}
        />
      ))}
      {circles.map((c, i) => (
        <motion.circle
          key={`c${i}`}
          cx={c.x}
          cy={c.y}
          r={dotR}
          fill={color}
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          transition={{ duration: 0.5, delay: i * 0.03 }}
        />
      ))}
    </svg>
  );
}
