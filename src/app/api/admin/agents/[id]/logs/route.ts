import { NextRequest, NextResponse } from 'next/server';
import { isValidSession } from '@/lib/auth';

async function isAuthed(req: NextRequest) {
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

// GET /api/admin/agents/[id]/logs — recent log entries for one agent
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { getSupabaseAdmin } = await import('@/lib/supabase');
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('tola_agent_log')
    .select('*')
    .eq('agent_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
