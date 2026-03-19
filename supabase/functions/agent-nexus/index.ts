// =============================================================================
// Agent: Nexus — System Health & Inter-Agent Coordination
// Flower of Life engine: weighted graph routing
// Runs every 5 min via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'nexus')) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    await updateHeartbeat(supabase, 'nexus');

    // 1. Health-check all agents
    const { data: agents } = await supabase.from('tola_agents').select('id, display_name, last_heartbeat, status, config');
    const now = Date.now();
    const healthScores: Record<string, number> = {};

    for (const agent of agents || []) {
      let score = 100;
      // Heartbeat freshness (max -50 points)
      if (agent.last_heartbeat) {
        const ageMin = (now - new Date(agent.last_heartbeat).getTime()) / 60000;
        if (ageMin > 60) score -= 50;
        else if (ageMin > 30) score -= 30;
        else if (ageMin > 10) score -= 15;
      } else {
        score -= 40;
      }

      // Recent error rate (check last 20 logs)
      const { data: recentLogs } = await supabase
        .from('tola_agent_log')
        .select('output')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const errorCount = (recentLogs || []).filter((l) => {
        const out = l.output as Record<string, unknown> | null;
        return out?.error || out?.status === 'failed';
      }).length;
      score -= errorCount * 5;

      healthScores[agent.id] = Math.max(0, Math.min(100, score));

      // Update agent config with health score
      const newConfig = { ...(agent.config || {}), health_score: healthScores[agent.id] };
      await supabase.from('tola_agents').update({ config: newConfig }).eq('id', agent.id);

      // Flag degraded
      if (healthScores[agent.id] < 50 && agent.status === 'healthy') {
        await supabase.from('tola_agents').update({ status: 'degraded' }).eq('id', agent.id);
      }
    }

    // 2. Path activity aggregation (last 30 min)
    const thirtyMinAgo = new Date(now - 30 * 60000).toISOString();
    const { data: logs } = await supabase
      .from('tola_agent_log')
      .select('agent_id, latency_ms, created_at')
      .gte('created_at', thirtyMinAgo);

    // Build path activity from sequential agent log entries
    const agentActivity: Record<string, { count: number; totalLatency: number }> = {};
    for (const log of logs || []) {
      if (!log.agent_id) continue;
      if (!agentActivity[log.agent_id]) agentActivity[log.agent_id] = { count: 0, totalLatency: 0 };
      agentActivity[log.agent_id].count++;
      agentActivity[log.agent_id].totalLatency += (log.latency_ms as number) || 0;
    }

    // Store path activity for visualization
    const pathInserts = [];
    const agentIds = Object.keys(agentActivity);
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const a = agentIds[i], b = agentIds[j];
        pathInserts.push({
          source_agent: a,
          target_agent: b,
          message_count: agentActivity[a].count + agentActivity[b].count,
          avg_latency_ms: Math.round((agentActivity[a].totalLatency + agentActivity[b].totalLatency) / (agentActivity[a].count + agentActivity[b].count)),
          period_start: thirtyMinAgo,
          period_end: new Date().toISOString(),
        });
      }
    }
    if (pathInserts.length > 0) {
      await supabase.from('tola_path_activity').insert(pathInserts);
    }

    // Clean old path activity (keep 24h)
    const dayAgo = new Date(now - 24 * 3600000).toISOString();
    await supabase.from('tola_path_activity').delete().lt('period_end', dayAgo);

    const avgScore = Object.values(healthScores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(healthScores).length, 1);
    await recordMetric(supabase, 'nexus', 'system_health_score', Math.round(avgScore), { agent_scores: healthScores });

    await logAction(supabase, 'nexus', 'health-check', {
      geometryPattern: 'flower_of_life',
      output: { agents_checked: Object.keys(healthScores).length, avg_health: Math.round(avgScore), paths_recorded: pathInserts.length },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({ status: 'ok', avg_health: Math.round(avgScore) }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-nexus]', msg);
    await logAction(supabase, 'nexus', 'health-check-error', { output: { error: msg }, latencyMs: Date.now() - start });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
