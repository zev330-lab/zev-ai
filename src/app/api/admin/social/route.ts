import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

async function isAuthed() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  const auth = cookieStore.get('admin_auth')?.value;
  return auth === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');

  const supabase = getSupabaseAdmin();
  let query = supabase.from('social_queue').select('*, blog_posts(title, slug)').order('created_at', { ascending: false });

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Bulk approve: { ids: [...], status: 'approved' }
  if (Array.isArray(body.ids)) {
    const supabase = getSupabaseAdmin();
    const updates: Record<string, unknown> = {};
    if (body.status) updates.status = body.status;
    if (body.scheduled_for) updates.scheduled_for = body.scheduled_for;
    const { error } = await supabase.from('social_queue').update(updates).in('id', body.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, updated: body.ids.length });
  }

  // Single update: { id, ...updates }
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('social_queue').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('social_queue').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
