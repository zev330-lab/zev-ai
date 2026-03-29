'use client';

// ─── Cain Dashboard (client component) ────────────────────────────────────────
// Receives server-fetched tasks + log. Handles optimistic mark-done via
// PATCH /api/cain/tasks which persists to Supabase (survives refresh).
// Supabase Realtime subscription for live updates when agents push tasks.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Priority = 'urgent' | 'today' | 'week' | 'backlog';
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'failed';

export interface EmailAction  { type: 'email';  to: string; subject: string; body: string }
export interface SMSAction    { type: 'sms';    body: string; phoneNumber?: string }
export interface LinkAction   { type: 'link';   url: string; label: string }
export interface LinksAction  { type: 'links';  links: Array<{ url: string; label: string }> }
export interface SQLAction    { type: 'sql';    sql: string; dashboardUrl: string }
export interface InfoAction   { type: 'info';   rows: Array<{ label: string; value: string; secret?: boolean }> }
export interface NoteAction   { type: 'note';   text: string }

export type TaskAction = EmailAction | SMSAction | LinkAction | LinksAction | SQLAction | InfoAction | NoteAction;

export interface DBTask {
  id: string;
  title: string;
  context: string | null;
  priority: Priority;
  status: TaskStatus;
  assigned_to: string;
  created_by: string;
  actions: TaskAction[];
  created_at: string;
  completed_at: string | null;
  completion_notes: string | null;
}

export interface DBLog {
  id: string;
  entry: string;
  created_by: string;
  created_at: string;
}

// ─── Supabase client for Realtime ────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent:  { emoji: '🔴', label: 'Urgent',    color: 'text-red-400',   border: 'border-red-500/30',    bg: 'bg-red-500/5' },
  today:   { emoji: '🟡', label: 'Today',     color: 'text-amber-400', border: 'border-amber-500/30',  bg: 'bg-amber-500/5' },
  week:    { emoji: '🔵', label: 'This Week', color: 'text-blue-400',  border: 'border-blue-500/30',   bg: 'bg-blue-500/5' },
  backlog: { emoji: '⚪', label: 'Backlog',   color: 'text-zinc-400',  border: 'border-[var(--color-admin-border)]', bg: 'bg-[var(--color-admin-surface)]' },
};

const AGENT_COLORS: Record<string, string> = {
  cain: 'text-orange-400',
  abel: 'text-blue-400',
  zev: 'text-purple-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  const d = Math.floor(sec / 86400);
  return d === 1 ? '1 day ago' : `${d} days ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-[var(--color-admin-surface)] text-[var(--color-foreground-strong)] border border-[var(--color-admin-border)] hover:border-[var(--color-accent)]/40'
      }`}
    >
      {copied ? '✓ Copied!' : label ? `📋 ${label}` : '📋'}
    </button>
  );
}

// ─── Action Renderer ──────────────────────────────────────────────────────────

function ActionRenderer({ action, taskId }: { action: TaskAction; taskId?: string }) {
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sendError, setSendError] = useState('');

  if (action.type === 'email') {
    const mailto = `mailto:${action.to}?subject=${encodeURIComponent(action.subject)}&body=${encodeURIComponent(action.body)}`;

    async function handleSendNow() {
      if (sendState === 'sending' || sendState === 'sent') return;
      setSendState('sending');
      setSendError('');
      try {
        const res = await fetch('/api/cain/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: (action as EmailAction).to,
            subject: (action as EmailAction).subject,
            body: (action as EmailAction).body,
            ...(taskId ? { task_id: taskId } : {}),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Send failed' }));
          throw new Error(data.error || 'Send failed');
        }
        setSendState('sent');
      } catch (err) {
        setSendState('error');
        setSendError(err instanceof Error ? err.message : 'Send failed');
      }
    }

    return (
      <div className="flex flex-col gap-3">
        <div className="text-xs text-[var(--color-muted)] space-y-0.5">
          <div><span className="text-[var(--color-muted-light)] font-medium">To:</span> {action.to}</div>
          <div><span className="text-[var(--color-muted-light)] font-medium">Subject:</span> {action.subject}</div>
        </div>
        <pre className="text-xs text-[var(--color-muted-light)] leading-relaxed whitespace-pre-wrap bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg p-3 font-sans">
          {action.body}
        </pre>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSendNow}
            disabled={sendState === 'sending' || sendState === 'sent'}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity ${
              sendState === 'sent'
                ? 'bg-emerald-600 text-white cursor-default'
                : sendState === 'error'
                  ? 'bg-red-600 text-white hover:opacity-90'
                  : 'bg-[var(--color-accent)] text-white hover:opacity-90'
            } disabled:opacity-60`}
          >
            {sendState === 'sending' ? 'Sending...' : sendState === 'sent' ? '✓ Sent' : sendState === 'error' ? 'Retry Send' : 'Send Now'}
          </button>
          <a
            href={mailto}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--color-admin-border)] text-[var(--color-muted-light)] rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            ✉ Open in Mail
          </a>
          <CopyButton text={action.body} label="Copy Body" />
          {sendState === 'error' && sendError && (
            <span className="text-xs text-red-400">{sendError}</span>
          )}
        </div>
      </div>
    );
  }

  if (action.type === 'sms') {
    const smsUrl = action.phoneNumber ? `sms:${action.phoneNumber}` : undefined;
    return (
      <div className="flex flex-col gap-3">
        {action.phoneNumber && (
          <div className="text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-muted-light)] font-medium">To:</span>{' '}
            <span className="font-mono">{action.phoneNumber}</span>
          </div>
        )}
        <pre className="text-xs text-[var(--color-muted-light)] leading-relaxed whitespace-pre-wrap bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg p-3 font-sans">
          {action.body}
        </pre>
        <div className="flex items-center gap-2 flex-wrap">
          <CopyButton text={action.body} label="Copy Message" />
          {smsUrl && (
            <a
              href={smsUrl}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              💬 Open in Messages
            </a>
          )}
        </div>
      </div>
    );
  }

  if (action.type === 'link') {
    return (
      <a
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        {action.label}
      </a>
    );
  }

  if (action.type === 'links') {
    return (
      <div className="flex flex-wrap gap-2">
        {action.links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-admin-surface)] text-[var(--color-foreground-strong)] border border-[var(--color-admin-border)] rounded-lg text-sm font-semibold hover:border-[var(--color-accent)]/40 transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
    );
  }

  if (action.type === 'sql') {
    return (
      <div className="flex flex-col gap-3">
        <pre className="text-xs text-emerald-300/80 leading-relaxed whitespace-pre-wrap bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg p-3 font-mono overflow-x-auto">
          {action.sql}
        </pre>
        <div className="flex items-center gap-2 flex-wrap">
          <CopyButton text={action.sql} label="Copy SQL" />
          <a
            href={action.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Open Supabase →
          </a>
        </div>
        <p className="text-xs text-[var(--color-muted)]">SQL Editor → paste → Run</p>
      </div>
    );
  }

  if (action.type === 'info') {
    return (
      <div className="space-y-2">
        {action.rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-xs">
            <span className="text-[var(--color-muted)] w-16 shrink-0">{row.label}</span>
            {row.secret ? (
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-foreground-strong)] font-mono">
                  {showSecret[row.label] ? row.value : '••••••••••'}
                </span>
                <button
                  onClick={() => setShowSecret(v => ({ ...v, [row.label]: !v[row.label] }))}
                  className="text-[var(--color-muted)] hover:text-[var(--color-muted-light)] text-[10px] cursor-pointer"
                >
                  {showSecret[row.label] ? 'hide' : 'show'}
                </button>
                <CopyButton text={row.value} label="" />
              </div>
            ) : (
              <span className="text-[var(--color-foreground-strong)] font-mono">{row.value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (action.type === 'note') {
    return (
      <div className="bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg p-3">
        <p className="text-xs text-[var(--color-muted)] leading-relaxed whitespace-pre-wrap">{action.text}</p>
      </div>
    );
  }

  return null;
}

// ─── Task Card (collapsible) ──────────────────────────────────────────────────

function TaskCard({
  task,
  done,
  onToggle,
}: {
  task: DBTask;
  done: boolean;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PRIORITY_CONFIG[task.priority];
  const hasContent = !done && (task.context || task.actions.length > 0);

  return (
    <div className={`rounded-xl border transition-opacity ${cfg.border} ${cfg.bg} ${done ? 'opacity-40' : ''}`}>
      {/* ── Header row — always visible, tappable to expand ── */}
      <div
        className={`flex items-start gap-3 p-4 ${hasContent ? 'cursor-pointer select-none' : ''}`}
        onClick={() => hasContent && setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
              {cfg.emoji} {cfg.label}
            </span>
            <span className={`text-[10px] ${AGENT_COLORS[task.created_by] || 'text-zinc-400'}`}>
              by {task.created_by}
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">
              → {task.assigned_to}
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">
              {timeAgo(task.created_at)}
            </span>
          </div>
          <h3 className={`text-sm font-semibold leading-snug ${done ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-foreground-strong)]'}`}>
            {task.title}
          </h3>
          {done && task.completed_at && (
            <p className="text-[10px] text-emerald-400/70 mt-1">
              Completed {formatDate(task.completed_at)}
              {task.completion_notes && ` — ${task.completion_notes}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Expand/collapse chevron */}
          {hasContent && (
            <span className={`text-[var(--color-muted)] text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          )}
          {/* Mark done button — stop propagation so it doesn't toggle expand */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
            title={done ? 'Undo' : 'Mark done'}
            className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs transition-colors cursor-pointer ${
              done
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'border-[var(--color-admin-border)] text-[var(--color-muted)] hover:border-emerald-500/40 hover:text-emerald-400'
            }`}
          >
            {done ? '✓' : '○'}
          </button>
        </div>
      </div>

      {/* ── Expandable content ── */}
      {expanded && hasContent && (
        <div className="px-4 pb-4 border-t border-[var(--color-admin-border)]/50 pt-3 space-y-3">
          {task.context && (
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">{task.context}</p>
          )}
          {task.actions.map((action, i) => (
            <ActionRenderer key={i} action={action} taskId={task.id} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ emoji, label, count, color }: { emoji: string; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`h-px flex-1 ${color.replace('text-', 'bg-').replace('-400', '-500/20')}`} />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{emoji} {label} · {count}</span>
      <div className={`h-px flex-1 ${color.replace('text-', 'bg-').replace('-400', '-500/20')}`} />
    </div>
  );
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

function FilterTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const tabs = [
    { value: 'open', label: 'Open' },
    { value: 'done', label: 'Done' },
    { value: 'all', label: 'All' },
  ];
  return (
    <div className="flex gap-1 bg-[var(--color-admin-surface)] rounded-lg p-0.5 border border-[var(--color-admin-border)]">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
            active === t.value
              ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Assignee Filter ──────────────────────────────────────────────────────────

function AssigneeTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const tabs = [
    { value: 'zev',  label: '👑 Mine' },
    { value: 'abel', label: '⚡ Abel' },
    { value: 'all',  label: 'All' },
  ];
  return (
    <div className="flex gap-1 overflow-x-auto bg-[var(--color-admin-surface)] rounded-lg p-0.5 border border-[var(--color-admin-border)]" style={{ scrollbarWidth: 'none' }}>
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            active === t.value
              ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function CainDashboard({ tasks: initialTasks, log: initialLog }: { tasks: DBTask[]; log: DBLog[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [log, setLog] = useState(initialLog);
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>(
    () => Object.fromEntries(initialTasks.map(t => [t.id, t.status]))
  );
  const [filter, setFilter]         = useState('open');
  const [assignee, setAssignee]     = useState('zev');   // default: show Zev's tasks
  const [showCompleted, setShowCompleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [tasksRes, logRes] = await Promise.all([
        fetch('/api/admin/cain?status=all'),
        fetch('/api/admin/cain?view=log'),
      ]);
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data);
        setStatuses(Object.fromEntries(data.map((t: DBTask) => [t.id, t.status])));
      }
      if (logRes.ok) setLog(await logRes.json());
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Realtime subscription — refetch on any change from agents
  useEffect(() => {
    const channel = supabase
      .channel('cain-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cain_tasks' }, async () => {
        const res = await fetch('/api/admin/cain?status=all');
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
          setStatuses(Object.fromEntries(data.map((t: DBTask) => [t.id, t.status])));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cain_log' }, async () => {
        const res = await fetch('/api/admin/cain?view=log');
        if (res.ok) setLog(await res.json());
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    const current = statuses[id] ?? 'open';
    const next: TaskStatus = current === 'done' ? 'open' : 'done';

    // Optimistic update
    setStatuses(prev => ({ ...prev, [id]: next }));

    try {
      const res = await fetch('/api/cain/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) throw new Error('persist failed');
    } catch {
      // Revert on failure
      setStatuses(prev => ({ ...prev, [id]: current }));
    }
  }, [statuses]);

  // Filter tasks by status + assignee
  const filtered = tasks.filter(t => {
    const s = statuses[t.id] ?? t.status;
    const statusMatch = filter === 'open' ? (s === 'open' || s === 'in_progress')
                      : filter === 'done' ? s === 'done'
                      : (s === 'open' || s === 'in_progress');
    const assigneeMatch = assignee === 'all' ? true : t.assigned_to === assignee;
    return statusMatch && assigneeMatch;
  });

  // Completed tasks for the "Show Completed" section (only in open/all views)
  const completedTasks = filter !== 'done' ? tasks.filter(t => {
    const s = statuses[t.id] ?? t.status;
    const assigneeMatch = assignee === 'all' ? true : t.assigned_to === assignee;
    return s === 'done' && assigneeMatch;
  }) : [];

  const byPriority = (p: Priority) => filtered.filter(t => t.priority === p);
  const urgent  = byPriority('urgent');
  const today   = byPriority('today');
  const week    = byPriority('week');
  const backlog = byPriority('backlog');

  const openCount = tasks.filter(t => {
    const s = statuses[t.id] ?? t.status;
    const assigneeMatch = assignee === 'all' ? true : t.assigned_to === assignee;
    return (s === 'open' || s === 'in_progress') && assigneeMatch;
  }).length;
  const doneCount = tasks.filter(t => {
    const s = statuses[t.id] ?? t.status;
    const assigneeMatch = assignee === 'all' ? true : t.assigned_to === assignee;
    return s === 'done' && assigneeMatch;
  }).length;

  return (
    <div className="h-full overflow-y-auto flex flex-col">

      {/* ── Page header ── */}
      <div className="sticky top-0 z-10 bg-[var(--color-admin-bg)]/95 backdrop-blur-sm border-b border-[var(--color-admin-border)] px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {/* Top row: title + counts + refresh */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🗡️</span>
              <div>
                <h1 className="text-sm font-bold text-[var(--color-foreground-strong)]">Cain + Abel</h1>
                <p className="text-[11px] text-[var(--color-muted)]">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-emerald-400 font-semibold">{doneCount} done</span>
                <span className="text-[var(--color-muted)]">·</span>
                <span className="text-amber-400 font-semibold">{openCount} open</span>
              </div>
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh tasks"
                className="w-7 h-7 rounded-lg border border-[var(--color-admin-border)] flex items-center justify-center text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] hover:border-[var(--color-accent)]/40 transition-colors cursor-pointer disabled:opacity-40"
              >
                {refreshing ? '⟳' : '↺'}
              </button>
            </div>
          </div>
          {/* Bottom row: assignee + status filters */}
          <div className="flex items-center gap-2">
            <AssigneeTabs active={assignee} onChange={setAssignee} />
            <FilterTabs active={filter} onChange={setFilter} />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto w-full space-y-10 pb-16">

        {/* ── TASKS ── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-5">
            Tasks · {filtered.length} {assignee !== 'all' ? `(${assignee})` : ''}
          </h2>

          {filtered.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] text-center py-12">
              {filter === 'done' ? 'Nothing completed yet.' : 'All clear — nothing pending.'}
            </p>
          )}

          {urgent.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🔴" label="Urgent" count={urgent.length} color="text-red-400" />
              <div className="space-y-3">
                {urgent.map(task => (
                  <TaskCard key={task.id} task={task} done={statuses[task.id] === 'done'} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}

          {today.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🟡" label="Today" count={today.length} color="text-amber-400" />
              <div className="space-y-3">
                {today.map(task => (
                  <TaskCard key={task.id} task={task} done={statuses[task.id] === 'done'} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}

          {week.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🔵" label="This Week" count={week.length} color="text-blue-400" />
              <div className="space-y-3">
                {week.map(task => (
                  <TaskCard key={task.id} task={task} done={statuses[task.id] === 'done'} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}

          {backlog.length > 0 && (
            <div>
              <SectionHeader emoji="⚪" label="Backlog / Discuss" count={backlog.length} color="text-zinc-400" />
              <div className="space-y-3">
                {backlog.map(task => (
                  <TaskCard key={task.id} task={task} done={statuses[task.id] === 'done'} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}

          {/* Show Completed toggle (only in open/all views) */}
          {completedTasks.length > 0 && filter !== 'done' && (
            <div className="mt-6">
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--color-admin-border)] text-[11px] font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] hover:border-[var(--color-accent)]/40 transition-colors cursor-pointer"
              >
                <span className={`transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`}>▼</span>
                {showCompleted ? 'Hide' : 'Show'} {completedTasks.length} Completed
              </button>
              {showCompleted && (
                <div className="mt-3 space-y-3">
                  {completedTasks.map(task => (
                    <TaskCard key={task.id} task={task} done onToggle={handleToggle} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── ACTIVITY LOG ── */}
        {log.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">
              Activity Log · {log.length} entries
            </h2>
            <div className="border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
              {log.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-admin-border)] last:border-b-0 hover:bg-[var(--color-admin-surface)] transition-colors"
                >
                  <span className="text-emerald-400 text-sm shrink-0">✓</span>
                  <span className="text-sm text-[var(--color-foreground-strong)] flex-1">{entry.entry}</span>
                  <span className={`text-[10px] ${AGENT_COLORS[entry.created_by] || 'text-zinc-400'} shrink-0`}>
                    {entry.created_by}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)] shrink-0">
                    {timeAgo(entry.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
