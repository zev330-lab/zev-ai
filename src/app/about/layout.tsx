import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Implementation over strategy. We build production AI systems for businesses — not slide decks, not roadmaps, working software.',
  openGraph: {
    title: 'About | zev.ai',
    description: 'Built, not theorized. The philosophy behind zev.ai.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
