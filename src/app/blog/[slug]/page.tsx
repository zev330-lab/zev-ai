import Link from 'next/link';

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <section className="relative pt-32 pb-24 md:pt-40">
      <div className="absolute inset-0 mesh-gradient" />
      <div className="relative mx-auto max-w-3xl px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Blog
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
          {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h1>

        <div className="rounded-2xl border border-surface-border bg-surface p-12 text-center mt-12">
          <p className="text-muted-light text-lg mb-2">This article is coming soon.</p>
          <p className="text-sm text-muted">
            Check back shortly — or{' '}
            <Link href="/contact" className="text-accent hover:text-accent-light transition-colors">
              get in touch
            </Link>
            {' '}to discuss these topics directly.
          </p>
        </div>
      </div>
    </section>
  );
}
