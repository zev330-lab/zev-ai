// =============================================================================
// Pipeline Guardian — Dual Mode
//   Mode 1 (pipeline_status=pending): Input validation (Path 2)
//   Mode 2 (pipeline_status=reporting): Quality gate with Claude eval (Path 6)
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

  try {
    const { discovery_id } = await req.json();
    if (!discovery_id) return jsonResponse({ error: 'discovery_id required' }, 400);

    const supabase = getServiceClient();

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discovery_id)
      .single();

    if (!discovery) return jsonResponse({ error: 'Discovery not found' }, 404);

    // ── Route by pipeline status ──────────────────────────────────────────
    if (discovery.pipeline_status === 'reporting') {
      return await qualityGate(supabase, discovery, start);
    }
    return await inputValidation(supabase, discovery, start);

  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

// =============================================================================
// Mode 1: Input Validation (Path 2)
// =============================================================================
async function inputValidation(
  supabase: ReturnType<typeof getServiceClient>,
  discovery: Record<string, unknown>,
  start: number,
) {
  const discoveryId = discovery.id as string;
  const issues: string[] = [];
  const flags: string[] = [];

  const name = ((discovery.name as string) || '').trim();
  const email = ((discovery.email as string) || '').trim();
  const business = ((discovery.business_overview as string) || '').trim();
  const painPoints = ((discovery.pain_points as string) || '').trim();

  // Name validation
  if (name.length < 2) issues.push('Name too short');

  // Email format validation
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push('Invalid email format');
  }

  // Content validation
  if (business.length < 10) issues.push('Business overview too brief');
  if (painPoints.length < 10) issues.push('Pain points too brief');

  // Spam/injection detection
  const allText = `${name} ${business} ${painPoints} ${discovery.magic_wand || ''} ${discovery.anything_else || ''}`.toLowerCase();
  const spamWords = ['buy now', 'click here', 'free money', 'casino', 'viagra', 'lottery', 'nigerian prince', 'wire transfer'];
  const hasSpam = spamWords.some((w) => allText.includes(w));
  if (hasSpam) flags.push('Spam content detected');

  // Script injection detection
  if (/<script|javascript:|on\w+=/i.test(allText)) {
    flags.push('Possible injection attempt');
  }

  // Profanity check (basic)
  const profanityPatterns = [/\bf[*u][*c]k/i, /\bsh[*i]t/i, /\bass\b/i];
  if (profanityPatterns.some(p => p.test(allText))) {
    flags.push('Profanity detected');
  }

  // Assign risk tier
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (flags.length > 0) riskLevel = 'high';
  else if (issues.length > 0) riskLevel = 'medium';

  // Determine recommendation
  let validation: 'pass' | 'fail' | 'flag' = 'pass';
  let recommendation: 'proceed' | 'review' | 'reject' = 'proceed';

  if (hasSpam || flags.some(f => f.includes('injection'))) {
    validation = 'fail';
    recommendation = 'reject';
  } else if (flags.length > 0) {
    validation = 'flag';
    recommendation = 'review';
  } else if (issues.length > 1) {
    validation = 'flag';
    recommendation = 'review';
  }

  const guardianPayload = {
    validation,
    risk_level: riskLevel,
    flags: [...issues, ...flags],
    recommendation,
  };

  if (validation === 'fail') {
    await supabase.from('discoveries').update({
      status: 'archived',
      pipeline_status: 'failed',
      pipeline_error: `Guardian rejected: ${[...issues, ...flags].join(', ')}`,
    }).eq('id', discoveryId);

    await writeContext(supabase, {
      pipelineId: discoveryId,
      fromAgent: 'guardian',
      toAgent: 'nexus',
      pathName: 'guardian_to_nexus_validated',
      payload: guardianPayload,
    });

    await logAction(supabase, 'guardian', 'validate-discovery', {
      geometryPattern: 'yin_yang',
      output: { status: 'rejected', ...guardianPayload },
      latencyMs: Date.now() - start,
    });

    return jsonResponse({ status: 'rejected', ...guardianPayload });
  }

  // Pass or flag — advance to researching
  await supabase.from('discoveries').update({
    pipeline_status: validation === 'flag' ? 'pending' : 'researching',
    pipeline_started_at: null,
    progress_pct: validation === 'flag' ? 0 : 10,
  }).eq('id', discoveryId);

  // Write to shared context
  await writeContext(supabase, {
    pipelineId: discoveryId,
    fromAgent: 'guardian',
    toAgent: 'nexus',
    pathName: 'guardian_to_nexus_validated',
    payload: guardianPayload,
    tierLevel: validation === 'flag' ? 3 : 1,
  });

  await Promise.all([
    logAction(supabase, 'guardian', 'validate-discovery', {
      geometryPattern: 'yin_yang',
      output: { status: validation, ...guardianPayload },
      latencyMs: Date.now() - start,
    }),
    updateHeartbeat(supabase, 'guardian'),
  ]);

  return jsonResponse({ status: validation, ...guardianPayload });
}

// =============================================================================
// Mode 2: Quality Gate (Path 6) — Real evaluation, not rubber stamp
// =============================================================================
async function qualityGate(
  supabase: ReturnType<typeof getServiceClient>,
  discovery: Record<string, unknown>,
  start: number,
) {
  const discoveryId = discovery.id as string;

  const reportData = discovery.report_data as Record<string, unknown> | null;
  if (!reportData) {
    await failPipeline(supabase, discoveryId, 'Quality gate', 'No report_data to evaluate');
    return jsonResponse({ error: 'No report_data — run Oracle first' }, 400);
  }

  const anthropicKey = getAnthropicKey();
  if (!anthropicKey) {
    await failPipeline(supabase, discoveryId, 'Quality gate', 'ANTHROPIC_API_KEY not configured');
    return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
  }

  const researchBrief = discovery.research_brief as Record<string, unknown> | null;
  const report = reportData.report as Record<string, unknown> | undefined;

  const prompt = `You are the Guardian agent performing a QUALITY GATE on an Insight Report before it is delivered to a paying client ($499).

This is NOT a rubber stamp. You must critically evaluate whether this report is worth $499. Be honest.

**The Prospect:**
- Name: ${discovery.name}
- Company: ${discovery.company || 'Not provided'}
- Industry: ${(researchBrief as Record<string, unknown>)?.company_profile ? ((researchBrief as Record<string, unknown>).company_profile as Record<string, unknown>)?.industry || 'Unknown' : 'Unknown'}

**The Report Being Evaluated:**
${JSON.stringify(report || reportData, null, 2)}

**Visionary's Research Sources (for fact-checking):**
${researchBrief ? JSON.stringify((researchBrief as Record<string, unknown>).raw_sources || (researchBrief as Record<string, unknown>).sources_consulted || 'No sources recorded') : 'No research brief available'}

**Evaluate against these criteria (score each 0-1):**

1. **Specificity** (0.20 weight): Does the executive summary mention the company by name and their specific situation? Are opportunities backed by numbers and timelines, not vague promises like "improve efficiency"?

2. **Honest Assessment** (0.20 weight): Is the honest assessment actually honest? Does it flag real concerns, or is it just cheerleading? Are there genuine caveats about what might not work?

3. **Decision Forks** (0.15 weight): Do the decision forks present genuine tradeoffs with real pros/cons, or are they obvious choices where one option is clearly better?

4. **Actionability** (0.15 weight): Would a business owner read the "what I would do" sections and know exactly what to do next? Are next steps concrete?

5. **Value** (0.15 weight): Would a business owner pay $499 for this and feel it was worth it? Does it contain insights they couldn't get from a 5-minute Google search?

6. **Accuracy** (0.15 weight): Are there any hallucinated facts? Do claims align with the Visionary's research? Are company details correct?

Return ONLY valid JSON:
{
  "scores": {
    "specificity": 0.0,
    "honest_assessment": 0.0,
    "decision_forks": 0.0,
    "actionability": 0.0,
    "value": 0.0,
    "accuracy": 0.0
  },
  "quality_score": 0.0,
  "pass_threshold": 0.80,
  "verdict": "pass" | "fail" | "needs_revision",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "location": "section_name",
      "issue": "description of the problem",
      "suggested_fix": "how to fix it"
    }
  ],
  "revision_instructions": "specific instructions for Oracle to fix the report" | null,
  "summary": "one-paragraph quality assessment"
}`;

  const response = await callClaude(anthropicKey, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  }, 120_000);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const result = await response.json();
  let evalText = '';
  for (const block of result.content ?? []) {
    if (block.type === 'text') evalText += block.text;
  }

  let evaluation: Record<string, unknown>;
  try {
    const jsonMatch = evalText.match(/```(?:json)?\s*([\s\S]*?)```/);
    evaluation = JSON.parse(jsonMatch ? jsonMatch[1] : evalText);
  } catch {
    evaluation = {
      quality_score: 0.5,
      verdict: 'needs_revision',
      issues: [{ severity: 'major', location: 'evaluation', issue: 'Could not parse quality evaluation', suggested_fix: 'Re-run quality gate' }],
      revision_instructions: 'Quality gate evaluation failed to parse. Please regenerate.',
    };
  }

  const qualityScore = (evaluation.quality_score as number) || 0;
  const verdict = (evaluation.verdict as string) || 'needs_revision';
  const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

  // Update discovery based on verdict
  if (verdict === 'pass') {
    const track = (discovery.pipeline_track as string) || 'free';
    await supabase.from('discoveries').update({
      pipeline_status: track === 'paid_499' ? 'delivering' : 'complete',
      quality_gate_score: qualityScore,
      pipeline_step_completed_at: new Date().toISOString(),
      pipeline_started_at: null,
      progress_pct: track === 'paid_499' ? 92 : 100,
      pipeline_completed_at: track === 'paid_499' ? null : new Date().toISOString(),
    }).eq('id', discoveryId);
  } else if (verdict === 'needs_revision') {
    const revisionCount = ((discovery.revision_count as number) || 0);
    if (revisionCount < 2) {
      await supabase.from('discoveries').update({
        pipeline_status: 'revising',
        quality_gate_score: qualityScore,
        pipeline_step_completed_at: new Date().toISOString(),
        pipeline_started_at: null,
        progress_pct: 80,
      }).eq('id', discoveryId);
    } else {
      // Max revisions, mark complete for Crown review
      await supabase.from('discoveries').update({
        pipeline_status: 'complete',
        quality_gate_score: qualityScore,
        pipeline_completed_at: new Date().toISOString(),
        pipeline_step_completed_at: new Date().toISOString(),
        pipeline_started_at: null,
        progress_pct: 100,
      }).eq('id', discoveryId);
    }
  } else {
    // Hard fail
    await supabase.from('discoveries').update({
      pipeline_status: 'complete',
      quality_gate_score: qualityScore,
      pipeline_completed_at: new Date().toISOString(),
      pipeline_step_completed_at: new Date().toISOString(),
      pipeline_started_at: null,
      progress_pct: 100,
    }).eq('id', discoveryId);
  }

  // Write quality verdict to shared context
  await writeContext(supabase, {
    pipelineId: discoveryId,
    fromAgent: 'guardian',
    toAgent: 'nexus',
    pathName: 'guardian_to_nexus_quality',
    payload: evaluation,
    qualityScore,
  });

  await Promise.all([
    recordMetric(supabase, 'guardian', 'quality_gate_score', qualityScore, { discovery_id: discoveryId }),
    recordMetric(supabase, 'guardian', 'quality_gate_tokens', tokensUsed, { discovery_id: discoveryId }),
    logAction(supabase, 'guardian', 'quality-gate', {
      geometryPattern: 'yin_yang',
      output: { verdict, quality_score: qualityScore, issues_count: ((evaluation.issues as unknown[]) || []).length },
      tokensUsed,
      latencyMs: Date.now() - start,
    }),
    updateHeartbeat(supabase, 'guardian'),
  ]);

  return jsonResponse({ status: verdict, quality_score: qualityScore, tokens_used: tokensUsed });
}
