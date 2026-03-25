'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CommandPalette } from './command-palette';
import { ToastProvider } from './toast';

interface NavBadges {
  discoveries: number;
  content: number;
  finance: number;
  family: number;
  contacts: number;
  cain: number;
}

function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const shortcuts = [
    { keys: '⌘K', desc: 'Command palette — search everything' },
    { keys: '?', desc: 'Show this help' },
    { keys: 'G D', desc: 'Go to Dashboard' },
    { keys: 'G T', desc: 'Go to TOLA' },
    { keys: 'G I', desc: 'Go to Discoveries' },
    { keys: 'G C', desc: 'Go to Content' },
    { keys: 'G F', desc: 'Go to Family' },
    { keys: 'G A', desc: 'Go to Agents' },
    { keys: 'F11', desc: 'Fullscreen/kiosk (on TOLA page)' },
    { keys: 'Esc', desc: 'Close panel/modal' },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)]">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] cursor-pointer">&times;</button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.keys} className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-muted-light)]">{s.desc}</span>
              <kbd className="bg-[var(--color-admin-bg)] text-[var(--color-foreground-strong)] px-2 py-0.5 rounded text-[10px] font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [badges, setBadges] = useState<NavBadges>({ discoveries: 0, content: 0, finance: 0, family: 0, contacts: 0, cain: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pendingG, setPendingG] = useState(false);

  // Keyboard shortcuts: ? for help, G+key for navigation
  useEffect(() => {
    if (pathname === '/admin/login') return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;

      if (e.key === '?' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setShowShortcuts(s => !s); return; }

      if (pendingG) {
        setPendingG(false);
        const routes: Record<string, string> = { d: '/admin', t: '/admin/tola', i: '/admin/discoveries', c: '/admin/content', f: '/admin/family', a: '/admin/agents', p: '/admin/projects', k: '/admin/knowledge' };
        if (routes[e.key]) { e.preventDefault(); router.push(routes[e.key]); }
        return;
      }
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) { setPendingG(true); setTimeout(() => setPendingG(false), 1000); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [pathname, pendingG, router]);

  const fetchBadges = useCallback(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/admin/cain').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([stats, cainTasks]) => {
      const openCain = Array.isArray(cainTasks)
        ? cainTasks.filter((t: { status: string }) => t.status === 'open' || t.status === 'in_progress').length
        : 0;
      setBadges({
        discoveries: stats ? (stats.by_stage?.failed || 0) + (stats.alerts?.filter((a: { type: string }) => a.type === 'pipeline_stalled').length || 0) : 0,
        content: stats ? (stats.blog_pending_review || 0) + (stats.social_pending || 0) : 0,
        finance: stats ? stats.unpaid_invoices || 0 : 0,
        family: stats ? stats.overdue_family_tasks || 0 : 0,
        contacts: 0,
        cain: openCain,
      });
    });
  }, []);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [pathname, fetchBadges]);

  if (pathname === '/admin/login') return <>{children}</>;

  const nav = [
    { href: '/admin/tola', label: 'TOLA', icon: <TolaIcon />, badge: 0 },
    { href: '/admin', label: 'Dashboard', icon: <DashboardIcon />, badge: 0 },
    { href: '/admin/cain', label: 'Cain', icon: <CainNavIcon />, badge: badges.cain },
    { href: '/admin/discoveries', label: 'Discoveries', icon: <DiscoveryIcon />, badge: badges.discoveries },
    { href: '/admin/content', label: 'Content', icon: <ContentIcon />, badge: badges.content },
    { href: '/admin/projects', label: 'Projects', icon: <ProjectIcon />, badge: 0 },
    { href: '/admin/finance', label: 'Finance', icon: <FinanceIcon />, badge: badges.finance },
    { href: '/admin/family', label: 'Family', icon: <FamilyIcon />, badge: badges.family },
    { href: '/admin/knowledge', label: 'Knowledge', icon: <KnowledgeIcon />, badge: 0 },
    { href: '/admin/agents', label: 'Agents', icon: <AgentIcon />, badge: 0 },
    { href: '/admin/contacts', label: 'Contacts', icon: <ContactIcon />, badge: badges.contacts },
  ];

  return (
    <ToastProvider>
    <div
      className="h-screen flex"
      style={{
        background: 'var(--color-admin-bg)',
        color: 'var(--color-foreground)',
      }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 border-r border-[var(--color-admin-border)] flex-col shrink-0">
        <div className="px-5 py-5 border-b border-[var(--color-admin-border)] space-y-3">
          <Link href="/admin" className="text-base font-semibold text-[var(--color-foreground-strong)]">
            TOLA v3.0
          </Link>
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-muted)] bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg hover:border-[var(--color-accent)]/30 transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search...
            <kbd className="ml-auto text-[10px] bg-[var(--color-admin-surface)] px-1 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'bg-[var(--color-admin-surface)] text-[var(--color-foreground-strong)]'
                    : 'text-[var(--color-muted-light)] hover:bg-[var(--color-admin-surface)] hover:text-[var(--color-foreground-strong)]'
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-[var(--color-admin-border)] space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-muted-light)] transition-colors"
          >
            &larr; Back to site
          </Link>
          <button
            onClick={() => {
              document.cookie = 'admin_auth=; path=/; max-age=0';
              router.push('/admin/login');
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-muted-light)] transition-colors w-full cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-admin-bg)] border-t border-[var(--color-admin-border)] flex justify-around py-2 px-1">
        {nav.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] transition-colors ${
                active ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-14 md:pb-0">
        {/* Breadcrumb */}
        {pathname !== '/admin' && (
          <div className="px-6 py-2 border-b border-[var(--color-admin-border)] text-[11px] text-[var(--color-muted)] flex items-center gap-1.5 shrink-0">
            <Link href="/admin" className="hover:text-[var(--color-accent)] transition-colors">Dashboard</Link>
            {pathname.split('/').filter(Boolean).slice(1).map((segment, i, arr) => {
              const href = '/admin/' + arr.slice(0, i + 1).join('/');
              const label = segment.charAt(0).toUpperCase() + segment.slice(1);
              const isLast = i === arr.length - 1;
              return (
                <span key={href} className="flex items-center gap-1.5">
                  <span className="text-[var(--color-muted)]/50">/</span>
                  {isLast ? (
                    <span className="text-[var(--color-foreground-strong)]">{label}</span>
                  ) : (
                    <Link href={href} className="hover:text-[var(--color-accent)] transition-colors">{label}</Link>
                  )}
                </span>
              );
            })}
          </div>
        )}
        {children}
      </main>

      <CommandPalette />
      <ShortcutHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
    </ToastProvider>
  );
}

function CainNavIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function TolaIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="4" r="2" />
      <circle cx="6" cy="10" r="2" />
      <circle cx="18" cy="10" r="2" />
      <circle cx="12" cy="14" r="2.5" />
      <circle cx="12" cy="22" r="2" />
      <line x1="12" y1="6" x2="12" y2="12" strokeOpacity="0.5" />
      <line x1="12" y1="16.5" x2="12" y2="20" strokeOpacity="0.5" />
      <line x1="7.5" y1="11" x2="10" y2="13" strokeOpacity="0.4" />
      <line x1="16.5" y1="11" x2="14" y2="13" strokeOpacity="0.4" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function DiscoveryIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function FamilyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function KnowledgeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-4 4m4-4l4 4m-8 4h8m-10 4h12" />
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
