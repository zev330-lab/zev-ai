import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — AI Implementation Insights',
  description: 'Practical insights on AI implementation, multi-agent systems, and turning AI investment into measurable business outcomes.',
  openGraph: {
    title: 'Blog | zev.ai',
    description: 'Practical AI implementation insights for business leaders.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
