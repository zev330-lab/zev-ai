'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Section } from '@/components/section';

const POSTS = [
  {
    slug: 'how-i-built-2000-page-website-with-18-ai-agents',
    title: 'How I Built a 2,000-Page Website With 18 AI Agents',
    excerpt: 'The full story of building SteinmetzRealEstate.com — from concept to production with AI-assisted development. Architecture decisions, tools used, and lessons learned.',
    date: '2026-03-10',
    readTime: '12 min read',
    category: 'Case Study',
  },
  {
    slug: 'ai-readiness-assessment-what-every-business-owner-should-know',
    title: 'The AI Readiness Assessment: What Every Business Owner Should Know Before Investing in AI',
    excerpt: 'Before you spend a dollar on AI, you need to know where the highest ROI opportunities are. Here\'s the framework I use to evaluate every business.',
    date: '2026-03-06',
    readTime: '8 min read',
    category: 'Strategy',
  },
  {
    slug: 'why-ai-consultants-should-build-not-advise',
    title: 'Why AI Consultants Should Build, Not Advise',
    excerpt: 'The AI consulting industry is full of strategists who\'ve never deployed a production system. Here\'s why that matters — and what to look for instead.',
    date: '2026-03-01',
    readTime: '6 min read',
    category: 'Opinion',
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-sm font-medium tracking-widest text-accent uppercase font-[family-name:var(--font-mono)]">
              Blog
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight">
              Thoughts on{' '}
              <span className="gradient-text">AI in Practice</span>
            </h1>
            <p className="mt-6 text-lg text-muted-light max-w-2xl mx-auto">
              Lessons learned from building production AI systems. No theory — just what works.
            </p>
          </motion.div>
        </div>
      </section>

      <Section className="pt-8">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-8">
            {POSTS.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl border border-surface-border bg-surface p-8 transition-all duration-300 hover:border-accent/30 hover:bg-surface-light"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent font-medium">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted">{post.date}</span>
                    <span className="text-xs text-muted">{post.readTime}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-display)] text-foreground group-hover:text-accent transition-colors mb-3">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-light leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-accent group-hover:text-accent-light transition-colors">
                    Read article
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
