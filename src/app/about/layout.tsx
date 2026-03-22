import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Builder, Not Theorist',
  description: 'Zev Steinmetz builds production AI systems for businesses. Boston-based, hands-on, focused on results. From real estate operations to multi-agent AI framework development.',
  openGraph: {
    title: 'About | zev.ai',
    description: 'Builder, not theorist. The story behind zev.ai.',
    images: [{ url: '/api/og/social?text=Builder,+Not+Theorist&pillar=About&style=quote', width: 1200, height: 630 }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
