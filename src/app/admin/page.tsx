'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ActivityFeed } from '@/components/admin/activity-feed';

const STAGE_COLORS: Record<string, string> = {
  none: '#6b7280',
  pending: '#9ca3af',
  researching: '#60a5fa',
  scoping: '#a78bfa',
  synthesizing: '#fb923c',
  complete: '#4ade80',
  failed: '#f87171',
};

const STAGE_LABELS: Record<string, string> = {
  none: 'No Pipeline',
  pending: 'Pending',
  researching: 'Researching',
  scoping: 'Scoping',
  synthesizing: 'Synthesizing',
  complete: 'Complete',
  failed: 'Failed',
};

interface DashboardStats {
  total_discoveries: number;
  pipeline_success_rate: number;
  active_agents: number;
  avg_pipeline_seconds: number;
  actions_today: number;
  pipelines_today: number;
  tier3_queue: number;
  by_stage: Record<string, number>;
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return '--';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 401) {
          router.push('/admin/login');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)]">
        <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">
          Operations Center
        </h1>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          TOLA v3.0 Pipeline Dashboard
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Primary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Discoveries" value={stats?.total_discoveries ?? 0} />
          <StatCard
            label="Success Rate"
            value={`${stats?.pipeline_success_rate ?? 0}%`}
            accent={!!stats?.pipeline_success_rate}
          />
          <StatCard label="Active Agents" value={stats?.active_agents ?? 0} />
          <StatCard
            label="Avg Pipeline Time"
            value={formatDuration(stats?.avg_pipeline_seconds ?? 0)}
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Actions Today" value={stats?.actions_today ?? 0} />
          <MiniStat label="Pipelines Today" value={stats?.pipelines_today ?? 0} />
          <MiniStat
            label="Review Queue"
            value={stats?.tier3_queue ?? 0}
            alert={(stats?.tier3_queue ?? 0) > 0}
          />
        </div>

        {/* Two-column: Pipeline stages + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline stages */}
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[var(--color-foreground-strong)]">
                Pipeline Stages
              </h2>
              <Link
                href="/admin/discoveries"
                className="text-[10px] text-[var(--color-accent)] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {['pending', 'researching', 'scoping', 'synthesizing', 'complete', 'failed'].map(
                (stage) => {
                  const count = stats?.by_stage?.[stage] ?? 0;
                  const total = stats?.total_discoveries || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: STAGE_COLORS[stage] }}
                          />
                          <span className="text-xs text-[var(--color-muted-light)]">
                            {STAGE_LABELS[stage]}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[var(--color-foreground-strong)]">
                          {count}
                        </span>
                      </div>
                      <div className="h-1 bg-[var(--color-admin-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: STAGE_COLORS[stage],
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
            <h2 className="text-sm font-medium text-[var(--color-foreground-strong)] mb-4">
              Recent Activity
            </h2>
            <div className="max-h-80 overflow-y-auto">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
        {label}
      </p>
      <p
        className={`text-2xl font-semibold ${
          accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground-strong)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  alert,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 flex items-center justify-between">
      <span className="text-xs text-[var(--color-muted-light)]">{label}</span>
      <span
        className={`text-sm font-semibold ${
          alert ? 'text-amber-400' : 'text-[var(--color-foreground-strong)]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
