// =============================================================================
// Pipeline Step 5: Proposal Generator — Generates professional consulting SOW
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, failPipeline, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';

const PRICING_DEFAULTS = {
  hourlyRange: '$175-250/hr',
  assessments: '$2,500-$5,000',
  implementations: '$5,000-$25,000',
  retainers: '$5,000-$10,000/mo',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();
  let discoveryId: string | undefined;

  try {
    const body = await req.json();
    discoveryId = body.discovery_id;
    const promptOverride = body.prompt_context as string | undefined;

    if (!discoveryId) return jsonResponse({ error: 'discovery_id required' }, 400);

    const supabase = getServiceClient();

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discoveryId)
      .single();

    if (!discovery) return jsonResponse({ error: 'Discovery not found' }, 404);

    // Check rate limit — 60s cooldown from last pipeline step
    if (discovery.pipeline_step_completed_at) {
      const elapsed = Date.now() - new Date(discovery.pipeline_step_completed_at).getTime();
      if (elapsed < 60_000) {
        const wait = Math.ceil((60_000 - elapsed) / 1000);
        return jsonResponse({ error: `Rate limited — wait ${wait}s`, retry_after: wait }, 429);
      }
    }

    if (!discovery.research_brief || !discovery.assessment_doc || !discovery.meeting_prep_doc) {
      return jsonResponse({ error: 'Pipeline must be complete before generating proposal' }, 400);
    }

    const anthropicKey = getAnthropicKey();
    if (!anthropicKey) {
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    const includePricing = discovery.include_pricing !== false;
    const researchJSON = JSON.stringify(discovery.research_brief, null, 2);

    const pricingSection = includePricing
      ? `## Investment Options

Present THREE pricing tiers based on these ranges:
- Hourly consulting: ${PRICING_DEFAULTS.hourlyRange}
- Assessment packages: ${PRICING_DEFAULTS.assessments}
- Implementation projects: ${PRICING_DEFAULTS.implementations}
- Ongoing optimization retainers: ${PRICING_DEFAULTS.retainers}

**Tier 1 — Conservative:** Focused assessment + quick wins. Lower investment, targeted scope.
**Tier 2 — Recommended:** Full implementation of core solution. Best value-to-impact ratio.
**Tier 3 — Comprehensive:** End-to-end transformation with ongoing support.

For each tier, provide a specific dollar amount or range appropriate to the prospect's size and scope.`
      : `## Investment

*Pricing to be discussed during our consultation call. We'll tailor the investment to your specific scope, timeline, and organizational needs.*`;

    const defaultContext = `**Prospect:**
- Name: ${discovery.name}
- Company: ${discovery.company || 'Not provided'}
- Role: ${discovery.role || 'Not provided'}
- Team Size: ${discovery.team_size || 'Not provided'}

**Pain Points:**
${discovery.pain_points || 'Not provided'}

**Magic Wand (ideal outcome):**
${discovery.magic_wand || 'Not provided'}

**Success Vision:**
${discovery.success_vision || 'Not provided'}

**Visionary Research:**
${researchJSON}

**Architect Assessment:**
${discovery.assessment_doc}

**Oracle Meeting Prep:**
${discovery.meeting_prep_doc}`;

    const promptContext = promptOverride || defaultContext;

    const systemPrompt = `You are a senior AI consultant writing a professional proposal/Statement of Work for Zev Steinmetz's AI consulting practice (zev.ai). You use the TOLA framework — a multi-agent AI system built on sacred geometry principles.

Write proposals that are:
- Professional but warm — not corporate-speak
- Specific to this prospect (reference their actual problems, not generic benefits)
- Confident without being arrogant
- Clear about deliverables and timelines
- Honest about limitations

NEVER use Kabbalah/Hebrew references — use secular names only (Crown, Visionary, etc.).`;

    const prompt = `Generate a professional consulting proposal based on the following discovery data.

${promptContext}

**Structure the proposal EXACTLY as follows:**

# Proposal: AI Transformation for ${discovery.company || discovery.name}

## Executive Summary
(2-3 sentences: their problem, our understanding, our proposed approach)

## Discovery Findings
(Synthesized insights from research — what we learned about their business, industry, and challenges. Make it clear we did our homework.)

## Proposed Solution
(Map their needs to specific TOLA capabilities. Explain what we'll build/implement in plain language. Reference the agent framework where relevant but don't over-explain it.)

### Phase 1: Assessment & Quick Wins (Weeks 1-2)
(Specific deliverables for the first phase)

### Phase 2: Core Implementation (Weeks 3-6)
(Main build-out)

### Phase 3: Optimization & Handoff (Weeks 7-8)
(Refinement, training, documentation)

## Deliverables
(Bulleted list of concrete deliverables they'll receive)

${pricingSection}

## Terms & Next Steps
- Engagement begins upon signed agreement
- 50% upfront, 50% at completion (or milestone-based for larger projects)
- All custom code and documentation is client property
- 30-day post-delivery support included

**Immediate Next Step:** Schedule a 30-minute discovery call to refine scope and answer questions.

## Why Zev.AI
(Brief differentiator — multi-agent AI systems, not just chatbots. Production-grade, not prototypes.)`;

    const response = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 6144,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }, 120_000);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    let proposalMarkdown = '';
    for (const block of result.content ?? []) {
      if (block.type === 'text') proposalMarkdown += block.text;
    }

    const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

    const proposalData = {
      markdown: proposalMarkdown,
      generated_at: new Date().toISOString(),
      model_used: 'claude-sonnet-4-6',
      tokens_used: tokensUsed,
      include_pricing: includePricing,
      prompt_context: promptContext,
    };

    // Save proposal and update step timestamp for rate limiting
    await supabase.from('discoveries').update({
      proposal_data: proposalData,
      pipeline_step_completed_at: new Date().toISOString(),
    }).eq('id', discoveryId);

    await Promise.all([
      recordMetric(supabase, 'oracle', 'proposal_tokens', tokensUsed, { discovery_id: discoveryId }),
      logAction(supabase, 'oracle', 'generate-proposal', {
        geometryPattern: 'torus',
        output: { status: 'complete', tokens_used: tokensUsed, doc_length: proposalMarkdown.length },
        tokensUsed,
        latencyMs: Date.now() - start,
      }),
      updateHeartbeat(supabase, 'oracle'),
    ]);

    return jsonResponse({ status: 'complete', tokens_used: tokensUsed });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown proposal error';
    console.error('[pipeline-proposal]', errorMsg);
    return jsonResponse({ error: errorMsg }, 500);
  }
});
