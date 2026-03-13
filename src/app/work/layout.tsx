import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work',
  description: 'A 2,000-page real estate platform with 18 AI agents — built entirely with AI-native development. See how we work.',
  openGraph: {
    title: 'Work | zev.ai',
    description: 'What we\'ve built — production AI systems in action.',
  },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
