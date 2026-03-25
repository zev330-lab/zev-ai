import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

// POST /api/cain/push-task
// Inserts a new task into cain_tasks. Authenticated via:
//   - x-api-key header matching CAIN_API_KEY env var (for programmatic use by Cain)
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

  const { title, context, priority, actions } = body as {
    title?: string;
    context?: string;
    priority?: string;
    actions?: unknown[];
  };

  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const validPriorities = ['urgent', 'today', 'week', 'backlog'];
  const taskPriority = priority && validPriorities.includes(priority) ? priority : 'today';

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('cain_tasks')
    .insert({
      title: title.trim(),
      context: context?.trim() ?? null,
      priority: taskPriority,
      actions: Array.isArray(actions) ? actions : [],
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
