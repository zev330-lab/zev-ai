// =============================================================================
// Pipeline: Social Agent — Daily social content generation
// Triggered Mon-Fri 7am EST by pg_cron, or on-demand from admin
// Catalyst generates posts, Guardian reviews them
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';

const CONTENT_PILLARS = [
  'AI Implementation Guides',
  'AI Strategy for Leaders',
  'Industry-Specific AI',
  'AI Tools & Comparisons',
  'Case Studies',
  'AI Trends',
];

const PLATFORMS = ['linkedin', 'twitter', 'instagram', 'threads', 'tiktok'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();

  try {
    const supabase = getServiceClient();
    const anthropicKey = getAnthropicKey();
    if (!anthropicKey) return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

    // Check how many approved/scheduled posts exist for next 3 days
    const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString();
    const { count: approvedCount } = await supabase
      .from('social_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'scheduled'])
      .or(`scheduled_for.is.null,scheduled_for.lte.${threeDaysOut}`);

    if ((approvedCount ?? 0) >= 3) {
      return jsonResponse({ status: 'skipped', reason: 'Queue has sufficient approved posts' });
    }

    // Get recent blog posts for content source
    const { data: recentPosts } = await supabase
      .from('blog_posts')
      .select('title, excerpt, category, content')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5);

    // Get recent discovery insights (anonymized)
    const { data: recentDiscoveries } = await supabase
      .from('discoveries')
      .select('pain_points, ai_experience, magic_wand')
      .eq('pipeline_status', 'complete')
      .order('created_at', { ascending: false })
      .limit(3);

    // Get pillar distribution from last 2 weeks for balance
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: recentSocial } = await supabase
      .from('social_queue')
      .select('content_pillar')
      .gte('created_at', twoWeeksAgo);

    const pillarCounts: Record<string, number> = {};
    for (const pillar of CONTENT_PILLARS) pillarCounts[pillar] = 0;
    for (const s of recentSocial || []) {
      if (s.content_pillar && pillarCounts[s.content_pillar] !== undefined) {
        pillarCounts[s.content_pillar]++;
      }
    }
    const underrepresented = Object.entries(pillarCounts)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([p]) => p);

    const blogContext = (recentPosts || []).map((p: Record<string, unknown>) =>
      `- "${p.title}" (${p.category}): ${p.excerpt}`
    ).join('\n');

    const painPoints = (recentDiscoveries || []).map((d: Record<string, unknown>) =>
      d.pain_points ? `- ${String(d.pain_points).slice(0, 200)}` : ''
    ).filter(Boolean).join('\n');

    // Step 1: Catalyst generates posts
    const genResponse = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are a social media strategist for zev.ai, an AI consulting practice run by Zev Steinmetz. Generate engaging social media content that positions Zev as a hands-on AI builder, not a generic consultant.

Voice: authoritative, practical, direct. No fluff or corporate-speak. Use specific examples and numbers. Be opinionated about AI — hot takes welcome.

Platform formatting rules:
- LinkedIn: 800-1500 chars, hook-first opening line, short paragraphs (1-2 sentences), end with question or CTA, 3-5 hashtags
- Twitter/X: under 280 chars, punchy and opinionated. For threads, provide a JSON array of tweets.
- Instagram: caption with strategic emoji (not excessive), include 20-30 hashtags in a separate block, include image_prompt describing ideal visual
- Threads: conversational, opinion-forward, 500 chars max
- TikTok: script format with [HOOK] (first 3 seconds), [BODY], [CTA] markers`,
      messages: [{
        role: 'user',
        content: `Generate 2-3 social media posts for different platforms. Mix up the platforms.

Recent blog content to draw from:
${blogContext || 'No recent blog posts'}

Common prospect pain points:
${painPoints || 'No recent discovery data'}

Prioritize these underrepresented content pillars: ${underrepresented.join(', ')}

Content pillars: ${CONTENT_PILLARS.join(', ')}

Respond in this EXACT JSON format (no markdown, no code fences):
{
  "posts": [
    {
      "platform": "linkedin",
      "content": "Full post text here",
      "content_pillar": "One of the 6 pillars",
      "image_prompt": null,
      "rationale": "Brief reason for this topic/angle"
    }
  ]
}`,
      }],
    }, 120_000);

    if (!genResponse.ok) throw new Error(`Claude API error ${genResponse.status}: ${await genResponse.text()}`);
    const genResult = await genResponse.json();

    let genText = '';
    for (const block of genResult.content ?? []) {
      if (block.type === 'text') genText += block.text;
    }

    const genMatch = genText.match(/\{[\s\S]*\}/);
    if (!genMatch) throw new Error('Failed to parse social generation JSON');
    const generated = JSON.parse(genMatch[0]);
    const genTokens = (genResult.usage?.input_tokens ?? 0) + (genResult.usage?.output_tokens ?? 0);

    // Wait for rate limit cooldown
    await new Promise((r) => setTimeout(r, 5000));

    // Step 2: Guardian reviews each post
    const reviewResponse = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are a brand quality reviewer for zev.ai. Review social media posts for: brand consistency (authoritative AI builder, not generic consultant), tone (professional but approachable), platform-appropriateness, factual accuracy, and engagement potential. Flag anything that sounds like generic AI hype.`,
      messages: [{
        role: 'user',
        content: `Review these social posts and provide quality scores:

${JSON.stringify(generated.posts, null, 2)}

Respond in this EXACT JSON format (no markdown, no code fences):
{
  "reviews": [
    {
      "index": 0,
      "score": 8,
      "brand_ok": true,
      "notes": "Brief review note",
      "approved": true
    }
  ]
}`,
      }],
    }, 120_000);

    if (!reviewResponse.ok) throw new Error(`Claude review error ${reviewResponse.status}`);
    const reviewResult = await reviewResponse.json();

    let reviewText = '';
    for (const block of reviewResult.content ?? []) {
      if (block.type === 'text') reviewText += block.text;
    }

    const reviewMatch = reviewText.match(/\{[\s\S]*\}/);
    const reviews = reviewMatch ? JSON.parse(reviewMatch[0]).reviews || [] : [];
    const reviewTokens = (reviewResult.usage?.input_tokens ?? 0) + (reviewResult.usage?.output_tokens ?? 0);

    // Insert approved posts into social_queue
    const posts = generated.posts || [];
    const inserts = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const review = reviews.find((r: Record<string, unknown>) => r.index === i);
      inserts.push({
        platform: post.platform,
        content: post.content,
        content_pillar: post.content_pillar || '',
        image_prompt: post.image_prompt || null,
        review_notes: review ? `Score: ${review.score}/10. ${review.notes}` : '',
        status: 'draft',
      });
    }

    if (inserts.length > 0) {
      await supabase.from('social_queue').insert(inserts);
    }

    const totalTokens = genTokens + reviewTokens;
    const latency = Date.now() - start;

    await Promise.all([
      logAction(supabase, 'catalyst', 'social-agent-generate', {
        output: { posts_generated: posts.length, tokens: genTokens },
        tokensUsed: genTokens,
        latencyMs: latency,
      }),
      logAction(supabase, 'guardian', 'social-agent-review', {
        output: { posts_reviewed: reviews.length, tokens: reviewTokens },
        tokensUsed: reviewTokens,
      }),
      recordMetric(supabase, 'catalyst', 'social_posts_generated', posts.length),
      updateHeartbeat(supabase, 'catalyst'),
      updateHeartbeat(supabase, 'guardian'),
    ]);

    return jsonResponse({
      status: 'complete',
      posts_generated: posts.length,
      tokens_used: totalTokens,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown social agent error';
    console.error('[pipeline-social-agent]', msg);
    return jsonResponse({ error: msg }, 500);
  }
});
