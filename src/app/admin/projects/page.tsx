'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string; name: string; client: string; status: string; description: string;
  tola_node: string; start_date: string; target_end_date: string | null;
  totalMilestones: number; completeMilestones: number; totalHours: number;
  hoursThisWeek: number; hasOverdue: boolean;
  created_at: string; updated_at: string;
  // Workspace sync fields
  github_url: string | null; deployed_url: string | null; local_path: string | null;
  tech_stack: string[] | null; last_commit_date: string | null;
  last_commit_message: string | null; git_branch: string | null;
  readme_summary: string | null; workspace_dir: string | null; synced_at: string | null;
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

const TECH_COLORS: Record<string, string> = {
  'Next.js': '#60a5fa', 'React': '#61dafb', 'TypeScript': '#3178c6',
  'Tailwind': '#38bdf8', 'Supabase': '#3ecf8e', 'Claude API': '#c4b5e0',
  'Framer Motion': '#e879f9', 'Python': '#ffd43b', 'HTML/CSS/JS': '#f59e0b',
  'Recharts': '#8884d8', 'React Flow': '#ff6b6b', 'Resend': '#4ade80',
  'Prisma': '#2d3748', 'Express': '#68a063',
};

const FILTERS = ['all', 'active', 'paused', 'completed', 'archived'] as const;
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
  const [quickLog, setQuickLog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number; scanned: number } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', client: '', description: '', status: 'active' });
  const [detailTab, setDetailTab] = useState<'overview' | 'milestones' | 'time'>('overview');

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

  useEffect(() => { if (selected) { setDetailTab('overview'); fetchDetail(selected); } }, [selected, fetchDetail]);

  const syncWorkspace = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/projects/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ created: data.created, updated: data.updated, scanned: data.scanned });
        fetchProjects();
      } else {
        setSyncResult(null);
        alert(data.error || 'Sync failed');
      }
    } catch {
      alert('Sync failed — check console');
    } finally {
      setSyncing(false);
    }
  };

  const createProject = async () => {
    if (!createForm.name) return;
    await fetch('/api/admin/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    setShowCreate(false);
    setCreateForm({ name: '', client: '', description: '', status: 'active' });
    fetchProjects();
  };

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
      body: JSON.stringify({ _type: 'time_entry', project_id: logForm.project_id, hours: parseFloat(logForm.hours), description: logForm.description, billable: logForm.billable, date: logForm.date || TODAY }),
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

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const totalHoursAll = projects.reduce((s, p) => s + p.totalHours, 0);
  const totalMsComplete = projects.reduce((s, p) => s + p.completeMilestones, 0);
  const totalMsAll = projects.reduce((s, p) => s + p.totalMilestones, 0);
  const hoursThisWeek = projects.reduce((s, p) => s + (p.hoursThisWeek || 0), 0);

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Projects</h1>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {activeCount} active &middot; {totalHoursAll.toFixed(1)}h total &middot; {projects.length} projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncWorkspace}
              disabled={syncing}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-admin-border)] text-[var(--color-muted-light)] hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
              title="Scan ~/dev/ and sync projects"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={syncing ? 'animate-spin' : ''}>
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              {syncing ? 'Syncing...' : 'Sync Workspace'}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-admin-border)] text-[var(--color-muted-light)] hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] cursor-pointer transition-colors"
            >
              + New
            </button>
            <button
              onClick={openQuickLog}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 cursor-pointer"
            >
              Log Time
            </button>
          </div>
        </div>
        {/* Sync result toast */}
        {syncResult && (
          <div className="mt-3 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
            <p className="text-xs text-green-400">
              Scanned {syncResult.scanned} directories &middot; {syncResult.created} new &middot; {syncResult.updated} updated
            </p>
            <button onClick={() => setSyncResult(null)} className="text-green-400/60 hover:text-green-400 text-sm cursor-pointer">&times;</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MiniStat label="Active Projects" value={String(activeCount)} />
          <MiniStat label="Hours This Week" value={hoursThisWeek.toFixed(1)} accent />
          <MiniStat label="Milestones Done" value={String(totalMsComplete)} />
          <MiniStat label="Total Milestones" value={String(totalMsAll)} />
          <MiniStat label="Total Projects" value={String(projects.length)} />
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
            </div>
            <p className="text-sm text-[var(--color-muted-light)] mb-2">No projects found</p>
            <p className="text-xs text-[var(--color-muted)] mb-4">Sync from your workspace or create a new project.</p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={syncWorkspace} className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 cursor-pointer">Sync Workspace</button>
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--color-admin-border)] text-[var(--color-muted-light)] hover:border-[var(--color-accent)]/30 cursor-pointer">Create Manually</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const badge = STATUS_BADGE[p.status] || STATUS_BADGE.active;
              const pct = p.totalMilestones > 0 ? Math.round((p.completeMilestones / p.totalMilestones) * 100) : 0;
              const barColor = pct === 100 ? '#4ade80' : pct > 0 ? '#7c9bf5' : 'var(--color-admin-border)';
              const techStack = p.tech_stack || [];
              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5 cursor-pointer hover:border-[var(--color-accent)]/30 transition-colors relative overflow-hidden group"
                  style={p.hasOverdue ? { borderLeftColor: '#f87171', borderLeftWidth: 3 } : {}}
                >
                  {p.hasOverdue && (
                    <span title="Has overdue milestone" className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400" />
                  )}

                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] truncate pr-4">{p.name}</h3>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">{p.client}</p>
                  {p.description && <p className="text-[11px] text-[var(--color-muted-light)] mt-1 line-clamp-2 leading-relaxed">{p.description}</p>}

                  {/* Tech stack tags */}
                  {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {techStack.slice(0, 5).map((tech) => (
                        <span key={tech} className="px-1.5 py-0.5 text-[9px] font-medium rounded" style={{ backgroundColor: `${TECH_COLORS[tech] || '#6b7280'}20`, color: TECH_COLORS[tech] || '#9ca3af' }}>
                          {tech}
                        </span>
                      ))}
                      {techStack.length > 5 && (
                        <span className="px-1.5 py-0.5 text-[9px] text-[var(--color-muted)] rounded bg-[var(--color-admin-bg)]">+{techStack.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Last commit */}
                  {p.last_commit_message && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[var(--color-muted)]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><line x1="1.05" y1="12" x2="7" y2="12" /><line x1="17.01" y1="12" x2="22.96" y2="12" /></svg>
                      <span className="truncate flex-1">{p.last_commit_message}</span>
                      {p.last_commit_date && <span className="shrink-0 text-[var(--color-muted)]">{timeAgo(p.last_commit_date)}</span>}
                    </div>
                  )}

                  {/* Milestone progress bar */}
                  {p.totalMilestones > 0 && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[var(--color-muted)]">
                          {p.completeMilestones}/{p.totalMilestones} milestones
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: barColor }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--color-admin-border)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                    </div>
                  )}

                  {/* Bottom row: hours + links */}
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
                    <div className="flex items-center gap-3">
                      {p.totalHours > 0 && <span>{p.totalHours.toFixed(1)}h total</span>}
                      {(p.hoursThisWeek || 0) > 0 && (
                        <span className="text-[var(--color-accent)]">{p.hoursThisWeek.toFixed(1)}h this week</span>
                      )}
                      {p.hasOverdue && <span className="text-red-400 font-medium">overdue</span>}
                      {p.git_branch && p.git_branch !== 'main' && p.git_branch !== 'master' && (
                        <span className="text-purple-400">{p.git_branch}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.deployed_url && (
                        <a href={p.deployed_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="text-[var(--color-accent)] hover:text-white" title="Open deployed site">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                      )}
                      {p.github_url && (
                        <a href={p.github_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="text-[var(--color-muted-light)] hover:text-white" title="Open GitHub">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Log Time FAB */}
      <button
        onClick={openQuickLog}
        title="Quick Log Time"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[var(--color-accent)] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        style={{ boxShadow: '0 4px 24px rgba(124,155,245,0.35)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
      </button>

      {/* Project Detail Slide-out */}
      {selected && detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => { setSelected(null); setDetail(null); }} />
          <div className="w-full max-w-2xl bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
            {/* Detail header */}
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

              {/* Quick info row */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {detail.project.deployed_url && (
                  <a href={detail.project.deployed_url} target="_blank" rel="noopener" className="text-[11px] text-[var(--color-accent)] hover:underline flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    {detail.project.deployed_url.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {detail.project.github_url && (
                  <a href={detail.project.github_url} target="_blank" rel="noopener" className="text-[11px] text-[var(--color-muted-light)] hover:underline flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                    GitHub
                  </a>
                )}
                {detail.project.git_branch && (
                  <span className="text-[11px] text-purple-400 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
                    {detail.project.git_branch}
                  </span>
                )}
                {detail.project.last_commit_date && (
                  <span className="text-[11px] text-[var(--color-muted)]">
                    Last commit {timeAgo(detail.project.last_commit_date)}
                  </span>
                )}
              </div>

              {/* Tech stack */}
              {(detail.project.tech_stack || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(detail.project.tech_stack || []).map((tech) => (
                    <span key={tech} className="px-2 py-0.5 text-[10px] font-medium rounded" style={{ backgroundColor: `${TECH_COLORS[tech] || '#6b7280'}20`, color: TECH_COLORS[tech] || '#9ca3af' }}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => setShowAddMs(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)]/20 text-[var(--color-accent)] cursor-pointer">Add Milestone</button>
                <button onClick={openDetailLog} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-400 cursor-pointer">Log Time</button>
              </div>
            </div>

            {/* Detail tabs */}
            <div className="px-6 py-2 border-b border-[var(--color-admin-border)] flex gap-4">
              {(['overview', 'milestones', 'time'] as const).map((tab) => (
                <button key={tab} onClick={() => setDetailTab(tab)} className={`text-xs py-2 capitalize cursor-pointer border-b-2 transition-colors ${detailTab === tab ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'}`}>{tab}</button>
              ))}
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Overview tab */}
              {detailTab === 'overview' && (
                <>
                  {/* Description / README summary */}
                  {(detail.project.readme_summary || detail.project.description) && (
                    <div>
                      <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">About</p>
                      <p className="text-sm text-[var(--color-muted-light)] leading-relaxed">{detail.project.readme_summary || detail.project.description}</p>
                    </div>
                  )}

                  {/* Last commit */}
                  {detail.project.last_commit_message && (
                    <div>
                      <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">Last Commit</p>
                      <div className="p-3 bg-[var(--color-admin-bg)] rounded-lg">
                        <p className="text-sm text-[var(--color-foreground-strong)]">{detail.project.last_commit_message}</p>
                        <p className="text-[10px] text-[var(--color-muted)] mt-1">
                          {detail.project.last_commit_date ? new Date(detail.project.last_commit_date).toLocaleString() : ''} &middot; {detail.project.git_branch}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[var(--color-admin-bg)] rounded-lg text-center">
                      <p className="text-lg font-semibold text-[var(--color-foreground-strong)]">{detail.project.totalHours.toFixed(1)}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">Hours Logged</p>
                    </div>
                    <div className="p-3 bg-[var(--color-admin-bg)] rounded-lg text-center">
                      <p className="text-lg font-semibold text-[var(--color-foreground-strong)]">{detail.milestones.length}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">Milestones</p>
                    </div>
                    <div className="p-3 bg-[var(--color-admin-bg)] rounded-lg text-center">
                      <p className="text-lg font-semibold text-[var(--color-foreground-strong)]">{detail.entries.length}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">Time Entries</p>
                    </div>
                  </div>
                </>
              )}

              {/* Milestones tab */}
              {detailTab === 'milestones' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)]">Milestones</p>
                    <button onClick={() => setShowAddMs(true)} className="text-[10px] text-[var(--color-accent)] hover:underline cursor-pointer">+ Add</button>
                  </div>
                  {detail.milestones.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-[var(--color-muted)]">No milestones yet.</p>
                      <button onClick={() => setShowAddMs(true)} className="mt-2 text-xs text-[var(--color-accent)] hover:underline cursor-pointer">Add your first milestone</button>
                    </div>
                  ) : (
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
                              {m.description && <p className="text-[11px] text-[var(--color-muted)] mt-0.5">{m.description}</p>}
                              {m.due_date && (
                                <p className={`text-[10px] mt-0.5 ${isOverdue ? 'text-red-400' : 'text-[var(--color-muted)]'}`}>
                                  {isOverdue ? 'Overdue - ' : ''}{new Date(m.due_date).toLocaleDateString()}
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
              )}

              {/* Time log tab */}
              {detailTab === 'time' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)]">Time Log</p>
                    <button onClick={openDetailLog} className="text-[10px] text-[var(--color-accent)] hover:underline cursor-pointer">+ Log Time</button>
                  </div>
                  {detail.entries.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-[var(--color-muted)]">No time logged yet.</p>
                      <button onClick={openDetailLog} className="mt-2 text-xs text-[var(--color-accent)] hover:underline cursor-pointer">Log your first entry</button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {detail.entries.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 text-xs py-2 border-b border-[var(--color-admin-border)]/30">
                          <span className="text-[var(--color-foreground-strong)] w-12 font-medium">{Number(e.hours).toFixed(1)}h</span>
                          <span className="text-[var(--color-muted-light)] flex-1 truncate">{e.description || '--'}</span>
                          {e.billable && <span className="text-[10px] text-green-400 font-medium">$</span>}
                          <span className="text-[var(--color-muted)] w-20 text-right">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Time Modal */}
      {showLogTime && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-1">{quickLog ? 'Quick Log Time' : 'Log Time'}</h3>
            {quickLog && <p className="text-[11px] text-[var(--color-muted)] mb-4">Fast entry — no need to open a project first.</p>}
            {!quickLog && <div className="mb-4" />}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Project</label>
                <select value={logForm.project_id} onChange={(e) => setLogForm({ ...logForm, project_id: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]">
                  <option value="">Select project...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Hours</label>
                <input type="number" step="0.25" min="0" value={logForm.hours} onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" placeholder="1.5" autoFocus />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Description</label>
                <input value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" placeholder="What did you work on?" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Date</label>
                <input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" />
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
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Description</label>
                <input value={msForm.description} onChange={(e) => setMsForm({ ...msForm, description: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" placeholder="Optional details" />
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

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-4">New Project</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Name</label>
                <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" autoFocus placeholder="Project name" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Client</label>
                <input value={createForm.client} onChange={(e) => setCreateForm({ ...createForm, client: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" placeholder="Client name or Internal" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Description</label>
                <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] resize-none" rows={3} placeholder="Brief description" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Status</label>
                <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createProject} className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs text-[var(--color-muted)] cursor-pointer">Cancel</button>
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
