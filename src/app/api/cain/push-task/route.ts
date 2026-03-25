import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

// POST /api/cain/push-task
// Cain or Abel can push tasks to each other. Authenticated via:
//   - x-api-key header matching CAIN_API_KEY env var (for programmatic use)
//   - admin session cookie (for manual testing)

function isValidApiKey(req: NextRequest): boolean {
  const apiKey = process.env.CAIN_API_KEY;
  if (!apiKey) return false;
  return req.headers.get('x-api-key') === apiKey;
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  if (isValidApiKey(req)) return true;
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, context, priority, actions, created_by, assigned_to } = body as {
    title?: string;
    context?: string;
    priority?: string;
    actions?: unknown[];
    created_by?: string;
    assigned_to?: string;
  };

  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const validPriorities = ['urgent', 'today', 'week', 'backlog'];
  const taskPriority = priority && validPriorities.includes(priority) ? priority : 'today';

  const validAgents = ['cain', 'abel', 'zev'];
  const creator = created_by && validAgents.includes(created_by) ? created_by : 'cain';
  const assignee = assigned_to && validAgents.includes(assigned_to) ? assigned_to : 'zev';

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('cain_tasks')
    .insert({
      title: title.trim(),
      context: context?.trim() ?? null,
      priority: taskPriority,
      actions: Array.isArray(actions) ? actions : [],
      status: 'open',
      created_by: creator,
      assigned_to: assignee,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the task creation
  await supabase.from('cain_log').insert({
    entry: `${creator} pushed task to ${assignee}: ${title.trim()}`,
    created_by: creator,
  });

  return NextResponse.json(data, { status: 201 });
}
