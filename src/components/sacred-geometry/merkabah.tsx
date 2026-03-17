'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function Merkabah({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;

  // Two interpenetrating triangles (Star of David / 2D projection of dual tetrahedra)
  const upTriangle = Array.from({ length: 3 }, (_, i) => {
    const angle = (i * 120 - 90) * (Math.PI / 180);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  const downTriangle = Array.from({ length: 3 }, (_, i) => {
    const angle = (i * 120 + 30) * (Math.PI / 180);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  const opacity = state === 'idle' ? 0.4 : state === 'active' ? 0.85 : 0.6;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className}`}
      aria-hidden="true"
    >
      {/* Outer circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        animate={{ opacity: opacity * 0.4 }}
      />
      {/* Upward triangle (Team Alpha) */}
      <motion.polygon
        points={upTriangle}
        fill="none"
        stroke={color}
        strokeWidth={1}
        initial={{ opacity: 0 }}
        animate={{ opacity }}
        transition={{ duration: 0.6 }}
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          ...(animate && state === 'active' ? {} : {}),
        }}
      />
      {/* Downward triangle (Team Beta) — counter-rotate */}
      <motion.polygon
        points={downTriangle}
        fill="none"
        stroke={color}
        strokeWidth={1}
        initial={{ opacity: 0 }}
        animate={{ opacity }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Inner hexagon formed by intersection */}
      {(() => {
        const hexR = r * 0.577;
        const hex = Array.from({ length: 6 }, (_, i) => {
          const angle = (i * 60) * (Math.PI / 180);
          return `${cx + hexR * Math.cos(angle)},${cy + hexR * Math.sin(angle)}`;
        }).join(' ');
        return (
          <motion.polygon
            points={hex}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
            animate={{ opacity: opacity * 0.5 }}
          />
        );
      })()}
      {/* Center point */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={size * 0.012}
        fill={color}
        animate={{ opacity: state === 'active' ? 1 : 0.5 }}
      />
    </svg>
  );
}
