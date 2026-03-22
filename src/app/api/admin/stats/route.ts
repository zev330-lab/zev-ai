import { NextRequest, NextResponse } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { tokensToCost } from '@/lib/cost-utils';

async function isAuthed(req: NextRequest) {
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

// GET /api/admin/stats — aggregate stats for admin dashboard
export async function GET(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { getSupabaseAdmin } = await import('@/lib/supabase');
  const supabase = getSupabaseAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // 7-day window for trend queries
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    actionsRes, todayPipelinesRes, tierThreeRes, activeAgentsRes, allDiscoveriesRes, completedTimesRes,
    // Cross-module queries
    blogReviewRes, socialPendingRes, overdueTasksRes, unpaidInvoicesRes,
    // Alerts
    failedRes, stalledRes, staleAgentsRes,
    // Cost / trend queries
    recentLogsRes, uptimeRes,
  ] = await Promise.all([
    supabase.from('tola_agent_log').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('discoveries').select('*', { count: 'exact', head: true }).eq('pipeline_status', 'complete').gte('pipeline_completed_at', todayISO),
    supabase.from('discoveries').select('*', { count: 'exact', head: true }).eq('pipeline_status', 'complete').eq('status', 'new'),
    supabase.from('tola_agents').select('*', { count: 'exact', head: true }).neq('status', 'offline'),
    supabase.from('discoveries').select('pipeline_status'),
    supabase.from('discoveries').select('created_at, pipeline_completed_at').eq('pipeline_status', 'complete').not('pipeline_completed_at', 'is', null),
    // Cross-module
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'review'),
    supabase.from('social_queue').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('family_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending').lte('due_date', new Date().toISOString().slice(0, 10)),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['sent', 'overdue']),
    // Alerts
    supabase.from('discoveries').select('id, name, company, pipeline_error, pipeline_status, updated_at').eq('pipeline_status', 'failed').order('updated_at', { ascending: false }).limit(5),
    supabase.from('discoveries').select('id, name, company, pipeline_error, pipeline_status, updated_at').eq('pipeline_status', 'stalled').order('updated_at', { ascending: false }).limit(5),
    supabase.from('tola_agents').select('id, display_name, last_heartbeat, status').lt('last_heartbeat', new Date(Date.now() - 10 * 60 * 1000).toISOString()).neq('status', 'offline'),
    // Last 7 days of log entries for trend + per-agent cost aggregation
    supabase.from('tola_agent_log').select('created_at, tokens_used, agent_id').gte('created_at', sevenDaysAgo),
    // Earliest heartbeat to approximate system uptime
    supabase.from('tola_agents').select('last_heartbeat').not('last_heartbeat', 'is', null).order('last_heartbeat', { ascending: true }).limit(1),
  ]);

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

  let avgPipelineSeconds = 0;
  if (completedTimesRes.data && completedTimesRes.data.length > 0) {
    const times = completedTimesRes.data.map((d) => {
      const row = d as { created_at: string; pipeline_completed_at: string };
      return (new Date(row.pipeline_completed_at).getTime() - new Date(row.created_at).getTime()) / 1000;
    });
    avgPipelineSeconds = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  // Build alerts array
  const alerts: { type: string; severity: string; message: string; id?: string; timestamp?: string }[] = [];

  for (const f of failedRes.data || []) {
    const row = f as { id: string; company: string; name: string; pipeline_error: string; updated_at: string };
    alerts.push({ type: 'pipeline_failed', severity: 'error', message: `${row.company || row.name}: ${row.pipeline_error || 'Unknown error'}`, id: row.id, timestamp: row.updated_at });
  }
  for (const s of stalledRes.data || []) {
    const row = s as { id: string; company: string; name: string; pipeline_error: string; updated_at: string };
    alerts.push({ type: 'pipeline_stalled', severity: 'warning', message: `${row.company || row.name}: ${row.pipeline_error || 'Stalled'}`, id: row.id, timestamp: row.updated_at });
  }
  for (const a of staleAgentsRes.data || []) {
    const row = a as { id: string; display_name: string; last_heartbeat: string };
    alerts.push({ type: 'stale_agent', severity: 'warning', message: `${row.display_name} — no heartbeat for 10+ min`, timestamp: row.last_heartbeat });
  }

  // --- Cost & trend aggregation ---
  type LogRow = { created_at: string; tokens_used: number | null; agent_id: string | null };
  const logs: LogRow[] = (recentLogsRes.data as LogRow[]) || [];

  // Build daily_trend: group by UTC date string (YYYY-MM-DD) over last 7 days
  const trendByDate: Record<string, { actions: number; tokens: number }> = {};

  // Pre-populate the last 7 days so days with zero activity still appear
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    trendByDate[key] = { actions: 0, tokens: 0 };
  }

  const agentMap: Record<string, { tokens: number; actions: number }> = {};

  for (const row of logs) {
    const dateKey = row.created_at.slice(0, 10); // YYYY-MM-DD
    const tokens = row.tokens_used ?? 0;

    // Daily trend (only bucket dates that fall inside our 7-day window)
    if (trendByDate[dateKey] !== undefined) {
      trendByDate[dateKey].actions += 1;
      trendByDate[dateKey].tokens += tokens;
    }

    // Per-agent aggregation
    if (row.agent_id) {
      if (!agentMap[row.agent_id]) {
        agentMap[row.agent_id] = { tokens: 0, actions: 0 };
      }
      agentMap[row.agent_id].tokens += tokens;
      agentMap[row.agent_id].actions += 1;
    }
  }

  const daily_trend = Object.entries(trendByDate).map(([date, { actions, tokens }]) => ({
    date,
    actions,
    tokens,
    cost: tokensToCost(tokens),
  }));

  const agent_costs = Object.entries(agentMap).map(([agent_id, { tokens, actions }]) => ({
    agent_id,
    tokens,
    actions,
    cost: tokensToCost(tokens),
  }));

  // Today's total cost from logs with created_at >= todayISO
  const total_tokens_today = logs
    .filter((r) => r.created_at >= todayISO)
    .reduce((sum, r) => sum + (r.tokens_used ?? 0), 0);
  const total_cost_today = tokensToCost(total_tokens_today);

  // 7-day total cost
  const total_tokens_7d = logs.reduce((sum, r) => sum + (r.tokens_used ?? 0), 0);
  const total_cost_7d = tokensToCost(total_tokens_7d);

  // System uptime: hours since earliest recorded heartbeat
  let system_uptime_hours = 0;
  if (uptimeRes.data && uptimeRes.data.length > 0) {
    const earliest = (uptimeRes.data[0] as { last_heartbeat: string }).last_heartbeat;
    system_uptime_hours = Math.round((Date.now() - new Date(earliest).getTime()) / (1000 * 60 * 60));
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
    // Cross-module
    blog_pending_review: blogReviewRes.count ?? 0,
    social_pending: socialPendingRes.count ?? 0,
    overdue_family_tasks: overdueTasksRes.count ?? 0,
    unpaid_invoices: unpaidInvoicesRes.count ?? 0,
    // Alerts
    alerts,
    // Cost & trend analytics
    daily_trend,
    agent_costs,
    total_cost_today,
    total_cost_7d,
    system_uptime_hours,
  });
}
