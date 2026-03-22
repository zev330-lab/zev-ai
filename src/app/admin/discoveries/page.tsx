'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownContent, ResearchBriefView } from '@/components/admin/markdown-content';

interface ProposalData {
  markdown: string;
  generated_at: string;
  model_used: string;
  tokens_used: number;
  include_pricing: boolean;
  prompt_context: string;
}

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
  proposal_data: ProposalData | null;
  include_pricing: boolean;
}

const PIPELINE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: 'Queued' },
  researching: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Researching' },
  scoping: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: 'Scoping' },
  synthesizing: { bg: 'rgba(251,146,60,0.15)', text: '#fb923c', label: 'Preparing' },
  complete: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Complete' },
  failed: { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Failed' },
  stalled: { bg: 'rgba(234,179,8,0.15)', text: '#eab308', label: 'Stalled' },
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
  const [detailTab, setDetailTab] = useState<'overview' | 'research' | 'assessment' | 'meeting' | 'proposal'>('overview');
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptOverride, setPromptOverride] = useState('');
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

  const generateProposal = async (id: string, promptCtx?: string) => {
    setGeneratingProposal(true);
    setProposalError(null);
    try {
      const payload: Record<string, unknown> = { agent: 'pipeline-proposal', discovery_id: id };
      if (promptCtx) payload.prompt_context = promptCtx;
      const res = await fetch('/api/admin/agents/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setProposalError(data.error || 'Failed to generate proposal');
      } else {
        // Refresh to pick up the new proposal_data
        await fetchDiscoveries();
        // Re-fetch the selected discovery
        const updatedRes = await fetch(`/api/admin/discoveries?search=${encodeURIComponent(selected?.name || '')}`);
        const updatedData = await updatedRes.json();
        if (Array.isArray(updatedData)) {
          const updated = updatedData.find((d: Discovery) => d.id === id);
          if (updated) setSelected(updated);
        }
      }
    } catch (err) {
      setProposalError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setGeneratingProposal(false);
      setEditingPrompt(false);
    }
  };

  const togglePricing = async (id: string, includePricing: boolean) => {
    await updateDiscovery(id, { include_pricing: includePricing } as Partial<Discovery>);
  };

  const downloadProposalPDF = (proposal: ProposalData, name: string, company: string | null) => {
    const title = `Proposal - ${company || name}`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head>
<title>${title}</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; line-height: 1.7; font-size: 14px; }
  h1 { font-size: 22px; color: #0a0e1a; border-bottom: 2px solid #7c9bf5; padding-bottom: 8px; margin-top: 32px; }
  h2 { font-size: 18px; color: #1a1a2e; margin-top: 28px; }
  h3 { font-size: 15px; color: #333; margin-top: 20px; }
  ul, ol { padding-left: 24px; }
  li { margin-bottom: 6px; }
  strong { color: #0a0e1a; }
  em { color: #555; }
  code { background: #f0f0f5; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
  pre { background: #f0f0f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
  blockquote { border-left: 3px solid #7c9bf5; margin: 16px 0; padding: 8px 16px; color: #555; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
  @media print { body { margin: 20px; } }
</style>
</head><body>`);

    // Convert markdown to basic HTML
    const html = proposal.markdown
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
        return match.includes('1.') ? `<ol>${match}</ol>` : `<ul>${match}</ul>`;
      })
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hulo])/gm, (line) => line ? `<p>${line}</p>` : '');

    win.document.write(html);
    win.document.write(`<div class="footer">Generated by zev.ai TOLA Framework &middot; ${new Date(proposal.generated_at).toLocaleDateString()}</div>`);
    win.document.write('</body></html>');
    win.document.close();
    setTimeout(() => win.print(), 500);
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
                      <div className="flex items-center gap-1.5">
                        <PipelineBadge status={d.pipeline_status} />
                        {d.proposal_data && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/15 text-purple-400 whitespace-nowrap">
                            Proposal
                          </span>
                        )}
                      </div>
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
                {selected.pipeline_status === 'complete' && !generatingProposal && (
                  <button
                    onClick={() => generateProposal(selected.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors cursor-pointer"
                  >
                    {selected.proposal_data ? 'Regenerate Proposal' : 'Generate Proposal'}
                  </button>
                )}
                {generatingProposal && (
                  <span className="px-3 py-1.5 text-xs font-medium text-purple-400 flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    Generating...
                  </span>
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

            {/* Proposal error */}
            {proposalError && (
              <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20">
                <p className="text-xs text-red-400">Proposal error: {proposalError}</p>
              </div>
            )}

            {/* Pipeline Timeline */}
            <PipelineTimeline discovery={selected} />

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-admin-border)]">
              {(['overview', 'research', 'assessment', 'meeting', 'proposal'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors cursor-pointer relative ${
                    detailTab === tab
                      ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'
                  }`}
                >
                  {tab === 'meeting' ? 'Meeting Prep' : tab}
                  {tab === 'proposal' && selected.proposal_data && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-400" />
                  )}
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

              {detailTab === 'proposal' && (
                <div>
                  {selected.proposal_data ? (
                    <div>
                      {/* Proposal actions bar */}
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <button
                          onClick={() =>
                            downloadProposalPDF(
                              selected.proposal_data!,
                              selected.name,
                              selected.company,
                            )
                          }
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors cursor-pointer"
                        >
                          Download as PDF
                        </button>
                        <button
                          onClick={() => {
                            setEditingPrompt(!editingPrompt);
                            setPromptOverride(selected.proposal_data!.prompt_context || '');
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer"
                        >
                          Edit & Regenerate
                        </button>
                        <label className="flex items-center gap-2 ml-auto cursor-pointer">
                          <span className="text-[10px] text-[var(--color-muted)]">Include pricing</span>
                          <button
                            onClick={() => togglePricing(selected.id, !selected.include_pricing)}
                            className={`relative w-8 h-4 rounded-full transition-colors duration-200 cursor-pointer ${
                              selected.include_pricing !== false
                                ? 'bg-[var(--color-accent)]'
                                : 'bg-[var(--color-admin-border)]'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                                selected.include_pricing !== false
                                  ? 'translate-x-[16px]'
                                  : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </label>
                      </div>

                      {/* Edit & Regenerate panel */}
                      {editingPrompt && (
                        <div className="mb-4 p-4 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg">
                          <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-2">
                            Prompt Context (edit and regenerate)
                          </p>
                          <textarea
                            value={promptOverride}
                            onChange={(e) => setPromptOverride(e.target.value)}
                            rows={10}
                            className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-muted-light)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => generateProposal(selected.id, promptOverride)}
                              disabled={generatingProposal}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                            >
                              {generatingProposal ? 'Generating...' : 'Regenerate'}
                            </button>
                            <button
                              onClick={() => setEditingPrompt(false)}
                              className="px-3 py-1.5 text-xs text-[var(--color-muted)] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Proposal metadata */}
                      <div className="flex items-center gap-3 mb-4 text-[10px] text-[var(--color-muted)]">
                        <span>
                          Generated {new Date(selected.proposal_data.generated_at).toLocaleString()}
                        </span>
                        <span>&middot;</span>
                        <span>{selected.proposal_data.model_used}</span>
                        <span>&middot;</span>
                        <span>{selected.proposal_data.tokens_used.toLocaleString()} tokens</span>
                        {!selected.proposal_data.include_pricing && (
                          <>
                            <span>&middot;</span>
                            <span className="text-amber-400">Pricing omitted</span>
                          </>
                        )}
                      </div>

                      {/* Proposal content */}
                      <MarkdownContent content={selected.proposal_data.markdown} />
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      {generatingProposal ? (
                        <>
                          <div className="flex justify-center mb-3">
                            <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                          </div>
                          <p className="text-sm text-[var(--color-muted)]">
                            Generating proposal...
                          </p>
                        </>
                      ) : selected.pipeline_status === 'complete' ? (
                        <div>
                          <p className="text-sm text-[var(--color-muted)] mb-3">
                            Pipeline complete. Ready to generate a proposal.
                          </p>
                          <button
                            onClick={() => generateProposal(selected.id)}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-500 text-white hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Generate Proposal
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--color-muted)]">
                          Complete the assessment pipeline first to generate a proposal.
                        </p>
                      )}
                    </div>
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

// Pipeline stage definitions — ordered journey from submission to completion
const PIPELINE_STAGES: {
  key: string;
  label: string;
  agent: string;
  minPct: number;
  maxPct: number;
}[] = [
  { key: 'submitted',   label: 'Submitted',   agent: '',          minPct: 0,   maxPct: 0   },
  { key: 'pending',     label: 'Queued',       agent: 'Guardian',  minPct: 0,   maxPct: 10  },
  { key: 'researching', label: 'Researched',   agent: 'Visionary', minPct: 15,  maxPct: 35  },
  { key: 'scoping',     label: 'Scoped',       agent: 'Architect', minPct: 40,  maxPct: 65  },
  { key: 'synthesizing',label: 'Synthesized',  agent: 'Oracle',    minPct: 70,  maxPct: 90  },
  { key: 'complete',    label: 'Complete',     agent: '',          minPct: 100, maxPct: 100 },
];

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function PipelineTimeline({ discovery }: { discovery: Discovery }) {
  const {
    pipeline_status,
    pipeline_error,
    pipeline_started_at,
    pipeline_step_completed_at,
    pipeline_completed_at,
    created_at,
    progress_pct,
    pipeline_retry_count,
  } = discovery;

  // Only render if a pipeline has ever been initiated
  if (!pipeline_status) return null;

  const isFailed = pipeline_status === 'failed';
  const isComplete = pipeline_status === 'complete';

  // Determine which stage index is currently active
  const activeStageKey = isFailed
    ? (() => {
        // Infer where it failed from progress_pct
        if (progress_pct >= 70) return 'synthesizing';
        if (progress_pct >= 40) return 'scoping';
        if (progress_pct >= 15) return 'researching';
        return 'pending';
      })()
    : pipeline_status;

  const activeIdx = PIPELINE_STAGES.findIndex((s) => s.key === activeStageKey);

  // Build stage state + timestamps
  const stagesWithState = PIPELINE_STAGES.map((stage, idx) => {
    let stageState: 'done' | 'current' | 'failed' | 'pending';

    if (isFailed && idx === activeIdx) {
      stageState = 'failed';
    } else if (isComplete || idx < activeIdx) {
      stageState = 'done';
    } else if (idx === activeIdx) {
      stageState = 'current';
    } else {
      stageState = 'pending';
    }

    // Assign best available timestamp per stage
    let timestamp: string | null = null;
    if (idx === 0) {
      // Submitted
      timestamp = created_at;
    } else if (idx === 1 && pipeline_started_at) {
      // Queued → pipeline started
      timestamp = pipeline_started_at;
    } else if (stageState === 'done' || stageState === 'failed') {
      // For intermediate done stages, use step_completed_at as an approximation;
      // for the final complete stage use pipeline_completed_at
      if (stage.key === 'complete' && pipeline_completed_at) {
        timestamp = pipeline_completed_at;
      } else if (pipeline_step_completed_at) {
        timestamp = pipeline_step_completed_at;
      }
    }

    return { ...stage, state: stageState, timestamp };
  });

  // Compute duration from submission to last known event
  const lastEventTs =
    pipeline_completed_at ||
    pipeline_step_completed_at ||
    pipeline_started_at ||
    null;

  const totalDuration =
    lastEventTs && created_at
      ? Date.now() - new Date(created_at).getTime()
      : null;

  const dotColor = (state: string) => {
    if (state === 'done') return '#4ade80';
    if (state === 'current') return '#60a5fa';
    if (state === 'failed') return '#f87171';
    return 'var(--color-admin-border)';
  };

  const dotBg = (state: string) => {
    if (state === 'done') return 'rgba(74,222,128,0.12)';
    if (state === 'current') return 'rgba(96,165,250,0.12)';
    if (state === 'failed') return 'rgba(248,113,113,0.12)';
    return 'rgba(75,85,99,0.15)';
  };

  const lineColor = (fromState: string) => {
    if (fromState === 'done') return '#4ade80';
    return 'var(--color-admin-border)';
  };

  return (
    <div className="px-6 py-4 border-b border-[var(--color-admin-border)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-3">
        Pipeline Journey
        {totalDuration && (
          <span className="normal-case ml-2 text-[var(--color-muted)]">
            &middot; {formatDuration(totalDuration)} elapsed
          </span>
        )}
        {pipeline_retry_count != null && pipeline_retry_count > 0 && (
          <span className="normal-case ml-2 text-amber-400">
            &middot; {pipeline_retry_count} {pipeline_retry_count === 1 ? 'retry' : 'retries'}
          </span>
        )}
      </p>

      <div className="relative flex items-start gap-0">
        {stagesWithState.map((stage, idx) => {
          const isLast = idx === stagesWithState.length - 1;
          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center relative min-w-0">
              {/* Connector line to the right (skip for last item) */}
              {!isLast && (
                <div
                  className="absolute top-[10px] left-1/2 right-0 h-px z-0"
                  style={{
                    width: '100%',
                    left: '50%',
                    backgroundColor: lineColor(stagesWithState[idx].state),
                    opacity: stagesWithState[idx].state === 'pending' ? 0.25 : 0.6,
                  }}
                />
              )}

              {/* Dot */}
              <div
                className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mb-1.5"
                style={{
                  backgroundColor: dotBg(stage.state),
                  border: `1.5px solid ${dotColor(stage.state)}`,
                  boxShadow:
                    stage.state === 'current'
                      ? '0 0 0 3px rgba(96,165,250,0.15)'
                      : stage.state === 'failed'
                        ? '0 0 0 3px rgba(248,113,113,0.15)'
                        : 'none',
                }}
              >
                {stage.state === 'done' && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {stage.state === 'current' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
                {stage.state === 'failed' && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M2 2l5 5M7 2L2 7" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
                {stage.state === 'pending' && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-admin-border)' }} />
                )}
              </div>

              {/* Label */}
              <p
                className="text-[9px] font-medium text-center leading-tight px-0.5 truncate w-full"
                style={{
                  color:
                    stage.state === 'done'
                      ? '#4ade80'
                      : stage.state === 'current'
                        ? '#60a5fa'
                        : stage.state === 'failed'
                          ? '#f87171'
                          : 'var(--color-muted)',
                }}
              >
                {stage.label}
              </p>

              {/* Agent name */}
              {stage.agent && (
                <p className="text-[8px] text-[var(--color-muted)] text-center mt-0.5 opacity-70 truncate w-full px-0.5">
                  {stage.agent}
                </p>
              )}

              {/* Timestamp */}
              {stage.timestamp && stage.state !== 'pending' && (
                <p className="text-[8px] text-[var(--color-muted)] text-center mt-0.5 leading-tight opacity-60 px-0.5">
                  {relativeDate(stage.timestamp)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {isFailed && pipeline_error && (
        <div className="mt-3 px-3 py-2 bg-red-500/8 border border-red-500/20 rounded-lg">
          <p className="text-[10px] uppercase tracking-wider text-red-400 mb-0.5">Pipeline Error</p>
          <p className="text-xs text-red-300/80 leading-relaxed">{pipeline_error}</p>
        </div>
      )}
    </div>
  );
}
