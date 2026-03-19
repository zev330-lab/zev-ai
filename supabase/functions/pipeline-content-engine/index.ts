// =============================================================================
// Pipeline: Content Engine — Multi-step blog post generation
// Steps: topic_research → outlining → drafting → reviewing → social_gen → review
// Each step is one Claude call. pg_cron advances between steps with 60s cooldown.
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

const AUTHOR_VOICE = `Write in Zev Steinmetz's voice: authoritative, practical, direct. No fluff, no buzzwords, no filler. Use real examples and specific numbers where possible. The reader is a business leader or operator who wants actionable information, not hype. Tone is professional but approachable — like talking to a smart friend who happens to be an AI expert.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();

  try {
    const body = await req.json();
    const blogPostId = body.blog_post_id;

    if (!blogPostId) return jsonResponse({ error: 'blog_post_id required' }, 400);

    const supabase = getServiceClient();
    const anthropicKey = getAnthropicKey();
    if (!anthropicKey) return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

    const { data: post } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    if (!post) return jsonResponse({ error: 'Blog post not found' }, 404);

    // Rate limit check
    if (post.pipeline_step_completed_at) {
      const elapsed = Date.now() - new Date(post.pipeline_step_completed_at).getTime();
      if (elapsed < 60_000) {
        const wait = Math.ceil((60_000 - elapsed) / 1000);
        return jsonResponse({ error: `Rate limited — wait ${wait}s`, retry_after: wait }, 429);
      }
    }

    const step = post.status;
    let result: Record<string, unknown>;

    switch (step) {
      case 'topic_research':
        result = await stepTopicResearch(anthropicKey, supabase, post);
        break;
      case 'outlining':
        result = await stepOutline(anthropicKey, supabase, post);
        break;
      case 'drafting':
        result = await stepDraft(anthropicKey, supabase, post);
        break;
      case 'reviewing':
        result = await stepReview(anthropicKey, supabase, post);
        break;
      case 'social_gen':
        result = await stepSocialGen(anthropicKey, supabase, post);
        break;
      default:
        return jsonResponse({ error: `Invalid step: ${step}` }, 400);
    }

    const latency = Date.now() - start;
    await Promise.all([
      recordMetric(supabase, result.agent as string, 'content_engine_tokens', result.tokens as number, { blog_post_id: blogPostId, step }),
      logAction(supabase, result.agent as string, `content-engine-${step}`, {
        output: { status: 'complete', step, tokens_used: result.tokens },
        tokensUsed: result.tokens as number,
        latencyMs: latency,
      }),
      updateHeartbeat(supabase, result.agent as string),
    ]);

    return jsonResponse({ status: 'complete', step, next: result.nextStatus });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown content engine error';
    console.error('[pipeline-content-engine]', msg);
    return jsonResponse({ error: msg }, 500);
  }
});

// ---------------------------------------------------------------------------
// Step 1: Topic Research (Visionary agent)
// ---------------------------------------------------------------------------
async function stepTopicResearch(key: string, supabase: ReturnType<typeof getServiceClient>, post: Record<string, unknown>) {
  // Fetch existing posts to avoid duplication
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('title, category, slug')
    .neq('id', post.id)
    .in('status', ['review', 'published', 'drafting', 'reviewing', 'social_gen']);

  const existingTitles = (existing || []).map((p: Record<string, unknown>) => p.title).join('\n- ');

  const response = await callClaude(key, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    system: `You are a content strategist for zev.ai, an AI consulting practice. Research trending AI topics and select the best one for a blog post. ${AUTHOR_VOICE}`,
    messages: [{
      role: 'user',
      content: `Research current trending topics in AI implementation and automation for businesses. Then select ONE topic that would make an excellent blog post.

Content pillars (pick one): ${CONTENT_PILLARS.join(', ')}

AVOID these existing topics (no duplication):
- ${existingTitles || 'No existing posts'}

Respond in this EXACT JSON format (no markdown, no code fences):
{
  "title": "Blog post title — clear, specific, ideally question format for AEO",
  "excerpt": "2-3 sentence summary that hooks the reader",
  "category": "One of the 6 content pillars above",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo_title": "SEO-optimized title (50-60 chars)",
  "seo_description": "Meta description (150-160 chars)",
  "topic_research": "3-5 paragraphs of research findings that will inform the article — key data points, trends, examples, expert opinions found during research"
}`,
    }],
  }, 120_000);

  if (!response.ok) throw new Error(`Claude API error ${response.status}: ${await response.text()}`);
  const result = await response.json();

  // Extract text from response (skip tool use blocks)
  let text = '';
  for (const block of result.content ?? []) {
    if (block.type === 'text') text += block.text;
  }

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse topic research JSON');
  const parsed = JSON.parse(jsonMatch[0]);

  const slug = (parsed.title as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  const tokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

  await supabase.from('blog_posts').update({
    title: parsed.title,
    excerpt: parsed.excerpt,
    category: parsed.category,
    tags: parsed.tags,
    seo_title: parsed.seo_title,
    seo_description: parsed.seo_description,
    slug: slug || post.slug,
    generation_data: { topic_research: parsed.topic_research },
    status: 'outlining',
    generation_started_at: null,
    pipeline_step_completed_at: new Date().toISOString(),
    generation_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', post.id);

  return { agent: 'visionary', tokens, nextStatus: 'outlining' };
}

// ---------------------------------------------------------------------------
// Step 2: Outline (Architect agent)
// ---------------------------------------------------------------------------
async function stepOutline(key: string, supabase: ReturnType<typeof getServiceClient>, post: Record<string, unknown>) {
  const genData = (post.generation_data as Record<string, unknown>) || {};

  const response = await callClaude(key, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an expert content architect. Create structured blog post outlines optimized for Answer Engine Optimization (AEO) — headers should be in question format where possible. ${AUTHOR_VOICE}`,
    messages: [{
      role: 'user',
      content: `Create a detailed outline for this blog post:

Title: ${post.title}
Category: ${post.category}
Topic Research: ${genData.topic_research || 'Not available'}

Requirements:
- 1,500-2,500 words target
- Use question-format H2/H3 headers for AEO optimization
- Include an FAQ section with 3-5 common questions
- Each section should have bullet points of key points to cover
- Include target keywords for SEO

Respond in this EXACT JSON format (no markdown, no code fences):
{
  "outline": [
    {"level": 2, "heading": "Question-format heading?", "points": ["key point 1", "key point 2"]},
    {"level": 3, "heading": "Sub-question?", "points": ["point 1"]}
  ],
  "faq": [
    {"question": "Common question?", "answer_points": ["key point for answer"]}
  ],
  "target_keywords": ["keyword1", "keyword2", "keyword3"]
}`,
    }],
  }, 120_000);

  if (!response.ok) throw new Error(`Claude API error ${response.status}: ${await response.text()}`);
  const result = await response.json();

  let text = '';
  for (const block of result.content ?? []) {
    if (block.type === 'text') text += block.text;
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse outline JSON');
  const parsed = JSON.parse(jsonMatch[0]);

  const tokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

  await supabase.from('blog_posts').update({
    generation_data: { ...genData, outline: parsed.outline, faq: parsed.faq, target_keywords: parsed.target_keywords },
    status: 'drafting',
    generation_started_at: null,
    pipeline_step_completed_at: new Date().toISOString(),
    generation_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', post.id);

  return { agent: 'architect', tokens, nextStatus: 'drafting' };
}

// ---------------------------------------------------------------------------
// Step 3: Draft (Oracle agent)
// ---------------------------------------------------------------------------
async function stepDraft(key: string, supabase: ReturnType<typeof getServiceClient>, post: Record<string, unknown>) {
  const genData = (post.generation_data as Record<string, unknown>) || {};

  const response = await callClaude(key, {
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: `You are Zev Steinmetz writing a blog post for zev.ai. ${AUTHOR_VOICE}

Write in markdown format. Use ## for main sections and ### for subsections. Include the FAQ section at the end with ## Frequently Asked Questions.`,
    messages: [{
      role: 'user',
      content: `Write the full blog post based on this outline:

Title: ${post.title}
Category: ${post.category}
Excerpt: ${post.excerpt}
Topic Research: ${genData.topic_research || ''}

Outline:
${JSON.stringify(genData.outline || [], null, 2)}

FAQ:
${JSON.stringify(genData.faq || [], null, 2)}

Target Keywords: ${JSON.stringify(genData.target_keywords || [])}

Requirements:
- 1,500-2,500 words
- Start with a compelling hook paragraph (no heading needed for intro)
- Use the outline headings (keep them in question format for AEO)
- Include specific examples, data points, and actionable advice
- End with the FAQ section
- End with a brief conclusion that includes a CTA to visit /discover
- Do NOT include the title as an H1 — just start with the intro paragraph`,
    }],
  }, 120_000);

  if (!response.ok) throw new Error(`Claude API error ${response.status}: ${await response.text()}`);
  const result = await response.json();

  let content = '';
  for (const block of result.content ?? []) {
    if (block.type === 'text') content += block.text;
  }

  // Estimate reading time (avg 200 words per minute)
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const tokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

  await supabase.from('blog_posts').update({
    content,
    reading_time_min: readingTime,
    generation_data: { ...genData, word_count: wordCount },
    status: 'reviewing',
    generation_started_at: null,
    pipeline_step_completed_at: new Date().toISOString(),
    generation_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', post.id);

  return { agent: 'oracle', tokens, nextStatus: 'reviewing' };
}

// ---------------------------------------------------------------------------
// Step 4: Review (Guardian agent)
// ---------------------------------------------------------------------------
async function stepReview(key: string, supabase: ReturnType<typeof getServiceClient>, post: Record<string, unknown>) {
  const genData = (post.generation_data as Record<string, unknown>) || {};

  const response = await callClaude(key, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are a quality reviewer for zev.ai blog content. Review the post for: factual accuracy, brand consistency, writing quality, SEO optimization, and AEO readiness. Be specific and actionable in your feedback. Flag anything that needs human review.`,
    messages: [{
      role: 'user',
      content: `Review this blog post:

Title: ${post.title}
Category: ${post.category}

Content:
${post.content}

Respond in this EXACT JSON format (no markdown, no code fences):
{
  "overall_score": 8,
  "quality_notes": "Brief overall assessment",
  "issues": [
    {"severity": "minor|major|critical", "description": "Specific issue", "suggestion": "How to fix"}
  ],
  "seo_score": 7,
  "seo_notes": "SEO assessment",
  "brand_consistent": true,
  "needs_human_review": false,
  "human_review_reason": null
}`,
    }],
  }, 120_000);

  if (!response.ok) throw new Error(`Claude API error ${response.status}: ${await response.text()}`);
  const result = await response.json();

  let text = '';
  for (const block of result.content ?? []) {
    if (block.type === 'text') text += block.text;
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse review JSON');
  const parsed = JSON.parse(jsonMatch[0]);

  const tokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

  await supabase.from('blog_posts').update({
    generation_data: { ...genData, review: parsed },
    status: 'social_gen',
    generation_started_at: null,
    pipeline_step_completed_at: new Date().toISOString(),
    generation_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', post.id);

  return { agent: 'guardian', tokens, nextStatus: 'social_gen' };
}

// ---------------------------------------------------------------------------
// Step 5: Social Generation (Catalyst agent)
// ---------------------------------------------------------------------------
async function stepSocialGen(key: string, supabase: ReturnType<typeof getServiceClient>, post: Record<string, unknown>) {
  const genData = (post.generation_data as Record<string, unknown>) || {};

  const response = await callClaude(key, {
    model: 'claude-sonnet-4-6',
    max_tokens: 3072,
    system: `You are a social media strategist for zev.ai. Generate social media variants from blog content. Each variant should be native to its platform — not just a truncated version of the same text. ${AUTHOR_VOICE}`,
    messages: [{
      role: 'user',
      content: `Generate social media posts from this blog post:

Title: ${post.title}
Excerpt: ${post.excerpt}
Category: ${post.category}

Full content:
${(post.content as string || '').slice(0, 3000)}

Generate variants for each platform. Respond in this EXACT JSON format (no markdown, no code fences):
{
  "social_posts": [
    {"platform": "linkedin", "content": "LinkedIn post (800-1500 chars). Start with a strong hook. Include line breaks for readability. End with a question or CTA. Include 3-5 relevant hashtags."},
    {"platform": "twitter", "content": "Twitter/X post (max 280 chars). Punchy, quotable. No hashtags unless essential."},
    {"platform": "twitter", "content": "Alternative Twitter angle (max 280 chars)."},
    {"platform": "instagram", "content": "Instagram caption (500-800 chars). Engaging, visual language. Include emoji sparingly. End with CTA and hashtags."},
    {"platform": "threads", "content": "Threads post (300-500 chars). Conversational, opinion-forward."}
  ]
}`,
    }],
  }, 120_000);

  if (!response.ok) throw new Error(`Claude API error ${response.status}: ${await response.text()}`);
  const result = await response.json();

  let text = '';
  for (const block of result.content ?? []) {
    if (block.type === 'text') text += block.text;
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse social gen JSON');
  const parsed = JSON.parse(jsonMatch[0]);

  const tokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

  await supabase.from('blog_posts').update({
    social_posts: parsed.social_posts,
    status: 'review',
    generation_started_at: null,
    pipeline_step_completed_at: new Date().toISOString(),
    generation_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', post.id);

  return { agent: 'catalyst', tokens, nextStatus: 'review' };
}
