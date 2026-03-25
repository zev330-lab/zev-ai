import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discovery',
  description: 'Tell me what you\'re dealing with — I\'ll give you an honest take on where AI could help.',
  robots: { index: false, follow: false },
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
