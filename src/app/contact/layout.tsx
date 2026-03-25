import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch to talk about what AI could do for your situation. Response within 24 hours.',
  openGraph: {
    title: 'Contact | zev.ai',
    description: 'Start a conversation about what AI could do for you.',
    images: [{ url: '/api/og/social?text=Let%27s+Talk+About+AI&pillar=Contact&style=quote', width: 1200, height: 630 }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
