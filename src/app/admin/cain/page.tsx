'use client';

// ─── /admin/cain ─────────────────────────────────────────────────────────────
// Cain's dashboard — what's in flight, what got done, what needs Zev's call.
// Phase 1: Static/hardcoded. Phase 2: Supabase-backed (cain_sessions table).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Task {
  title: string;
  status: 'completed' | 'partial' | 'skipped' | 'failed' | 'in-progress';
  detail?: string;
}

interface Artifact {
  type: 'file' | 'commit' | 'deployment' | 'proposal';
  label: string;
  url?: string;
  repo?: string;
}

interface ActionItem {
  id: string;
  title: string;
  context: string;
  options: string[];
}

interface Session {
  id: string;
  label: string;
  type: 'overnight' | 'task' | 'on-demand';
  status: 'completed' | 'partial' | 'active';
  date: string;
  tasks: Task[];
  artifacts: Artifact[];
  actionItems: ActionItem[];
  summary: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SESSIONS: Session[] = [
  {
    id: 'wave5',
    label: 'Wave 5 — March 23, 2026',
    type: 'overnight',
    status: 'active',
    date: '2026-03-23',
    summary: 'Lisa Rosen proposal + strategy doc, Cain admin dashboard (this page), Steinmetz /invest API fix, 20 LinkedIn posts for askzev.ai, security vendor research.',
    tasks: [
      { title: 'Lisa Rosen discovery data read + strategy doc written', status: 'completed', detail: 'Full summary of what she asked for, three-tier pricing recap, warm follow-up text for Zev, and HTML proposal page.' },
      { title: 'Lisa Rosen HTML proposal page', status: 'completed', detail: 'Saved to /docs/proposals/lisa-rosen-proposal.html — same dark-mode format as Atlantic Laser and Bay State.' },
      { title: 'Cain admin dashboard (/admin/cain)', status: 'completed', detail: 'Phase 1 static implementation. Shows current work, recent completions, pending decisions, proposal links.' },
      { title: 'Steinmetz /invest API fix — lead field mapping', status: 'completed', detail: 'Fixed the TODO in /api/leads/route.ts: investment fields (timeline, strategy, capRateTarget, propertyTypes, towns) now stored in metadata since migration 002 columns not yet applied to DB.' },
      { title: 'LinkedIn content — 20 posts for askzev.ai', status: 'completed', detail: 'Saved to /docs/content/askzevai-linkedin-posts.md. Practitioner tone, specific, no buzzword soup.' },
      { title: 'Security vendor research (next 10)', status: 'completed', detail: 'Saved to /docs/security-vendor-complete-list.md. 17 total vendors documented with status.' },
    ],
    artifacts: [
      { type: 'file', label: 'lisa-rosen-strategy.md', url: '/docs/proposals/lisa-rosen-strategy.md' },
      { type: 'proposal', label: 'lisa-rosen-proposal.html', url: 'https://askzev.ai/proposals/lisa-rosen' },
      { type: 'file', label: 'askzevai-linkedin-posts.md', url: '/docs/content/askzevai-linkedin-posts.md' },
      { type: 'file', label: 'security-vendor-complete-list.md', url: '/docs/security-vendor-complete-list.md' },
      { type: 'commit', label: 'steinmetz-real-estate: invest API fix + leads metadata', repo: 'steinmetz-real-estate' },
      { type: 'commit', label: 'zev-ai: /admin/cain dashboard (this page)', repo: 'zev-ai' },
    ],
    actionItems: [
      {
        id: 'lisa-followup',
        title: 'Send Lisa Rosen follow-up text',
        context: 'The warm follow-up text is written in /docs/proposals/lisa-rosen-strategy.md. It\'s casual friend tone, not sales. Mentions the 173K Facebook audience angle. Zev just needs to send it.',
        options: ['I\'ll send it', 'Edit the text first', 'Not yet — wait longer'],
      },
      {
        id: 'invest-migration',
        title: 'Run Steinmetz DB migration 002',
        context: 'The /api/leads/route.ts has TODO\'d columns (property_type, timeline, investment_strategy, target_cap_rate, investment_property_types). The migration SQL is at supabase/migrations/002_add_missing_lead_columns.sql. Running it will let us uncomment those field mappings and use dedicated columns instead of metadata JSON.',
        options: ['Run it via Supabase dashboard', 'I\'ll handle it', 'Low priority — skip for now'],
      },
      {
        id: 'linkedin-scheduling',
        title: 'Schedule the 20 LinkedIn posts for askzev.ai',
        context: '20 posts written and saved to /docs/content/askzevai-linkedin-posts.md. There\'s no Buffer connection for askzev.ai yet. Either connect Buffer or schedule manually. Posts are ready to go.',
        options: ['Connect Buffer and schedule', 'Schedule manually', 'Hold — not ready to post yet'],
      },
    ],
  },
  {
    id: 'wave4',
    label: 'Wave 4 — March 23, 2026',
    type: 'overnight',
    status: 'completed',
    date: '2026-03-23',
    summary: 'TOLA client workflow spec, wearable AI comparison, Skyslope sync skeleton, /discover page improvements, Finance module updated.',
    tasks: [
      { title: 'TOLA client workflow spec', status: 'completed' },
      { title: 'Wearable AI comparison doc', status: 'completed' },
      { title: 'Skyslope sync skeleton', status: 'completed' },
      { title: '/discover page improvements', status: 'completed' },
      { title: 'Finance module updated', status: 'completed' },
    ],
    artifacts: [
      { type: 'file', label: 'tola-client-workflow-spec.md' },
      { type: 'file', label: 'wearable-ai-comparison.md' },
    ],
    actionItems: [],
  },
];

const PROPOSAL_LINKS = [
  { label: 'Atlantic Laser Solutions', url: 'https://askzev.ai/proposals/atlantic-laser', status: 'live' },
  { label: 'Bay State Remodeling', url: 'https://askzev.ai/proposals/bay-state', status: 'live' },
  { label: 'Lisa Rosen / IGS', url: 'https://askzev.ai/proposals/lisa-rosen', status: 'pending-deploy' },
  { label: 'Jonathan (Atlantic Laser v2)', url: '/docs/proposals/jonathan-assessment-doc.html', status: 'local' },
  { label: 'Zion / Bay State Decision Tool', url: 'https://askzev.ai/proposals/bay-state-decision', status: 'live' },
];

const CURRENT_WORK = [
  'Wave 5: Lisa Rosen proposal, /admin/cain dashboard, invest API fix, LinkedIn content, security vendor research',
];

// ─── Icons ───────────────────────────────────────────────────────────────────

function CainIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />
    </svg>
  );
}

function StatusBadge({ status }: { status: Task['status'] }) {
  const configs = {
    completed: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '✓', label: 'Done' },
    partial: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: '⚠', label: 'Partial' },
    'in-progress': { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '↻', label: 'Active' },
    skipped: { bg: 'bg-[var(--color-admin-surface)] text-[var(--color-muted)] border-[var(--color-admin-border)]', icon: '—', label: 'Skipped' },
    failed: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '✗', label: 'Failed' },
  };
  const c = configs[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${c.bg}`}>
      <span>{c.icon}</span> {c.label}
    </span>
  );
}

function SessionTypeBadge({ type }: { type: Session['type'] }) {
  const configs = {
    overnight: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    task: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'on-demand': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${configs[type]}`}>
      {type}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CainPage() {
  const [selectedSession, setSelectedSession] = useState(SESSIONS[0]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const pendingActions = SESSIONS.flatMap(s => s.actionItems);

  return (
    <div className="flex h-full min-h-0">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 border-r border-[var(--color-admin-border)] flex flex-col overflow-hidden hidden lg:flex">

        {/* Header */}
        <div className="px-5 py-5 border-b border-[var(--color-admin-border)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[var(--color-accent)]"><CainIcon /></span>
            <span className="text-sm font-semibold text-[var(--color-foreground-strong)]">Cain</span>
            {pendingActions.length > 0 && (
              <span className="ml-auto text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500 text-white">
                {pendingActions.length}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-muted)]">AI assistant — session logs</p>
        </div>

        {/* Current Status */}
        <div className="px-4 py-3 border-b border-[var(--color-admin-border)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-[11px] text-amber-400 font-medium">Wave 5 active</span>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-1 leading-relaxed">{CURRENT_WORK[0]}</p>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Recent Sessions</p>
          {SESSIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSession(s)}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                selectedSession.id === s.id
                  ? 'bg-[var(--color-admin-surface)] text-[var(--color-foreground-strong)]'
                  : 'text-[var(--color-muted-light)] hover:bg-[var(--color-admin-surface)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">{s.label}</span>
                {s.actionItems.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20 shrink-0">
                    {s.actionItems.length}
                  </span>
                )}
              </div>
              <div className="mt-1">
                <SessionTypeBadge type={s.type} />
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 max-w-4xl">

          {/* Session header */}
          <div className="flex items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">{selectedSession.label}</h1>
                <SessionTypeBadge type={selectedSession.type} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  selectedSession.status === 'active'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : selectedSession.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {selectedSession.status}
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">{selectedSession.summary}</p>
            </div>
          </div>

          {/* ── Action Items (shown first if any) ── */}
          {selectedSession.actionItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <span>⚠</span> Decisions Needed ({selectedSession.actionItems.length})
              </h2>
              <div className="space-y-4">
                {selectedSession.actionItems.map(item => (
                  <ActionItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* ── Task Summary ── */}
          <div className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">
              Task Summary
            </h2>
            <div className="border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
              {selectedSession.tasks.map((task, i) => (
                <div
                  key={i}
                  className="border-b border-[var(--color-admin-border)] last:border-b-0"
                >
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-admin-surface)] transition-colors text-left"
                    onClick={() => setExpandedTask(expandedTask === `${selectedSession.id}-${i}` ? null : `${selectedSession.id}-${i}`)}
                  >
                    <StatusBadge status={task.status} />
                    <span className="text-sm text-[var(--color-foreground-strong)] flex-1">{task.title}</span>
                    {task.detail && (
                      <span className="text-[var(--color-muted)] text-xs">
                        {expandedTask === `${selectedSession.id}-${i}` ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                  {task.detail && expandedTask === `${selectedSession.id}-${i}` && (
                    <div className="px-4 pb-3 pt-0">
                      <p className="text-xs text-[var(--color-muted)] leading-relaxed pl-[68px]">{task.detail}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Artifacts ── */}
          {selectedSession.artifacts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">
                Artifacts
              </h2>
              <div className="space-y-2">
                {selectedSession.artifacts.map((artifact, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg">
                    <span className="text-[var(--color-muted)] text-sm">
                      {artifact.type === 'file' && '📄'}
                      {artifact.type === 'commit' && '📦'}
                      {artifact.type === 'deployment' && '🚀'}
                      {artifact.type === 'proposal' && '📋'}
                    </span>
                    <span className="text-sm text-[var(--color-foreground-strong)] flex-1">{artifact.label}</span>
                    {artifact.url && (
                      <a
                        href={artifact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
                      >
                        view →
                      </a>
                    )}
                    {artifact.repo && (
                      <span className="text-[10px] text-[var(--color-muted)] bg-[var(--color-admin-surface)] px-2 py-0.5 rounded">
                        {artifact.repo}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Proposal Quick Links ── */}
          <div className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">
              Proposal Pages
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROPOSAL_LINKS.map((p, i) => (
                <a
                  key={i}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-admin-surface)] transition-colors"
                >
                  <span className="text-sm">📋</span>
                  <span className="text-sm text-[var(--color-foreground-strong)] flex-1">{p.label}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                    p.status === 'live'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : p.status === 'pending-deploy'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-[var(--color-admin-surface)] text-[var(--color-muted)] border-[var(--color-admin-border)]'
                  }`}>
                    {p.status === 'live' ? 'live' : p.status === 'pending-deploy' ? 'pending' : 'local'}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Phase 2 note */}
          <div className="border border-[var(--color-admin-border)] rounded-xl px-5 py-4 bg-[var(--color-admin-surface)]">
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              <strong className="text-[var(--color-muted-light)]">Phase 1 — Static Dashboard.</strong> This page is manually updated. Phase 2 will wire this to a Supabase <code>cain_sessions</code> table — Cain writes session data at end of each run, and this page renders it dynamically. Action item responses will route back to Cain via Telegram. See <code>/docs/cain-dashboard-spec.md</code> for the full spec.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Action Item Card ─────────────────────────────────────────────────────────

function ActionItemCard({ item }: { item: ActionItem }) {
  const [resolved, setResolved] = useState<string | null>(null);

  return (
    <div className="border border-amber-500/25 rounded-xl p-5 bg-amber-500/5">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-amber-400 text-base mt-0.5">⚠</span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-1">{item.title}</h3>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed">{item.context}</p>
        </div>
      </div>
      {resolved ? (
        <div className="ml-8 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-xs text-emerald-400">✓ Marked as: <strong>{resolved}</strong></p>
        </div>
      ) : (
        <div className="ml-8 flex gap-2 flex-wrap">
          {item.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setResolved(opt)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] text-[var(--color-muted-light)] hover:text-[var(--color-foreground-strong)] hover:border-[var(--color-accent)]/40 transition-colors cursor-pointer"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
