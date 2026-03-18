// =============================================================================
// Pipeline Step 3: Architect — Generates assessment, then triggers Oracle
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, delay, triggerNext, failPipeline, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';

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

    // Wait 60s for rate limit window to reset after Visionary's Claude call
    console.log('[Architect] Waiting 60s for rate limit cooldown...');
    await delay(60_000);

    const supabase = getServiceClient();

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discovery_id)
      .single();

    if (!discovery) return jsonResponse({ error: 'Discovery not found' }, 404);
    if (!discovery.research_brief) {
      return jsonResponse({ error: 'No research brief — run Visionary first' }, 400);
    }

    const anthropicKey = getAnthropicKey();
    if (!anthropicKey) {
      await failPipeline(supabase, discovery_id, 'Architect', 'ANTHROPIC_API_KEY not configured');
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    // --- Scope assessment via Claude ---
    const researchJSON = JSON.stringify(discovery.research_brief, null, 2);

    const prompt = `You are the Architect agent in the TOLA framework — a constraint-satisfaction engine powered by Sri Yantra geometry (9 interlocking constraints that must all be satisfied simultaneously).

You have the prospect's form data and the Visionary's research. Produce a scope assessment.

**Form Data:**
- Name: ${discovery.name}
- Company: ${discovery.company || 'Not provided'}
- Role: ${discovery.role || 'Not provided'}
- Business: ${discovery.business_overview || 'Not provided'}
- Pain Points: ${discovery.pain_points || 'Not provided'}
- Team Size: ${discovery.team_size || 'Not provided'}
- AI Experience: ${discovery.ai_experience || 'Not provided'}

**Visionary Research:**
${researchJSON}

**9 Constraints Your Assessment Must Satisfy:**
1. Address the prospect's STATED problem
2. Address UNSTATED needs from research
3. Technically feasible with current stack (Next.js, React, Supabase, Claude API)
4. Fits prospect's likely budget range
5. Realistic timeline for the complexity
6. Accounts for prospect's technical maturity
7. Addresses risk factors from research
8. Creates natural Assess → Build → Optimize → Scale path
9. Concrete enough to justify engagement fee

Where research has [LIMITED DATA] tags, frame those areas as discovery questions rather than assumptions.

**Output as markdown with this structure:**

# Assessment: [Company Name]

## Executive Summary
(2-3 paragraphs)

## Current State Analysis
(from research)

## Opportunity Map
(3-5 AI agent opportunities, ranked by impact + feasibility)

## Recommended Solutions

### Starter Tier
- TOLA nodes: [which agents]
- Timeline: [estimate]
- Investment: [range]
- Delivers: [what]

### Growth Tier
- TOLA nodes: [which agents]
- Timeline: [estimate]
- Investment: [range]
- Delivers: [what]

### Enterprise Tier
- TOLA nodes: [which agents]
- Timeline: [estimate]
- Investment: [range]
- Delivers: [what]

## Key Risks & Dependencies

## Recommended Next Steps`;

    const response = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }, 120_000);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    let assessmentDoc = '';
    for (const block of result.content ?? []) {
      if (block.type === 'text') assessmentDoc += block.text;
    }

    // --- Save and chain ---
    await supabase.from('discoveries').update({
      assessment_doc: assessmentDoc,
      pipeline_status: 'synthesizing',
    }).eq('id', discovery_id);

    const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

    await Promise.all([
      recordMetric(supabase, 'architect', 'scope_tokens', tokensUsed, { discovery_id }),
      logAction(supabase, 'architect', 'scope-discovery', {
        geometryPattern: 'sri_yantra',
        output: { status: 'complete', tokens_used: tokensUsed, doc_length: assessmentDoc.length },
        tokensUsed,
        latencyMs: Date.now() - start,
      }),
      updateHeartbeat(supabase, 'architect'),
    ]);

    // Fire-and-forget: trigger Oracle
    triggerNext('pipeline-oracle', discovery_id);

    return jsonResponse({ status: 'complete', tokens_used: tokensUsed, next: 'pipeline-oracle' });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown scoping error';
    if (discoveryId) {
      try {
        const supabase = getServiceClient();
        await failPipeline(supabase, discoveryId, 'Architect scoping', errorMsg);
      } catch { /* best effort */ }
    }
    return jsonResponse({ error: errorMsg }, 500);
  }
});
