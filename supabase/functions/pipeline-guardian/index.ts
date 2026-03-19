// =============================================================================
// Pipeline Step 1: Guardian — Validates discovery, sets status to 'researching'
// pg_cron worker polls and dispatches the next step after 60s cooldown
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat } from '../_shared/agent-utils.ts';
import { jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();

  try {
    const { discovery_id } = await req.json();
    if (!discovery_id) return jsonResponse({ error: 'discovery_id required' }, 400);

    const supabase = getServiceClient();

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discovery_id)
      .single();

    if (!discovery) return jsonResponse({ error: 'Discovery not found' }, 404);

    // --- Validation ---
    const issues: string[] = [];
    const name = (discovery.name || '').trim();
    const business = (discovery.business_overview || '').trim();
    const painPoints = (discovery.pain_points || '').trim();

    if (name.length < 2) issues.push('Name too short');
    if (business.length < 10) issues.push('Business overview too brief');
    if (painPoints.length < 10) issues.push('Pain points too brief');

    const allText = `${name} ${business} ${painPoints} ${discovery.magic_wand || ''}`.toLowerCase();
    const spamWords = ['buy now', 'click here', 'free money', 'casino', 'viagra', 'lottery'];
    const hasSpam = spamWords.some((w) => allText.includes(w));
    if (hasSpam) issues.push('Spam content detected');

    if (issues.length > 0 && hasSpam) {
      await supabase.from('discoveries').update({
        status: 'archived',
        pipeline_status: 'failed',
        pipeline_error: `Guardian rejected: ${issues.join(', ')}`,
      }).eq('id', discovery_id);

      await logAction(supabase, 'guardian', 'validate-discovery', {
        geometryPattern: 'yin_yang',
        output: { status: 'rejected', issues },
        latencyMs: Date.now() - start,
      });

      return jsonResponse({ status: 'rejected', issues });
    }

    // --- Valid: advance to researching (pg_cron worker dispatches Visionary) ---
    await supabase.from('discoveries').update({
      pipeline_status: 'researching',
      pipeline_started_at: null,
      progress_pct: 10,
    }).eq('id', discovery_id);

    await Promise.all([
      logAction(supabase, 'guardian', 'validate-discovery', {
        geometryPattern: 'yin_yang',
        output: { status: 'validated', issues: issues.length > 0 ? issues : undefined },
        latencyMs: Date.now() - start,
      }),
      updateHeartbeat(supabase, 'guardian'),
    ]);

    // pg_cron worker will dispatch pipeline-visionary after 60s cooldown
    return jsonResponse({ status: 'validated', next: 'pipeline-visionary' });

  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
