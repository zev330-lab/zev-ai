// =============================================================================
// Agent: Gateway — Frontend & SEO Monitoring
// Flower of Life engine: interconnected page delivery
// Runs every hour (offset 30 min) via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

const SITE_URL = 'https://zev-ai-swart.vercel.app';

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

    await logAction(supabase, 'gateway', 'seo-check', {
      geometryPattern: 'flower_of_life',
      output: {
        sitemap_valid: sitemapValid, sitemap_urls: sitemapUrls,
        robots_valid: robotsValid, ai_crawlers: aiCrawlersAllowed,
        rss_valid: rssValid, total_pages: totalPages,
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
