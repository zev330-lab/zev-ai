'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string; name: string; client: string; status: string; description: string;
  tola_node: string; start_date: string; target_end_date: string | null;
  totalMilestones: number; completeMilestones: number; totalHours: number;
  hoursThisWeek: number; hasOverdue: boolean;
  created_at: string; updated_at: string;
  deployed_url: string | null; github_url: string | null;
  tech_stack: string[] | null; last_commit_message: string | null;
}

interface Milestone {
  id: string; project_id: string; title: string; description: string;
  status: string; due_date: string | null; completed_at: string | null; sort_order: number;
}

interface TimeEntry {
  id: string; project_id: string; description: string; hours: number;
  date: string; billable: boolean; hourly_rate: number | null; created_at: string;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Active' },
  paused: { bg: 'rgba(250,204,21,0.15)', text: '#facc15', label: 'Paused' },
  completed: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Completed' },
  archived: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', label: 'Archived' },
};

const MS_BADGE: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' },
  in_progress: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
  complete: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
  blocked: { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
};

const FILTERS = ['all', 'active', 'paused', 'completed'] as const;

const TODAY = new Date().toISOString().slice(0, 10);

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ project: Project; milestones: Milestone[]; entries: TimeEntry[] } | null>(null);
  const [showLogTime, setShowLogTime] = useState(false);
  const [logForm, setLogForm] = useState({ project_id: '', hours: '', description: '', billable: true, date: TODAY });
  const [showAddMs, setShowAddMs] = useState(false);
  const [msForm, setMsForm] = useState({ title: '', due_date: '', description: '' });
  // Track whether the quick-log fab was opened without a pre-selected project
  const [quickLog, setQuickLog] = useState(false);

  const fetchProjects = useCallback(async () => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    const res = await fetch(`/api/admin/projects${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (Array.isArray(data)) setProjects(data);
    setLoading(false);
  }, [filter, router]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const fetchDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/projects?id=${id}`);
    if (res.ok) { const d = await res.json(); setDetail(d); }
  }, []);

  useEffect(() => { if (selected) fetchDetail(selected); }, [selected, fetchDetail]);

  const openQuickLog = () => {
    setQuickLog(true);
    setLogForm({ project_id: projects[0]?.id || '', hours: '', description: '', billable: true, date: TODAY });
    setShowLogTime(true);
  };

  const openDetailLog = () => {
    setQuickLog(false);
    setLogForm({ project_id: selected || projects[0]?.id || '', hours: '', description: '', billable: true, date: TODAY });
    setShowLogTime(true);
  };

  const logTime = async () => {
    if (!logForm.project_id || !logForm.hours) return;
    await fetch('/api/admin/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _type: 'time_entry',
        project_id: logForm.project_id,
        hours: parseFloat(logForm.hours),
        description: logForm.description,
        billable: logForm.billable,
        date: logForm.date || TODAY,
      }),
    });
    setShowLogTime(false);
    setLogForm({ project_id: '', hours: '', description: '', billable: true, date: TODAY });
    fetchProjects();
    if (selected) fetchDetail(selected);
  };

  const addMilestone = async () => {
    if (!selected || !msForm.title) return;
    await fetch('/api/admin/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'milestone', project_id: selected, title: msForm.title, due_date: msForm.due_date || null, description: msForm.description }),
    });
    setShowAddMs(false);
    setMsForm({ title: '', due_date: '', description: '' });
    fetchDetail(selected);
  };

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    await fetch('/api/admin/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, _type: 'milestone', ...updates }) });
    if (selected) fetchDetail(selected);
  };

  // Derived stats — computed inline, no useMemo
  const activeCount = projects.filter((p) => p.status === 'active').length;
  const totalHoursAll = projects.reduce((s, p) => s + p.totalHours, 0);
  const totalMsComplete = projects.reduce((s, p) => s + p.completeMilestones, 0);
  const totalMsAll = projects.reduce((s, p) => s + p.totalMilestones, 0);
  const hoursThisWeek = projects.reduce((s, p) => s + (p.hoursThisWeek || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Projects</h1>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {activeCount} active &middot; {totalHoursAll.toFixed(1)}h total
            </p>
          </div>
          <button
            onClick={openQuickLog}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 cursor-pointer"
          >
            Log Time
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Active Projects" value={String(activeCount)} />
          <MiniStat label="Hours This Week" value={hoursThisWeek.toFixed(1)} accent />
          <MiniStat label="Milestones Done" value={String(totalMsComplete)} />
          <MiniStat label="Total Milestones" value={String(totalMsAll)} />
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden w-fit">
          {FILTERS.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-[11px] font-medium capitalize cursor-pointer ${filter === s ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-admin-surface)] text-[var(--color-muted-light)] hover:bg-[var(--color-admin-border)]'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Project cards */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-[var(--color-muted)] py-12 text-center">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-[var(--color-muted)]">No projects found.</p>
            <p className="text-xs text-[var(--color-muted)]/60 mt-1">Change the filter above or create your first project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const badge = STATUS_BADGE[p.status] || STATUS_BADGE.active;
              const pct = p.totalMilestones > 0 ? Math.round((p.completeMilestones / p.totalMilestones) * 100) : 0;
              // Progress bar color: green when complete, amber when partially done, muted when zero
              const barColor = pct === 100 ? '#4ade80' : pct > 0 ? '#7c9bf5' : 'var(--color-admin-border)';
              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5 cursor-pointer hover:border-[var(--color-accent)]/30 transition-colors relative overflow-hidden"
                  style={p.hasOverdue ? { borderLeftColor: '#f87171', borderLeftWidth: 3 } : {}}
                >
                  {/* Overdue indicator dot */}
                  {p.hasOverdue && (
                    <span
                      title="Has overdue milestone"
                      className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400"
                      style={{ display: 'block' }}
                    />
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] truncate pr-4">{p.name}</h3>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">{p.client}</p>
                  {p.description && <p className="text-[11px] text-[var(--color-muted-light)] mt-1 line-clamp-2 leading-relaxed">{p.description}</p>}

                  {/* Milestone progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[var(--color-muted)]">
                        {p.completeMilestones}/{p.totalMilestones} milestones
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: barColor }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-admin-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--color-muted)]">
                    <span>{p.totalHours.toFixed(1)}h total</span>
                    {(p.hoursThisWeek || 0) > 0 && (
                      <span className="text-[var(--color-accent)]">{p.hoursThisWeek.toFixed(1)}h this week</span>
                    )}
                    {p.hasOverdue && (
                      <span className="text-red-400 font-medium">overdue</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Log Time FAB — bottom-right floating */}
      <button
        onClick={openQuickLog}
        title="Quick Log Time"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[var(--color-accent)] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        style={{ boxShadow: '0 4px 24px rgba(124,155,245,0.35)' }}
      >
        {/* Clock icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {/* Project Detail Slide-out */}
      {selected && detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => { setSelected(null); setDetail(null); }} />
          <div className="w-full max-w-2xl bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--color-admin-border)]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-[var(--color-foreground-strong)]">{detail.project.name}</h2>
                <button onClick={() => { setSelected(null); setDetail(null); }} className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] text-xl cursor-pointer">&times;</button>
              </div>
              <p className="text-xs text-[var(--color-muted)]">{detail.project.client} &middot; {detail.project.tola_node} node</p>
              {/* Description */}
              {detail.project.description && (
                <p className="text-sm text-[var(--color-muted-light)] mt-2 leading-relaxed">{detail.project.description}</p>
              )}
              {/* Links */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {detail.project.deployed_url && (
                  <a href={detail.project.deployed_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-accent)] hover:underline">🌐 {detail.project.deployed_url.replace(/^https?:\/\//, '')}</a>
                )}
                {detail.project.github_url && (
                  <a href={detail.project.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-muted-light)]">⌥ GitHub</a>
                )}
              </div>
              {/* Tech stack */}
              {detail.project.tech_stack && detail.project.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {detail.project.tech_stack.map((t) => (
                    <span key={t} className="text-[9px] bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded px-1.5 py-0.5 text-[var(--color-muted)]">{t}</span>
                  ))}
                </div>
              )}
              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-muted)]">
                <span>{detail.project.totalHours.toFixed(1)}h logged</span>
                <span>{detail.project.completeMilestones}/{detail.project.totalMilestones} milestones done</span>
                {(detail.project.hoursThisWeek || 0) > 0 && <span className="text-[var(--color-accent)]">{detail.project.hoursThisWeek.toFixed(1)}h this week</span>}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => setShowAddMs(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)]/20 text-[var(--color-accent)] cursor-pointer">Add Milestone</button>
                <button onClick={openDetailLog} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-400 cursor-pointer">Log Time</button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Milestones */}
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Milestones</p>
                {detail.milestones.length === 0 ? <p className="text-xs text-[var(--color-muted)]">No milestones yet.</p> : (
                  <div className="space-y-2">
                    {detail.milestones.map((m) => {
                      const mb = MS_BADGE[m.status] || MS_BADGE.pending;
                      const isOverdue = m.status !== 'complete' && m.due_date && m.due_date < TODAY;
                      return (
                        <div key={m.id} className="flex items-start gap-3 p-3 bg-[var(--color-admin-bg)] rounded-lg" style={isOverdue ? { borderLeft: '2px solid #f87171' } : {}}>
                          <button onClick={() => updateMilestone(m.id, { status: m.status === 'complete' ? 'pending' : 'complete', completed_at: m.status === 'complete' ? null : new Date().toISOString() })} className="mt-0.5 w-4 h-4 rounded border border-[var(--color-admin-border)] flex items-center justify-center shrink-0 cursor-pointer" style={m.status === 'complete' ? { backgroundColor: '#4ade80', borderColor: '#4ade80' } : {}}>
                            {m.status === 'complete' && <span className="text-[10px] text-white">&#10003;</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${m.status === 'complete' ? 'text-[var(--color-muted)] line-through' : 'text-[var(--color-foreground-strong)]'}`}>{m.title}</p>
                            {m.due_date && (
                              <p className={`text-[10px] mt-0.5 ${isOverdue ? 'text-red-400' : 'text-[var(--color-muted)]'}`}>
                                {isOverdue ? 'Overdue · ' : ''}{new Date(m.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <span className="inline-block px-1.5 py-0.5 text-[9px] font-medium rounded-full shrink-0" style={{ backgroundColor: mb.bg, color: mb.text }}>{m.status.replace('_', ' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Time log */}
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Time Log</p>
                {detail.entries.length === 0 ? <p className="text-xs text-[var(--color-muted)]">No time logged yet.</p> : (
                  <div className="space-y-1">
                    {detail.entries.slice(0, 20).map((e) => (
                      <div key={e.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-[var(--color-admin-border)]/30">
                        <span className="text-[var(--color-foreground-strong)] w-12">{Number(e.hours).toFixed(1)}h</span>
                        <span className="text-[var(--color-muted-light)] flex-1 truncate">{e.description || '--'}</span>
                        {e.billable && <span className="text-[10px] text-green-400">$</span>}
                        <span className="text-[var(--color-muted)] w-16 text-right">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Time Modal */}
      {showLogTime && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-1">
              {quickLog ? 'Quick Log Time' : 'Log Time'}
            </h3>
            {quickLog && (
              <p className="text-[11px] text-[var(--color-muted)] mb-4">Fast entry — no need to open a project first.</p>
            )}
            {!quickLog && <div className="mb-4" />}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Project</label>
                <select
                  value={logForm.project_id}
                  onChange={(e) => setLogForm({ ...logForm, project_id: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Hours</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={logForm.hours}
                  onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                  placeholder="1.5"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Description</label>
                <input
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                  placeholder="What did you work on?"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Date</label>
                <input
                  type="date"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={logForm.billable} onChange={(e) => setLogForm({ ...logForm, billable: e.target.checked })} className="accent-[var(--color-accent)]" />
                <span className="text-xs text-[var(--color-muted-light)]">Billable</span>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={logTime} className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Save</button>
              <button onClick={() => setShowLogTime(false)} className="px-4 py-2 text-xs text-[var(--color-muted)] cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddMs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-4">Add Milestone</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Title</label>
                <input value={msForm.title} onChange={(e) => setMsForm({ ...msForm, title: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" autoFocus />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Due Date</label>
                <input type="date" value={msForm.due_date} onChange={(e) => setMsForm({ ...msForm, due_date: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addMilestone} className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Add</button>
              <button onClick={() => setShowAddMs(false)} className="px-4 py-2 text-xs text-[var(--color-muted)] cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground-strong)]'}`}>{value}</p>
    </div>
  );
}
