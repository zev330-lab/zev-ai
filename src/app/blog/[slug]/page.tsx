import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase';
import { BlogPostContent } from '@/components/blog-post-content';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data;
}

async function getRelatedPosts(category: string, currentId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, category, reading_time_min, published_at')
    .eq('status', 'published')
    .eq('category', category)
    .neq('id', currentId)
    .order('published_at', { ascending: false })
    .limit(3);
  return data || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author || 'Zev Steinmetz'],
      section: post.category,
      tags: post.tags || [],
      images: [{
        url: `https://zev-ai-swart.vercel.app/api/og/social?text=${encodeURIComponent(post.seo_title || post.title)}&pillar=${encodeURIComponent(post.category || '')}&format=landscape&style=blog`,
        width: 1200,
        height: 630,
        alt: post.seo_title || post.title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: [`https://zev-ai-swart.vercel.app/api/og/social?text=${encodeURIComponent(post.seo_title || post.title)}&pillar=${encodeURIComponent(post.category || '')}&format=landscape&style=blog`],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post.id);

  // Extract headings for table of contents
  const headings = (post.content || '').split('\n')
    .filter((line: string) => /^#{2,3}\s/.test(line))
    .map((line: string) => {
      const level = line.startsWith('### ') ? 3 : 2;
      const text = line.replace(/^#{2,3}\s+/, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return { level, text, id };
    });

  const publishDate = new Date(post.published_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  // FAQ schema extraction
  const faqItems: { question: string; answer: string }[] = [];
  const faqMatch = (post.content || '').match(/## Frequently Asked Questions[\s\S]*$/);
  if (faqMatch) {
    const faqSection = faqMatch[0];
    const qaPairs = faqSection.split(/### /).slice(1);
    for (const qa of qaPairs) {
      const lines = qa.trim().split('\n');
      const question = lines[0]?.replace(/\??\s*$/, '?');
      const answer = lines.slice(1).join(' ').trim();
      if (question && answer) faqItems.push({ question, answer });
    }
  }

  return (
    <>
      {/* JSON-LD */}
      {post.schema_data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.schema_data) }}
        />
      )}
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            }),
          }}
        />
      )}

      <article className="pt-36 md:pt-44 pb-20">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          {/* Header */}
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/blog" className="text-xs text-muted-light hover:text-accent transition-colors">
                &larr; Blog
              </Link>
              <span className="text-xs text-muted">&middot;</span>
              <span className="text-xs tracking-wide uppercase text-accent font-medium">
                {post.category}
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-6">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-light">
              <span>{post.author || 'Zev Steinmetz'}</span>
              <span>&middot;</span>
              <span>{publishDate}</span>
              <span>&middot;</span>
              <span>{post.reading_time_min} min read</span>
            </div>
          </div>

          {/* Content + ToC grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Table of Contents sidebar */}
            {headings.length > 3 && (
              <aside className="hidden lg:block lg:col-span-3 lg:order-2">
                <div className="sticky top-28">
                  <p className="text-xs tracking-[0.2em] uppercase text-muted mb-4">
                    Contents
                  </p>
                  <nav className="space-y-2">
                    {headings.map((h: { level: number; text: string; id: string }) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className={`block text-sm text-muted-light hover:text-accent transition-colors leading-snug ${
                          h.level === 3 ? 'pl-4' : ''
                        }`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

            {/* Post content */}
            <div className={`${headings.length > 3 ? 'lg:col-span-9 lg:order-1' : 'lg:col-span-8'}`}>
              <BlogPostContent content={post.content} />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span key={tag} className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-light">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Author bio */}
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-accent font-semibold text-sm">ZS</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground-strong">Zev Steinmetz</p>
                    <p className="text-sm text-muted-light mt-1 leading-relaxed max-w-lg">
                      AI engineer and real estate professional building production multi-agent
                      systems for businesses. Builder, not theorist.
                    </p>
                    <Link href="/about" className="text-sm text-accent hover:text-accent-hover transition-colors mt-2 inline-block">
                      About Zev &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="section-light">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
            <h2 className="font-[family-name:var(--font-serif)] text-2xl tracking-tight mb-8">
              Related posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="group block">
                  <article className="border border-border rounded-2xl p-6 h-full transition-all duration-500 hover:border-accent/30">
                    <span className="text-[11px] tracking-wide uppercase text-accent font-medium">
                      {r.category}
                    </span>
                    <h3 className="text-base font-semibold tracking-tight text-foreground-strong mt-2 mb-2 group-hover:text-accent transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-sm text-muted-light leading-relaxed line-clamp-2">
                      {r.excerpt}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-20 md:py-28">
          <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.15] tracking-tight mb-4 max-w-lg">
            Ready to put these ideas to work?
          </h2>
          <p className="text-muted-light mb-8 max-w-xl">
            Every engagement starts with a discovery — a clear-eyed look at your biggest AI opportunities.
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
        </div>
      </section>
    </>
  );
}
