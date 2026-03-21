import { NextRequest, NextResponse } from 'next/server';
import { isValidSession } from '@/lib/auth';

async function getSupabaseAdmin() {
  const { getSupabaseAdmin: getSb } = await import('@/lib/supabase');
  return getSb();
}

async function isAuthed(req: NextRequest) {
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

// GET /api/admin/agents — list all agents
export async function GET(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tola_agents')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/admin/agents — update agent (kill switch, status, etc.)
export async function PATCH(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Agent id required' }, { status: 400 });
  }

  // Only allow updating specific fields
  const allowed = ['kill_switch', 'is_active', 'status', 'config', 'tier'];
  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) {
      filtered[key] = updates[key];
    }
  }

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tola_agents')
    .update(filtered)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
