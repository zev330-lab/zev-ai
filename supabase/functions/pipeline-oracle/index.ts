// =============================================================================
// Pipeline Oracle — Dual Mode
//   Mode 1 (synthesizing): Generate meeting prep + client insight report (Path 5)
//   Mode 2 (revising): Revise report based on Guardian feedback
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, failPipeline, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';
import { writeContext, getLatestContext } from '../_shared/context-utils.ts';

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

    if (!discovery.research_brief || !discovery.assessment_doc) {
      return jsonResponse({ error: 'Missing research or assessment — run earlier steps first' }, 400);
    }

    const anthropicKey = getAnthropicKey();
    if (!anthropicKey) {
      await failPipeline(supabase, discoveryId, 'Oracle', 'ANTHROPIC_API_KEY not configured');
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    // Route by pipeline status
    if (discovery.pipeline_status === 'revising') {
      return await reviseReport(supabase, discovery, anthropicKey, start);
    }
    return await synthesize(supabase, discovery, anthropicKey, start);

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

// =============================================================================
// Mode 1: Full synthesis — meeting prep + client insight report
// =============================================================================
async function synthesize(
  supabase: ReturnType<typeof getServiceClient>,
  discovery: Record<string, unknown>,
  anthropicKey: string,
  start: number,
) {
  const discoveryId = discovery.id as string;
  const researchJSON = JSON.stringify(discovery.research_brief, null, 2);

  // Progress: Oracle started
  await supabase.from('discoveries').update({ progress_pct: 70 }).eq('id', discoveryId);

  // ── Step 1: Generate Meeting Prep (internal) ───────────────────────────
  const meetingPrompt = `You are the Oracle agent — a synthesis engine. Synthesize the Visionary's research and the Architect's assessment into meeting preparation for Zev (the consultant).

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
(Plain language — who they are, what they need, why they reached out)

## Discovery Questions (7-10)
(Specific to THIS prospect. Example: "Your recent Series B suggests aggressive growth — how is your ops team scaling?" NOT: "Tell me about your company.")

## Potential Objections & Responses
(Pricing, timeline, "we tried AI before," build-vs-buy)

## Talking Points
(Connect their specific situation to what Zev.AI can deliver)

## Red Flags
(Budget mismatch, unrealistic expectations, no authority, vendor-shopping)

## Recommended Engagement Path
(Which package first, upsell path, 12-month vision)

## Competitive Context
(What alternatives they might be evaluating)

Where research has [LIMITED DATA], convert gaps into priority discovery questions.`;

  await supabase.from('discoveries').update({ progress_pct: 75 }).eq('id', discoveryId);

  const meetingResponse = await callClaude(anthropicKey, {
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: meetingPrompt }],
  }, 120_000);

  if (!meetingResponse.ok) {
    const errText = await meetingResponse.text();
    throw new Error(`Claude API error ${meetingResponse.status}: ${errText}`);
  }

  const meetingResult = await meetingResponse.json();
  let meetingPrepDoc = '';
  for (const block of meetingResult.content ?? []) {
    if (block.type === 'text') meetingPrepDoc += block.text;
  }

  const meetingTokens = (meetingResult.usage?.input_tokens ?? 0) + (meetingResult.usage?.output_tokens ?? 0);

  // Save meeting prep
  await supabase.from('discoveries').update({
    meeting_prep_doc: meetingPrepDoc,
    progress_pct: 82,
  }).eq('id', discoveryId);

  // ── Step 2: Generate Client Insight Report (deliverable) ───────────────
  const reportPrompt = `You are the Oracle agent generating a CLIENT-FACING Insight Report. This report may be delivered to a paying client ($499). It must be specific, honest, and worth the money.

**Context:**
- Prospect: ${discovery.name} at ${discovery.company || 'their company'}
- Role: ${discovery.role || 'Not provided'}
- Their pain points: ${discovery.pain_points || 'Not provided'}
- Their magic wand wish: ${discovery.magic_wand || 'Not provided'}

**Visionary Research:**
${researchJSON}

**Architect Scope Assessment:**
${discovery.assessment_doc}

**RULES:**
- The executive summary MUST mention ${discovery.company || discovery.name} by name and their specific situation
- Every opportunity must have specific numbers (dollar amounts, percentages, timeframes)
- "Honest assessment" sections must include genuine concerns, not cheerleading
- "What I would do" must be actionable enough that they could start without hiring anyone
- Decision forks must present genuinely balanced options
- This report should make the reader think "this person understands my business"

**Return ONLY valid JSON:**
{
  "report": {
    "executive_summary": "3-4 sentences, sharp, specific to THIS business. Mention company name.",
    "key_findings": [
      "finding 1 with specifics from research",
      "finding 2 with numbers"
    ],
    "opportunities": [
      {
        "title": "Specific opportunity name",
        "description": "What the opportunity is and why it matters for THEM",
        "expected_impact": "Specific measurable outcome with numbers",
        "honest_assessment": "What could go wrong, what's hard, genuine concerns",
        "what_i_would_do": "Concrete actionable recommendation"
      }
    ],
    "decision_forks": [
      {
        "question": "A genuine strategic question they need to answer",
        "options": ["Option A with tradeoffs", "Option B with tradeoffs"],
        "my_recommendation": "What I'd actually recommend",
        "why": "Reasoning that shows domain expertise"
      }
    ],
    "next_steps": "Concrete next steps, including what they can do RIGHT NOW",
    "fit_for_zev_ai": "strong|moderate|exploratory"
  },
  "delivery_ready": true,
  "synthesis_confidence": "high|medium|low"
}`;

  // Wait briefly for rate limit headroom
  await new Promise(r => setTimeout(r, 2000));

  await supabase.from('discoveries').update({ progress_pct: 85 }).eq('id', discoveryId);

  const reportResponse = await callClaude(anthropicKey, {
    model: 'claude-sonnet-4-6',
    max_tokens: 6144,
    messages: [{ role: 'user', content: reportPrompt }],
  }, 120_000);

  if (!reportResponse.ok) {
    const errText = await reportResponse.text();
    throw new Error(`Claude API error ${reportResponse.status}: ${errText}`);
  }

  const reportResult = await reportResponse.json();
  let reportText = '';
  for (const block of reportResult.content ?? []) {
    if (block.type === 'text') reportText += block.text;
  }

  let reportData: Record<string, unknown>;
  try {
    const jsonMatch = reportText.match(/```(?:json)?\s*([\s\S]*?)```/);
    reportData = JSON.parse(jsonMatch ? jsonMatch[1] : reportText);
  } catch {
    reportData = {
      report: { executive_summary: reportText, key_findings: [], opportunities: [], decision_forks: [], next_steps: '', fit_for_zev_ai: 'exploratory' },
      delivery_ready: false,
      synthesis_confidence: 'low',
    };
  }

  const reportTokens = (reportResult.usage?.input_tokens ?? 0) + (reportResult.usage?.output_tokens ?? 0);
  const totalTokens = meetingTokens + reportTokens;

  // Save report and advance to quality gate
  await supabase.from('discoveries').update({
    report_data: reportData,
    pipeline_status: 'reporting',
    pipeline_step_completed_at: new Date().toISOString(),
    pipeline_started_at: null,
    pipeline_retry_count: 0,
    progress_pct: 88,
  }).eq('id', discoveryId);

  // Auto-create or update contact
  if (discovery.email) {
    const { data: existing } = await supabase.from('contacts').select('id').eq('email', discovery.email).single();
    if (existing) {
      await supabase.from('contacts').update({ status: 'researched' }).eq('id', existing.id);
    } else {
      await supabase.from('contacts').insert({
        name: discovery.name,
        email: discovery.email,
        company: (discovery.company as string) || null,
        message: `Auto-created from discovery pipeline. Role: ${discovery.role || 'N/A'}`,
        status: 'researched',
      });
    }
  }

  // Write to shared context (Path 5 output)
  await writeContext(supabase, {
    pipelineId: discoveryId,
    fromAgent: 'oracle',
    toAgent: 'nexus',
    pathName: 'oracle_to_nexus_report',
    payload: {
      report_data: reportData,
      meeting_prep_length: meetingPrepDoc.length,
      tokens_used: totalTokens,
      synthesis_confidence: (reportData.synthesis_confidence as string) || 'unknown',
      delivery_ready: (reportData.delivery_ready as boolean) || false,
    },
  });

  await Promise.all([
    recordMetric(supabase, 'oracle', 'synthesis_tokens', totalTokens, { discovery_id: discoveryId }),
    logAction(supabase, 'oracle', 'synthesize-discovery', {
      geometryPattern: 'torus',
      output: {
        status: 'complete',
        tokens_used: totalTokens,
        meeting_prep_length: meetingPrepDoc.length,
        report_ready: (reportData.delivery_ready as boolean) || false,
        confidence: (reportData.synthesis_confidence as string) || 'unknown',
      },
      tokensUsed: totalTokens,
      latencyMs: Date.now() - start,
    }),
    updateHeartbeat(supabase, 'oracle'),
  ]);

  return jsonResponse({ status: 'complete', tokens_used: totalTokens, next: 'pipeline-guardian (quality gate)' });
}

// =============================================================================
// Mode 2: Revision — fix report based on Guardian feedback
// =============================================================================
async function reviseReport(
  supabase: ReturnType<typeof getServiceClient>,
  discovery: Record<string, unknown>,
  anthropicKey: string,
  start: number,
) {
  const discoveryId = discovery.id as string;
  const currentReport = discovery.report_data as Record<string, unknown>;

  // Get Guardian's quality feedback from shared context
  const guardianFeedback = await getLatestContext(supabase, discoveryId, 'guardian');
  const revisionInstructions = (guardianFeedback?.revision_instructions as string) ||
    'Improve specificity, add more concrete numbers, and ensure honest assessments.';
  const issues = (guardianFeedback?.issues as Array<Record<string, unknown>>) || [];

  await supabase.from('discoveries').update({ progress_pct: 82 }).eq('id', discoveryId);

  const prompt = `You are the Oracle agent REVISING a client insight report. The Guardian quality gate found issues that need fixing.

**CURRENT REPORT:**
${JSON.stringify(currentReport, null, 2)}

**GUARDIAN'S REVISION INSTRUCTIONS:**
${revisionInstructions}

**SPECIFIC ISSUES TO FIX:**
${issues.map(i => `- [${i.severity}] ${i.location}: ${i.issue} → ${i.suggested_fix}`).join('\n')}

**CONTEXT:**
- Prospect: ${discovery.name} at ${discovery.company || 'their company'}
- This is revision ${(discovery.revision_count as number) || 1} of max 2

**Fix ALL issues listed above. Keep what's working. Return the COMPLETE revised report as valid JSON in the same structure as the original:**
{
  "report": {
    "executive_summary": "...",
    "key_findings": ["..."],
    "opportunities": [{ "title", "description", "expected_impact", "honest_assessment", "what_i_would_do" }],
    "decision_forks": [{ "question", "options", "my_recommendation", "why" }],
    "next_steps": "...",
    "fit_for_zev_ai": "strong|moderate|exploratory"
  },
  "delivery_ready": true,
  "synthesis_confidence": "high|medium|low"
}`;

  const response = await callClaude(anthropicKey, {
    model: 'claude-sonnet-4-6',
    max_tokens: 6144,
    messages: [{ role: 'user', content: prompt }],
  }, 120_000);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const result = await response.json();
  let reportText = '';
  for (const block of result.content ?? []) {
    if (block.type === 'text') reportText += block.text;
  }

  let reportData: Record<string, unknown>;
  try {
    const jsonMatch = reportText.match(/```(?:json)?\s*([\s\S]*?)```/);
    reportData = JSON.parse(jsonMatch ? jsonMatch[1] : reportText);
  } catch {
    reportData = currentReport; // Fall back to original if parse fails
  }

  const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

  // Save revised report and send back to quality gate
  await supabase.from('discoveries').update({
    report_data: reportData,
    pipeline_status: 'reporting',
    pipeline_step_completed_at: new Date().toISOString(),
    pipeline_started_at: null,
    progress_pct: 88,
  }).eq('id', discoveryId);

  // Write to shared context
  await writeContext(supabase, {
    pipelineId: discoveryId,
    fromAgent: 'oracle',
    toAgent: 'nexus',
    pathName: 'oracle_to_nexus_report',
    payload: {
      report_data: reportData,
      revision_number: (discovery.revision_count as number) || 1,
      issues_addressed: issues.length,
      tokens_used: tokensUsed,
    },
  });

  await Promise.all([
    recordMetric(supabase, 'oracle', 'revision_tokens', tokensUsed, { discovery_id: discoveryId }),
    logAction(supabase, 'oracle', 'revise-report', {
      geometryPattern: 'torus',
      output: {
        status: 'revised',
        revision: (discovery.revision_count as number) || 1,
        issues_fixed: issues.length,
        tokens_used: tokensUsed,
      },
      tokensUsed,
      latencyMs: Date.now() - start,
    }),
    updateHeartbeat(supabase, 'oracle'),
  ]);

  return jsonResponse({ status: 'revised', tokens_used: tokensUsed, next: 'pipeline-guardian (quality gate re-check)' });
}
