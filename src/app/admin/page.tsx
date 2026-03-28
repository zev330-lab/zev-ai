'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Types ---

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
  alerts: { type: string; severity: string; message: string; id?: string; timestamp?: string }[];
  next_actions?: { priority: number; type: string; label: string; detail: string; href: string }[];
  new_contacts_count?: number;
  active_projects_count?: number;
  total_cost_today?: number;
  total_cost_7d?: number;
  system_uptime_hours?: number;
  agent_costs?: { agent_id: string; tokens: number; actions: number; cost: number }[];
  daily_trend?: { date: string; actions: number; tokens: number; cost: number }[];
}

interface Discovery {
  id: string;
  name: string;
  email?: string;
  company?: string;
  pipeline_status: string;
  progress_pct?: number;
  pipeline_error?: string;
  pipeline_track?: string;
  created_at: string;
  updated_at: string;
}

interface CainTask {
  id: string;
  title: string;
  context?: string;
  priority: string;
  status: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

interface CainLogEntry {
  id: string;
  entry: string;
  created_by: string;
  created_at: string;
}

interface OpusMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  message: string;
  message_type: string;
  status: string;
  created_at: string;
}

// --- Helpers ---

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#f87171',
  today: '#f59e0b',
  week: '#60a5fa',
  backlog: '#6b7280',
};

const STAGE_LABELS: Record<string, string> = {
  pending: 'Pending',
  researching: 'Researching',
  scoping: 'Scoping',
  synthesizing: 'Synthesizing',
  reporting: 'Reporting',
  revising: 'Revising',
  delivering: 'Delivering',
  complete: 'Complete',
  failed: 'Failed',
};

const STAGE_COLORS: Record<string, string> = {
  pending: '#9ca3af',
  researching: '#60a5fa',
  scoping: '#a78bfa',
  synthesizing: '#fb923c',
  reporting: '#e879f9',
  revising: '#f59e0b',
  delivering: '#4ade80',
  complete: '#4ade80',
  failed: '#f87171',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// --- Components ---

function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {pulse && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
    </span>
  );
}

function SectionHeader({ title, href, count }: { title: string; href?: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-[var(--color-foreground-strong)]">{title}</h2>
      <div className="flex items-center gap-2">
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
            {count}
          </span>
        )}
        {href && (
          <Link href={href} className="text-[10px] text-[var(--color-accent)] hover:underline">
            View all
          </Link>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [tasks, setTasks] = useState<CainTask[]>([]);
  const [latestLog, setLatestLog] = useState<CainLogEntry | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<OpusMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, discRes, tasksRes, logRes, msgRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/discoveries?limit=10'),
        fetch('/api/admin/cain?assigned_to=zev&status=open'),
        fetch('/api/admin/cain?view=log'),
        fetch('/api/opus/messages?status=unread&to_agent=cain'),
      ]);

      if (statsRes.status === 401) {
        router.push('/admin/login');
        return;
      }

      const [statsData, discData, tasksData, logData, msgData] = await Promise.all([
        statsRes.ok ? statsRes.json() : null,
        discRes.ok ? discRes.json() : [],
        tasksRes.ok ? tasksRes.json() : [],
        logRes.ok ? logRes.json() : [],
        msgRes.ok ? msgRes.json() : [],
      ]);

      if (statsData) setStats(statsData);

      // Active discoveries: not complete, not failed, or recently completed
      const activeDiscs = (Array.isArray(discData) ? discData : discData.data || discData.discoveries || []) as Discovery[];
      const sorted = activeDiscs
        .sort((a: Discovery, b: Discovery) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 8);
      setDiscoveries(sorted);

      setTasks(Array.isArray(tasksData) ? tasksData : []);

      const logs = Array.isArray(logData) ? logData : [];
      if (logs.length > 0) setLatestLog(logs[0]);

      const msgs = Array.isArray(msgData) ? msgData : (msgData.messages || []);
      setUnreadMessages(msgs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading...</p>
      </div>
    );
  }

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  // Active leads: in-progress or recently completed
  const activeLeads = discoveries.filter(d => !['failed'].includes(d.pipeline_status));
  const stuckLeads = discoveries.filter(d => d.pipeline_status === 'failed' || (d.progress_pct && d.progress_pct > 0 && d.progress_pct < 100 && Date.now() - new Date(d.updated_at).getTime() > 30 * 60 * 1000));

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-admin-border)]">
        <h1 className="text-base font-semibold text-[var(--color-foreground-strong)]">
          {greeting}, Zev
        </h1>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* ===== SECTION 1: TOLA Status Bar ===== */}
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: 'Cain',
              status: (stats?.active_agents ?? 0) > 0 ? 'ok' : 'warn',
              detail: latestLog ? timeAgo(latestLog.created_at) : 'no data',
            },
            {
              label: 'Abel',
              status: 'ok',
              detail: 'active',
            },
            {
              label: 'Pipeline',
              status: (stats?.alerts?.some(a => a.type === 'pipeline_failed') ? 'error' : stuckLeads.length > 0 ? 'warn' : 'ok'),
              detail: `${stats?.pipelines_today ?? 0} today`,
            },
            {
              label: 'Catalyst',
              status: (stats?.social_pending ?? 0) > 3 ? 'warn' : 'ok',
              detail: `${stats?.social_pending ?? 0} drafts`,
            },
            {
              label: 'Agents',
              status: (stats?.active_agents ?? 0) >= 9 ? 'ok' : (stats?.active_agents ?? 0) >= 5 ? 'warn' : 'error',
              detail: `${stats?.active_agents ?? 0}/11`,
            },
          ].map((item) => {
            const color = item.status === 'ok' ? '#4ade80' : item.status === 'warn' ? '#f59e0b' : '#f87171';
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] min-w-0"
              >
                <StatusDot color={color} pulse={item.status !== 'ok'} />
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-[var(--color-foreground-strong)]">{item.label}</span>
                  <span className="text-[10px] text-[var(--color-muted)] ml-1.5">{item.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alerts banner — only if something is red */}
        {(stats?.alerts?.length ?? 0) > 0 && (
          <div className="space-y-2">
            {stats!.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs ${
                  alert.severity === 'error'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-yellow-500/10 border border-yellow-500/20'
                }`}
              >
                <StatusDot color={alert.severity === 'error' ? '#f87171' : '#f59e0b'} pulse />
                <span className={alert.severity === 'error' ? 'text-red-300' : 'text-yellow-300'}>
                  {alert.message}
                </span>
                {alert.id && (
                  <Link href="/admin/discoveries" className="ml-auto text-[10px] text-[var(--color-accent)] hover:underline shrink-0">
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== SECTION 2: Active Leads & Opportunities ===== */}
        <div>
          <SectionHeader title="Active Leads & Opportunities" href="/admin/discoveries" count={activeLeads.length} />

          {/* Unread Opus Messages */}
          {unreadMessages.length > 0 && (
            <div className="mb-3 space-y-2">
              {unreadMessages.slice(0, 3).map((msg) => (
                <Link
                  key={msg.id}
                  href="/admin/messages"
                  className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25 hover:border-[var(--color-accent)]/40 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[var(--color-accent)]">O</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-[var(--color-accent)]">Message from Opus</span>
                      <span className="text-[10px] text-[var(--color-muted)]">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-muted-light)] mt-0.5 line-clamp-2">{msg.message}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Latest Cain update */}
          {latestLog && (
            <div className="mb-3 px-4 py-3 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium text-green-400">Cain Update</span>
                <span className="text-[10px] text-[var(--color-muted)]">{timeAgo(latestLog.created_at)}</span>
              </div>
              <p className="text-xs text-[var(--color-muted-light)] line-clamp-2">{latestLog.entry}</p>
            </div>
          )}

          {/* Lead cards */}
          {activeLeads.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)] py-4 text-center">No active leads right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeLeads.slice(0, 6).map((d) => {
                const isStuck = stuckLeads.some(s => s.id === d.id);
                const stageColor = STAGE_COLORS[d.pipeline_status] || '#6b7280';
                return (
                  <Link
                    key={d.id}
                    href="/admin/discoveries"
                    className={`px-4 py-3 rounded-lg bg-[var(--color-admin-surface)] border transition-colors hover:border-[var(--color-accent)]/30 ${
                      isStuck ? 'border-red-500/30' : 'border-[var(--color-admin-border)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--color-foreground-strong)] truncate">
                          {d.company || d.name}
                        </p>
                        {d.company && d.name && (
                          <p className="text-[10px] text-[var(--color-muted)] truncate">{d.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${stageColor}20`, color: stageColor }}
                        >
                          {STAGE_LABELS[d.pipeline_status] || d.pipeline_status}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    {d.progress_pct !== undefined && d.progress_pct > 0 && d.pipeline_status !== 'complete' && (
                      <div className="mt-2 h-1 bg-[var(--color-admin-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${d.progress_pct}%`, backgroundColor: stageColor }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[var(--color-muted)]">{timeAgo(d.updated_at)}</span>
                      {isStuck && (
                        <span className="text-[10px] font-medium text-red-400">Needs attention</span>
                      )}
                      {d.pipeline_status === 'complete' && (
                        <span className="text-[10px] font-medium text-green-400">Ready for review</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== SECTION 3: My Tasks ===== */}
        <div>
          <SectionHeader title="My Tasks" href="/admin/cain" count={tasks.length} />
          {tasks.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)] py-4 text-center">No open tasks assigned to you.</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 6).map((task) => (
                <TaskCard key={task.id} task={task} onDone={fetchAll} />
              ))}
            </div>
          )}
        </div>

        {/* ===== SECTION 4: Financial Pulse (compact) ===== */}
        <div>
          <SectionHeader title="Financial Pulse" href="/admin/finance" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CompactStat
              label="Pipeline Value"
              value={`$${((stats?.total_discoveries ?? 0) * 499).toLocaleString()}`}
              sub="active discoveries"
            />
            <CompactStat
              label="Unpaid"
              value={stats?.unpaid_invoices ?? 0}
              sub="invoices"
              alert={(stats?.unpaid_invoices ?? 0) > 0}
            />
            <CompactStat
              label="7d Spend"
              value={stats?.total_cost_7d != null ? `$${stats.total_cost_7d.toFixed(2)}` : '--'}
              sub="TOLA cost"
            />
            <CompactStat
              label="Success Rate"
              value={`${stats?.pipeline_success_rate ?? 0}%`}
              sub="pipeline"
            />
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 pb-4">
          {[
            { href: '/admin/tola', label: 'TOLA', icon: '◉' },
            { href: '/admin/discoveries', label: 'Leads', icon: '◈' },
            { href: '/admin/content', label: 'Content', icon: '◇' },
            { href: '/admin/contacts', label: 'Contacts', icon: '◎' },
            { href: '/admin/cain', label: 'Cain', icon: '⬡' },
            { href: '/admin/finance', label: 'Finance', icon: '◆' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-1 py-3 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] hover:border-[var(--color-accent)]/30 transition-colors"
            >
              <span className="text-base text-[var(--color-accent)]">{link.icon}</span>
              <span className="text-[10px] text-[var(--color-muted)]">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function TaskCard({ task, onDone }: { task: CainTask; onDone: () => void }) {
  const [marking, setMarking] = useState(false);

  const markDone = async () => {
    setMarking(true);
    try {
      await fetch('/api/admin/cain', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: 'done' }),
      });
      onDone();
    } catch {
      setMarking(false);
    }
  };

  const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280';

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)]">
      <button
        onClick={markDone}
        disabled={marking}
        className="w-5 h-5 rounded border-2 border-[var(--color-admin-border)] hover:border-[var(--color-accent)] transition-colors shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-50"
        title="Mark done"
      >
        {marking && <span className="text-[10px] text-[var(--color-accent)]">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--color-foreground-strong)] truncate">{task.title}</p>
        {task.context && (
          <p className="text-[10px] text-[var(--color-muted)] truncate mt-0.5">{task.context}</p>
        )}
      </div>
      <span
        className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
        style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}
      >
        {task.priority}
      </span>
    </div>
  );
}

function CompactStat({ label, value, sub, alert }: { label: string; value: number | string; sub?: string; alert?: boolean }) {
  return (
    <div className="px-4 py-3 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">{label}</p>
      <p className={`text-lg font-semibold ${alert ? 'text-amber-400' : 'text-[var(--color-foreground-strong)]'}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[var(--color-muted)]">{sub}</p>}
    </div>
  );
}
