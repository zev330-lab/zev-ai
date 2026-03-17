'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export function Lotus({ size = 80, animate = true, state = 'idle', color = '#7c9bf5', className = '' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const petalCount = 8;
  const outerR = size * 0.38;
  const innerR = size * 0.18;

  const opacity = state === 'idle' ? 0.4 : state === 'active' ? 0.85 : 0.6;

  // Generate petal paths
  const petals = Array.from({ length: petalCount }, (_, i) => {
    const angle = (i * 360 / petalCount - 90) * (Math.PI / 180);
    const nextAngle = ((i + 1) * 360 / petalCount - 90) * (Math.PI / 180);
    const midAngle = (angle + nextAngle) / 2;

    const tipX = cx + outerR * Math.cos(midAngle);
    const tipY = cy + outerR * Math.sin(midAngle);
    const baseLeftX = cx + innerR * 0.4 * Math.cos(angle);
    const baseLeftY = cy + innerR * 0.4 * Math.sin(angle);
    const baseRightX = cx + innerR * 0.4 * Math.cos(nextAngle);
    const baseRightY = cy + innerR * 0.4 * Math.sin(nextAngle);

    const cpDist = outerR * 0.7;
    const cp1X = cx + cpDist * Math.cos(angle + 0.15);
    const cp1Y = cy + cpDist * Math.sin(angle + 0.15);
    const cp2X = cx + cpDist * Math.cos(nextAngle - 0.15);
    const cp2Y = cy + cpDist * Math.sin(nextAngle - 0.15);

    return `M ${baseLeftX} ${baseLeftY} Q ${cp1X} ${cp1Y} ${tipX} ${tipY} Q ${cp2X} ${cp2Y} ${baseRightX} ${baseRightY} Z`;
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className}`}
      aria-hidden="true"
    >
      {petals.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={0.8}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: state === 'active' ? (i < 4 ? 0.9 : 0.5) : opacity,
            scale: 1,
          }}
          transition={{
            duration: 0.6,
            delay: animate ? i * 0.08 : 0,
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      {/* Center circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={size * 0.04}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        animate={{ opacity: state === 'active' ? 1 : 0.6 }}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={size * 0.015}
        fill={color}
        animate={{ opacity: state === 'active' ? 1 : 0.5 }}
      />
    </svg>
  );
}
