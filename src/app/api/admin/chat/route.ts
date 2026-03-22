import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { tokensToCost, formatCost } from '@/lib/cost-utils';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

async function getLiveContext(): Promise<string> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: discoveries },
    { data: contacts },
    { data: agents },
    { data: blogPosts },
    { data: socialQueue },
    { data: invoices },
    { data: familyTasks },
    { data: familyEvents },
    { data: recentLogs },
    { count: actionsToday },
  ] = await Promise.all([
    supabase.from('discoveries').select('id, name, company, email, pipeline_status, pipeline_error, progress_pct, created_at, updated_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('contacts').select('id, name, email, company, status, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('tola_agents').select('id, display_name, status, last_heartbeat, kill_switch, is_active'),
    supabase.from('blog_posts').select('id, title, status, category, created_at, published_at').order('created_at', { ascending: false }).limit(15),
    supabase.from('social_queue').select('id, platform, status, content, scheduled_for').in('status', ['draft', 'approved', 'scheduled']).order('created_at', { ascending: false }).limit(20),
    supabase.from('invoices').select('id, client_name, amount, status, due_date, issued_date').order('created_at', { ascending: false }).limit(15),
    supabase.from('family_tasks').select('id, title, status, priority, due_date, assigned_to, family_members(name)').neq('status', 'done').order('created_at', { ascending: false }).limit(20),
    supabase.from('family_events').select('id, title, date, time_start, time_end, location').gte('date', todayISO.slice(0, 10)).order('date').limit(10),
    supabase.from('tola_agent_log').select('agent_id, action, tokens_used, created_at').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(100),
    supabase.from('tola_agent_log').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
  ]);

  // Compute costs
  const totalTokens7d = (recentLogs || []).reduce((sum, l) => sum + (l.tokens_used || 0), 0);
  const todayTokens = (recentLogs || []).filter(l => l.created_at >= todayISO).reduce((sum, l) => sum + (l.tokens_used || 0), 0);

  // Pipeline stats
  const pipelineStats: Record<string, number> = {};
  (discoveries || []).forEach(d => { pipelineStats[d.pipeline_status || 'none'] = (pipelineStats[d.pipeline_status || 'none'] || 0) + 1; });

  // Agent health
  const healthyAgents = (agents || []).filter(a => a.status !== 'offline' && !a.kill_switch).length;
  const degradedAgents = (agents || []).filter(a => {
    if (!a.last_heartbeat) return false;
    const age = (now.getTime() - new Date(a.last_heartbeat).getTime()) / 60000;
    return age > 10 && a.status !== 'offline';
  });

  // Invoice stats
  const overdueInvoices = (invoices || []).filter(i => i.status === 'overdue' || (i.status === 'sent' && i.due_date && i.due_date < todayISO.slice(0, 10)));
  const outstandingTotal = (invoices || []).filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);

  // Stalled discoveries
  const stalledDiscoveries = (discoveries || []).filter(d => {
    if (!['researching', 'scoping', 'synthesizing'].includes(d.pipeline_status)) return false;
    const age = (now.getTime() - new Date(d.updated_at).getTime()) / 60000;
    return age > 30;
  });

  // Overdue tasks
  const today = todayISO.slice(0, 10);
  const overdueTasks = (familyTasks || []).filter(t => t.due_date && t.due_date <= today && t.status !== 'done');

  // Social queue summary
  const socialDrafts = (socialQueue || []).filter(s => s.status === 'draft').length;
  const socialApproved = (socialQueue || []).filter(s => s.status === 'approved').length;

  // Blog post status
  const publishedPosts = (blogPosts || []).filter(p => p.status === 'published').length;
  const draftPosts = (blogPosts || []).filter(p => p.status === 'draft' || p.status === 'review').length;

  // New contacts this week
  const newContacts = (contacts || []).filter(c => c.created_at >= sevenDaysAgo);

  return `
LIVE DASHBOARD DATA (as of ${now.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET):

SYSTEM:
- ${healthyAgents}/11 agents active, ${degradedAgents.length} degraded
- ${actionsToday ?? 0} agent actions today
- Cost today: ${formatCost(tokensToCost(todayTokens))}, 7-day: ${formatCost(tokensToCost(totalTokens7d))}

DISCOVERIES (${discoveries?.length || 0} total):
${Object.entries(pipelineStats).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
${stalledDiscoveries.length > 0 ? `- STALLED (30+ min): ${stalledDiscoveries.map(d => `${d.company || d.name} (${d.pipeline_status})`).join(', ')}` : '- No stalled pipelines'}
${(discoveries || []).filter(d => d.pipeline_status === 'failed').length > 0 ? `- FAILED: ${(discoveries || []).filter(d => d.pipeline_status === 'failed').map(d => `${d.company || d.name}: ${d.pipeline_error || 'unknown'}`).join(', ')}` : ''}

RECENT DISCOVERIES:
${(discoveries || []).slice(0, 5).map(d => `- ${d.name} (${d.company || 'no company'}) — ${d.pipeline_status} ${d.progress_pct || 0}%`).join('\n')}

CONTACTS (${newContacts.length} new this week):
${(contacts || []).filter(c => c.status === 'new').slice(0, 5).map(c => `- ${c.name} (${c.company || 'no company'}) — ${c.email}`).join('\n') || '- No new contacts'}

FINANCE:
- Outstanding: $${outstandingTotal.toLocaleString()}
- Overdue invoices: ${overdueInvoices.length}${overdueInvoices.length > 0 ? ` — ${overdueInvoices.map(i => `${i.client_name} $${i.amount}`).join(', ')}` : ''}

CONTENT:
- ${publishedPosts} published blog posts, ${draftPosts} drafts/in-review
- Social queue: ${socialDrafts} drafts, ${socialApproved} approved awaiting publish

FAMILY:
- ${overdueTasks.length} overdue tasks${overdueTasks.length > 0 ? `: ${overdueTasks.map(t => t.title).join(', ')}` : ''}
- ${(familyTasks || []).filter(t => t.status === 'pending').length} pending tasks
- Upcoming events: ${(familyEvents || []).slice(0, 3).map(e => `${e.title} (${e.date}${e.time_start ? ' ' + e.time_start.slice(0, 5) : ''})`).join(', ') || 'none'}
`.trim();
}

const BASE_PROMPT = `You are Zev's AI executive assistant inside the zev.ai admin dashboard. You have LIVE access to all dashboard data — discoveries, contacts, invoices, content, family tasks, agent health, and costs.

IMPORTANT: You have real data injected below. Use it to give SPECIFIC, actionable answers. Never say "I don't have access to your data" — you DO. Reference actual names, numbers, and statuses.

When asked "what should I prioritize?", give a ranked list based on:
1. Revenue-blocking items (stalled pipelines, unsent proposals, overdue invoices)
2. Time-sensitive items (overdue tasks, upcoming meetings)
3. Growth items (content to approve, leads to follow up)
4. Maintenance (agent health, system costs)

TOLA ARCHITECTURE: 11 agents (Crown, Visionary, Architect, Oracle, Guardian, Nexus, Catalyst, Sentinel, Prism, Foundation, Gateway) coordinating through 22 pathways. 3-tier decision model.

PIPELINES: Assessment (form → Guardian → Visionary → Architect → Oracle), Content (5-step blog generation), Social (daily platform posting), Proposal (SOW generation).

Be direct, specific, and actionable. Zev is technical — no hand-holding. Use real numbers from the data below.`;

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

    const trimmed = messages.slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    // Pull live data from all admin modules
    let liveContext = '';
    try {
      liveContext = await getLiveContext();
    } catch (e) {
      console.error('Failed to fetch live context:', e);
      liveContext = 'LIVE DATA: Failed to load — answer based on general knowledge.';
    }

    const systemPrompt = `${BASE_PROMPT}\n\n${liveContext}`;

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
        system: systemPrompt,
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
