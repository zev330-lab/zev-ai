import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

async function isAuthed(req: NextRequest): Promise<boolean> {
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

// PATCH /api/cain/tasks
// Updates a task's status (open ↔ done) and sets completed_at.
export async function PATCH(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, status } = body as { id?: string; status?: string };

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  if (status !== 'open' && status !== 'done') {
    return NextResponse.json({ error: 'status must be "open" or "done"' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('cain_tasks')
    .update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
