import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Approach — Nature-Inspired Agent Architecture',
  description: 'Our multi-agent AI systems apply geometric coordination patterns found in nature — fractal branching, spiral optimization, and self-similar scaling. 11 agents, 22 pathways, 3-tier human oversight.',
  openGraph: {
    title: 'Our Approach | zev.ai',
    description: '11 agents, 22 pathways, 9 coordination patterns from nature.',
    images: [{ url: '/api/og/social?text=Nature-Inspired+Agent+Architecture&pillar=Our+Approach&style=blog', width: 1200, height: 630 }],
  },
};

export default function ApproachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
