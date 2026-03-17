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
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const supabase = getSupabaseAdmin();
  let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, ...updates } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('contacts').update(updates).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
