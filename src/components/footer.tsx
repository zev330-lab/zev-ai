import Link from 'next/link';
import { SITE } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border" role="contentinfo">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-16 md:py-20">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-12">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight">
              <span className="text-foreground-strong">zev</span>
              <span className="text-accent">.ai</span>
            </Link>
            <p className="mt-4 text-sm text-muted max-w-xs leading-relaxed">
              AI systems that drive revenue.
              Real implementation, not strategy decks.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 text-sm text-muted">
            <Link
              href="/approach"
              className="inline-flex items-center gap-1.5 text-muted-light/60 hover:text-accent transition-colors duration-300"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="4" r="1.5" />
                <circle cx="12" cy="20" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="19" cy="8" r="1.5" />
                <circle cx="5" cy="16" r="1.5" />
                <circle cx="19" cy="16" r="1.5" />
              </svg>
              Our Approach
            </Link>
            <a
              href={`mailto:${SITE.email}`}
              className="hover:text-foreground-strong transition-colors duration-300"
            >
              {SITE.email}
            </a>
            <span>&copy; {new Date().getFullYear()} Zev Steinmetz</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
