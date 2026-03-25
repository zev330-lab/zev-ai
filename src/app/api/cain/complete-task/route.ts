import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Agent-to-agent task completion. Cain or Abel marks tasks done.
// Auth: Bearer token must match SUPABASE_SERVICE_ROLE_KEY.

function isAgentAuthed(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  return token === process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function POST(request: NextRequest) {
  if (!isAgentAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const completed_by = body.completed_by;
  if (!completed_by || !['cain', 'abel', 'zev'].includes(completed_by)) {
    return NextResponse.json({ error: 'completed_by must be cain, abel, or zev' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('cain_tasks')
    .update({
      status: body.status || 'done',
      completed_at: new Date().toISOString(),
      completion_notes: body.completion_notes || null,
    })
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Log the completion
  await supabase.from('cain_log').insert({
    entry: `${completed_by} completed: ${data.title}${body.completion_notes ? ` — ${body.completion_notes}` : ''}`,
    created_by: completed_by,
  });

  return NextResponse.json(data);
}
