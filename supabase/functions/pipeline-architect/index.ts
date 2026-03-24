// =============================================================================
// Pipeline Architect — Scope Assessment with Spec Data Contract (Path 4)
// Reads Visionary's research, outputs: opportunities[], recommended_tier,
// recommended_scope, constraints_identified, fit_assessment, decision_forks[]
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, failPipeline, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';
import { writeContext } from '../_shared/context-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();
  let discoveryId: string | undefined;

  try {
    const body = await req.json();
    discoveryId = body.discovery_id;
    if (!discoveryId) return jsonResponse({ error: 'discovery_id required' }, 400);

    const supabase = getServiceClient();

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discoveryId)
      .single();

    if (!discovery) return jsonResponse({ error: 'Discovery not found' }, 404);

    // Progress: Architect started
    await supabase.from('discoveries').update({ progress_pct: 40 }).eq('id', discoveryId);

    if (!discovery.research_brief) {
      return jsonResponse({ error: 'No research brief — run Visionary first' }, 400);
    }

    const anthropicKey = getAnthropicKey();
    if (!anthropicKey) {
      await failPipeline(supabase, discoveryId, 'Architect', 'ANTHROPIC_API_KEY not configured');
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    const researchJSON = JSON.stringify(discovery.research_brief, null, 2);

    const prompt = `You are the Architect agent — a constraint-satisfaction engine. You have the prospect's form data and Visionary's research. Produce a structured scope assessment.

**9 CONSTRAINTS your assessment must satisfy:**
1. Address the prospect's STATED problem
2. Address UNSTATED needs revealed by research
3. Technically feasible (Next.js, React, Supabase, Claude API stack)
4. Fits the prospect's likely budget range
5. Realistic timeline for the complexity
6. Accounts for their technical maturity level
7. Addresses risk factors from research
8. Creates a natural Assess → Build → Optimize → Scale path
9. Concrete enough to justify engagement

**PROSPECT FORM DATA:**
- Name: ${discovery.name}
- Company: ${discovery.company || 'Not provided'}
- Role: ${discovery.role || 'Not provided'}
- Business: ${discovery.business_overview || 'Not provided'}
- Pain Points: ${discovery.pain_points || 'Not provided'}
- Repetitive Work: ${discovery.repetitive_work || 'Not provided'}
- Team Size: ${discovery.team_size || 'Not provided'}
- AI Experience: ${discovery.ai_experience || 'Not provided'}
- AI Tools: ${discovery.ai_tools_detail || 'Not provided'}
- Magic Wand: ${discovery.magic_wand || 'Not provided'}
- Success Vision: ${discovery.success_vision || 'Not provided'}

**VISIONARY RESEARCH:**
${researchJSON}

**RULES:**
- Where research has [LIMITED DATA], frame those areas as discovery questions, not assumptions
- If something is a poor fit, SAY SO — honesty builds trust
- Include real numbers: dollar estimates, week counts, percentage impacts
- Decision forks must have genuinely balanced options, not one obvious winner

**Return ONLY valid JSON matching this exact structure:**
{
  "opportunities": [
    {
      "name": "Lead generation automation",
      "pain_point_addressed": "Spending $X on Y with poor ROI",
      "proposed_solution": "What we'd actually build",
      "feasibility": "high|medium|low",
      "estimated_effort": "X-Y weeks",
      "expected_impact": "Specific measurable outcome",
      "honest_caveat": "What could go wrong or take longer"
    }
  ],
  "recommended_tier": "assess|build|optimize|scale",
  "recommended_scope": {
    "phase_1": "Description and deliverables",
    "phase_2": "Description and deliverables",
    "estimated_total_investment": "$X,000-$Y,000"
  },
  "constraints_identified": [
    "Specific constraint with context"
  ],
  "fit_assessment": "strong|moderate|weak",
  "fit_reasoning": "Why this is or isn't a good fit, honestly",
  "decision_forks": [
    {
      "fork": "Build custom CRM vs. use existing tools",
      "option_a": "Custom: $X, full control, 6-week build",
      "option_b": "Existing: $Y/mo, faster start, less customization",
      "recommendation": "Which and why"
    }
  ]
}`;

    // Progress: Claude API call starting
    await supabase.from('discoveries').update({ progress_pct: 45 }).eq('id', discoveryId);

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
    let scopeText = '';
    for (const block of result.content ?? []) {
      if (block.type === 'text') scopeText += block.text;
    }

    // Parse structured JSON output
    let scopeData: Record<string, unknown>;
    try {
      const jsonMatch = scopeText.match(/```(?:json)?\s*([\s\S]*?)```/);
      scopeData = JSON.parse(jsonMatch ? jsonMatch[1] : scopeText);
    } catch {
      scopeData = { raw_assessment: scopeText };
    }

    // Also generate markdown assessment for backward compatibility
    const assessmentDoc = formatScopeAsMarkdown(scopeData, discovery);

    // Save and advance
    await supabase.from('discoveries').update({
      assessment_doc: assessmentDoc,
      pipeline_status: 'synthesizing',
      pipeline_step_completed_at: new Date().toISOString(),
      pipeline_started_at: null,
      pipeline_retry_count: 0,
      progress_pct: 65,
    }).eq('id', discoveryId);

    const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

    // Write to shared context (Path 4 output)
    await writeContext(supabase, {
      pipelineId: discoveryId,
      fromAgent: 'architect',
      toAgent: 'nexus',
      pathName: 'architect_to_nexus_scoped',
      payload: {
        scope_data: scopeData,
        tokens_used: tokensUsed,
        fit_assessment: (scopeData.fit_assessment as string) || 'unknown',
        recommended_tier: (scopeData.recommended_tier as string) || 'assess',
        opportunities_count: Array.isArray(scopeData.opportunities) ? scopeData.opportunities.length : 0,
      },
    });

    await Promise.all([
      recordMetric(supabase, 'architect', 'scope_tokens', tokensUsed, { discovery_id: discoveryId }),
      logAction(supabase, 'architect', 'scope-discovery', {
        geometryPattern: 'sri_yantra',
        output: {
          status: 'complete',
          tokens_used: tokensUsed,
          fit: (scopeData.fit_assessment as string) || 'unknown',
          opportunities: Array.isArray(scopeData.opportunities) ? scopeData.opportunities.length : 0,
        },
        tokensUsed,
        latencyMs: Date.now() - start,
      }),
      updateHeartbeat(supabase, 'architect'),
    ]);

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

/**
 * Format the structured scope data as markdown for backward compatibility
 * with the admin discoveries detail view.
 */
function formatScopeAsMarkdown(
  scope: Record<string, unknown>,
  discovery: Record<string, unknown>,
): string {
  if (scope.raw_assessment) return scope.raw_assessment as string;

  const lines: string[] = [];
  lines.push(`# Assessment: ${discovery.company || discovery.name}`);
  lines.push('');

  // Fit assessment
  lines.push(`## Fit Assessment: ${((scope.fit_assessment as string) || 'Unknown').toUpperCase()}`);
  if (scope.fit_reasoning) lines.push(`\n${scope.fit_reasoning}`);
  lines.push('');

  // Opportunities
  const opps = (scope.opportunities as Array<Record<string, unknown>>) || [];
  if (opps.length) {
    lines.push('## Opportunity Map');
    lines.push('');
    for (const opp of opps) {
      lines.push(`### ${opp.name}`);
      lines.push(`**Pain Point:** ${opp.pain_point_addressed}`);
      lines.push(`**Solution:** ${opp.proposed_solution}`);
      lines.push(`**Feasibility:** ${opp.feasibility} | **Effort:** ${opp.estimated_effort}`);
      lines.push(`**Expected Impact:** ${opp.expected_impact}`);
      if (opp.honest_caveat) lines.push(`**Caveat:** ${opp.honest_caveat}`);
      lines.push('');
    }
  }

  // Recommended scope
  const rs = scope.recommended_scope as Record<string, unknown>;
  if (rs) {
    lines.push('## Recommended Scope');
    lines.push(`**Recommended Tier:** ${scope.recommended_tier || 'assess'}`);
    if (rs.phase_1) lines.push(`\n**Phase 1:** ${rs.phase_1}`);
    if (rs.phase_2) lines.push(`**Phase 2:** ${rs.phase_2}`);
    if (rs.estimated_total_investment) lines.push(`**Investment:** ${rs.estimated_total_investment}`);
    lines.push('');
  }

  // Decision forks
  const forks = (scope.decision_forks as Array<Record<string, unknown>>) || [];
  if (forks.length) {
    lines.push('## Decision Forks');
    for (const fork of forks) {
      lines.push(`\n### ${fork.fork}`);
      lines.push(`- **Option A:** ${fork.option_a}`);
      lines.push(`- **Option B:** ${fork.option_b}`);
      lines.push(`- **Recommendation:** ${fork.recommendation}`);
    }
    lines.push('');
  }

  // Constraints
  const constraints = (scope.constraints_identified as string[]) || [];
  if (constraints.length) {
    lines.push('## Key Risks & Constraints');
    for (const c of constraints) lines.push(`- ${c}`);
    lines.push('');
  }

  return lines.join('\n');
}
