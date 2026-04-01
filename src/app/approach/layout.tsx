import type { Metadata } from 'next';
import { ApproachSchema } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Our Approach — Nature-Inspired Multi-Agent Architecture',
  description: 'Zev.AI builds multi-agent systems using geometric coordination patterns from nature. 11 specialized agents, 22 communication pathways, and a 3-tier human oversight model.',
  alternates: { canonical: 'https://askzev.ai/approach' },
  openGraph: {
    title: 'Our Approach | zev.ai',
    description: '11 agents, 22 pathways, 9 coordination patterns from nature. Production-proven results.',
    url: 'https://askzev.ai/approach',
    type: 'website',
    images: [{ url: '/api/og/social?text=Nature-Inspired+Agent+Architecture&pillar=Our+Approach&style=blog', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Approach | zev.ai',
    description: '11 agents, 22 pathways, 9 coordination patterns from nature.',
  },
};

export default function ApproachLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ApproachSchema />
      {children}
    </>
  );
}
