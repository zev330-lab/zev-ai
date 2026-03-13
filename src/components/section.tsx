'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn('relative py-24 md:py-32', className)}
    >
      {children}
    </motion.section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-3xl text-center mb-16', className)}>
      {eyebrow && (
        <p className="text-sm font-medium text-accent mb-4 tracking-wider uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-6 text-lg text-muted-light leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
