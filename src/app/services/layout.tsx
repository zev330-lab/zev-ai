import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services — From Discovery to Deployment',
  description: 'Four levels of AI engagement: Assess, Build, Optimize, Scale. From focused assessments starting at $2,500 to enterprise-wide AI infrastructure.',
  openGraph: {
    title: 'Services | zev.ai',
    description: 'From discovery to deployment — real AI systems, measurable outcomes.',
    images: [{ url: '/api/og/social?text=From+Discovery+to+Deployment&pillar=Services&style=blog', width: 1200, height: 630 }],
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
