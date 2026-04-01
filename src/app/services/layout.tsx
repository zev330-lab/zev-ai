import type { Metadata } from 'next';
import { ServicesSchema, ServicesFaqSchema } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Services — AI Consulting from Discovery to Deployment',
  description: 'Five-tier AI consulting: free analysis, $499 roadmap, $2,500 consultation, custom builds from $15K, ongoing partnerships. Every tier credits toward the next.',
  alternates: { canonical: 'https://askzev.ai/services' },
  openGraph: {
    title: 'AI Consulting Services | zev.ai',
    description: 'From discovery to deployment — real AI systems, measurable outcomes. Free analysis, $499 roadmap, builds from $15K.',
    url: 'https://askzev.ai/services',
    type: 'website',
    images: [{ url: '/api/og/social?text=From+Discovery+to+Deployment&pillar=Services&style=blog', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Consulting Services | zev.ai',
    description: 'From discovery to deployment — real AI systems, measurable outcomes.',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServicesSchema />
      <ServicesFaqSchema />
      {children}
    </>
  );
}
