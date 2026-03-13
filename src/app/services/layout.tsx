import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Three ways to work with zev.ai: AI Readiness Assessment, AI Implementation, and Fractional AI Officer. Real systems, not strategy decks.',
  openGraph: {
    title: 'Services | zev.ai',
    description: 'How we work — from discovery to ongoing AI partnership.',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
