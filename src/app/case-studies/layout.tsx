import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Studies — Production AI Systems in Action',
  description: 'See real AI systems deployed and running in production. Flagship: Steinmetz Real Estate — 2,000+ pages, 18 AI agents, full Supabase backend.',
  openGraph: {
    title: 'Case Studies | zev.ai',
    description: 'Real AI systems, real results. See what I\'ve built.',
  },
};

export default function CaseStudiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
