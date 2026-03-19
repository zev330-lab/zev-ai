// =============================================================================
// Agent: Foundation — Infrastructure Maintenance
// Seed of Life engine: hub-and-spoke maintenance
// Runs every 2 hours via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'foundation')) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    await updateHeartbeat(supabase, 'foundation');

    // 1. Table row counts
    const tables = ['tola_agent_log', 'tola_agent_metrics', 'tola_path_activity', 'discoveries', 'contacts', 'blog_posts', 'social_queue', 'knowledge_entries'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      counts[table] = count ?? 0;
    }

    await recordMetric(supabase, 'foundation', 'total_rows', Object.values(counts).reduce((a, b) => a + b, 0), counts);

    // 2. Archive old metrics (keep 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count: archivedMetrics } = await supabase
      .from('tola_agent_metrics')
      .delete()
      .lt('created_at', thirtyDaysAgo)
      .select('*', { count: 'exact', head: true });

    // Archive old path activity (keep 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: archivedPaths } = await supabase
      .from('tola_path_activity')
      .delete()
      .lt('period_end', sevenDaysAgo)
      .select('*', { count: 'exact', head: true });

    // 3. Archive old agent logs (keep 30 days)
    const { count: archivedLogs } = await supabase
      .from('tola_agent_log')
      .delete()
      .lt('created_at', thirtyDaysAgo)
      .select('*', { count: 'exact', head: true });

    // 4. Daily infra report (4am UTC = 11pm EST)
    const hour = new Date().getUTCHours();
    if (hour >= 9 && hour < 10) {
      const { data: existing } = await supabase
        .from('knowledge_entries')
        .select('id')
        .eq('source', 'insight')
        .ilike('title', `%Infrastructure Report%${new Date().toISOString().slice(0, 10)}%`)
        .limit(1);

      if (!existing || existing.length === 0) {
        const report = `# Infrastructure Report — ${new Date().toISOString().slice(0, 10)}

## Table Row Counts
${Object.entries(counts).map(([t, c]) => `- **${t}:** ${c.toLocaleString()}`).join('\n')}

## Maintenance
- Archived metrics: ${archivedMetrics ?? 0} rows (>30 days)
- Archived path data: ${archivedPaths ?? 0} rows (>7 days)
- Archived agent logs: ${archivedLogs ?? 0} rows (>30 days)

## Total rows across system: ${Object.values(counts).reduce((a, b) => a + b, 0).toLocaleString()}`;

        await supabase.from('knowledge_entries').insert({
          title: `Infrastructure Report ${new Date().toISOString().slice(0, 10)}`,
          content: report,
          source: 'insight',
          tags: ['infrastructure', 'foundation', 'daily'],
        });
      }
    }

    await logAction(supabase, 'foundation', 'maintenance-run', {
      geometryPattern: 'seed_of_life',
      output: { table_counts: counts, archived_metrics: archivedMetrics ?? 0, archived_logs: archivedLogs ?? 0, archived_paths: archivedPaths ?? 0 },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({ counts, archived: (archivedMetrics ?? 0) + (archivedLogs ?? 0) + (archivedPaths ?? 0) }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-foundation-bg]', msg);
    await logAction(supabase, 'foundation', 'maintenance-error', { output: { error: msg }, latencyMs: Date.now() - start });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
