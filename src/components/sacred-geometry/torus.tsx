'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function Torus({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rx = size * 0.35;
  const ry = size * 0.15;

  const opacity = state === 'idle' ? 0.4 : state === 'active' ? 0.85 : 0.6;

  // Flow lines showing the toroidal circulation
  const flowPaths = Array.from({ length: 8 }, (_, i) => {
    const t = (i / 8) * Math.PI * 2;
    const flowRx = rx * (0.4 + 0.6 * Math.abs(Math.sin(t)));
    const flowRy = ry + rx * 0.6 * Math.cos(t);
    return `M ${cx - flowRx} ${cy} A ${flowRx} ${flowRy} 0 0 1 ${cx + flowRx} ${cy} A ${flowRx} ${flowRy} 0 0 1 ${cx - flowRx} ${cy}`;
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className}`}
      aria-hidden="true"
    >
      {/* Outer ellipse */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={rx * 0.85}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        animate={{ opacity: opacity * 0.5 }}
      />
      {/* Inner donut hole */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx * 0.3}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={0.7}
        animate={{ opacity }}
      />
      {/* Meridian lines */}
      {[0, 45, 90, 135].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = cx + rx * Math.cos(rad);
        const y1 = cy + rx * 0.85 * Math.sin(rad);
        const x2 = cx - rx * Math.cos(rad);
        const y2 = cy - rx * 0.85 * Math.sin(rad);
        return (
          <motion.path
            key={i}
            d={`M ${x1} ${y1} Q ${cx} ${cy + (i % 2 === 0 ? ry : -ry)} ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: opacity * 0.4 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          />
        );
      })}
      {/* Animated flow indicator */}
      {animate && state === 'active' && (
        <motion.circle
          cx={cx + rx * 0.3}
          cy={cy}
          r={size * 0.02}
          fill={color}
          animate={{
            cx: [cx + rx * 0.3, cx, cx - rx * 0.3, cx, cx + rx * 0.3],
            cy: [cy, cy - ry, cy, cy + ry, cy],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </svg>
  );
}
