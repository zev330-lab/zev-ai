'use client';

import { useRealtimeActivityFeed } from '@/hooks/use-realtime-agents';
import { GEOMETRY_LABELS, type GeometryEngine } from '@/lib/tola-agents';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed() {
  const { entries, loading } = useRealtimeActivityFeed();

  if (loading) {
    return (
      <div className="text-sm text-[var(--color-muted)] py-8 text-center">
        Loading activity...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-sm text-[var(--color-muted)] py-8 text-center px-4">
        No activity yet. Agent actions will appear here in real time.
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-admin-bg)]/50 transition-colors"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-[var(--color-foreground-strong)] capitalize">
                {entry.agent_id || 'system'}
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">
                {relativeTime(entry.created_at)}
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted-light)] mt-0.5 truncate">
              {entry.action}
              {entry.geometry_pattern && (
                <span className="text-[var(--color-muted)] ml-1">
                  via{' '}
                  {GEOMETRY_LABELS[entry.geometry_pattern as GeometryEngine] ||
                    entry.geometry_pattern}
                </span>
              )}
            </p>
            {typeof entry.latency_ms === 'number' && (
              <span className="text-[10px] text-[var(--color-muted)]">
                {entry.latency_ms}ms
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
