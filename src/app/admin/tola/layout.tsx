'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TolaAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div
      className="h-screen flex"
      style={{
        background: 'var(--color-admin-bg)',
        color: 'var(--color-foreground)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 border-r border-[var(--color-admin-border)] flex-col shrink-0">
        <div className="px-5 py-5 border-b border-[var(--color-admin-border)]">
          <span className="text-base font-semibold text-[var(--color-foreground-strong)]">
            TOLA v3.0
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarLink href="/admin/tola" icon={<TreeIcon />} label="TOLA Agents" active={pathname === '/admin/tola'} />
          <SidebarLink href="/admin" icon={<InboxIcon />} label="Contacts" active={pathname === '/admin'} />
          <SidebarLink href="/admin/discoveries" icon={<ClipboardIcon />} label="Discoveries" active={pathname === '/admin/discoveries'} />
        </nav>
        <div className="px-5 py-4 border-t border-[var(--color-admin-border)]">
          <Link
            href="/"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-muted-light)] transition-colors"
          >
            &larr; Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">{children}</main>
    </div>
  );
}

function SidebarLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-[var(--color-admin-surface)] text-[var(--color-foreground-strong)]'
          : 'text-[var(--color-muted-light)] hover:bg-[var(--color-admin-surface)]'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function TreeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-4 4m4-4l4 4m-8 4h8m-10 4h12" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}
