import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function isAuthed(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return req.cookies.get('admin_auth')?.value === adminPassword;
}

// GET /api/admin/activity — latest tola_agent_log entries
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
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
