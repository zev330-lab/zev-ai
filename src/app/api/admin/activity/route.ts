import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

async function isAuthed(req: NextRequest) {
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

// GET /api/admin/activity — latest tola_agent_log entries
export async function GET(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('tola_agent_log')
    .select('id, agent_id, action, geometry_pattern, latency_ms, tokens_used, created_at')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
