// =============================================================================
// Agent: Catalyst — Pipeline Velocity & Optimization Tracking
// Lotus engine: progressive pipeline analysis
// Runs every hour via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'catalyst')) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    await updateHeartbeat(supabase, 'catalyst');

    // 1. Pipeline velocity analysis
    const { data: completed } = await supabase
      .from('discoveries')
      .select('created_at, pipeline_completed_at')
      .eq('pipeline_status', 'complete')
      .not('pipeline_completed_at', 'is', null)
      .order('pipeline_completed_at', { ascending: false })
      .limit(20);

    const durations = (completed || []).map((d) => {
      const s = new Date(d.created_at as string).getTime();
      const e = new Date(d.pipeline_completed_at as string).getTime();
      return (e - s) / 1000;
    }).filter((d) => d > 0);

    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const recentAvg = durations.slice(0, 5).length > 0 ? Math.round(durations.slice(0, 5).reduce((a, b) => a + b, 0) / durations.slice(0, 5).length) : 0;

    await recordMetric(supabase, 'catalyst', 'avg_pipeline_duration_s', avgDuration);
    await recordMetric(supabase, 'catalyst', 'recent_pipeline_duration_s', recentAvg);

    // 2. Per-stage latency from agent logs
    const stages = ['guardian', 'visionary', 'architect', 'oracle'];
    const stageLatencies: Record<string, number> = {};

    for (const stage of stages) {
      const { data: logs } = await supabase
        .from('tola_agent_log')
        .select('latency_ms')
        .eq('agent_id', stage)
        .not('latency_ms', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const lats = (logs || []).map((l) => (l.latency_ms as number) || 0).filter((l) => l > 0);
      stageLatencies[stage] = lats.length > 0 ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : 0;
    }

    // 3. Bottleneck detection
    const maxStage = Object.entries(stageLatencies).sort((a, b) => b[1] - a[1])[0];
    const bottleneck = maxStage ? { agent: maxStage[0], avg_ms: maxStage[1] } : null;

    // 4. Retry frequency
    const { data: retryLogs } = await supabase
      .from('tola_agent_log')
      .select('agent_id')
      .ilike('action', '%retry%')
      .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString());

    const retryCount = (retryLogs || []).length;

    // Velocity trend: is recent avg faster or slower than historical?
    const velocityTrend = avgDuration > 0 && recentAvg > 0
      ? Math.round(((recentAvg - avgDuration) / avgDuration) * 100)
      : 0;

    await recordMetric(supabase, 'catalyst', 'velocity_trend_pct', velocityTrend, {
      stage_latencies: stageLatencies, bottleneck, retries_24h: retryCount,
    });

    await logAction(supabase, 'catalyst', 'velocity-analysis', {
      geometryPattern: 'lotus',
      output: { avg_duration_s: avgDuration, recent_avg_s: recentAvg, trend_pct: velocityTrend, bottleneck, retries: retryCount },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({ avg_duration: avgDuration, trend: velocityTrend, bottleneck }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-catalyst-bg]', msg);
    await logAction(supabase, 'catalyst', 'velocity-error', { output: { error: msg }, latencyMs: Date.now() - start });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
