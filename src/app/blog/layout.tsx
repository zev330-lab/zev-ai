import type { Metadata } from 'next';
import { BlogIndexSchema } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Blog — AI Implementation Insights',
  description: 'Practical insights on building and deploying AI systems for real business outcomes. Multi-agent architecture, automation strategies, and implementation guides by Zev Steinmetz.',
  alternates: { canonical: 'https://askzev.ai/blog' },
  openGraph: {
    title: 'Blog | zev.ai',
    description: 'Practical AI implementation insights for business leaders.',
    url: 'https://askzev.ai/blog',
    type: 'website',
    images: [{ url: '/api/og/social?text=AI+Implementation+Insights&pillar=Blog&style=blog', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | zev.ai',
    description: 'Practical AI implementation insights for business leaders.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BlogIndexSchema />
      {children}
    </>
  );
}
