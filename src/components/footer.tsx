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
              AI systems built for your business.
              Real implementation, not strategy decks.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 text-sm text-muted">
            <a
              href={`mailto:${SITE.email}`}
              className="hover:text-foreground-strong transition-colors duration-300"
            >
              {SITE.email}
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground-strong transition-colors duration-300"
              aria-label="LinkedIn"
            >
              LinkedIn
            </a>
            <span>&copy; {new Date().getFullYear()} Zev Steinmetz</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
