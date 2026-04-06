'use client';

export function ComingSoonOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 min-h-0">
      {/* The actual page content, blurred */}
      <div className="pointer-events-none select-none opacity-30 blur-[2px] overflow-hidden flex-1">
        {children}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[var(--color-admin-bg)]/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Coming Soon</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1 max-w-xs">
              This feature is planned but not yet active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
