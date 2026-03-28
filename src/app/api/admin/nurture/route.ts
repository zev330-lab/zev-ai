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

  if (view === 'emails') {
    const sequenceId = searchParams.get('sequence_id');
    let query = supabase
      .from('nurture_emails')
      .select('*')
      .order('step_number', { ascending: true });

    if (sequenceId) query = query.eq('sequence_id', sequenceId);

    const { data } = await query;
    return NextResponse.json(data || []);
  }

  // Default: sequences
  const status = searchParams.get('status');
  let query = supabase
    .from('nurture_sequences')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { _type } = body;
  const supabase = getSupabaseAdmin();

  // Approve/reject nurture emails
  if (_type === 'email') {
    const { id, status, ids } = body;

    // Bulk approve
    if (ids && Array.isArray(ids) && ids.length > 0) {
      if (ids.length > 100) return NextResponse.json({ error: 'Max 100 items' }, { status: 400 });
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('nurture_emails')
        .update({ status: 'approved', approved_at: now })
        .in('id', ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ updated: ids.length });
    }

    // Single email update
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'approved') updates.approved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('nurture_emails')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Update sequence (pause/resume/cancel)
  if (_type === 'sequence') {
    const { id, status } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('nurture_sequences')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Missing _type (email or sequence)' }, { status: 400 });
}
