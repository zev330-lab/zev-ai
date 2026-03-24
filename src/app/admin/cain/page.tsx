'use client';

// ─── /admin/cain ─────────────────────────────────────────────────────────────
// Cain's command center. Every card is a fully self-contained task.
// One button = the thing is done.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = 'urgent' | 'today' | 'when-ready';

interface EmailAction { type: 'email'; to: string; subject: string; body: string }
interface SMSAction  { type: 'sms';   body: string; phoneNumber?: string }
interface LinkAction { type: 'link';  url: string; label: string }
interface SQLAction  { type: 'sql';   sql: string; dashboardUrl: string }
interface InfoAction { type: 'info';  rows: Array<{ label: string; value: string; secret?: boolean }> }

type TaskAction = EmailAction | SMSAction | LinkAction | SQLAction | InfoAction;

interface ActionCard {
  id: string;
  priority: Priority;
  title: string;
  context: string;
  actions: TaskAction[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const JOHN_EMAIL_BODY = `Hi John,

Hope you're well. I put together two things based on the discovery you submitted:

1. The proposal — scope, timeline, and investment:
https://atlantic-laser-v2.vercel.app

2. The full assessment — everything we found:
https://atlantic-laser-assessment.vercel.app

With your laser cleaning launch coming up, timing matters. Happy to jump on a quick call this week.

— Zev
zev.ai | hello@askzev.ai`;

const ZION_TEXT = `Hey Zion — been heads down on some new work and wanted to circle back. Rebuilt your proposal with updated pricing and also put together something I think you're going to like.

Two links for you:

Updated proposal: https://zion-proposal-deploy.vercel.app

And a working prototype of that customer decision tool we talked about: https://bay-state-decision-tool.vercel.app

Take a look and let me know what you think. Happy to jump on a call this week.`;

const LISA_TEXT = `Hey Lisa — just wanted to check in and see if you'd had a chance to look at the proposal. No rush at all, I know you're managing a lot right now.

I built the tiers specifically so you could start at whatever level feels right — honestly even the Starter Tier would give you consistent social content without you having to write a single post from scratch, and we're talking a few hundred bucks a month, not agency rates.

The thing that keeps standing out to me is that 173K Facebook audience sitting there dormant. That's a remarketing pool most businesses would pay a lot of money to build, and you already have it. Even just getting consistent content going again would start warming them up before we ever spent a dollar on ads.

If it helps to talk through any of it — even just a 20-minute call — happy to do that. And if the timing isn't right right now, totally get it.

— Zev`;

const SUPABASE_SQL = `DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type text;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_range text;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline text;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS investment_strategy text;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS target_cap_rate text;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS investment_property_types text[];
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_name text;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_email text;
EXCEPTION WHEN others THEN NULL;
END $$;`;

const ACTION_ITEMS: ActionCard[] = [
  {
    id: 'john-email',
    priority: 'urgent',
    title: "Send John's email",
    context: "Atlantic Laser — proposal + assessment are live. He needs to see them before his laser cleaning launch.",
    actions: [
      {
        type: 'email',
        to: 'jonathanproctor68@gmail.com',
        subject: 'Your Atlantic Laser proposal — two things to review',
        body: JOHN_EMAIL_BODY,
      },
    ],
  },
  {
    id: 'zion-text',
    priority: 'urgent',
    title: 'Text Zion',
    context: "Bay State — rebuilt proposal + decision tool prototype are ready. He's been waiting.",
    actions: [
      {
        type: 'sms',
        body: ZION_TEXT,
      },
    ],
  },
  {
    id: 'lisa-text',
    priority: 'today',
    title: 'Send Lisa follow-up text',
    context: "Close friend. Proposal sent a few days ago. Casual check-in, no pressure — don't wait too long.",
    actions: [
      {
        type: 'sms',
        body: LISA_TEXT,
      },
    ],
  },
  {
    id: 'supabase-migration',
    priority: 'today',
    title: 'Run Supabase migration',
    context: 'Steinmetz DB — adds missing lead columns. The API is working around these with metadata JSON right now.',
    actions: [
      {
        type: 'sql',
        sql: SUPABASE_SQL,
        dashboardUrl: 'https://supabase.com/dashboard',
      },
    ],
  },
  {
    id: 'buffer-linkedin',
    priority: 'today',
    title: 'Connect askzev.ai to Buffer · schedule 20 posts',
    context: '20 LinkedIn posts are written and ready. Buffer needs to be connected for askzev.ai.',
    actions: [
      {
        type: 'link',
        url: 'https://buffer.com',
        label: 'Open Buffer',
      },
      {
        type: 'info',
        rows: [
          { label: 'Login', value: 'zev330@gmail.com' },
          { label: 'Password', value: 'Complicated1*', secret: true },
          { label: 'Posts file', value: '/docs/content/askzevai-linkedin-posts.md' },
        ],
      },
    ],
  },
  {
    id: 'limitless-pendant',
    priority: 'when-ready',
    title: 'Order Limitless Pendant',
    context: 'Best wearable for TOLA. Only one with a real API for auto-pushing meeting transcripts. $99 + $19/month.',
    actions: [
      {
        type: 'link',
        url: 'https://www.limitless.ai',
        label: 'Order on Limitless.ai →',
      },
    ],
  },
  {
    id: 'elevenlabs-upgrade',
    priority: 'when-ready',
    title: 'Upgrade ElevenLabs',
    context: 'Voice replies are paused — quota exceeded. Creator plan is $22/month for 100K chars.',
    actions: [
      {
        type: 'link',
        url: 'https://elevenlabs.io/app/billing',
        label: 'Upgrade to Creator ($22/mo) →',
      },
    ],
  },
  {
    id: 'sarina-skyslope',
    priority: 'when-ready',
    title: "Send Sarina's Skyslope credentials to Cain",
    context: 'Needed for overnight transaction sync. Send your raveis365.com login via Telegram when ready.',
    actions: [
      {
        type: 'link',
        url: 'https://t.me',
        label: 'Open Telegram →',
      },
    ],
  },
];

const RECENT_WORK = [
  'Projects crash fix on askzev.ai',
  'Knowledge Base populated (Newton + 6 other neighborhoods)',
  'Quality Monitor critical issue fixed',
  'Stale agents fixed (4→12+ healthy)',
  "Sarina's transaction form built",
  '10 social posts scheduled in Buffer',
  'Google Analytics connected (both sites)',
  'Google Search Console verified (both sites)',
  'Stripe configured + payment links created',
  'ElevenLabs voice configured',
  'Atlantic Laser interactive proposal app live',
  'Zion Bay State proposal + decision tool mockup live',
  'Zev headshot added to About page',
  'PWA manifest added (add to home screen)',
  'TOLA client workflow spec written',
  'Wearable AI comparison written',
  '20 LinkedIn posts written for askzev.ai',
];

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent:     { emoji: '🔴', label: 'Urgent',     color: 'text-red-400',     border: 'border-red-500/30',    bg: 'bg-red-500/5' },
  today:      { emoji: '🟡', label: 'Today',      color: 'text-amber-400',   border: 'border-amber-500/30',  bg: 'bg-amber-500/5' },
  'when-ready': { emoji: '🟢', label: 'When Ready', color: 'text-emerald-400', border: 'border-[var(--color-admin-border)]', bg: 'bg-[var(--color-admin-surface)]' },
};

// ─── Copy Button ─────────────────────────────────────────────────────────────

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
        {/* Email meta */}
        <div className="text-xs text-[var(--color-muted)] space-y-0.5">
          <div><span className="text-[var(--color-muted-light)] font-medium">To:</span> {action.to}</div>
          <div><span className="text-[var(--color-muted-light)] font-medium">Subject:</span> {action.subject}</div>
        </div>
        {/* Email body — always visible */}
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
    return (
      <div className="flex flex-col gap-3">
        {/* Message body — always visible */}
        <pre className="text-xs text-[var(--color-muted-light)] leading-relaxed whitespace-pre-wrap bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg p-3 font-sans">
          {action.body}
        </pre>
        <CopyButton text={action.body} label="Copy Message" />
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

  if (action.type === 'sql') {
    return (
      <div className="flex flex-col gap-3">
        {/* SQL — always visible */}
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

  return null;
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ item }: { item: ActionCard }) {
  const [done, setDone] = useState(false);
  const cfg = PRIORITY_CONFIG[item.priority];

  return (
    <div className={`rounded-xl border p-4 transition-opacity ${cfg.border} ${cfg.bg} ${done ? 'opacity-40' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          <h3 className={`text-sm font-semibold leading-snug ${done ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-foreground-strong)]'}`}>
            {item.title}
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">{item.context}</p>
        </div>
        <button
          onClick={() => setDone(v => !v)}
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

      {/* Actions */}
      {!done && (
        <div className="space-y-3">
          {item.actions.map((action, i) => (
            <ActionRenderer key={i} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CainPage() {
  const urgent    = ACTION_ITEMS.filter(a => a.priority === 'urgent');
  const today     = ACTION_ITEMS.filter(a => a.priority === 'today');
  const whenReady = ACTION_ITEMS.filter(a => a.priority === 'when-ready');

  const totalPending = ACTION_ITEMS.length;

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {/* ── Page header ── */}
      <div className="sticky top-0 z-10 bg-[var(--color-admin-bg)]/95 backdrop-blur-sm border-b border-[var(--color-admin-border)] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🗡️</span>
            <div>
              <h1 className="text-sm font-bold text-[var(--color-foreground-strong)]">Cain</h1>
              <p className="text-[11px] text-[var(--color-muted)]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            <span className="text-red-400 font-semibold">{urgent.length} urgent</span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">{today.length} today</span>
            <span>·</span>
            <span>{whenReady.length} when ready</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-10">

        {/* ── FOR YOU ── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-5">
            For You · {totalPending} items
          </h2>

          {/* Urgent */}
          {urgent.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-red-500/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">🔴 Urgent</span>
                <div className="h-px flex-1 bg-red-500/20" />
              </div>
              <div className="space-y-3">
                {urgent.map(item => <TaskCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {/* Today */}
          {today.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-amber-500/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">🟡 Today</span>
                <div className="h-px flex-1 bg-amber-500/20" />
              </div>
              <div className="space-y-3">
                {today.map(item => <TaskCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {/* When Ready */}
          {whenReady.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-[var(--color-admin-border)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">🟢 When Ready</span>
                <div className="h-px flex-1 bg-[var(--color-admin-border)]" />
              </div>
              <div className="space-y-3">
                {whenReady.map(item => <TaskCard key={item.id} item={item} />)}
              </div>
            </div>
          )}
        </section>

        {/* ── WHAT CAIN DID ── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">
            What Cain Built · {RECENT_WORK.length} shipped
          </h2>
          <div className="border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
            {RECENT_WORK.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-admin-border)] last:border-b-0 hover:bg-[var(--color-admin-surface)] transition-colors"
              >
                <span className="text-emerald-400 text-sm shrink-0">✓</span>
                <span className="text-sm text-[var(--color-foreground-strong)]">{item}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
