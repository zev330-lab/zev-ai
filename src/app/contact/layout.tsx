import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — Book a Discovery Call',
  description: 'Tell me about your business challenges and I\'ll show you what AI can do. Free discovery call — no commitment, just possibilities.',
  openGraph: {
    title: 'Contact | zev.ai',
    description: 'Book a free AI discovery call.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
