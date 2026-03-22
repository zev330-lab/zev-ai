import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work — Case Studies & Results',
  description: 'Real AI systems, measurable results. See how we\'ve deployed multi-agent AI across real estate, manufacturing, education, and more.',
  openGraph: {
    title: 'Work | zev.ai',
    description: 'Case studies showing real AI systems in production.',
    images: [{ url: '/api/og/social?text=Real+Systems.+Measurable+Results.&pillar=Case+Studies&style=blog', width: 1200, height: 630 }],
  },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
