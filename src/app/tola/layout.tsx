import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TOLA Framework — Sacred Geometry Agent Operating System',
  description: 'The Tree of Life Architecture: 11 specialized AI agents orchestrated through 9 sacred geometry engines. The framework that builds, runs, and evolves production AI systems.',
};

export default function TolaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
