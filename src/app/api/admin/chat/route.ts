import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { tokensToCost, formatCost } from '@/lib/cost-utils';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

// ---------------------------------------------------------------------------
// Tool definitions — each maps to a Supabase query or admin action
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'search_contacts',
    description: 'Search contacts by name, email, company, or status. Returns matching contacts with their details.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term (name, email, or company)' },
        status: { type: 'string', description: 'Filter by status: new, researched, meeting_scheduled, proposal_sent, client, archived' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'search_discoveries',
    description: 'Search discoveries (assessment pipeline submissions). Filter by pipeline status, company, or name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term (name, company, or email)' },
        pipeline_status: { type: 'string', description: 'Filter: pending, researching, scoping, synthesizing, complete, failed' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'get_projects',
    description: 'List projects with hours, milestones, and workspace metadata. Filter by status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Filter: active, paused, completed, archived' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'get_invoices',
    description: 'List invoices with amounts, status, and client info. Filter by status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Filter: draft, sent, paid, overdue' },
        client_name: { type: 'string', description: 'Filter by client name' },
        limit: { type: 'number', description: 'Max results (default 15)' },
      },
    },
  },
  {
    name: 'get_family_data',
    description: 'Get family tasks, events, and notes. Filter by type and status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: { type: 'string', description: 'Data type: tasks, events, notes, or all (default all)' },
        include_done: { type: 'boolean', description: 'Include completed tasks (default false)' },
      },
    },
  },
  {
    name: 'get_agents',
    description: 'Get TOLA agent status, health, and recent activity.',
    input_schema: {
      type: 'object' as const,
      properties: {
        agent_name: { type: 'string', description: 'Specific agent to query (e.g., guardian, visionary)' },
      },
    },
  },
  {
    name: 'get_blog_posts',
    description: 'List blog posts with status, category, and performance info.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Filter: draft, review, published, archived' },
        category: { type: 'string', description: 'Filter by content pillar category' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'get_social_queue',
    description: 'List social media posts in the queue. Filter by platform or status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        platform: { type: 'string', description: 'Filter: linkedin, twitter, instagram, tiktok, threads' },
        status: { type: 'string', description: 'Filter: draft, approved, scheduled, posted, failed' },
        limit: { type: 'number', description: 'Max results (default 15)' },
      },
    },
  },
  {
    name: 'search_knowledge',
    description: 'Search the knowledge base for insights, meeting notes, articles, and lessons.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term' },
        source: { type: 'string', description: 'Filter: meeting, voice_memo, article, insight, lesson, discovery' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'get_dashboard_stats',
    description: 'Get dashboard statistics: discovery counts, agent health, costs, pipeline breakdown, alerts.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'create_family_task',
    description: 'Create a new family task. Returns the created task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        priority: { type: 'string', description: 'Priority: low, medium, high, urgent (default medium)' },
        due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        assigned_to_name: { type: 'string', description: 'Family member name: Zev, Irit, Havi, Parker, Allan, Sarina' },
      },
      required: ['title'],
    },
  },
  {
    name: 'log_project_time',
    description: 'Log time to a project. Requires project name (will fuzzy match) and hours.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_name: { type: 'string', description: 'Project name (fuzzy matched)' },
        hours: { type: 'number', description: 'Hours worked' },
        description: { type: 'string', description: 'What was done' },
        billable: { type: 'boolean', description: 'Whether billable (default true)' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD (default today)' },
      },
      required: ['project_name', 'hours'],
    },
  },
  {
    name: 'create_knowledge_entry',
    description: 'Add an entry to the knowledge base (insight, lesson, meeting note, etc.).',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Entry title' },
        content: { type: 'string', description: 'Entry content' },
        source: { type: 'string', description: 'Source type: meeting, voice_memo, article, insight, lesson, discovery' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'update_contact_status',
    description: 'Update a contact\'s status in the CRM pipeline.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_email: { type: 'string', description: 'Contact email to find' },
        contact_name: { type: 'string', description: 'Contact name to find (if email not known)' },
        status: { type: 'string', description: 'New status: new, researched, meeting_scheduled, proposal_sent, client, archived' },
        notes: { type: 'string', description: 'Notes to append' },
      },
      required: ['status'],
    },
  },
  {
    name: 'trigger_agent',
    description: 'Manually trigger a TOLA agent edge function. Use for running assessments, content generation, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        agent_name: {
          type: 'string',
          description: 'Agent function name: pipeline-guardian, pipeline-visionary, pipeline-architect, pipeline-oracle, pipeline-proposal, pipeline-content-engine, pipeline-social-agent, tola-agent, agent-nexus, agent-guardian-bg, agent-crown, agent-prism, agent-catalyst-bg, agent-gateway, agent-foundation-bg',
        },
      },
      required: ['agent_name'],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution — each function queries Supabase or performs an action
// ---------------------------------------------------------------------------

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  switch (name) {
    case 'search_contacts': {
      const limit = (input.limit as number) || 10;
      let query = supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(limit);
      if (input.query) query = query.or(`name.ilike.%${input.query}%,email.ilike.%${input.query}%,company.ilike.%${input.query}%`);
      if (input.status) query = query.eq('status', input.status);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return 'No contacts found.';
      return JSON.stringify(data.map(c => ({ id: c.id, name: c.name, email: c.email, company: c.company, status: c.status, message: c.message?.slice(0, 200), notes: c.notes, created_at: c.created_at })), null, 2);
    }

    case 'search_discoveries': {
      const limit = (input.limit as number) || 10;
      let query = supabase.from('discoveries').select('id, name, email, company, pipeline_status, pipeline_error, progress_pct, pain_points, budget_range, timeline, created_at, updated_at').order('created_at', { ascending: false }).limit(limit);
      if (input.query) query = query.or(`name.ilike.%${input.query}%,company.ilike.%${input.query}%,email.ilike.%${input.query}%`);
      if (input.pipeline_status) query = query.eq('pipeline_status', input.pipeline_status);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return 'No discoveries found.';
      return JSON.stringify(data, null, 2);
    }

    case 'get_projects': {
      const limit = (input.limit as number) || 20;
      let query = supabase.from('projects').select('id, name, client, status, description, tech_stack, last_commit_date, last_commit_message, git_branch, deployed_url, github_url').order('updated_at', { ascending: false }).limit(limit);
      if (input.status) query = query.eq('status', input.status);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return 'No projects found.';

      // Add hours and milestones
      const ids = data.map(p => p.id);
      const [{ data: milestones }, { data: entries }] = await Promise.all([
        supabase.from('project_milestones').select('project_id, status').in('project_id', ids),
        supabase.from('project_time_entries').select('project_id, hours').in('project_id', ids),
      ]);
      const enriched = data.map(p => {
        const pm = (milestones || []).filter(m => m.project_id === p.id);
        const pe = (entries || []).filter(e => e.project_id === p.id);
        return { ...p, milestones: `${pm.filter(m => m.status === 'complete').length}/${pm.length}`, total_hours: pe.reduce((s, e) => s + Number(e.hours), 0) };
      });
      return JSON.stringify(enriched, null, 2);
    }

    case 'get_invoices': {
      const limit = (input.limit as number) || 15;
      let query = supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(limit);
      if (input.status) query = query.eq('status', input.status);
      if (input.client_name) query = query.ilike('client_name', `%${input.client_name}%`);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return 'No invoices found.';
      return JSON.stringify(data, null, 2);
    }

    case 'get_family_data': {
      const type = (input.type as string) || 'all';
      const results: Record<string, unknown> = {};

      if (type === 'all' || type === 'tasks') {
        let tq = supabase.from('family_tasks').select('*, family_members(name)').order('created_at', { ascending: false });
        if (!input.include_done) tq = tq.neq('status', 'done');
        const { data } = await tq.limit(20);
        results.tasks = data || [];
      }
      if (type === 'all' || type === 'events') {
        const { data } = await supabase.from('family_events').select('*').gte('date', todayISO).order('date').limit(10);
        results.events = data || [];
      }
      if (type === 'all' || type === 'notes') {
        const { data } = await supabase.from('family_notes').select('*').order('created_at', { ascending: false }).limit(10);
        results.notes = data || [];
      }
      return JSON.stringify(results, null, 2);
    }

    case 'get_agents': {
      let query = supabase.from('tola_agents').select('*');
      if (input.agent_name) query = query.ilike('display_name', `%${input.agent_name}%`);
      const { data: agents, error } = await query;
      if (error) return `Error: ${error.message}`;

      // Get recent logs for context
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: logs } = await supabase.from('tola_agent_log').select('agent_id, action, tokens_used, created_at').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(50);

      const enriched = (agents || []).map(a => {
        const agentLogs = (logs || []).filter(l => l.agent_id === a.id);
        const heartbeatAge = a.last_heartbeat ? Math.round((now.getTime() - new Date(a.last_heartbeat).getTime()) / 60000) : null;
        return {
          display_name: a.display_name, status: a.status, is_active: a.is_active,
          kill_switch: a.kill_switch, tier: a.tier,
          heartbeat_age_mins: heartbeatAge,
          actions_7d: agentLogs.length,
          tokens_7d: agentLogs.reduce((s, l) => s + (l.tokens_used || 0), 0),
        };
      });
      return JSON.stringify(enriched, null, 2);
    }

    case 'get_blog_posts': {
      const limit = (input.limit as number) || 10;
      let query = supabase.from('blog_posts').select('id, title, slug, status, category, tags, reading_time_min, created_at, published_at, updated_at').order('created_at', { ascending: false }).limit(limit);
      if (input.status) query = query.eq('status', input.status);
      if (input.category) query = query.eq('category', input.category);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return 'No blog posts found.';
      return JSON.stringify(data, null, 2);
    }

    case 'get_social_queue': {
      const limit = (input.limit as number) || 15;
      let query = supabase.from('social_queue').select('id, platform, status, content, content_pillar, scheduled_for, posted_at, publish_error, created_at').order('created_at', { ascending: false }).limit(limit);
      if (input.platform) query = query.eq('platform', input.platform);
      if (input.status) query = query.eq('status', input.status);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return 'No social posts found.';
      return JSON.stringify(data.map(p => ({ ...p, content: p.content?.slice(0, 200) })), null, 2);
    }

    case 'search_knowledge': {
      const limit = (input.limit as number) || 10;
      let query = supabase.from('knowledge_entries').select('id, title, content, source, tags, created_at').order('created_at', { ascending: false }).limit(limit);
      if (input.query) query = query.or(`title.ilike.%${input.query}%,content.ilike.%${input.query}%`);
      if (input.source) query = query.eq('source', input.source);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return 'No knowledge entries found.';
      return JSON.stringify(data.map(k => ({ ...k, content: k.content?.slice(0, 300) })), null, 2);
    }

    case 'get_dashboard_stats': {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [
        { data: discoveries }, { data: agents }, { data: logs },
        { data: invoices }, { data: tasks }, { data: blogPosts },
      ] = await Promise.all([
        supabase.from('discoveries').select('pipeline_status, progress_pct, created_at'),
        supabase.from('tola_agents').select('display_name, status, kill_switch, is_active, last_heartbeat'),
        supabase.from('tola_agent_log').select('tokens_used, created_at').gte('created_at', sevenDaysAgo),
        supabase.from('invoices').select('status, amount, due_date'),
        supabase.from('family_tasks').select('status, due_date').neq('status', 'done'),
        supabase.from('blog_posts').select('status'),
      ]);

      const todayLogs = (logs || []).filter(l => l.created_at >= now.toISOString().slice(0, 10));
      const totalTokens7d = (logs || []).reduce((s, l) => s + (l.tokens_used || 0), 0);
      const pipelineStats: Record<string, number> = {};
      (discoveries || []).forEach(d => { pipelineStats[d.pipeline_status || 'none'] = (pipelineStats[d.pipeline_status || 'none'] || 0) + 1; });

      const overdueInvoices = (invoices || []).filter(i => i.status === 'overdue' || (i.status === 'sent' && i.due_date && i.due_date < todayISO));
      const outstandingTotal = (invoices || []).filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);
      const overdueTasks = (tasks || []).filter(t => t.due_date && t.due_date <= todayISO);
      const activeAgents = (agents || []).filter(a => a.status !== 'offline' && !a.kill_switch).length;

      return JSON.stringify({
        discoveries: { total: discoveries?.length || 0, by_stage: pipelineStats },
        agents: { active: activeAgents, total: agents?.length || 0 },
        costs: { today: formatCost(tokensToCost(todayLogs.reduce((s, l) => s + (l.tokens_used || 0), 0))), seven_day: formatCost(tokensToCost(totalTokens7d)) },
        actions: { today: todayLogs.length, seven_day: logs?.length || 0 },
        finance: { outstanding: `$${outstandingTotal.toLocaleString()}`, overdue_invoices: overdueInvoices.length },
        family: { overdue_tasks: overdueTasks.length, pending_tasks: (tasks || []).filter(t => t.status === 'pending').length },
        content: { published: (blogPosts || []).filter(p => p.status === 'published').length, drafts: (blogPosts || []).filter(p => ['draft', 'review'].includes(p.status)).length },
      }, null, 2);
    }

    // ---- Write operations ----

    case 'create_family_task': {
      const { title, description, priority, due_date, assigned_to_name } = input as Record<string, string>;
      let assigned_to = null;
      if (assigned_to_name) {
        const { data: member } = await supabase.from('family_members').select('id').ilike('name', assigned_to_name).maybeSingle();
        assigned_to = member?.id || null;
      }
      const { data, error } = await supabase.from('family_tasks').insert({
        title, description: description || null, priority: priority || 'medium',
        due_date: due_date || null, assigned_to, status: 'pending',
        created_by_context: 'admin_chat',
      }).select().single();
      if (error) return `Error creating task: ${error.message}`;
      return `Task created: "${data.title}" (priority: ${data.priority}${data.due_date ? `, due: ${data.due_date}` : ''})`;
    }

    case 'log_project_time': {
      const { project_name, hours, description, billable, date } = input as { project_name: string; hours: number; description?: string; billable?: boolean; date?: string };
      // Fuzzy find project
      const { data: projects } = await supabase.from('projects').select('id, name').ilike('name', `%${project_name}%`);
      if (!projects?.length) return `No project found matching "${project_name}". Available projects: check get_projects.`;
      const project = projects[0];
      const { error } = await supabase.from('project_time_entries').insert({
        project_id: project.id, hours, description: description || null,
        billable: billable !== false, date: date || todayISO,
      });
      if (error) return `Error logging time: ${error.message}`;
      return `Logged ${hours}h to "${project.name}"${description ? ` — ${description}` : ''}`;
    }

    case 'create_knowledge_entry': {
      const { title, content, source, tags } = input as { title: string; content: string; source?: string; tags?: string[] };
      const { data, error } = await supabase.from('knowledge_entries').insert({
        title, content, source: source || 'insight', tags: tags || [],
      }).select().single();
      if (error) return `Error creating entry: ${error.message}`;
      return `Knowledge entry created: "${data.title}" (source: ${data.source})`;
    }

    case 'update_contact_status': {
      const { contact_email, contact_name, status, notes } = input as Record<string, string>;
      let query = supabase.from('contacts').select('id, name, email, status');
      if (contact_email) query = query.ilike('email', contact_email);
      else if (contact_name) query = query.ilike('name', `%${contact_name}%`);
      else return 'Error: provide contact_email or contact_name';
      const { data: contacts } = await query.limit(1);
      if (!contacts?.length) return 'Contact not found.';
      const contact = contacts[0];
      const updates: Record<string, unknown> = { status };
      if (notes) updates.notes = (contact as { notes?: string }).notes ? `${(contact as { notes?: string }).notes}\n${notes}` : notes;
      const { error } = await supabase.from('contacts').update(updates).eq('id', contact.id);
      if (error) return `Error updating contact: ${error.message}`;
      return `Updated ${contact.name} (${contact.email}) status: ${(contact as { status: string }).status} → ${status}`;
    }

    case 'trigger_agent': {
      const agentName = input.agent_name as string;
      const VALID_AGENTS = [
        'pipeline-guardian', 'pipeline-visionary', 'pipeline-architect', 'pipeline-oracle',
        'pipeline-proposal', 'pipeline-content-engine', 'pipeline-social-agent', 'tola-agent',
        'agent-nexus', 'agent-guardian-bg', 'agent-crown', 'agent-prism',
        'agent-catalyst-bg', 'agent-gateway', 'agent-foundation-bg',
      ];
      if (!VALID_AGENTS.includes(agentName)) return `Invalid agent. Valid agents: ${VALID_AGENTS.join(', ')}`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) return 'Error: Supabase config missing';
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/${agentName}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggered_by: 'admin_chat' }),
        });
        if (!res.ok) return `Agent ${agentName} returned ${res.status}: ${await res.text()}`;
        return `Agent ${agentName} triggered successfully.`;
      } catch (err) {
        return `Error triggering agent: ${err instanceof Error ? err.message : 'unknown'}`;
      }
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are TOLA — Zev's AI operating system inside the zev.ai admin dashboard. You are agentic: you have tools to read AND write data across all modules.

CAPABILITIES:
- Search contacts, discoveries, projects, invoices, blog posts, social queue, knowledge base
- Create family tasks, log project time, create knowledge entries
- Update contact statuses
- Trigger TOLA agent functions (assessment pipeline, content generation, etc.)
- Get dashboard stats and agent health

BEHAVIOR:
- Be direct, specific, and actionable. Zev is technical — no hand-holding
- When asked "what should I prioritize?", USE the get_dashboard_stats tool first, then give a ranked list
- When asked about a person/company, search contacts AND discoveries
- When asked to prep for a meeting, search contacts + discoveries + knowledge base, then synthesize
- For write actions (creating tasks, logging time), confirm what you did
- Show specific names, numbers, and statuses — never say "I don't have access"
- Use multiple tools when needed to give comprehensive answers
- When listing items, be concise: name + key detail, not full JSON dumps

PRIORITY ORDER for recommendations:
1. Revenue-blocking: stalled pipelines, unsent proposals, overdue invoices
2. Time-sensitive: overdue tasks, upcoming meetings/events
3. Growth: content to approve, leads to follow up, social posts to publish
4. Maintenance: agent health, system costs

You are the central nervous system of Zev's business. Act like a chief of staff.`;

// ---------------------------------------------------------------------------
// Agentic loop: call Claude, execute tools, repeat until done
// ---------------------------------------------------------------------------

const MAX_TOOL_ROUNDS = 5;

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

    // Build conversation history — keep last 20 messages
    const conversationMessages = messages.slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    let totalTokens = 0;
    const toolCallLog: { tool: string; input: Record<string, unknown>; result: string }[] = [];

    // Agentic loop
    let currentMessages = [...conversationMessages];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
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
          tools: TOOLS,
          messages: currentMessages,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({ error: `Claude API error: ${res.status}`, details: err }, { status: 502 });
      }

      const data = await res.json();
      totalTokens += (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      // Check if there are tool use blocks
      const toolUseBlocks = (data.content || []).filter((b: { type: string }) => b.type === 'tool_use');
      const textBlocks = (data.content || []).filter((b: { type: string }) => b.type === 'text');

      if (toolUseBlocks.length === 0 || data.stop_reason === 'end_turn') {
        // No more tools to call — return final text
        const responseText = textBlocks.map((b: { text: string }) => b.text).join('\n');
        return NextResponse.json({
          response: responseText || 'Done.',
          tool_calls: toolCallLog,
          usage: { total_tokens: totalTokens, cost: formatCost(tokensToCost(totalTokens)) },
        });
      }

      // Execute tools and build tool results
      const toolResults: { type: 'tool_result'; tool_use_id: string; content: string }[] = [];

      for (const toolBlock of toolUseBlocks) {
        const { id, name, input } = toolBlock;
        const result = await executeTool(name, input || {});
        toolResults.push({ type: 'tool_result', tool_use_id: id, content: result });
        toolCallLog.push({ tool: name, input: input || {}, result: result.slice(0, 500) });
      }

      // Add assistant message (with tool use) and tool results for next round
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: data.content },
        { role: 'user', content: toolResults },
      ];
    }

    // If we hit max rounds, return whatever text we have
    return NextResponse.json({
      response: 'I gathered a lot of data but hit my processing limit. Here\'s what I found — ask me to continue if you need more.',
      tool_calls: toolCallLog,
      usage: { total_tokens: totalTokens, cost: formatCost(tokensToCost(totalTokens)) },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat error' },
      { status: 500 },
    );
  }
}
