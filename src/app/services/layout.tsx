import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services — AI Readiness, Implementation & Fractional AI Officer',
  description: 'Productized AI consulting: AI Readiness Assessment ($2,500–$5,000), AI Workflow Implementation ($5,000–$25,000), and Fractional AI Officer ($5,000–$10,000/month).',
  openGraph: {
    title: 'Services | zev.ai',
    description: 'Productized AI consulting services — from assessment to full implementation.',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
