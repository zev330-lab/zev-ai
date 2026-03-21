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

  if (view === 'members') {
    const { data } = await supabase.from('family_members').select('*').order('created_at');
    return NextResponse.json(data || []);
  }

  if (view === 'events') {
    const { data } = await supabase.from('family_events').select('*').order('date').gte('date', new Date().toISOString().slice(0, 10)).limit(30);
    return NextResponse.json(data || []);
  }

  if (view === 'notes') {
    const search = searchParams.get('search');
    let query = supabase.from('family_notes').select('*').order('created_at', { ascending: false }).limit(50);
    if (search) query = query.or(`content.ilike.%${search}%,context.ilike.%${search}%`);
    const { data } = await query;
    return NextResponse.json(data || []);
  }

  // Default: tasks
  const status = searchParams.get('status');
  const member = searchParams.get('member');
  let query = supabase.from('family_tasks').select('*, family_members(name, avatar_color)').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  if (member && member !== 'all') query = query.eq('assigned_to', member);

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getSupabaseAdmin();
  const type = body._type || 'task';
  delete body._type;

  if (!['task', 'event', 'note', 'member'].includes(type)) {
    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 });
  }

  const table = type === 'event' ? 'family_events' : type === 'note' ? 'family_notes' : type === 'member' ? 'family_members' : 'family_tasks';
  const { data, error } = await supabase.from(table).insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, _type, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const table = _type === 'event' ? 'family_events' : _type === 'note' ? 'family_notes' : _type === 'member' ? 'family_members' : 'family_tasks';

  const { error } = await supabase.from(table).update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, _type } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const table = _type === 'event' ? 'family_events' : _type === 'note' ? 'family_notes' : 'family_tasks';
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
