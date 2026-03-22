'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ActivityFeed } from '@/components/admin/activity-feed';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';

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

interface Alert {
  type: string;
  severity: string;
  message: string;
  id?: string;
  timestamp?: string;
}

interface DashboardStats {
  total_discoveries: number;
  pipeline_success_rate: number;
  active_agents: number;
  avg_pipeline_seconds: number;
  actions_today: number;
  pipelines_today: number;
  tier3_queue: number;
  by_stage: Record<string, number>;
  blog_pending_review: number;
  social_pending: number;
  overdue_family_tasks: number;
  unpaid_invoices: number;
  alerts: Alert[];
  total_cost_today?: number;
  total_cost_7d?: number;
  system_uptime_hours?: number;
  agent_costs?: { agent_id: string; tokens: number; actions: number; cost: number }[];
  daily_trend?: { date: string; actions: number; tokens: number; cost: number }[];
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

const COST_LEVELS = {
  low: { label: '$', color: 'green', desc: 'Minimal — Haiku model, reduced agents, MWF posting', est: '~$3-5/mo' },
  medium: { label: '$$', color: 'yellow', desc: 'Balanced — Sonnet for content, standard agent schedule', est: '~$12-15/mo' },
  high: { label: '$$$', color: 'red', desc: 'Maximum — Sonnet everywhere, full frequency, all platforms', est: '~$30-50/mo' },
} as const;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [costLevel, setCostLevel] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then((data) => { if (data) setStats(data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/admin/settings')
      .then((r) => r.ok ? r.json() : {})
      .then((data: Record<string, unknown>) => {
        if (data.cost_level) {
          const level = typeof data.cost_level === 'string' ? data.cost_level.replace(/"/g, '') : String(data.cost_level);
          if (['high', 'medium', 'low'].includes(level)) setCostLevel(level as 'high' | 'medium' | 'low');
        }
      })
      .catch(() => {});
  }, [router]);

  const changeCostLevel = async (level: 'low' | 'medium' | 'high') => {
    setCostLevel(level);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost_level: level }),
    });
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">
              Operations Center
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              TOLA v3.0 Pipeline Dashboard
            </p>
          </div>
          {(stats?.system_uptime_hours ?? 0) > 0 && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">System Uptime</p>
              <p className="text-sm font-mono text-green-400">
                {Math.floor((stats?.system_uptime_hours ?? 0) / 24)}d {Math.floor((stats?.system_uptime_hours ?? 0) % 24)}h
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Morning Briefing */}
        {stats && (
          <div className="bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent border border-[var(--color-accent)]/20 rounded-xl p-5">
            <h2 className="text-base font-semibold text-[var(--color-foreground-strong)]">
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, Zev
            </h2>
            <p className="text-sm text-[var(--color-muted-light)] mt-1">
              {[
                stats.total_discoveries > 0 && `${stats.total_discoveries} discoveries in pipeline`,
                (stats.alerts?.length ?? 0) > 0 && `${stats.alerts.length} alert${stats.alerts.length > 1 ? 's' : ''} need attention`,
                (stats.blog_pending_review ?? 0) > 0 && `${stats.blog_pending_review} post${stats.blog_pending_review > 1 ? 's' : ''} awaiting review`,
                (stats.unpaid_invoices ?? 0) > 0 && `${stats.unpaid_invoices} unpaid invoice${stats.unpaid_invoices > 1 ? 's' : ''}`,
                (stats.overdue_family_tasks ?? 0) > 0 && `${stats.overdue_family_tasks} overdue task${stats.overdue_family_tasks > 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ') || 'All clear — nothing urgent.'}
            </p>
          </div>
        )}

        {/* Cost Control */}
        <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-medium text-[var(--color-foreground-strong)]">System Cost Level</h2>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Controls agent frequency, AI model selection, image generation, and posting cadence</p>
            </div>
            <span className="text-[10px] text-[var(--color-muted)]">
              {stats?.total_cost_7d != null ? `$${stats.total_cost_7d.toFixed(2)} last 7d` : COST_LEVELS[costLevel].est}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => {
              const cfg = COST_LEVELS[level];
              const active = costLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => changeCostLevel(level)}
                  className={`relative px-4 py-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    active
                      ? cfg.color === 'green' ? 'border-green-500 bg-green-500/10'
                        : cfg.color === 'yellow' ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-red-500 bg-red-500/10'
                      : 'border-[var(--color-admin-border)] hover:border-[var(--color-admin-border)]/80'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-bold ${
                      active
                        ? cfg.color === 'green' ? 'text-green-400' : cfg.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                        : 'text-[var(--color-muted)]'
                    }`}>{cfg.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{level}</span>
                  </div>
                  <p className="text-[10px] text-[var(--color-muted-light)] leading-relaxed">{cfg.desc}</p>
                  {active && (
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      cfg.color === 'green' ? 'bg-green-400' : cfg.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
                    } animate-pulse`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Discoveries" value={stats?.total_discoveries ?? 0} href="/admin/discoveries" />
          <StatCard label="Active Agents" value={`${stats?.active_agents ?? 0}/11`} href="/admin/agents" />
          <StatCard label="Avg Pipeline Time" value={formatDuration(stats?.avg_pipeline_seconds ?? 0)} href="/admin/discoveries" />
          <StatCard
            label="System Cost Today"
            value={stats?.total_cost_today != null ? `$${stats.total_cost_today.toFixed(2)}` : '--'}
            href="/admin/tola"
            sparkline={stats?.daily_trend?.map(d => ({ value: d.cost }))}
          />
          <StatCard
            label="Actions Today"
            value={stats?.actions_today ?? 0}
            href="/admin/tola"
            sparkline={stats?.daily_trend?.map(d => ({ value: d.actions }))}
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Pipelines Today" value={stats?.pipelines_today ?? 0} href="/admin/discoveries" />
          <MiniStat label="Alerts" value={stats?.alerts?.length ?? 0} alert={(stats?.alerts?.length ?? 0) > 0} />
          <MiniStat label="Review Queue" value={stats?.tier3_queue ?? 0} alert={(stats?.tier3_queue ?? 0) > 0} href="/admin/discoveries" />
          <MiniStat label="Blog Pending" value={stats?.blog_pending_review ?? 0} alert={(stats?.blog_pending_review ?? 0) > 0} href="/admin/content" />
        </div>

        {/* Cross-module stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Social Drafts" value={stats?.social_pending ?? 0} href="/admin/content" />
          <MiniStat label="Overdue Tasks" value={stats?.overdue_family_tasks ?? 0} alert={(stats?.overdue_family_tasks ?? 0) > 0} href="/admin/family" />
          <MiniStat label="Unpaid Invoices" value={stats?.unpaid_invoices ?? 0} alert={(stats?.unpaid_invoices ?? 0) > 0} href="/admin/finance" />
          <MiniStat label="Success Rate" value={`${stats?.pipeline_success_rate ?? 0}%`} href="/admin/discoveries" />
        </div>

        {/* Alerts */}
        {(stats?.alerts?.length ?? 0) > 0 && (
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
            <h2 className="text-sm font-medium text-[var(--color-foreground-strong)] mb-3">Alerts</h2>
            <div className="space-y-2">
              {(stats?.alerts || []).map((alert, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-xs ${
                  alert.severity === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                  alert.severity === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                  'bg-blue-500/10 border border-blue-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    alert.severity === 'error' ? 'bg-red-400' : alert.severity === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${
                      alert.severity === 'error' ? 'text-red-400' : alert.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {alert.type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="text-[var(--color-muted-light)] mt-0.5">{alert.message}</p>
                    {alert.timestamp && <p className="text-[var(--color-muted)] mt-0.5">{new Date(alert.timestamp).toLocaleString()}</p>}
                  </div>
                  {alert.id && (
                    <Link href="/admin/discoveries" className="text-[10px] text-[var(--color-accent)] hover:underline shrink-0">View</Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/tola', label: 'TOLA System', desc: 'Agent visualization' },
            { href: '/admin/content', label: 'Content Engine', desc: `${stats?.blog_pending_review ?? 0} pending review` },
            { href: '/admin/discoveries', label: 'Discoveries', desc: `${stats?.total_discoveries ?? 0} total` },
            { href: '/admin/family', label: 'Family Hub', desc: `${stats?.overdue_family_tasks ?? 0} overdue` },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 hover:border-[var(--color-accent)]/30 transition-colors group">
              <span className="text-xs font-medium text-[var(--color-foreground-strong)] group-hover:text-[var(--color-accent)] transition-colors">{link.label}</span>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{link.desc}</p>
            </Link>
          ))}
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

        {/* Cost breakdown */}
        {(stats?.agent_costs?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-[var(--color-foreground-strong)]">Cost by Agent (7d)</h2>
                <Link href="/admin/tola" className="text-[10px] text-[var(--color-accent)] hover:underline">View details</Link>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(stats?.agent_costs || []).filter(a => a.cost > 0).map(a => ({ name: a.agent_id, value: Number(a.cost.toFixed(4)) }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {(stats?.agent_costs || []).filter(a => a.cost > 0).map((_, i) => (
                        <Cell key={i} fill={['#7c9bf5', '#c4b5e0', '#4ade80', '#f59e0b', '#60a5fa', '#e879f9', '#f472b6', '#6b7280', '#fb923c', '#a78bfa', '#34d399'][i % 11]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #2a2f3e', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(stats?.agent_costs || []).filter(a => a.cost > 0).slice(0, 6).map((a, i) => (
                  <span key={a.agent_id} className="text-[10px] text-[var(--color-muted)] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: ['#7c9bf5', '#c4b5e0', '#4ade80', '#f59e0b', '#60a5fa', '#e879f9'][i % 6] }} />
                    {a.agent_id}
                  </span>
                ))}
              </div>
            </div>

            {/* System health score */}
            <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
              <h2 className="text-sm font-medium text-[var(--color-foreground-strong)] mb-4">System Health</h2>
              {(() => {
                const agentScore = ((stats?.active_agents ?? 0) / 11) * 40;
                const pipelineScore = (stats?.pipeline_success_rate ?? 0) * 0.3;
                const alertPenalty = Math.min((stats?.alerts?.length ?? 0) * 10, 30);
                const score = Math.max(0, Math.min(100, Math.round(agentScore + pipelineScore + 30 - alertPenalty)));
                const color = score >= 80 ? '#4ade80' : score >= 50 ? '#f59e0b' : '#f87171';
                const label = score >= 80 ? 'Healthy' : score >= 50 ? 'Degraded' : 'Critical';
                return (
                  <div className="flex flex-col items-center py-4">
                    <div className="relative w-32 h-32">
                      <svg viewBox="0 0 120 120" className="w-full h-full">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-admin-border)" strokeWidth="8" />
                        <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="8"
                          strokeDasharray={`${score * 3.14} ${314 - score * 3.14}`}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                          style={{ transition: 'stroke-dasharray 1s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
                        <span className="text-[10px] text-[var(--color-muted)]">{label}</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5 text-xs text-[var(--color-muted-light)] w-full">
                      <div className="flex justify-between"><span>Agent uptime</span><span>{stats?.active_agents ?? 0}/11</span></div>
                      <div className="flex justify-between"><span>Pipeline success</span><span>{stats?.pipeline_success_rate ?? 0}%</span></div>
                      <div className="flex justify-between"><span>Active alerts</span><span>{stats?.alerts?.length ?? 0}</span></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  href,
  sparkline,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  href?: string;
  sparkline?: { value: number }[];
}) {
  const inner = (
    <div className={`bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl px-5 py-4 ${href ? 'hover:border-[var(--color-accent)]/30 transition-colors cursor-pointer' : ''}`}>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
        {label}
      </p>
      <div className="flex items-end justify-between gap-3">
        <p
          className={`text-2xl font-semibold ${
            accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground-strong)]'
          }`}
        >
          {value}
        </p>
        {sparkline && sparkline.length > 1 && (
          <div className="w-16 h-8 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <Area type="monotone" dataKey="value" stroke="#7c9bf5" fill="#7c9bf5" fillOpacity={0.15} strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function MiniStat({
  label,
  value,
  alert,
  href,
}: {
  label: string;
  value: number | string;
  alert?: boolean;
  href?: string;
}) {
  const inner = (
    <div className={`bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 flex items-center justify-between ${href ? 'hover:border-[var(--color-accent)]/30 transition-colors cursor-pointer' : ''}`}>
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
  return href ? <Link href={href}>{inner}</Link> : inner;
}
