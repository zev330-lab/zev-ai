import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

// GET: list projects with milestones count, hours, next milestone
export async function GET(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const id = searchParams.get('id');

  const supabase = getSupabaseAdmin();

  // Single project with milestones + time entries
  if (id) {
    const [{ data: project }, { data: milestones }, { data: entries }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_milestones').select('*').eq('project_id', id).order('sort_order'),
      supabase.from('project_time_entries').select('*').eq('project_id', id).order('date', { ascending: false }).limit(50),
    ]);
    return NextResponse.json({ project, milestones: milestones || [], entries: entries || [] });
  }

  // List all projects with aggregates
  let query = supabase.from('projects').select('*').order('updated_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);

  const { data: projects, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch aggregates for all projects
  const projectIds = (projects || []).map((p) => p.id);
  const [{ data: milestones }, { data: entries }] = await Promise.all([
    supabase.from('project_milestones').select('project_id, status').in('project_id', projectIds),
    supabase.from('project_time_entries').select('project_id, hours, billable, hourly_rate, date').in('project_id', projectIds),
  ]);

  const enriched = (projects || []).map((p) => {
    const pm = (milestones || []).filter((m) => m.project_id === p.id);
    const pe = (entries || []).filter((e) => e.project_id === p.id);
    const totalMilestones = pm.length;
    const completeMilestones = pm.filter((m) => m.status === 'complete').length;
    const totalHours = pe.reduce((s, e) => s + Number(e.hours), 0);
    return { ...p, totalMilestones, completeMilestones, totalHours };
  });

  return NextResponse.json(enriched);
}

// POST: create project, milestone, or time entry
export async function POST(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getSupabaseAdmin();
  const type = body._type;
  delete body._type;

  if (type && !['milestone', 'time_entry'].includes(type)) {
    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 });
  }

  if (type === 'milestone') {
    const { data, error } = await supabase.from('project_milestones').insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (type === 'time_entry') {
    const { data, error } = await supabase.from('project_time_entries').insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Default: create project
  const { data, error } = await supabase.from('projects').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: update project, milestone, or time entry
export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, _type, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const table = _type === 'milestone' ? 'project_milestones' : _type === 'time_entry' ? 'project_time_entries' : 'projects';

  if (table === 'projects') updates.updated_at = new Date().toISOString();
  const { error } = await supabase.from(table).update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, _type } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const table = _type === 'milestone' ? 'project_milestones' : _type === 'time_entry' ? 'project_time_entries' : 'projects';

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
