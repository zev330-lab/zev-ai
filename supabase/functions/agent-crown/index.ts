// =============================================================================
// Agent: Crown — Governance & Cost Tracking
// Seed of Life engine: hub-and-spoke coordination
// Runs every 15 min via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'crown')) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    await updateHeartbeat(supabase, 'crown');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // 1. Token spend tracking
    const { data: todayLogs } = await supabase
      .from('tola_agent_log')
      .select('agent_id, tokens_used')
      .gte('created_at', todayStart)
      .not('tokens_used', 'is', null);

    let totalTokens = 0;
    const byAgent: Record<string, number> = {};
    for (const log of todayLogs || []) {
      const t = (log.tokens_used as number) || 0;
      totalTokens += t;
      if (log.agent_id) byAgent[log.agent_id] = (byAgent[log.agent_id] || 0) + t;
    }

    // Estimate cost (~$3/MTok for Sonnet input, ~$15/MTok output — rough avg $5/MTok)
    const estimatedCost = (totalTokens / 1_000_000) * 5;

    await recordMetric(supabase, 'crown', 'daily_token_spend', totalTokens, { by_agent: byAgent, estimated_cost_usd: estimatedCost });

    // 2. Tier 3 queue scan
    const { count: tier3Count } = await supabase
      .from('discoveries')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_status', 'complete')
      .eq('status', 'new');

    await recordMetric(supabase, 'crown', 'tier3_queue', tier3Count ?? 0);

    // 3. Failure scan
    const { count: failedCount } = await supabase
      .from('discoveries')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_status', 'failed')
      .gte('updated_at', todayStart);

    const { count: stalledCount } = await supabase
      .from('discoveries')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_status', 'stalled');

    // 4. Daily governance digest (run once per day at first invocation after 6am)
    const hour = now.getUTCHours();
    if (hour >= 11 && hour < 12) { // ~6-7am EST
      const { count: totalActions } = await supabase
        .from('tola_agent_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      // Check if we already wrote today's digest
      const { data: existing } = await supabase
        .from('knowledge_entries')
        .select('id')
        .eq('source', 'insight')
        .ilike('title', `%Governance Digest%${now.toISOString().slice(0, 10)}%`)
        .limit(1);

      if (!existing || existing.length === 0) {
        const digest = `# Governance Digest — ${now.toISOString().slice(0, 10)}

- **Total actions:** ${totalActions ?? 0}
- **Total tokens:** ${totalTokens.toLocaleString()}
- **Estimated cost:** $${estimatedCost.toFixed(2)}
- **Tier 3 queue:** ${tier3Count ?? 0} pending
- **Failed pipelines:** ${failedCount ?? 0}
- **Stalled pipelines:** ${stalledCount ?? 0}
- **Top agents by tokens:** ${Object.entries(byAgent).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, t]) => `${id} (${t.toLocaleString()})`).join(', ') || 'none'}`;

        await supabase.from('knowledge_entries').insert({
          title: `Governance Digest ${now.toISOString().slice(0, 10)}`,
          content: digest,
          source: 'insight',
          tags: ['governance', 'daily', 'crown'],
        });
      }
    }

    await logAction(supabase, 'crown', 'governance-scan', {
      geometryPattern: 'seed_of_life',
      output: { tokens_today: totalTokens, cost_usd: estimatedCost, tier3: tier3Count, failed: failedCount, stalled: stalledCount },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({ tokens_today: totalTokens, tier3: tier3Count }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-crown]', msg);
    await logAction(supabase, 'crown', 'governance-error', { output: { error: msg }, latencyMs: Date.now() - start });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
