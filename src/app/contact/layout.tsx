import type { Metadata } from 'next';
import { ContactSchema } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Contact Zev.AI — Start a Conversation About AI',
  description: 'Reach out to discuss what AI could do for your business or personal workflow. Zev responds within 24 hours. No pitch — just an honest conversation about possibilities.',
  alternates: { canonical: 'https://askzev.ai/contact' },
  openGraph: {
    title: 'Contact | zev.ai',
    description: 'Start a conversation about what AI could do for you. Response within 24 hours.',
    url: 'https://askzev.ai/contact',
    type: 'website',
    images: [{ url: '/api/og/social?text=Let%27s+Talk+About+AI&pillar=Contact&style=quote', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | zev.ai',
    description: 'Start a conversation about what AI could do for you.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContactSchema />
      {children}
    </>
  );
}
