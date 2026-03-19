import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Approach — Nature-Inspired Agent Architecture',
  description: 'Our multi-agent AI systems apply geometric coordination patterns found in nature. 11 agents, 22 pathways, 3-tier human oversight.',
};

export default function TolaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
