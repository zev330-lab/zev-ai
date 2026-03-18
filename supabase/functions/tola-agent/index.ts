// =============================================================================
// TOLA v3.0 — Unified Agent Edge Function ("fat function" pattern)
//
// Single endpoint that routes to all 11 agent handlers.
// Invoked via POST with { "agent": "<id>", "action": "<action>", ... }
//
// Shared infrastructure:
//   - Kill switch check (skip if engaged)
//   - Audit logging (every invocation logged to tola_agent_log)
//   - Heartbeat update (marks agent as healthy + updates timestamp)
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import {
  checkKillSwitch,
  logAction,
  updateHeartbeat,
  recordMetric,
  jsonResponse,
  CORS_HEADERS,
} from '../_shared/agent-utils.ts';
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Agent handler type
// ---------------------------------------------------------------------------

type AgentHandler = (
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// Helper: Call Claude API with AbortController timeout
// ---------------------------------------------------------------------------

async function callClaude(
  anthropicKey: string,
  body: Record<string, unknown>,
  timeoutMs = 150_000,
  maxRetries = 1,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      // Retry on rate limit (429) — respect retry-after header
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
        const waitMs = Math.min(retryAfter * 1000, 90_000); // cap at 90s
        console.log(`[callClaude] Rate limited (429). Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${maxRetries}`);
        clearTimeout(timer);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`Claude API timed out after ${Math.round(timeoutMs / 1000)}s`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  // Should not reach here, but satisfy TypeScript
  throw new Error('callClaude: exhausted retries');
}

// ---------------------------------------------------------------------------
// Sentinel — Merkabah health monitoring
// ---------------------------------------------------------------------------

const sentinel: AgentHandler = async (supabase) => {
  const checks: Record<string, unknown> = {};

  const dbStart = Date.now();
  const { error: dbError } = await supabase.from('tola_agents').select('id').limit(1);
  checks.db = { ok: !dbError, latency_ms: Date.now() - dbStart };

  const { data: agents } = await supabase.from('tola_agents').select('id, last_heartbeat, status');
  const staleThreshold = Date.now() - 5 * 60 * 1000;
  const staleAgents = (agents ?? []).filter((a: { last_heartbeat: string | null }) => {
    if (!a.last_heartbeat) return true;
    return new Date(a.last_heartbeat).getTime() < staleThreshold;
  });

  for (const stale of staleAgents) {
    if ((stale as { status: string }).status !== 'offline') {
      await supabase.from('tola_agents').update({ status: 'degraded' }).eq('id', (stale as { id: string }).id);
    }
  }

  checks.stale_agents = staleAgents.map((a: { id: string }) => a.id);

  const healthScore = staleAgents.length === 0 && !dbError ? 1.0 : dbError ? 0.0 : 0.5;
  await recordMetric(supabase, 'sentinel', 'system_health', healthScore, {
    db_ok: !dbError,
    stale_count: staleAgents.length,
  });

  return { status: 'complete', checks, health_score: healthScore };
};

// ---------------------------------------------------------------------------
// Foundation — Seed of Life infrastructure maintenance
// ---------------------------------------------------------------------------

const foundation: AgentHandler = async (supabase) => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: deletedLogs } = await supabase
    .from('tola_agent_log')
    .delete()
    .lt('created_at', cutoff)
    .select('*', { count: 'exact', head: true });

  const metricCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count: deletedMetrics } = await supabase
    .from('tola_agent_metrics')
    .delete()
    .lt('created_at', metricCutoff)
    .select('*', { count: 'exact', head: true });

  const { count: totalLogs } = await supabase.from('tola_agent_log').select('*', { count: 'exact', head: true });
  const { count: totalMetrics } = await supabase.from('tola_agent_metrics').select('*', { count: 'exact', head: true });

  return {
    status: 'complete',
    cleaned: { logs: deletedLogs ?? 0, metrics: deletedMetrics ?? 0 },
    totals: { logs: totalLogs ?? 0, metrics: totalMetrics ?? 0 },
  };
};

// ---------------------------------------------------------------------------
// Nexus — Flower of Life intelligent routing
// ---------------------------------------------------------------------------

const nexus: AgentHandler = async (supabase) => {
  const { data: newContacts } = await supabase
    .from('contacts')
    .select('id, name, message')
    .eq('status', 'new')
    .limit(20);

  let classified = 0;

  for (const contact of newContacts ?? []) {
    const msg = ((contact as { message: string }).message ?? '').toLowerCase();
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'deadline'];
    const highValueKeywords = ['enterprise', 'scale', 'multiple', 'team', 'budget'];

    const isUrgent = urgencyKeywords.some((k) => msg.includes(k));
    const isHighValue = highValueKeywords.some((k) => msg.includes(k));

    if (isUrgent || isHighValue) {
      const notes = [
        isUrgent ? '[NEXUS: URGENT]' : '',
        isHighValue ? '[NEXUS: HIGH-VALUE]' : '',
      ].filter(Boolean).join(' ');

      await supabase
        .from('contacts')
        .update({ notes })
        .eq('id', (contact as { id: string }).id)
        .is('notes', null);

      classified++;
    }
  }

  return { status: 'complete', processed: newContacts?.length ?? 0, classified };
};

// ---------------------------------------------------------------------------
// Guardian — Yin-Yang adversarial validation
// Validates discovery form submissions for spam/quality
// ---------------------------------------------------------------------------

const guardian: AgentHandler = async (supabase, payload) => {
  const action = payload.action as string;

  if (action === 'validate-discovery') {
    const discoveryId = payload.discovery_id as string;
    if (!discoveryId) return { status: 'error', message: 'discovery_id required' };

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discoveryId)
      .single();

    if (!discovery) return { status: 'error', message: 'Discovery not found' };

    // Basic validation checks
    const issues: string[] = [];
    const name = (discovery.name || '').trim();
    const business = (discovery.business_overview || '').trim();
    const painPoints = (discovery.pain_points || '').trim();

    if (name.length < 2) issues.push('Name too short');
    if (business.length < 10) issues.push('Business overview too brief');
    if (painPoints.length < 10) issues.push('Pain points too brief');

    // Spam indicators
    const allText = `${name} ${business} ${painPoints} ${discovery.magic_wand || ''}`.toLowerCase();
    const spamWords = ['buy now', 'click here', 'free money', 'casino', 'viagra', 'lottery'];
    const hasSpam = spamWords.some((w) => allText.includes(w));
    if (hasSpam) issues.push('Spam content detected');

    if (issues.length > 0 && hasSpam) {
      // Reject spam
      await supabase.from('discoveries').update({
        status: 'archived',
        pipeline_status: 'failed',
        pipeline_error: `Guardian rejected: ${issues.join(', ')}`,
      }).eq('id', discoveryId);

      return { status: 'rejected', issues };
    }

    // Valid — update status (pipeline runner drives the next step)
    await supabase.from('discoveries').update({
      pipeline_status: 'researching',
    }).eq('id', discoveryId);

    return { status: 'validated', issues: issues.length > 0 ? issues : undefined };
  }

  // Default: validate most recent unprocessed discovery
  const { data: latest } = await supabase
    .from('discoveries')
    .select('id')
    .eq('pipeline_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!latest) return { status: 'idle', message: 'No pending discoveries' };

  // Re-invoke with specific discovery
  return guardian(supabase, { ...payload, action: 'validate-discovery', discovery_id: latest.id });
};

// ---------------------------------------------------------------------------
// Visionary — Metatron's Cube deep research
// Uses Claude API with web_search tool for 13-dimension analysis
// ---------------------------------------------------------------------------

const visionary: AgentHandler = async (supabase, payload) => {
  const action = payload.action as string;

  if (action === 'research-discovery') {
    const discoveryId = payload.discovery_id as string;
    if (!discoveryId) return { status: 'error', message: 'discovery_id required' };

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discoveryId)
      .single();

    if (!discovery) return { status: 'error', message: 'Discovery not found' };

    const rawKey = Deno.env.get('ANTHROPIC_API_KEY');
    // Strip non-printable chars, whitespace, and surrounding quotes (common dashboard paste issues)
    const anthropicKey = rawKey?.replace(/[^\x20-\x7E]/g, '').trim().replace(/^["']|["']$/g, '');
    console.log(`[Visionary] ANTHROPIC_API_KEY: ${anthropicKey ? `${anthropicKey.substring(0, 12)}... (${anthropicKey.length} chars)` : 'NOT SET'} raw length=${rawKey?.length ?? 0}`);
    if (!anthropicKey) {
      await supabase.from('discoveries').update({
        pipeline_status: 'failed',
        pipeline_error: 'ANTHROPIC_API_KEY not configured in Edge Function secrets',
      }).eq('id', discoveryId);
      return { status: 'error', message: 'ANTHROPIC_API_KEY not configured' };
    }

    try {
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
      }, 180_000); // 3 min — web_search is slow

      console.log(`[Visionary] Claude API response status: ${response.status}`);
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Visionary] Claude API error body: ${errText}`);
        throw new Error(`Claude API error ${response.status}: ${errText}`);
      }

      const result = await response.json();

      // Extract text content from response
      let researchText = '';
      for (const block of result.content ?? []) {
        if (block.type === 'text') {
          researchText += block.text;
        }
      }

      // Try to parse as JSON, fall back to raw text
      let researchBrief: Record<string, unknown>;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = researchText.match(/```(?:json)?\s*([\s\S]*?)```/);
        researchBrief = JSON.parse(jsonMatch ? jsonMatch[1] : researchText);
      } catch {
        researchBrief = { raw_research: researchText };
      }

      // Save to DB and chain to Architect
      await supabase.from('discoveries').update({
        research_brief: researchBrief,
        pipeline_status: 'scoping',
      }).eq('id', discoveryId);

      // Record token usage
      const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);
      await recordMetric(supabase, 'visionary', 'research_tokens', tokensUsed, { discovery_id: discoveryId });

      return { status: 'complete', tokens_used: tokensUsed, research_sections: Object.keys(researchBrief).length };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown research error';
      await supabase.from('discoveries').update({
        pipeline_status: 'failed',
        pipeline_error: `Visionary research failed: ${errorMsg}`,
      }).eq('id', discoveryId);
      return { status: 'error', message: errorMsg };
    }
  }

  // Default: research most recent discovery that needs it
  const { data: latest } = await supabase
    .from('discoveries')
    .select('id')
    .eq('pipeline_status', 'researching')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!latest) return { status: 'idle', message: 'No discoveries awaiting research' };
  return visionary(supabase, { ...payload, action: 'research-discovery', discovery_id: latest.id });
};

// ---------------------------------------------------------------------------
// Architect — Sri Yantra constraint-based scope assessment
// ---------------------------------------------------------------------------

const architect: AgentHandler = async (supabase, payload) => {
  const action = payload.action as string;

  if (action === 'scope-discovery') {
    const discoveryId = payload.discovery_id as string;
    if (!discoveryId) return { status: 'error', message: 'discovery_id required' };

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discoveryId)
      .single();

    if (!discovery) return { status: 'error', message: 'Discovery not found' };
    if (!discovery.research_brief) return { status: 'error', message: 'No research brief — run Visionary first' };

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')?.replace(/[^\x20-\x7E]/g, '').trim().replace(/^["']|["']$/g, '');
    if (!anthropicKey) {
      await supabase.from('discoveries').update({
        pipeline_status: 'failed',
        pipeline_error: 'ANTHROPIC_API_KEY not configured',
      }).eq('id', discoveryId);
      return { status: 'error', message: 'ANTHROPIC_API_KEY not configured' };
    }

    try {
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

      await supabase.from('discoveries').update({
        assessment_doc: assessmentDoc,
        pipeline_status: 'synthesizing',
      }).eq('id', discoveryId);

      const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);
      await recordMetric(supabase, 'architect', 'scope_tokens', tokensUsed, { discovery_id: discoveryId });

      return { status: 'complete', tokens_used: tokensUsed, doc_length: assessmentDoc.length };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown scoping error';
      await supabase.from('discoveries').update({
        pipeline_status: 'failed',
        pipeline_error: `Architect scoping failed: ${errorMsg}`,
      }).eq('id', discoveryId);
      return { status: 'error', message: errorMsg };
    }
  }

  // Default: scope most recent discovery with research
  const { data: latest } = await supabase
    .from('discoveries')
    .select('id')
    .eq('pipeline_status', 'scoping')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!latest) return { status: 'idle', message: 'No discoveries awaiting scoping' };
  return architect(supabase, { ...payload, action: 'scope-discovery', discovery_id: latest.id });
};

// ---------------------------------------------------------------------------
// Oracle — Torus iterative synthesis (meeting prep)
// ---------------------------------------------------------------------------

const oracle: AgentHandler = async (supabase, payload) => {
  const action = payload.action as string;

  if (action === 'synthesize-discovery') {
    const discoveryId = payload.discovery_id as string;
    if (!discoveryId) return { status: 'error', message: 'discovery_id required' };

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discoveryId)
      .single();

    if (!discovery) return { status: 'error', message: 'Discovery not found' };
    if (!discovery.research_brief || !discovery.assessment_doc) {
      return { status: 'error', message: 'Missing research or assessment — run earlier steps first' };
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')?.replace(/[^\x20-\x7E]/g, '').trim().replace(/^["']|["']$/g, '');
    if (!anthropicKey) {
      await supabase.from('discoveries').update({
        pipeline_status: 'failed',
        pipeline_error: 'ANTHROPIC_API_KEY not configured',
      }).eq('id', discoveryId);
      return { status: 'error', message: 'ANTHROPIC_API_KEY not configured' };
    }

    try {
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

      await supabase.from('discoveries').update({
        meeting_prep_doc: meetingPrepDoc,
        pipeline_status: 'complete',
        pipeline_completed_at: new Date().toISOString(),
      }).eq('id', discoveryId);

      const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);
      await recordMetric(supabase, 'oracle', 'synthesis_tokens', tokensUsed, { discovery_id: discoveryId });

      return { status: 'complete', tokens_used: tokensUsed, doc_length: meetingPrepDoc.length };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown synthesis error';
      await supabase.from('discoveries').update({
        pipeline_status: 'failed',
        pipeline_error: `Oracle synthesis failed: ${errorMsg}`,
      }).eq('id', discoveryId);
      return { status: 'error', message: errorMsg };
    }
  }

  // Default: synthesize most recent discovery with research + scope
  const { data: latest } = await supabase
    .from('discoveries')
    .select('id')
    .eq('pipeline_status', 'synthesizing')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!latest) return { status: 'idle', message: 'No discoveries awaiting synthesis' };
  return oracle(supabase, { ...payload, action: 'synthesize-discovery', discovery_id: latest.id });
};

// ---------------------------------------------------------------------------
// Remaining agent stubs
// ---------------------------------------------------------------------------

function createStub(agentId: string, geometryEngine: string): AgentHandler {
  return async () => ({
    status: 'ready',
    agent: agentId,
    geometry_engine: geometryEngine,
    message: `${agentId} agent is online and awaiting activation.`,
  });
}

const crown: AgentHandler = createStub('crown', 'seed_of_life');
const catalyst: AgentHandler = createStub('catalyst', 'lotus');
const prism: AgentHandler = createStub('prism', 'vortex');
const gateway: AgentHandler = createStub('gateway', 'flower_of_life');

// ---------------------------------------------------------------------------
// Pipeline runner — sequential in-process orchestration
// Replaces unreliable fire-and-forget HTTP chains.
// Each step saves to DB before proceeding, so pipeline is RESUMABLE:
// if the function gets killed, re-triggering picks up from the last checkpoint.
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Map pipeline_status values to the step index that PRODUCED that status.
// Used to determine which steps have already completed on resume.
const STATUS_STEP_INDEX: Record<string, number> = {
  pending: -1,       // no steps completed
  researching: 0,    // guardian completed
  scoping: 1,        // visionary completed
  synthesizing: 2,   // architect completed
  complete: 3,       // oracle completed (all done)
};

const pipeline: AgentHandler = async (supabase, payload) => {
  const discoveryId = payload.discovery_id as string;
  if (!discoveryId) return { status: 'error', message: 'discovery_id required' };

  // Check current status to support resume
  const { data: discovery } = await supabase
    .from('discoveries')
    .select('pipeline_status')
    .eq('id', discoveryId)
    .single();

  if (!discovery) return { status: 'error', message: 'Discovery not found' };

  const currentStatus = discovery.pipeline_status as string;
  const completedIndex = STATUS_STEP_INDEX[currentStatus] ?? -1;

  if (currentStatus === 'complete') {
    return { status: 'already_complete', message: 'Pipeline already finished' };
  }
  if (currentStatus === 'failed') {
    // Reset to the step that needs re-running (based on what data exists)
    console.log(`[Pipeline] Resuming from failed state for ${discoveryId}`);
  }

  const steps: { name: string; handler: AgentHandler; action: string }[] = [
    { name: 'guardian', handler: guardian, action: 'validate-discovery' },
    { name: 'visionary', handler: visionary, action: 'research-discovery' },
    { name: 'architect', handler: architect, action: 'scope-discovery' },
    { name: 'oracle', handler: oracle, action: 'synthesize-discovery' },
  ];

  const completed: string[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Skip steps that already completed (resume support)
    if (i <= completedIndex) {
      console.log(`[Pipeline] Skipping ${step.name} (already completed)`);
      skipped.push(step.name);
      continue;
    }

    console.log(`[Pipeline] Starting ${step.name} for ${discoveryId}`);
    const start = Date.now();

    const result = await step.handler(supabase, {
      action: step.action,
      discovery_id: discoveryId,
    });

    const elapsed = Date.now() - start;
    console.log(`[Pipeline] ${step.name} → ${result.status} (${elapsed}ms)`);

    await updateHeartbeat(supabase, step.name);

    if (result.status === 'error' || result.status === 'rejected') {
      return {
        status: 'failed',
        failed_step: step.name,
        completed_steps: completed,
        skipped_steps: skipped,
        error: result.message ?? result.status,
      };
    }

    completed.push(step.name);
  }

  return { status: 'complete', completed_steps: completed, skipped_steps: skipped };
};

// ---------------------------------------------------------------------------
// Agent registry
// ---------------------------------------------------------------------------

const AGENTS: Record<string, AgentHandler> = {
  crown,
  visionary,
  architect,
  oracle,
  catalyst,
  guardian,
  nexus,
  sentinel,
  prism,
  foundation,
  gateway,
  pipeline,
};

const GEOMETRY_MAP: Record<string, string> = {
  crown: 'seed_of_life',
  visionary: 'metatrons_cube',
  architect: 'sri_yantra',
  oracle: 'torus',
  catalyst: 'lotus',
  guardian: 'yin_yang',
  nexus: 'flower_of_life',
  sentinel: 'merkabah',
  prism: 'vortex',
  foundation: 'seed_of_life',
  gateway: 'flower_of_life',
  pipeline: 'flower_of_life',
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { agent, action = 'default', ...payload } = body;

    if (!agent || !AGENTS[agent]) {
      return jsonResponse({ error: `Unknown agent: ${agent}` }, 400);
    }

    const supabase = getServiceClient();

    // Pipeline is a meta-agent — skip kill switch and agent-level logging
    const isMetaAgent = agent === 'pipeline';

    if (!isMetaAgent) {
      const killed = await checkKillSwitch(supabase, agent);
      if (killed) {
        await logAction(supabase, agent, `${action}_blocked`, {
          geometryPattern: GEOMETRY_MAP[agent],
          output: { reason: 'kill_switch_engaged' },
        });
        return jsonResponse({ error: `Agent ${agent} is disabled` }, 403);
      }
    }

    const start = Date.now();
    const result = await AGENTS[agent](supabase, { action, ...payload });
    const latencyMs = Date.now() - start;

    if (!isMetaAgent) {
      await Promise.all([
        logAction(supabase, agent, action, {
          geometryPattern: GEOMETRY_MAP[agent],
          output: result,
          latencyMs,
        }),
        updateHeartbeat(supabase, agent),
      ]);
    }

    return jsonResponse({ agent, action, result, latency_ms: latencyMs });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      500,
    );
  }
});
