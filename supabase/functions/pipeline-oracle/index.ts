// =============================================================================
// Pipeline Step 4: Oracle — Generates meeting prep, marks pipeline complete
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, delay, failPipeline, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';

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

    // Wait 60s for rate limit window to reset after Architect's Claude call
    console.log('[Oracle] Waiting 60s for rate limit cooldown...');
    await delay(60_000);

    const supabase = getServiceClient();

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discovery_id)
      .single();

    if (!discovery) return jsonResponse({ error: 'Discovery not found' }, 404);
    if (!discovery.research_brief || !discovery.assessment_doc) {
      return jsonResponse({ error: 'Missing research or assessment — run earlier steps first' }, 400);
    }

    const anthropicKey = getAnthropicKey();
    if (!anthropicKey) {
      await failPipeline(supabase, discovery_id, 'Oracle', 'ANTHROPIC_API_KEY not configured');
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    // --- Meeting prep synthesis via Claude ---
    const researchJSON = JSON.stringify(discovery.research_brief, null, 2);

    const prompt = `You are the Oracle agent in the TOLA framework — an iterative synthesis engine powered by Torus geometry (continuous refinement loop that converges to insight).

Synthesize the Visionary's research and the Architect's assessment into meeting preparation for Zev (the consultant).

**Prospect:**
- Name: ${discovery.name}
- Company: ${discovery.company || 'Not provided'}
- Role: ${discovery.role || 'Not provided'}

**Visionary Research:**
${researchJSON}

**Architect Assessment:**
${discovery.assessment_doc}

**Produce meeting prep in this exact structure:**

# Meeting Prep: ${discovery.name}${discovery.company ? ` — ${discovery.company}` : ''}

## One-Paragraph Prospect Snapshot
(Plain language summary — who they are, what they need, why they reached out)

## Discovery Questions (7-10)
(Specific to this prospect, informed by research. NOT generic. Example: "Your recent Series B suggests aggressive growth — how is your ops team scaling to match?" NOT: "Tell me about your company.")

## Potential Objections & Responses
(Pricing, timeline, "we tried AI before," build-vs-buy — with specific counters)

## Talking Points
(Connect their specific situation to TOLA's strengths)

## Red Flags
(Budget too low, unrealistic expectations, no decision authority, vendor-shopping)

## Recommended Engagement Path
(Which package first, upsell path, 12-month relationship vision)

## Competitive Context
(What alternatives they might be evaluating, how TOLA differs)

Where research has [LIMITED DATA], convert gaps into priority discovery questions.`;

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
    let meetingPrepDoc = '';
    for (const block of result.content ?? []) {
      if (block.type === 'text') meetingPrepDoc += block.text;
    }

    // --- Save and mark complete ---
    await supabase.from('discoveries').update({
      meeting_prep_doc: meetingPrepDoc,
      pipeline_status: 'complete',
      pipeline_completed_at: new Date().toISOString(),
    }).eq('id', discovery_id);

    const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

    await Promise.all([
      recordMetric(supabase, 'oracle', 'synthesis_tokens', tokensUsed, { discovery_id }),
      logAction(supabase, 'oracle', 'synthesize-discovery', {
        geometryPattern: 'torus',
        output: { status: 'complete', tokens_used: tokensUsed, doc_length: meetingPrepDoc.length },
        tokensUsed,
        latencyMs: Date.now() - start,
      }),
      updateHeartbeat(supabase, 'oracle'),
    ]);

    return jsonResponse({ status: 'complete', tokens_used: tokensUsed });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown synthesis error';
    if (discoveryId) {
      try {
        const supabase = getServiceClient();
        await failPipeline(supabase, discoveryId, 'Oracle synthesis', errorMsg);
      } catch { /* best effort */ }
    }
    return jsonResponse({ error: errorMsg }, 500);
  }
});
