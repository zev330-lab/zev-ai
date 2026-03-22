import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — AI Implementation Insights',
  description: 'Practical insights on AI implementation, multi-agent systems, and turning AI investment into measurable business outcomes.',
  openGraph: {
    title: 'Blog | zev.ai',
    description: 'Practical AI implementation insights for business leaders.',
    images: [{ url: '/api/og/social?text=AI+Implementation+Insights&pillar=Blog&style=blog', width: 1200, height: 630 }],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
