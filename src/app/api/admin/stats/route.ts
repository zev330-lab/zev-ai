import { NextRequest, NextResponse } from 'next/server';

function isAuthed(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return req.cookies.get('admin_auth')?.value === adminPassword;
}

// GET /api/admin/stats — aggregate stats for admin dashboard
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { getSupabaseAdmin } = await import('@/lib/supabase');
  const supabase = getSupabaseAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [actionsRes, todayPipelinesRes, tierThreeRes, activeAgentsRes, allDiscoveriesRes, completedTimesRes] = await Promise.all([
    // Actions today
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
    // Tier 3 review queue
    supabase
      .from('discoveries')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_status', 'complete')
      .eq('status', 'new'),
    // Active agents (not offline)
    supabase
      .from('tola_agents')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'offline'),
    // All discoveries — pipeline_status for stage counts
    supabase
      .from('discoveries')
      .select('pipeline_status'),
    // Completed pipelines with timestamps for avg time
    supabase
      .from('discoveries')
      .select('created_at, pipeline_completed_at')
      .eq('pipeline_status', 'complete')
      .not('pipeline_completed_at', 'is', null),
  ]);

  // Compute stage counts and success rate
  const byStage: Record<string, number> = {};
  let totalDiscoveries = 0;
  let completeCount = 0;
  let failedCount = 0;

  if (allDiscoveriesRes.data) {
    totalDiscoveries = allDiscoveriesRes.data.length;
    for (const d of allDiscoveriesRes.data) {
      const s = (d as { pipeline_status: string | null }).pipeline_status || 'none';
      byStage[s] = (byStage[s] || 0) + 1;
      if (s === 'complete') completeCount++;
      if (s === 'failed') failedCount++;
    }
  }

  const pipelineTotal = completeCount + failedCount;
  const successRate = pipelineTotal > 0 ? Math.round((completeCount / pipelineTotal) * 100) : 0;

  // Compute avg pipeline time
  let avgPipelineSeconds = 0;
  if (completedTimesRes.data && completedTimesRes.data.length > 0) {
    const times = completedTimesRes.data.map((d) => {
      const row = d as { created_at: string; pipeline_completed_at: string };
      return (new Date(row.pipeline_completed_at).getTime() - new Date(row.created_at).getTime()) / 1000;
    });
    avgPipelineSeconds = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  return NextResponse.json({
    actions_today: actionsRes.count ?? 0,
    pipelines_today: todayPipelinesRes.count ?? 0,
    tier3_queue: tierThreeRes.count ?? 0,
    active_agents: activeAgentsRes.count ?? 0,
    total_discoveries: totalDiscoveries,
    pipeline_success_rate: successRate,
    avg_pipeline_seconds: avgPipelineSeconds,
    by_stage: byStage,
  });
}
