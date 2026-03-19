'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownContent, ResearchBriefView } from '@/components/admin/markdown-content';

interface Discovery {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  business_overview: string | null;
  team_size: string | null;
  pain_points: string | null;
  repetitive_work: string | null;
  ai_experience: string | null;
  ai_tools_detail: string | null;
  magic_wand: string | null;
  success_vision: string | null;
  anything_else: string | null;
  status: string;
  notes: string | null;
  research_brief: Record<string, unknown> | null;
  assessment_doc: string | null;
  meeting_prep_doc: string | null;
  pipeline_status: string | null;
  pipeline_error: string | null;
  pipeline_completed_at: string | null;
  pipeline_step_completed_at: string | null;
  pipeline_started_at: string | null;
  pipeline_retry_count: number | null;
  progress_pct: number;
}

const PIPELINE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: 'Queued' },
  researching: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Researching' },
  scoping: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: 'Scoping' },
  synthesizing: { bg: 'rgba(251,146,60,0.15)', text: '#fb923c', label: 'Preparing' },
  complete: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Complete' },
  failed: { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Failed' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: 'New' },
  reviewed: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Reviewed' },
  meeting_scheduled: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: 'Meeting Scheduled' },
  proposal_sent: { bg: 'rgba(129,140,248,0.15)', text: '#818cf8', label: 'Proposal Sent' },
  engaged: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Engaged' },
  archived: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', label: 'Archived' },
};

type SortKey = 'name' | 'company' | 'pipeline_status' | 'progress_pct' | 'created_at';
type SortDir = 'asc' | 'desc';

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function stageName(status: string | null): string {
  return PIPELINE_BADGE[status || '']?.label ?? 'New';
}

export default function AdminDiscoveriesPage() {
  const router = useRouter();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Discovery | null>(null);
  const [notes, setNotes] = useState('');
  const [detailTab, setDetailTab] = useState<'overview' | 'research' | 'assessment' | 'meeting'>('overview');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchDiscoveries = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/discoveries?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (Array.isArray(data)) setDiscoveries(data);
    setLoading(false);
  }, [filter, search, router]);

  useEffect(() => { fetchDiscoveries(); }, [fetchDiscoveries]);

  // Auto-refresh when active pipelines exist
  useEffect(() => {
    const hasActive = discoveries.some(
      (d) => d.pipeline_status && !['complete', 'failed'].includes(d.pipeline_status)
    );
    if (!hasActive) return;
    const interval = setInterval(fetchDiscoveries, 10000);
    return () => clearInterval(interval);
  }, [discoveries, fetchDiscoveries]);

  const sorted = useMemo(() => {
    return [...discoveries].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = (a.name || '').localeCompare(b.name || ''); break;
        case 'company': cmp = (a.company || '').localeCompare(b.company || ''); break;
        case 'pipeline_status': cmp = (a.pipeline_status || '').localeCompare(b.pipeline_status || ''); break;
        case 'progress_pct': cmp = (a.progress_pct || 0) - (b.progress_pct || 0); break;
        case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [discoveries, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const updateDiscovery = async (id: string, updates: Partial<Discovery>) => {
    await fetch('/api/admin/discoveries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchDiscoveries();
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  };

  const openDetail = (d: Discovery) => {
    setSelected(d);
    setNotes(d.notes || '');
    setDetailTab('overview');
    if (d.status === 'new') {
      updateDiscovery(d.id, { status: 'reviewed' });
    }
  };

  const triggerPipeline = async (id: string) => {
    await fetch('/api/admin/agents/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: 'pipeline-guardian', discovery_id: id }),
    });
    fetchDiscoveries();
  };

  const rerunPipeline = async (id: string) => {
    await fetch('/api/admin/discoveries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        pipeline_status: 'pending',
        pipeline_error: null,
        research_brief: null,
        assessment_doc: null,
        meeting_prep_doc: null,
        pipeline_completed_at: null,
        progress_pct: 0,
      }),
    });
    await triggerPipeline(id);
    if (selected?.id === id) {
      setSelected((prev) =>
        prev ? { ...prev, pipeline_status: 'pending', pipeline_error: null, progress_pct: 0 } : prev
      );
    }
  };

  const deleteDiscovery = async (id: string) => {
    if (!confirm('Delete this discovery permanently?')) return;
    await fetch('/api/admin/discoveries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSelected(null);
    fetchDiscoveries();
  };

  const scheduleCalendarUrl = (d: Discovery) => {
    const text = encodeURIComponent(`Discovery Call${d.company ? ` - ${d.company}` : ''}`);
    const details = encodeURIComponent(
      `Meeting with ${d.name}${d.email ? `\nEmail: ${d.email}` : ''}${d.company ? `\nCompany: ${d.company}` : ''}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
  };

  const FILTERS = ['all', 'new', 'reviewed', 'meeting_scheduled', 'proposal_sent', 'engaged', 'archived'] as const;

  const detailFields: { label: string; key: keyof Discovery }[] = [
    { label: 'Email', key: 'email' },
    { label: 'Company', key: 'company' },
    { label: 'Role', key: 'role' },
    { label: 'Business Overview', key: 'business_overview' },
    { label: 'Team Size', key: 'team_size' },
    { label: 'Pain Points', key: 'pain_points' },
    { label: 'Repetitive Work', key: 'repetitive_work' },
    { label: 'AI Experience', key: 'ai_experience' },
    { label: 'AI Tools Detail', key: 'ai_tools_detail' },
    { label: 'Magic Wand', key: 'magic_wand' },
    { label: 'Success Vision', key: 'success_vision' },
    { label: 'Anything Else', key: 'anything_else' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)] shrink-0">
        <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Discoveries</h1>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          {discoveries.length} total &middot;{' '}
          {discoveries.filter((d) => d.pipeline_status && !['complete', 'failed'].includes(d.pipeline_status)).length} in pipeline
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden">
          {FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filter === s
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-admin-surface)] text-[var(--color-muted-light)] hover:bg-[var(--color-admin-border)]'
              }`}
            >
              {STATUS_BADGE[s]?.label || 'All'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search name, company, role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg text-[var(--color-foreground-strong)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-64"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-[var(--color-muted)] py-12 text-center">Loading...</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] py-12 text-center">No discoveries found.</p>
        ) : (
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-admin-border)]">
                  <SortHeader label="Name" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Company" sortKey="company" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Status" sortKey="pipeline_status" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Progress" sortKey="progress_pct" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Date" sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => openDetail(d)}
                    className={`border-b border-[var(--color-admin-border)]/50 cursor-pointer transition-colors hover:bg-[var(--color-admin-border)]/30 ${
                      d.status === 'new' ? 'font-medium' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-[var(--color-foreground-strong)]">{d.name}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-light)]">{d.company || '--'}</td>
                    <td className="px-4 py-3">
                      <PipelineBadge status={d.pipeline_status} />
                    </td>
                    <td className="px-4 py-3 w-44">
                      <ProgressBar
                        pct={d.progress_pct || 0}
                        status={d.pipeline_status}
                        stepCompletedAt={d.pipeline_step_completed_at}
                        startedAt={d.pipeline_started_at}
                      />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)] whitespace-nowrap text-xs">
                      {relativeDate(d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail slide-out */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-2xl bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--color-admin-border)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[var(--color-foreground-strong)]">{selected.name}</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] text-xl leading-none cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <PipelineBadge status={selected.pipeline_status} />
                <StatusBadge status={selected.status} />
                <span className="text-xs text-[var(--color-muted)]">
                  {stageName(selected.pipeline_status)} &middot; {selected.progress_pct}%
                </span>
                {selected.pipeline_error && (
                  <span className="text-xs text-red-400">Error: {selected.pipeline_error}</span>
                )}
              </div>
              {/* Progress bar */}
              <div className="mb-4">
                <ProgressBar
                  pct={selected.progress_pct || 0}
                  status={selected.pipeline_status}
                  stepCompletedAt={selected.pipeline_step_completed_at}
                  startedAt={selected.pipeline_started_at}
                  large
                />
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {(!selected.pipeline_status || selected.pipeline_status === 'pending') && (
                  <button
                    onClick={() => triggerPipeline(selected.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Run Pipeline
                  </button>
                )}
                {selected.pipeline_status && selected.pipeline_status !== 'pending' && (
                  <button
                    onClick={() => rerunPipeline(selected.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-muted-light)] text-[var(--color-admin-bg)] hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Re-run Pipeline
                  </button>
                )}
                <a
                  href={scheduleCalendarUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  Schedule Meeting
                </a>
                <button
                  onClick={() => deleteDiscovery(selected.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-admin-border)]">
              {(['overview', 'research', 'assessment', 'meeting'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                    detailTab === tab
                      ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'
                  }`}
                >
                  {tab === 'meeting' ? 'Meeting Prep' : tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="px-6 py-5">
              {detailTab === 'overview' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
                      Submitted
                    </p>
                    <p className="text-sm text-[var(--color-muted-light)]">
                      {formatDate(selected.created_at)}
                    </p>
                  </div>
                  {detailFields.map(({ label, key }) => {
                    const val = selected[key];
                    if (!val) return null;
                    const strVal = String(val);
                    return (
                      <div key={key}>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
                          {label}
                        </p>
                        <p className="text-sm text-[var(--color-muted-light)] whitespace-pre-wrap leading-relaxed">
                          {strVal}
                          {key === 'email' && (
                            <a
                              href={`mailto:${strVal}`}
                              className="text-[var(--color-accent)] hover:underline text-sm ml-2"
                            >
                              Reply
                            </a>
                          )}
                        </p>
                      </div>
                    );
                  })}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
                      Status
                    </p>
                    <select
                      value={selected.status}
                      onChange={(e) => updateDiscovery(selected.id, { status: e.target.value })}
                      className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    >
                      {Object.entries(STATUS_BADGE).map(([val, { label }]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
                      Notes
                    </p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={() => updateDiscovery(selected.id, { notes })}
                      placeholder="Add internal notes..."
                      rows={4}
                      className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-muted-light)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-muted)]"
                    />
                  </div>
                </div>
              )}

              {detailTab === 'research' && (
                <div>
                  {selected.research_brief ? (
                    <ResearchBriefView data={selected.research_brief} />
                  ) : (
                    <EmptyState
                      message={
                        selected.pipeline_status === 'researching'
                          ? 'Visionary is researching...'
                          : selected.pipeline_status === 'pending'
                            ? 'Pipeline not started yet.'
                            : 'No research brief available.'
                      }
                      active={selected.pipeline_status === 'researching'}
                    />
                  )}
                </div>
              )}

              {detailTab === 'assessment' && (
                <div>
                  {selected.assessment_doc ? (
                    <MarkdownContent content={selected.assessment_doc} />
                  ) : (
                    <EmptyState
                      message={
                        selected.pipeline_status === 'scoping'
                          ? 'Architect is scoping...'
                          : 'No assessment available.'
                      }
                      active={selected.pipeline_status === 'scoping'}
                    />
                  )}
                </div>
              )}

              {detailTab === 'meeting' && (
                <div>
                  {selected.meeting_prep_doc ? (
                    <MarkdownContent content={selected.meeting_prep_doc} />
                  ) : (
                    <EmptyState
                      message={
                        selected.pipeline_status === 'synthesizing'
                          ? 'Oracle is synthesizing...'
                          : 'No meeting prep available.'
                      }
                      active={selected.pipeline_status === 'synthesizing'}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function SortHeader({
  label,
  sortKey: key,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = current === key;
  return (
    <th
      className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-muted-light)] transition-colors"
      onClick={() => onSort(key)}
    >
      {label}
      {active && (
        <span className="ml-1">{dir === 'asc' ? '\u2191' : '\u2193'}</span>
      )}
    </th>
  );
}

function PipelineBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-[var(--color-muted)]">--</span>;
  const badge = PIPELINE_BADGE[status] || PIPELINE_BADGE.pending;
  return (
    <span
      className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap"
      style={{ backgroundColor: badge.bg, color: badge.text }}
    >
      {badge.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] || STATUS_BADGE.new;
  return (
    <span
      className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap"
      style={{ backgroundColor: badge.bg, color: badge.text }}
    >
      {badge.label}
    </span>
  );
}

function ProgressBar({
  pct,
  status,
  stepCompletedAt,
  startedAt,
  large,
}: {
  pct: number;
  status: string | null;
  stepCompletedAt?: string | null;
  startedAt?: string | null;
  large?: boolean;
}) {
  // Determine staleness based on last activity
  const lastActivity = stepCompletedAt || startedAt;
  const staleMinutes = lastActivity
    ? (Date.now() - new Date(lastActivity).getTime()) / 60000
    : 0;

  let color = '#4ade80'; // green — advancing
  const isActive = status && !['complete', 'failed'].includes(status);

  if (isActive) {
    if (staleMinutes > 5) color = '#ef4444'; // red — stalled
    else if (staleMinutes > 2) color = '#f59e0b'; // yellow — slow
  }

  if (pct === 100 || status === 'complete') color = '#4ade80';
  if (pct === 0 && (!status || status === 'pending')) color = '#6b7280';
  if (status === 'failed') color = '#ef4444';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 bg-[var(--color-admin-border)] rounded-full overflow-hidden ${
          large ? 'h-2' : 'h-1.5'
        }`}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-[var(--color-muted)] w-8 text-right tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

function EmptyState({ message, active }: { message: string; active?: boolean }) {
  return (
    <div className="py-12 text-center">
      {active && (
        <div className="flex justify-center mb-3">
          <div className="w-5 h-5 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
        </div>
      )}
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
    </div>
  );
}
