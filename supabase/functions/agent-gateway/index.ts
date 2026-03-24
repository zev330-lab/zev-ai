// =============================================================================
// Agent: Gateway — Frontend & SEO Monitoring
// Flower of Life engine: interconnected page delivery
// Runs every hour (offset 30 min) via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';
import { writeContext } from '../_shared/context-utils.ts';

const SITE_URL = 'https://askzev.ai';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'gateway')) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    await updateHeartbeat(supabase, 'gateway');

    // 1. Sitemap validation
    let sitemapValid = false;
    let sitemapUrls = 0;
    try {
      const res = await fetch(`${SITE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const text = await res.text();
        sitemapValid = text.includes('<urlset') && text.includes('</urlset>');
        sitemapUrls = (text.match(/<url>/g) || []).length;
      }
    } catch { /* ignore */ }

    // 2. robots.txt validation
    let robotsValid = false;
    let aiCrawlersAllowed = false;
    try {
      const res = await fetch(`${SITE_URL}/robots.txt`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const text = await res.text();
        robotsValid = text.includes('Allow: /');
        aiCrawlersAllowed = text.includes('GPTBot') && text.includes('ClaudeBot') && text.includes('PerplexityBot');
      }
    } catch { /* ignore */ }

    // 3. RSS feed check
    let rssValid = false;
    try {
      const res = await fetch(`${SITE_URL}/blog/rss.xml`, { signal: AbortSignal.timeout(5000) });
      rssValid = res.ok && (res.headers.get('content-type') || '').includes('xml');
    } catch { /* ignore */ }

    // 4. Page count tracking
    const { count: publishedPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const staticPages = 9; // home, services, approach, work, about, blog, contact, discover, tola redirect
    const totalPages = staticPages + (publishedPosts ?? 0);

    await recordMetric(supabase, 'gateway', 'total_pages', totalPages, { static: staticPages, blog: publishedPosts ?? 0 });
    await recordMetric(supabase, 'gateway', 'sitemap_urls', sitemapUrls);

    // ── Path 21: Check for engagement signals (report views) ────────────
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: recentViews } = await supabase
      .from('tola_agent_log')
      .select('input, created_at')
      .eq('agent_id', 'gateway')
      .eq('action', 'report-view')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    // Group views by discovery_id and find hot signals (3+ views)
    const viewCounts: Record<string, number> = {};
    for (const view of recentViews || []) {
      const did = (view.input as Record<string, unknown>)?.discovery_id as string;
      if (did) viewCounts[did] = (viewCounts[did] || 0) + 1;
    }

    for (const [discoveryId, count] of Object.entries(viewCounts)) {
      if (count >= 2) {
        // Check if we already flagged this engagement
        const { data: existing } = await supabase
          .from('tola_shared_context')
          .select('id')
          .eq('pipeline_id', discoveryId)
          .eq('path_name', 'gateway_to_nexus_engagement')
          .gte('created_at', oneDayAgo)
          .limit(1);

        if (!existing || existing.length === 0) {
          const { data: disc } = await supabase
            .from('discoveries')
            .select('name, company')
            .eq('id', discoveryId)
            .single();

          await writeContext(supabase, {
            pipelineId: discoveryId,
            pipelineType: 'nurture',
            fromAgent: 'gateway',
            toAgent: 'nexus',
            pathName: 'gateway_to_nexus_engagement',
            payload: {
              signal: 'report_revisit',
              views_24h: count,
              contact_name: disc?.name,
              company: disc?.company,
              message: `${disc?.name || 'Prospect'} viewed their report ${count} times in 24h. Hot signal.`,
            },
          });
        }
      }
    }

    await logAction(supabase, 'gateway', 'seo-check', {
      geometryPattern: 'flower_of_life',
      output: {
        sitemap_valid: sitemapValid, sitemap_urls: sitemapUrls,
        robots_valid: robotsValid, ai_crawlers: aiCrawlersAllowed,
        rss_valid: rssValid, total_pages: totalPages,
        report_views_24h: (recentViews || []).length,
        hot_signals: Object.keys(viewCounts).filter(k => viewCounts[k] >= 2).length,
      },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({ sitemap: sitemapValid, robots: robotsValid, rss: rssValid, pages: totalPages }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[agent-gateway]', msg);
    await logAction(supabase, 'gateway', 'seo-error', { output: { error: msg }, latencyMs: Date.now() - start });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
