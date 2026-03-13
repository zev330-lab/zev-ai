import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Tell us about your business and what you\'re exploring with AI. We\'ll get back to you within 24 hours.',
  openGraph: {
    title: 'Contact | zev.ai',
    description: 'Start a conversation about AI for your business.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
