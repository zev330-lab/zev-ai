import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Implementation over strategy. I build production AI systems for businesses — not slide decks, not roadmaps, working software.',
  openGraph: {
    title: 'About | zev.ai',
    description: 'Implementation over strategy.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
