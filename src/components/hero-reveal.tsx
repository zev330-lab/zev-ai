'use client';

import { Reveal } from '@/components/reveal';

interface HeroRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function HeroReveal({ children, className, delay }: HeroRevealProps) {
  return (
    <Reveal className={className} delay={delay} y={24} duration={0.7}>
      {children}
    </Reveal>
  );
}
