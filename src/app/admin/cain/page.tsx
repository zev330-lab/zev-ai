'use client';

// ─── /admin/cain ─────────────────────────────────────────────────────────────
// Cain's command center. Every card is a fully self-contained task.
// One button = the thing is done.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = 'urgent' | 'today' | 'week' | 'backlog';

interface EmailAction  { type: 'email';  to: string; subject: string; body: string }
interface SMSAction    { type: 'sms';    body: string; phoneNumber?: string }
interface LinkAction   { type: 'link';   url: string; label: string }
interface LinksAction  { type: 'links';  links: Array<{ url: string; label: string }> }
interface SQLAction    { type: 'sql';    sql: string; dashboardUrl: string }
interface InfoAction   { type: 'info';   rows: Array<{ label: string; value: string; secret?: boolean }> }
interface NoteAction   { type: 'note';   text: string }

type TaskAction = EmailAction | SMSAction | LinkAction | LinksAction | SQLAction | InfoAction | NoteAction;

interface ActionCard {
  id: string;
  priority: Priority;
  title: string;
  context: string;
  actions: TaskAction[];
}

// ─── Content ─────────────────────────────────────────────────────────────────

const JOHN_EMAIL_BODY = `Hi John,

Hope you're well. I put together two things based on our conversation — proposal and a full market analysis:

1. The proposal — scope, timeline, and investment:
https://atlantic-laser-v2.vercel.app

2. The full Insight Report — everything we found on your market:
https://al-insight-report.vercel.app

With your laser cleaning launch coming up, timing matters. Happy to jump on a quick call this week.

— Zev
askzev.ai | hello@askzev.ai`;

const ZION_TEXT = `Hey Zion — been heads down on some new work and wanted to circle back. Rebuilt your proposal with updated pricing and also put together something I think you're going to like.

Two links for you:

Updated proposal: https://zion-v2-deploy.vercel.app

And a working prototype of that customer decision tool we talked about: https://bay-state-decision-tool.vercel.app

Take a look and let me know what you think. Happy to jump on a call this week.`;

const LISA_TEXT = `Hey Lisa — just wanted to check in and see if you'd had a chance to look at the proposal. No rush at all, I know you're managing a lot right now.

I built the tiers specifically so you could start at whatever level feels right — honestly even the Starter Tier would give you consistent social content without you having to write a single post from scratch, and we're talking a few hundred bucks a month, not agency rates.

The thing that keeps standing out to me is that 173K Facebook audience sitting there dormant. That's a remarketing pool most businesses would pay a lot of money to build, and you already have it. Even just getting consistent content going again would start warming them up before we ever spent a dollar on ads.

If it helps to talk through any of it — even just a 20-minute call — happy to do that. And if the timing isn't right right now, totally get it.

— Zev`;

const SUPABASE_ZEV_AI_SQL = `DO $$ BEGIN
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

const SUPABASE_STEINMETZ_SQL = `-- Steinmetz DB migration
-- Run in Steinmetz Supabase project SQL editor
DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS soi_tier text;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_status text DEFAULT 'pending';
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS skyslope_id text;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS skyslope_synced_at timestamptz;
EXCEPTION WHEN others THEN NULL;
END $$;`;

const ACTION_ITEMS: ActionCard[] = [

  // ══════════════════════════════════════════════════════════════
  // URGENT
  // ══════════════════════════════════════════════════════════════
  {
    id: 'john-email',
    priority: 'urgent',
    title: "Send John's email",
    context: "Atlantic Laser — proposal + Insight Report are live. He needs to see them before his laser cleaning launch. Warm intro through Zev's father.",
    actions: [
      {
        type: 'email',
        to: 'jonathanproctor68@gmail.com',
        subject: 'Your Atlantic Laser proposal — two things to review',
        body: JOHN_EMAIL_BODY,
      },
      {
        type: 'links',
        links: [
          { url: 'https://atlantic-laser-v2.vercel.app', label: 'Proposal →' },
          { url: 'https://al-insight-report.vercel.app', label: 'Insight Report →' },
        ],
      },
    ],
  },
  {
    id: 'zion-text',
    priority: 'urgent',
    title: 'Text Zion',
    context: "Bay State — rebuilt proposal + decision tool prototype are ready. He's been waiting. Include both links.",
    actions: [
      {
        type: 'sms',
        body: ZION_TEXT,
      },
      {
        type: 'links',
        links: [
          { url: 'https://zion-v2-deploy.vercel.app', label: 'Proposal →' },
          { url: 'https://bay-state-decision-tool.vercel.app', label: 'Decision Tool →' },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // TODAY
  // ══════════════════════════════════════════════════════════════
  {
    id: 'lisa-text',
    priority: 'today',
    title: 'Send Lisa follow-up text',
    context: "Close friend. Proposal sent a few days ago. Casual check-in, no pressure — don't wait too long. 173K Facebook audience, dormant.",
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
    title: 'Run Supabase migration (zev-ai)',
    context: 'Adds 3 columns to the discoveries table: phone, free_summary_content, discovery_page_url. How to do it: (1) Click "Open Supabase" below. (2) You\'ll see a blank SQL editor. (3) Click "Copy SQL" and paste it in. (4) Click the green Run button top-right. (5) You should see "Success. No rows returned." — you\'re done.',
    actions: [
      {
        type: 'sql',
        sql: SUPABASE_ZEV_AI_SQL,
        dashboardUrl: 'https://supabase.com/dashboard/project/ctrzkvdqkcqgejaedkbr/sql/new',
      },
    ],
  },
  {
    id: 'buffer-linkedin',
    priority: 'today',
    title: 'Connect askzev.ai accounts in Buffer · schedule 20 posts',
    context: '20 LinkedIn posts are written and ready. Connect askzev.ai accounts in Buffer, then schedule them out.',
    actions: [
      {
        type: 'link',
        url: 'https://buffer.com',
        label: 'Open Buffer →',
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
    id: 'steinmetz-nurture',
    priority: 'today',
    title: 'Review + approve nurture emails (Steinmetz)',
    context: '98 nurture emails pending approval on the Steinmetz dashboard. These are sitting in queue — approve or edit them so they can go out.',
    actions: [
      {
        type: 'link',
        url: 'https://steinmetz-real-estate.vercel.app/admin',
        label: 'Open Steinmetz Dashboard →',
      },
      {
        type: 'note',
        text: 'Go to CRM → Nurture → Pending Queue. Review each email, edit if needed, then approve. 98 total.',
      },
    ],
  },
  {
    id: 'steinmetz-vercel',
    priority: 'today',
    title: 'Fix Vercel deploy for Steinmetz',
    context: "Steinmetz site deploy is broken. Fix requires deleting the project in Vercel and recreating it. Zev needs to do this himself — he owns the account.",
    actions: [
      {
        type: 'link',
        url: 'https://vercel.com/dashboard',
        label: 'Open Vercel Dashboard →',
      },
      {
        type: 'note',
        text: "Steps: (1) Go to Vercel dashboard → find steinmetz-real-estate project → Settings → Delete Project. (2) Import the repo again from GitHub (zev330-lab/steinmetz-real-estate). (3) Set env vars from .env.production. (4) Deploy.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // THIS WEEK
  // ══════════════════════════════════════════════════════════════
  {
    id: 'limitless-pendant',
    priority: 'week',
    title: 'Order Limitless Pendant',
    context: 'Best wearable for AI context capture. Only one with a real API for auto-pushing meeting transcripts. $99 device + $19/month subscription.',
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
    priority: 'week',
    title: 'Upgrade ElevenLabs to Creator plan',
    context: 'Voice replies are paused — quota exceeded. Creator plan is $22/month for 100K chars. Needed for voice storytelling and audio features.',
    actions: [
      {
        type: 'link',
        url: 'https://elevenlabs.io/app/billing',
        label: 'Upgrade to Creator ($22/mo) →',
      },
    ],
  },
  {
    id: 'security-vendors',
    priority: 'week',
    title: 'Submit remaining security vendors',
    context: 'Norton, Talos, Palo Alto, Trend Micro, and Kaspersky still need submissions. Part of the security vendor outreach campaign.',
    actions: [
      {
        type: 'links',
        links: [
          { url: 'https://safeweb.norton.com/report', label: 'Norton →' },
          { url: 'https://talosintelligence.com/reputation_center', label: 'Talos →' },
          { url: 'https://urlfiltering.paloaltonetworks.com', label: 'Palo Alto →' },
          { url: 'https://global.sitesafety.trendmicro.com', label: 'Trend Micro →' },
          { url: 'https://opentip.kaspersky.com', label: 'Kaspersky →' },
        ],
      },
    ],
  },
  {
    id: 'steinmetz-supabase-migration',
    priority: 'week',
    title: 'Run Supabase migration (Steinmetz)',
    context: 'Steinmetz DB needs columns for SOI tier, last contacted, nurture status, and Skyslope sync fields. Run in Steinmetz Supabase project.',
    actions: [
      {
        type: 'sql',
        sql: SUPABASE_STEINMETZ_SQL,
        dashboardUrl: 'https://supabase.com/dashboard/projects',
      },
      {
        type: 'note',
        text: 'Make sure you select the STEINMETZ project — not zev-ai — in the Supabase dashboard before running.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // BACKLOG / DISCUSS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'soi-cultivation',
    priority: 'backlog',
    title: 'SOI cultivation strategy — Steinmetz contacts',
    context: "3,400 contacts in the Steinmetz CRM need categorization into SOI tiers. This is the foundation for the entire nurture program. Needs a strategy session before building.",
    actions: [
      {
        type: 'note',
        text: 'Proposed approach: (1) Export contacts from CRM. (2) Claude-powered categorization pass — Tier A (warm, likely to transact), Tier B (relationship, stay warm), Tier C (cold/dormant). (3) Zev reviews and adjusts. (4) Tier assignments power the nurture sequences. Discuss before building.',
      },
    ],
  },
  {
    id: 'skyslope-sync',
    priority: 'backlog',
    title: 'Skyslope sync automation',
    context: "Sarina's credentials are saved, sync script is ready. Waiting on Zev to confirm before activating the automated overnight transaction sync.",
    actions: [
      {
        type: 'note',
        text: "Script is at /scripts/skyslope-sync.ts. Credentials stored in TOOLS.md. Needs: (1) Zev confirms it's ready to activate. (2) Test run on one transaction. (3) Set up as nightly cron.",
      },
    ],
  },
  {
    id: 'kabbalahq',
    priority: 'backlog',
    title: 'KabbalahQ.ai — waiting on Zev',
    context: 'Zev will advise when ready to resume. Parked for now.',
    actions: [
      {
        type: 'note',
        text: 'No action needed. Zev will kick this off when the time is right. The repo is at zev330-lab/kabbalahq.',
      },
    ],
  },
  {
    id: 'blank-industries',
    priority: 'backlog',
    title: 'Blank Industries retainer',
    context: 'Zev is managing this engagement independently. No action for Cain at this time.',
    actions: [
      {
        type: 'note',
        text: 'Zev managing directly. Check in if Zev asks for a status update or needs deliverables prepped.',
      },
    ],
  },
];

const RECENT_WORK = [
  'Zion Bay State proposal rebuilt from source docs (zion-bay-state-final.html)',
  'Atlantic Laser proposal rebuilt from source docs (john-atlantic-laser-final.html)',
  'Homepage copy rewritten — anxiety approach + origin story, removed agent jargon',
  'Promo code "ZevGT3" added to /discover form (friends & family → free Insight Report)',
  'Cain dashboard rebuilt — comprehensive task list, all priorities',
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
  'Zion Bay State decision tool prototype live',
  'Zev headshot added to About page',
  'PWA manifest added (add to home screen)',
  'TOLA client workflow spec written',
  'Wearable AI comparison written',
  '20 LinkedIn posts written for askzev.ai',
];

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent:  { emoji: '🔴', label: 'Urgent',      color: 'text-red-400',     border: 'border-red-500/30',    bg: 'bg-red-500/5' },
  today:   { emoji: '🟡', label: 'Today',       color: 'text-amber-400',   border: 'border-amber-500/30',  bg: 'bg-amber-500/5' },
  week:    { emoji: '🔵', label: 'This Week',   color: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-500/5' },
  backlog: { emoji: '⚪', label: 'Backlog',     color: 'text-zinc-400',    border: 'border-[var(--color-admin-border)]', bg: 'bg-[var(--color-admin-surface)]' },
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
    return (
      <div className="flex flex-col gap-3">
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

function TaskCard({ item }: { item: ActionCard }) {
  const [done, setDone] = useState(false);
  const cfg = PRIORITY_CONFIG[item.priority];

  return (
    <div className={`rounded-xl border p-4 transition-opacity ${cfg.border} ${cfg.bg} ${done ? 'opacity-40' : ''}`}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CainPage() {
  const urgent  = ACTION_ITEMS.filter(a => a.priority === 'urgent');
  const today   = ACTION_ITEMS.filter(a => a.priority === 'today');
  const week    = ACTION_ITEMS.filter(a => a.priority === 'week');
  const backlog = ACTION_ITEMS.filter(a => a.priority === 'backlog');

  const urgentCount = urgent.length;
  const todayCount  = today.length;
  const weekCount   = week.length;
  const backlogCount = backlog.length;

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {/* ── Page header ── */}
      <div className="sticky top-0 z-10 bg-[var(--color-admin-bg)]/95 backdrop-blur-sm border-b border-[var(--color-admin-border)] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🗡️</span>
            <div>
              <h1 className="text-sm font-bold text-[var(--color-foreground-strong)]">Cain</h1>
              <p className="text-[11px] text-[var(--color-muted)]">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] flex-wrap justify-end">
            <span className="text-red-400 font-semibold">{urgentCount} urgent</span>
            <span className="text-[var(--color-muted)]">·</span>
            <span className="text-amber-400 font-semibold">{todayCount} today</span>
            <span className="text-[var(--color-muted)]">·</span>
            <span className="text-blue-400 font-semibold">{weekCount} this week</span>
            <span className="text-[var(--color-muted)]">·</span>
            <span className="text-zinc-400">{backlogCount} backlog</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-10 pb-16">

        {/* ── FOR YOU ── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-5">
            For You · {ACTION_ITEMS.length} items
          </h2>

          {/* Urgent */}
          {urgent.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🔴" label="Urgent" count={urgentCount} color="text-red-400" />
              <div className="space-y-3">
                {urgent.map(item => <TaskCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {/* Today */}
          {today.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🟡" label="Today" count={todayCount} color="text-amber-400" />
              <div className="space-y-3">
                {today.map(item => <TaskCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {/* This Week */}
          {week.length > 0 && (
            <div className="mb-6">
              <SectionHeader emoji="🔵" label="This Week" count={weekCount} color="text-blue-400" />
              <div className="space-y-3">
                {week.map(item => <TaskCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {/* Backlog */}
          {backlog.length > 0 && (
            <div>
              <SectionHeader emoji="⚪" label="Backlog / Discuss" count={backlogCount} color="text-zinc-400" />
              <div className="space-y-3">
                {backlog.map(item => <TaskCard key={item.id} item={item} />)}
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
