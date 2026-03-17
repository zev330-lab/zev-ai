'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function SriYantra({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.38;

  // 9 interlocking triangles (simplified representation)
  // 4 upward triangles (Shiva) + 5 downward triangles (Shakti)
  const upTriangles = [
    { y: -s * 0.9, w: s * 0.15 },
    { y: -s * 0.5, w: s * 0.45 },
    { y: -s * 0.15, w: s * 0.7 },
    { y: s * 0.25, w: s * 0.9 },
  ];

  const downTriangles = [
    { y: s * 0.85, w: s * 0.2 },
    { y: s * 0.5, w: s * 0.5 },
    { y: s * 0.15, w: s * 0.65 },
    { y: -s * 0.15, w: s * 0.8 },
    { y: -s * 0.45, w: s * 0.95 },
  ];

  const opacity = state === 'idle' ? 0.4 : state === 'active' ? 0.85 : 0.6;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${animate && state === 'active' ? 'animate-geometry-pulse' : ''} ${className}`}
      aria-hidden="true"
    >
      {/* Outer circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={s}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        animate={{ opacity: opacity * 0.5 }}
      />
      {/* Upward triangles */}
      {upTriangles.map((t, i) => (
        <motion.polygon
          key={`up${i}`}
          points={`${cx},${cy + t.y - t.w} ${cx - t.w},${cy + t.y + t.w * 0.5} ${cx + t.w},${cy + t.y + t.w * 0.5}`}
          fill="none"
          stroke={color}
          strokeWidth={0.7}
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
        />
      ))}
      {/* Downward triangles */}
      {downTriangles.map((t, i) => (
        <motion.polygon
          key={`dn${i}`}
          points={`${cx},${cy + t.y + t.w} ${cx - t.w},${cy + t.y - t.w * 0.5} ${cx + t.w},${cy + t.y - t.w * 0.5}`}
          fill="none"
          stroke={color}
          strokeWidth={0.7}
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          transition={{ duration: 0.5, delay: (i + 4) * 0.08 }}
        />
      ))}
      {/* Bindu (center dot) */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={size * 0.015}
        fill={color}
        animate={{ opacity: state === 'active' ? 1 : 0.6 }}
      />
    </svg>
  );
}
