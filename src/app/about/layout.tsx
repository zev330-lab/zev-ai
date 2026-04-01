import type { Metadata } from 'next';
import { AboutSchema } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'About Zev Steinmetz — AI Implementation Consultant',
  description: 'Zev Steinmetz is a Boston-based AI implementation consultant who builds production multi-agent systems. From real estate tech to custom AI platforms — builder, not theorist.',
  alternates: { canonical: 'https://askzev.ai/about' },
  openGraph: {
    title: 'About Zev Steinmetz | zev.ai',
    description: 'Builder, not theorist. Boston-based AI consultant building production systems.',
    url: 'https://askzev.ai/about',
    type: 'profile',
    images: [{ url: '/api/og/social?text=Builder,+Not+Theorist&pillar=About&style=quote', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Zev Steinmetz | zev.ai',
    description: 'Builder, not theorist. Boston-based AI consultant building production systems.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AboutSchema />
      {children}
    </>
  );
}
