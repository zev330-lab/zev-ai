import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Thoughts on AI in Practice',
  description: 'Lessons learned from building production AI systems. No theory — just what works. By Zev Steinmetz.',
  openGraph: {
    title: 'Blog | zev.ai',
    description: 'Practical AI insights from a builder, not an advisor.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
