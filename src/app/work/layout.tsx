import type { Metadata } from 'next';
import { WorkSchema } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Work — AI Case Studies & Production Results',
  description: 'Real AI systems in production: a 2,000-page real estate platform with 18 agents, an adaptive learning system, and a self-running consulting website. Measurable results.',
  alternates: { canonical: 'https://askzev.ai/work' },
  openGraph: {
    title: 'Case Studies | zev.ai',
    description: 'Real AI systems in production with measurable results across real estate, education, and consulting.',
    url: 'https://askzev.ai/work',
    type: 'website',
    images: [{ url: '/api/og/social?text=Real+Systems.+Measurable+Results.&pillar=Case+Studies&style=blog', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Case Studies | zev.ai',
    description: 'Real AI systems in production with measurable results.',
  },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WorkSchema />
      {children}
    </>
  );
}
