import Link from 'next/link';
import { SITE } from '@/lib/constants';

const SERVICES_LINKS = [
  { label: 'Free Summary', href: '/services' },
  { label: 'Insight Report', href: '/services' },
  { label: 'Build', href: '/services' },
  { label: 'Custom Apps', href: '/services' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Our Approach', href: '/approach' },
  { label: 'Work', href: '/work' },
  { label: 'Blog', href: '/blog' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border" role="contentinfo">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-16 md:py-20">

        {/* Top section: brand + columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              <span className="text-foreground-strong">zev</span>
              <span className="text-accent">.ai</span>
            </Link>
            <p className="mt-4 text-sm text-muted leading-relaxed max-w-[220px]">
              Custom AI systems that actually work.
              Real implementation, not strategy decks.
            </p>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-light/50 mb-5">
              Services
            </p>
            <ul className="space-y-3">
              {SERVICES_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted hover:text-foreground-strong transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-light/50 mb-5">
              Company
            </p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted hover:text-foreground-strong transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-light/50 mb-5">
              Connect
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted hover:text-foreground-strong transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/discover"
                  className="text-sm text-accent hover:text-accent-hover transition-colors duration-200"
                >
                  Start Discovery
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-sm text-muted hover:text-foreground-strong transition-colors duration-200"
                >
                  {SITE.email}
                </a>
              </li>
              <li>
                <span className="text-sm text-muted">Newton, MA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted">
            &copy; {year} Zev Steinmetz. All rights reserved.
          </p>
          <p className="text-xs text-muted/50">
            Built with Next.js, Claude, and Supabase
          </p>
        </div>

      </div>
    </footer>
  );
}
