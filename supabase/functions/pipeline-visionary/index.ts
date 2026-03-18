// =============================================================================
// Pipeline Step 2: Visionary — Researches discovery, then triggers Architect
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, failPipeline, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();
  let discoveryId: string | undefined;

  try {
    const body = await req.json();
    discoveryId = body.discovery_id;
    const discovery_id = discoveryId;
    if (!discovery_id) return jsonResponse({ error: 'discovery_id required' }, 400);

    const supabase = getServiceClient();

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discovery_id)
      .single();

    if (!discovery) return jsonResponse({ error: 'Discovery not found' }, 404);

    const anthropicKey = getAnthropicKey();
    console.log(`[Visionary] ANTHROPIC_API_KEY: ${anthropicKey ? `${anthropicKey.substring(0, 12)}... (${anthropicKey.length} chars)` : 'NOT SET'}`);

    if (!anthropicKey) {
      await failPipeline(supabase, discovery_id, 'Visionary', 'ANTHROPIC_API_KEY not configured');
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    // --- Research via Claude + web_search ---
    const prompt = `You are the Visionary agent in the TOLA framework — a deep research engine powered by Metatron's Cube geometry (exhaustive parallel research across all information sources).

A prospect has submitted a discovery form. Research them thoroughly across these dimensions:

**The Individual:**
- Name: ${discovery.name}
- Role: ${discovery.role || 'Not provided'}
- Find: LinkedIn presence, published content, decision-making authority, background

**The Company:**
- Company: ${discovery.company || 'Not provided'}
- Business: ${discovery.business_overview || 'Not provided'}
- Find: What they do, revenue/size/market position, recent news, funding, leadership, tech stack (check job postings), culture

**The Industry:**
- Find: Market trends, AI/automation adoption by competitors, regulatory environment, common operational pain points

**The Stated Problem:**
- Pain Points: ${discovery.pain_points || 'Not provided'}
- Repetitive Work: ${discovery.repetitive_work || 'Not provided'}
- Magic Wand: ${discovery.magic_wand || 'Not provided'}
- Success Vision: ${discovery.success_vision || 'Not provided'}
- Find: Implicit needs beyond what they wrote, likely root causes, complexity assessment

**AI Readiness:**
- Current AI Experience: ${discovery.ai_experience || 'Not provided'}
- AI Tools: ${discovery.ai_tools_detail || 'Not provided'}

**Potential Solutions:**
- Find: AI agent configurations that could address their problem, what similar companies have done, where TOLA multi-agent systems fit uniquely

**Team Context:**
- Team Size: ${discovery.team_size || 'Not provided'}
${discovery.anything_else ? `- Additional Context: ${discovery.anything_else}` : ''}

CRITICAL: If web search returns limited information about the individual or company, explicitly state what could NOT be found. Mark thin sections with [LIMITED DATA]. Do not invent or assume details. Honest gaps are more valuable than fabricated research.

Return a JSON object with these keys:
{
  "individual": { "summary": "...", "details": "...", "data_quality": "rich|moderate|limited" },
  "company": { "summary": "...", "details": "...", "data_quality": "rich|moderate|limited" },
  "industry": { "summary": "...", "details": "...", "data_quality": "rich|moderate|limited" },
  "stated_problem": { "analysis": "...", "implicit_needs": "...", "complexity": "low|medium|high" },
  "ai_readiness": { "current_state": "...", "readiness_score": 1-10, "gaps": "..." },
  "potential_solutions": { "recommendations": "...", "tola_fit": "..." },
  "red_flags": ["..."],
  "discovery_questions": ["..."]
}`;

    const response = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }, 150_000);

    console.log(`[Visionary] Claude API response status: ${response.status}`);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Visionary] Claude API error body: ${errText}`);
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }

    const result = await response.json();

    let researchText = '';
    for (const block of result.content ?? []) {
      if (block.type === 'text') researchText += block.text;
    }

    let researchBrief: Record<string, unknown>;
    try {
      const jsonMatch = researchText.match(/```(?:json)?\s*([\s\S]*?)```/);
      researchBrief = JSON.parse(jsonMatch ? jsonMatch[1] : researchText);
    } catch {
      researchBrief = { raw_research: researchText };
    }

    // --- Save and advance (pg_cron worker dispatches Architect after cooldown) ---
    await supabase.from('discoveries').update({
      research_brief: researchBrief,
      pipeline_status: 'scoping',
      pipeline_step_completed_at: new Date().toISOString(),
      pipeline_started_at: null,
      pipeline_retry_count: 0,
    }).eq('id', discovery_id);

    const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

    await Promise.all([
      recordMetric(supabase, 'visionary', 'research_tokens', tokensUsed, { discovery_id }),
      logAction(supabase, 'visionary', 'research-discovery', {
        geometryPattern: 'metatrons_cube',
        output: { status: 'complete', tokens_used: tokensUsed, sections: Object.keys(researchBrief).length },
        tokensUsed,
        latencyMs: Date.now() - start,
      }),
      updateHeartbeat(supabase, 'visionary'),
    ]);

    // pg_cron worker will dispatch pipeline-architect after 60s cooldown
    return jsonResponse({ status: 'complete', tokens_used: tokensUsed, next: 'pipeline-architect' });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown research error';
    if (discoveryId) {
      try {
        const supabase = getServiceClient();
        await failPipeline(supabase, discoveryId, 'Visionary research', errorMsg);
      } catch { /* best effort */ }
    }
    return jsonResponse({ error: errorMsg }, 500);
  }
});
