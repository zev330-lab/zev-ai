import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidSession } from '@/lib/auth';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

const SYSTEM_PROMPT = `You are the AI assistant for the zev.ai admin dashboard. You help Zev Steinmetz manage his AI consulting practice and the TOLA agent framework.

TOLA ARCHITECTURE:
- 11 agents: Crown (governance), Visionary (research), Architect (planning), Oracle (synthesis), Guardian (validation), Nexus (routing), Catalyst (engagement), Sentinel (monitoring), Prism (testing), Foundation (infrastructure), Gateway (application)
- 22 communication pathways connecting agents via Tree of Life topology
- 3-tier decision model: Tier 1 autonomous (80%), Tier 2 notify (15%), Tier 3 full stop (5%)

PIPELINES:
- Assessment: Discovery form → Guardian validates → Visionary researches (Claude + web_search) → Architect scopes → Oracle synthesizes meeting prep
- Content: topic_research → outlining → drafting → reviewing → social_gen → human review → published
- Social: Daily generation → admin approve → distributor posts to platforms (Twitter, LinkedIn, Instagram, Threads, TikTok)
- Proposal: After assessment pipeline, generates professional SOW

ADMIN SECTIONS:
- TOLA: Live React Flow visualization of all 11 agents and 22 paths
- Dashboard: Stats, pipeline breakdown, activity feed, cross-module alerts
- Discoveries: Assessment pipeline management with 5-tab detail view
- Content: Blog posts + social queue, calendar/list view, cost optimization toggle
- Projects: Card grid with milestones, time tracking
- Finance: Revenue, invoices, Recharts charts
- Family: Kanban tasks, events, notes
- Knowledge: pgvector search, sync from discoveries/blog
- Agents: Status cards, kill switches, manual triggers
- Contacts: CRM with pipeline statuses

TECH STACK: Next.js 16, TypeScript, Tailwind v4, Supabase, Claude API, Resend, Vercel

Be direct and concise. Zev is technical — don't over-explain. Help with content drafting, data analysis, architecture decisions, troubleshooting, and planning. If asked about data you don't have, suggest checking the relevant admin page.`;

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Keep full conversation context for admin (up to 20 messages)
    const trimmed = messages.slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: trimmed,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: `Claude API error: ${res.status}`, details: err }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || 'No response generated.';
    const usage = data.usage || {};

    return NextResponse.json({ response: text, usage });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat error' },
      { status: 500 },
    );
  }
}
