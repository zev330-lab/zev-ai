import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discovery',
  description: 'A few questions before we meet — help me understand your business.',
  robots: { index: false, follow: false },
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
