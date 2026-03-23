import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services — From Discovery to Deployment',
  description: 'Four tiers: Insight Report ($499), Strategy Session ($2,500), Build ($15,000), Growth ($2,500/mo). From first look to full AI operations.',
  openGraph: {
    title: 'Services | zev.ai',
    description: 'From discovery to deployment — real AI systems, measurable outcomes.',
    images: [{ url: '/api/og/social?text=From+Discovery+to+Deployment&pillar=Services&style=blog', width: 1200, height: 630 }],
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
