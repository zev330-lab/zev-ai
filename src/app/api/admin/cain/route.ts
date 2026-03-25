import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

export async function GET(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const view = searchParams.get('view');
  const supabase = getSupabaseAdmin();

  if (view === 'log') {
    const { data } = await supabase
      .from('cain_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    return NextResponse.json(data || []);
  }

  // Default: tasks
  const status = searchParams.get('status');
  const assigned = searchParams.get('assigned_to');
  let query = supabase
    .from('cain_tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (assigned && assigned !== 'all') query = query.eq('assigned_to', assigned);

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // If marking done, set completed_at
  if (updates.status === 'done' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('cain_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const _type = body._type;
  delete body._type;

  if (_type === 'log') {
    const { data, error } = await supabase
      .from('cain_log')
      .insert({ entry: body.entry, created_by: body.created_by || 'zev' })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Default: create task
  const { data, error } = await supabase
    .from('cain_tasks')
    .insert({
      title: body.title,
      context: body.context || '',
      priority: body.priority || 'today',
      assigned_to: body.assigned_to || 'zev',
      created_by: body.created_by || 'zev',
      actions: body.actions || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
