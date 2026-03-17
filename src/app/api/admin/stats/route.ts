import { NextRequest, NextResponse } from 'next/server';

function isAuthed(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return req.cookies.get('admin_auth')?.value === adminPassword;
}

// GET /api/admin/stats — aggregate stats for admin overview bar
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { getSupabaseAdmin } = await import('@/lib/supabase');
  const supabase = getSupabaseAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // Run queries in parallel
  const [actionsRes, pipelinesRes, tierThreeRes] = await Promise.all([
    // Total agent actions today
    supabase
      .from('tola_agent_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO),
    // Completed pipelines today
    supabase
      .from('discoveries')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_status', 'complete')
      .gte('pipeline_completed_at', todayISO),
    // Tier 3 review queue (complete pipelines with status 'new')
    supabase
      .from('discoveries')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_status', 'complete')
      .eq('status', 'new'),
  ]);

  return NextResponse.json({
    actions_today: actionsRes.count ?? 0,
    pipelines_today: pipelinesRes.count ?? 0,
    tier3_queue: tierThreeRes.count ?? 0,
  });
}
