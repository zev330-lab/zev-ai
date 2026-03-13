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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'glass-strong py-3' : 'py-5 bg-transparent'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <Link
            href="/"
            className="relative text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]"
            aria-label="zev.ai home"
          >
            <span className="text-foreground">zev</span>
            <span className="gradient-text">.ai</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.filter(l => l.href !== '/').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors duration-200 hover:text-accent-light',
                  pathname === link.href ? 'text-accent' : 'text-muted-light'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="relative inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-accent-light hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Book a Call
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden relative w-8 h-8 flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <div className="relative w-5 h-4">
              <span
                className={cn(
                  'absolute left-0 w-5 h-px bg-foreground transition-all duration-300',
                  mobileOpen ? 'top-2 rotate-45' : 'top-0'
                )}
              />
              <span
                className={cn(
                  'absolute left-0 top-2 w-5 h-px bg-foreground transition-all duration-300',
                  mobileOpen && 'opacity-0'
                )}
              />
              <span
                className={cn(
                  'absolute left-0 w-5 h-px bg-foreground transition-all duration-300',
                  mobileOpen ? 'top-2 -rotate-45' : 'top-4'
                )}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 pt-20 glass-strong md:hidden"
          >
            <div className="flex flex-col items-center gap-6 pt-12">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-lg transition-colors',
                    pathname === link.href ? 'text-accent' : 'text-muted-light hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="mt-4 rounded-full bg-accent px-8 py-3 text-sm font-medium text-white"
              >
                Book a Call
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
