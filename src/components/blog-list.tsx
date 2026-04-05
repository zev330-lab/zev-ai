'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal, StaggerReveal, StaggerChild } from '@/components/reveal';
import { EmailCapture } from '@/components/email-capture';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  reading_time_min: number;
  published_at: string;
  author: string;
}

const CATEGORIES = [
  'All',
  'AI Implementation Guides',
  'AI Strategy for Leaders',
  'Industry-Specific AI',
  'AI Tools & Comparisons',
  'Case Studies',
  'AI Trends',
];

function relativeDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function BlogList({ posts }: { posts: BlogPost[] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="pt-36 md:pt-44 pb-12">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-6">Blog</p>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight max-w-3xl">
              AI implementation
              <br />
              <span className="italic text-accent">insights.</span>
            </h1>
            <p className="mt-8 text-lg text-muted-light max-w-2xl leading-relaxed">
              Practical strategies for deploying AI systems that drive real business outcomes.
              No hype, no theory — just what works.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category filter */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="flex gap-2 overflow-x-auto pb-4 pt-2 -mb-px scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm whitespace-nowrap rounded-full transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-accent text-background font-medium'
                    : 'text-muted-light hover:text-foreground-strong border border-border hover:border-accent/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Discovery Banner */}
      <section className="border-b border-border bg-accent/5">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-light">
            <span className="text-foreground-strong font-medium">Want a personalized AI analysis?</span>{' '}
            It&apos;s free and takes 5 minutes.
          </p>
          <Link
            href="/discover"
            className="shrink-0 inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover font-medium transition-colors"
          >
            Start your discovery →
          </Link>
        </div>
      </section>

      {/* Posts grid */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-16 md:py-24">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Reveal>
                <h2 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl tracking-tight mb-4">
                  {posts.length === 0 ? 'Coming soon.' : 'No posts in this category yet.'}
                </h2>
                <p className="text-muted-light text-lg mb-8 max-w-lg mx-auto">
                  {posts.length === 0
                    ? 'We\'re working on our first posts. In the meantime, start a conversation about your AI needs.'
                    : 'Check back soon or explore another category.'}
                </p>
                {posts.length === 0 && (
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Start Your Discovery
                  </Link>
                )}
              </Reveal>
            </div>
          ) : (
            <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((post) => (
                <StaggerChild key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group block h-full">
                    <article className="border border-border rounded-2xl p-8 h-full transition-all duration-500 hover:border-accent/30 flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[11px] tracking-wide uppercase text-accent font-medium">
                          {post.category}
                        </span>
                        <span className="text-[11px] text-muted">&middot;</span>
                        <span className="text-[11px] text-muted">{post.reading_time_min} min read</span>
                      </div>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground-strong mb-3 group-hover:text-accent transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-light leading-relaxed flex-1 mb-6">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{relativeDate(post.published_at)}</span>
                        <span className="text-accent group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </div>
                    </article>
                  </Link>
                </StaggerChild>
              ))}
            </StaggerReveal>
          )}
        </div>
      </section>

      {/* Email capture */}
      <section className="section-light">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-16 md:py-20">
          <div className="max-w-xl mx-auto">
            <EmailCapture
              source="blog"
              heading="Get AI implementation insights delivered"
              description="Practical strategies for deploying production AI systems. Published bi-weekly. No spam, unsubscribe anytime."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.15] tracking-tight mb-4">
              Ready to put AI to work?
            </h2>
            <p className="text-muted-light mb-8 max-w-xl">
              Reading is good. Building is better. Start a discovery to find out where AI could actually help your situation.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Your Discovery
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
