// =============================================================================
// Agent: Guardian — Background Safety & Anomaly Scanning
// Yin-Yang engine: adversarial verification
// Runs every 5 min via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';
import { writeContext } from '../_shared/context-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'guardian')) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    await updateHeartbeat(supabase, 'guardian');

    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();

    // 1. Scan recent logs for anomalies
    const { data: recentLogs } = await supabase
      .from('tola_agent_log')
      .select('agent_id, action, tokens_used, latency_ms, output, created_at')
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false });

    let anomalies = 0;
    const flags: string[] = [];

    for (const log of recentLogs || []) {
      const tokens = (log.tokens_used as number) || 0;
      const latency = (log.latency_ms as number) || 0;
      const output = log.output as Record<string, unknown> | null;

      // Token spike detection (>100k in a single call is unusual)
      if (tokens > 100000) {
        anomalies++;
        flags.push(`Token spike: ${log.agent_id} used ${tokens} tokens in ${log.action}`);
      }

      // Latency anomaly (>5 min)
      if (latency > 300000) {
        anomalies++;
        flags.push(`Latency anomaly: ${log.agent_id} took ${Math.round(latency / 1000)}s`);
      }

      // Error in output
      if (output?.error) {
        anomalies++;
        flags.push(`Error: ${log.agent_id} — ${String(output.error).slice(0, 100)}`);
      }
    }

    // 2. Check for repeated errors (circuit breaker pattern)
    const { data: errorLogs } = await supabase
      .from('tola_agent_log')
      .select('agent_id')
      .ilike('action', '%error%')
      .gte('created_at', new Date(Date.now() - 60 * 60000).toISOString());

    // Count errors per agent
    const errorsByAgent: Record<string, number> = {};
    for (const log of errorLogs || []) {
      if (log.agent_id) errorsByAgent[log.agent_id] = (errorsByAgent[log.agent_id] || 0) + 1;
    }

    // Circuit breaker: if any agent has 10+ errors in the last hour, trip kill switch
    for (const [agentId, count] of Object.entries(errorsByAgent)) {
      if (count >= 10) {
        await supabase.from('tola_agents').update({ kill_switch: true }).eq('id', agentId);
        flags.push(`CIRCUIT BREAKER: ${agentId} disabled (${count} errors in 1h)`);
        anomalies++;
      }
    }

    await recordMetric(supabase, 'guardian', 'anomalies_5min', anomalies, { flags });

    // ── Path 15: Write health alert to shared_context if anomalies found ──
    if (anomalies > 0) {
      const severity = flags.some(f => f.includes('CIRCUIT BREAKER')) ? 'critical' : 'degraded';
      await writeContext(supabase, {
        pipelineId: '00000000-0000-0000-0000-000000000000', // system pipeline
        pipelineType: 'health_check',
        fromAgent: 'guardian',
        toAgent: 'nexus',
        pathName: 'sentinel_to_nexus_health',
        payload: {
          status: severity,
          anomalies,
          flags,
          errors_by_agent: errorsByAgent,
          scanned: (recentLogs || []).length,
        },
        tierLevel: severity === 'critical' ? 3 : 2,
      });
    }

    await logAction(supabase, 'guardian', 'safety-scan', {
      geometryPattern: 'yin_yang',
      output: { logs_scanned: (recentLogs || []).length, anomalies, flags_count: flags.length },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({ scanned: (recentLogs || []).length, anomalies, flags: flags.length }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-guardian-bg]', msg);
    await logAction(supabase, 'guardian', 'safety-error', { output: { error: msg }, latencyMs: Date.now() - start });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
