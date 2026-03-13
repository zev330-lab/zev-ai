import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Zev Steinmetz — AI Implementation Consultant',
  description: 'I built a 2,000+ page real estate platform with 18 AI agents using Claude and Claude Code. Now I help businesses transform their operations with AI.',
  openGraph: {
    title: 'About | zev.ai',
    description: 'The story behind zev.ai — from real estate to AI consulting.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
