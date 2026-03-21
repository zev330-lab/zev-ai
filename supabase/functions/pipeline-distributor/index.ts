import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, jsonResponse, corsHeaders } from '../_shared/agent-utils.ts';

const AGENT_ID = 'catalyst';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = getServiceClient();

  // Check kill switch
  const killed = await checkKillSwitch(supabase, AGENT_ID);
  if (killed) {
    return jsonResponse({ status: 'killed', message: 'Catalyst agent is disabled' });
  }

  await updateHeartbeat(supabase, AGENT_ID);

  const startTime = Date.now();

  try {
    // Read cost config
    const { data: costConfig } = await supabase
      .from('tola_config')
      .select('key, value')
      .in('key', ['cost_level', 'auto_publish', 'posting_frequency']);

    const config: Record<string, string> = {};
    for (const row of costConfig || []) {
      const val = row.value;
      config[row.key] = typeof val === 'string' ? val.replace(/^"|"$/g, '') : String(val);
    }

    const autoPublish = config.auto_publish !== 'false';
    if (!autoPublish) {
      await logAction(supabase, AGENT_ID, 'distribute_skip', {
        reason: 'Auto-publish disabled',
      });
      return jsonResponse({ status: 'skipped', reason: 'auto_publish disabled' });
    }

    // Check posting frequency against cost level
    const costLevel = config.cost_level || 'medium';
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 6=Sat

    // Low cost: only Mon/Wed/Fri
    if (costLevel === 'low' && ![1, 3, 5].includes(dayOfWeek)) {
      return jsonResponse({ status: 'skipped', reason: 'low cost mode — MWF only' });
    }

    // Medium cost: weekdays only
    if (costLevel === 'medium' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return jsonResponse({ status: 'skipped', reason: 'medium cost mode — weekdays only' });
    }

    // Query approved posts ready for distribution
    const { data: readyPosts, error: queryError } = await supabase
      .from('social_queue')
      .select('id, platform, content, content_pillar, scheduled_for')
      .eq('status', 'approved')
      .is('published_url', null)
      .order('created_at', { ascending: true })
      .limit(costLevel === 'low' ? 3 : costLevel === 'medium' ? 5 : 10);

    if (queryError) {
      throw new Error(`Query failed: ${queryError.message}`);
    }

    if (!readyPosts || readyPosts.length === 0) {
      await logAction(supabase, AGENT_ID, 'distribute_empty', {
        message: 'No approved posts to distribute',
      });
      return jsonResponse({ status: 'empty', message: 'No posts ready for distribution' });
    }

    // Filter scheduled posts (only publish if scheduled_for <= now)
    const publishable = readyPosts.filter((p) => {
      if (!p.scheduled_for) return true;
      return new Date(p.scheduled_for) <= now;
    });

    if (publishable.length === 0) {
      return jsonResponse({ status: 'waiting', message: 'All posts scheduled for later' });
    }

    // Call the Next.js publish API
    const siteUrl = Deno.env.get('SITE_URL') || 'https://zev-ai-swart.vercel.app';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const publishRes = await fetch(`${siteUrl}/api/admin/social/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ ids: publishable.map((p) => p.id) }),
    });

    const publishData = await publishRes.json();

    const latencyMs = Date.now() - startTime;

    await logAction(supabase, AGENT_ID, 'distribute_complete', {
      total: publishable.length,
      published: publishData.published || 0,
      cost_level: costLevel,
      results: publishData.results,
      latency_ms: latencyMs,
    });

    return jsonResponse({
      status: 'distributed',
      total: publishable.length,
      published: publishData.published || 0,
      cost_level: costLevel,
      latency_ms: latencyMs,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    await logAction(supabase, AGENT_ID, 'distribute_error', { error: errorMsg });
    return jsonResponse({ status: 'error', error: errorMsg }, 500);
  }
});
