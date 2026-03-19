// =============================================================================
// Agent: Prism — Continuous Quality Assurance
// Vortex engine: recursive refinement / funnel testing
// Runs every 30 min via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

const SITE_URL = 'https://zev-ai-swart.vercel.app';
const CHECK_PAGES = ['/', '/discover', '/blog', '/approach', '/services'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'prism')) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    await updateHeartbeat(supabase, 'prism');

    // 1. Synthetic health checks — fetch public pages
    const results: { page: string; status: number; ms: number }[] = [];
    for (const page of CHECK_PAGES) {
      const pageStart = Date.now();
      try {
        const res = await fetch(`${SITE_URL}${page}`, { signal: AbortSignal.timeout(10000) });
        results.push({ page, status: res.status, ms: Date.now() - pageStart });
      } catch {
        results.push({ page, status: 0, ms: Date.now() - pageStart });
      }
    }

    const allOk = results.every((r) => r.status === 200);
    const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);

    await recordMetric(supabase, 'prism', 'site_health', allOk ? 1 : 0, { pages: results, avg_response_ms: avgMs });
    await recordMetric(supabase, 'prism', 'avg_response_ms', avgMs);

    // 2. Agent output audit — check last 10 logs for anomalies
    const { data: recentLogs } = await supabase
      .from('tola_agent_log')
      .select('agent_id, tokens_used, latency_ms, action, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    let anomalies = 0;
    const issues: string[] = [];

    for (const log of recentLogs || []) {
      const tokens = (log.tokens_used as number) || 0;
      const latency = (log.latency_ms as number) || 0;
      if (tokens > 50000) { anomalies++; issues.push(`High tokens: ${log.agent_id} used ${tokens} in ${log.action}`); }
      if (latency > 300000) { anomalies++; issues.push(`High latency: ${log.agent_id} took ${Math.round(latency / 1000)}s in ${log.action}`); }
    }

    await recordMetric(supabase, 'prism', 'anomalies_detected', anomalies);

    // 3. Daily quality report (5am UTC = midnight EST)
    const hour = new Date().getUTCHours();
    if (hour >= 10 && hour < 11) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from('knowledge_entries')
        .select('id')
        .eq('source', 'insight')
        .ilike('title', `%Quality Report%${new Date().toISOString().slice(0, 10)}%`)
        .limit(1);

      if (!existing || existing.length === 0) {
        const report = `# Quality Report — ${new Date().toISOString().slice(0, 10)}

- **Site health:** ${allOk ? 'All pages returning 200' : 'ISSUES DETECTED'}
- **Avg response time:** ${avgMs}ms
- **Pages checked:** ${results.map((r) => `${r.page} (${r.status}, ${r.ms}ms)`).join(', ')}
- **Anomalies:** ${anomalies} detected
${issues.length > 0 ? '- **Issues:** ' + issues.join('; ') : '- No issues detected'}`;

        await supabase.from('knowledge_entries').insert({
          title: `Quality Report ${new Date().toISOString().slice(0, 10)}`,
          content: report,
          source: 'insight',
          tags: ['quality', 'prism', 'daily'],
        });
      }
    }

    await logAction(supabase, 'prism', 'quality-check', {
      geometryPattern: 'vortex',
      output: { pages_ok: allOk, avg_ms: avgMs, anomalies, issues_count: issues.length },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({ all_ok: allOk, avg_ms: avgMs, anomalies }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-prism]', msg);
    await logAction(supabase, 'prism', 'quality-error', { output: { error: msg }, latencyMs: Date.now() - start });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
