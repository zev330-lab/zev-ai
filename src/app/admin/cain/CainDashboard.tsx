'use client';

// ─── Cain Dashboard (client component) ────────────────────────────────────────
// Receives server-fetched tasks + log. Handles optimistic mark-done via
// PATCH /api/cain/tasks which persists to Supabase (survives refresh).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Priority = 'urgent' | 'today' | 'week' | 'backlog';

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
  status: 'open' | 'done';
  actions: TaskAction[];
  created_at: string;
  completed_at: string | null;
}

export interface DBLog {
  id: string;
  entry: string;
  created_at: string;
}

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent:  { emoji: '🔴', label: 'Urgent',    color: 'text-red-400',   border: 'border-red-500/30',    bg: 'bg-red-500/5' },
  today:   { emoji: '🟡', label: 'Today',     color: 'text-amber-400', border: 'border-amber-500/30',  bg: 'bg-amber-500/5' },
  week:    { emoji: '🔵', label: 'This Week', color: 'text-blue-400',  border: 'border-blue-500/30',   bg: 'bg-blue-500/5' },
  backlog: { emoji: '⚪', label: 'Backlog',   color: 'text-zinc-400',  border: 'border-[var(--color-admin-border)]', bg: 'bg-[var(--color-admin-surface)]' },
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
      {copied ? '✓ Copied!' : `📋 ${label}`}
    </button>
  );
}

// ─── Action Renderer ──────────────────────────────────────────────────────────

function ActionRenderer({ action }: { action: TaskAction }) {
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  if (action.type === 'email') {
    const mailto = `mailto:${action.to}?subject=${encodeURIComponent(action.subject)}&body=${encodeURIComponent(action.body)}`;
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
          <a
            href={mailto}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            ✉ Send Email
          </a>
          <CopyButton text={action.body} label="Copy Body" />
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

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  done,
  onToggle,
}: {
  task: DBTask;
  done: boolean;
  onToggle: (id: string) => void;
}) {
  const cfg = PRIORITY_CONFIG[task.priority];

  return (
    <div className={`rounded-xl border p-4 transition-opacity ${cfg.border} ${cfg.bg} ${done ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
              {cfg.emoji} {cfg.label}
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">· {timeAgo(task.created_at)}</span>
          </div>
          <h3 className={`text-sm font-semibold leading-snug ${done ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-foreground-strong)]'}`}>
            {task.title}
          </h3>
          {task.context && (
            <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">{task.context}</p>
          )}
        </div>
        <button
          onClick={() => onToggle(task.id)}
          title={done ? 'Undo' : 'Mark done'}
          className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs transition-colors cursor-pointer ${
            done
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'border-[var(--color-admin-border)] text-[var(--color-muted)] hover:border-emerald-500/40 hover:text-emerald-400'
          }`}
        >
          {done ? '✓' : '○'}
        </button>
      </div>

      {!done && (
        <div className="space-y-3">
          {task.actions.map((action, i) => (
            <ActionRenderer key={i} action={action} />
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function CainDashboard({ tasks, log }: { tasks: DBTask[]; log: DBLog[] }) {
  // Initialize status map from DB — this makes mark-done persist across refresh
  const [statuses, setStatuses] = useState<Record<string, 'open' | 'done'>>(
    () => Object.fromEntries(tasks.map(t => [t.id, t.status]))
  );

  const handleToggle = useCallback(async (id: string) => {
    const current = statuses[id] ?? 'open';
    const next: 'open' | 'done' = current === 'done' ? 'open' : 'done';

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

  const byPriority = (p: Priority) => tasks.filter(t => t.priority === p);
  const urgent  = byPriority('urgent');
  const today   = byPriority('today');
  const week    = byPriority('week');
  const backlog = byPriority('backlog');

  const openCount = tasks.filter(t => (statuses[t.id] ?? t.status) === 'open').length;

  return (
    <div className="h-full overflow-y-auto flex flex-col">

      {/* ── Page header ── */}
      <div className="sticky top-0 z-10 bg-[var(--color-admin-bg)]/95 backdrop-blur-sm border-b border-[var(--color-admin-border)] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🗡️</span>
            <div>
              <h1 className="text-sm font-bold text-[var(--color-foreground-strong)]">Cain</h1>
              <p className="text-[11px] text-[var(--color-muted)]">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] flex-wrap justify-end">
            <span className="text-red-400 font-semibold">{urgent.filter(t => statuses[t.id] === 'open').length} urgent</span>
            <span className="text-[var(--color-muted)]">·</span>
            <span className="text-amber-400 font-semibold">{today.filter(t => statuses[t.id] === 'open').length} today</span>
            <span className="text-[var(--color-muted)]">·</span>
            <span className="text-blue-400 font-semibold">{week.filter(t => statuses[t.id] === 'open').length} this week</span>
            <span className="text-[var(--color-muted)]">·</span>
            <span className="text-zinc-400">{backlog.filter(t => statuses[t.id] === 'open').length} backlog</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-10 pb-16">

        {/* ── FOR YOU ── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-5">
            For You · {openCount} open
          </h2>

          {urgent.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🔴" label="Urgent" count={urgent.filter(t => statuses[t.id] === 'open').length} color="text-red-400" />
              <div className="space-y-3">
                {urgent.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={statuses[task.id] === 'done'}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {today.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🟡" label="Today" count={today.filter(t => statuses[t.id] === 'open').length} color="text-amber-400" />
              <div className="space-y-3">
                {today.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={statuses[task.id] === 'done'}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {week.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🔵" label="This Week" count={week.filter(t => statuses[t.id] === 'open').length} color="text-blue-400" />
              <div className="space-y-3">
                {week.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={statuses[task.id] === 'done'}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {backlog.length > 0 && (
            <div>
              <SectionHeader emoji="⚪" label="Backlog / Discuss" count={backlog.filter(t => statuses[t.id] === 'open').length} color="text-zinc-400" />
              <div className="space-y-3">
                {backlog.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={statuses[task.id] === 'done'}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] text-center py-12">No tasks yet. Push one via POST /api/cain/push-task.</p>
          )}
        </section>

        {/* ── WHAT CAIN DID ── */}
        {log.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">
              What Cain Built · {log.length} shipped
            </h2>
            <div className="border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
              {log.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-admin-border)] last:border-b-0 hover:bg-[var(--color-admin-surface)] transition-colors"
                >
                  <span className="text-emerald-400 text-sm shrink-0">✓</span>
                  <span className="text-sm text-[var(--color-foreground-strong)]">{item.entry}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
