'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'py-4 bg-background/90 backdrop-blur-md'
            : 'py-6 bg-transparent'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
            aria-label="zev.ai home"
          >
            <span className="text-foreground-strong">zev</span>
            <span className="text-accent">.ai</span>
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.filter(l => l.href !== '/').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-[13px] tracking-wide transition-colors duration-300',
                  pathname === link.href
                    ? 'text-foreground-strong'
                    : 'text-muted-light hover:text-foreground-strong'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="text-[13px] tracking-wide bg-accent text-background px-5 py-2 rounded-full font-medium transition-all duration-300 hover:bg-accent-hover hover:scale-[1.03]"
            >
              Start a conversation
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden relative w-8 h-8 flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <div className="relative w-5 h-3.5">
              <span
                className={cn(
                  'absolute left-0 w-5 h-[1.5px] bg-foreground transition-all duration-300',
                  mobileOpen ? 'top-[7px] rotate-45' : 'top-0'
                )}
              />
              <span
                className={cn(
                  'absolute left-0 w-5 h-[1.5px] bg-foreground transition-all duration-300',
                  mobileOpen ? 'top-[7px] -rotate-45' : 'top-[14px]'
                )}
              />
            </div>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center lg:hidden"
          >
            <div className="flex flex-col items-center gap-10">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-2xl font-light tracking-tight transition-colors font-[family-name:var(--font-serif)]',
                    pathname === link.href
                      ? 'text-foreground-strong'
                      : 'text-muted-light hover:text-foreground-strong'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
