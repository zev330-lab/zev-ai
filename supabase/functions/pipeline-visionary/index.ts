// =============================================================================
// Pipeline Visionary — Deep Research with Real Web Searches (Path 3)
// Output follows spec data contract: company_profile, contact_profile,
// competitive_landscape, industry_trends, existing_tech_stack,
// ai_opportunity_signals, research_confidence, sources_consulted, raw_sources
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

    // Progress: Visionary started
    await supabase.from('discoveries').update({ progress_pct: 15 }).eq('id', discoveryId);

    const anthropicKey = getAnthropicKey();
    if (!anthropicKey) {
      await failPipeline(supabase, discoveryId, 'Visionary', 'ANTHROPIC_API_KEY not configured');
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    const prompt = `You are the Visionary agent — a deep research engine. A prospect has submitted a discovery form. Research them thoroughly using web search.

**RESEARCH TARGETS (use web_search for each):**

1. **Company Research** — Search for "${discovery.company || discovery.name}'s company":
   - What they do, products/services
   - Company size (employees, revenue signals)
   - Industry and market position
   - Recent news, press releases, funding
   - Their website content (about page, products, team)

2. **Contact Research** — Search for "${discovery.name}" ${discovery.company ? `at ${discovery.company}` : ''}:
   - LinkedIn profile, role, background
   - Published content, speaking engagements
   - Decision-making authority signals
   - Communication style from public content

3. **Competitive Landscape** — Search for competitors in "${discovery.business_overview || 'their industry'}":
   - Direct competitors
   - Market positioning
   - How competitors use AI/automation

4. **Industry Trends** — Search for AI trends in their industry:
   - Industry-specific AI adoption
   - Regulatory considerations
   - Common operational pain points

5. **Tech Stack Detection** — Search for "${discovery.company || ''} technology stack" or check job postings:
   - Current tools and platforms
   - Technical maturity signals
   - Existing AI/automation tools

**PROSPECT'S FORM RESPONSES:**
- Name: ${discovery.name}
- Email: ${discovery.email || 'Not provided'}
- Company: ${discovery.company || 'Not provided'}
- Role: ${discovery.role || 'Not provided'}
- Business Overview: ${discovery.business_overview || 'Not provided'}
- Team Size: ${discovery.team_size || 'Not provided'}
- Pain Points: ${discovery.pain_points || 'Not provided'}
- Repetitive Work: ${discovery.repetitive_work || 'Not provided'}
- AI Experience: ${discovery.ai_experience || 'Not provided'}
- AI Tools: ${discovery.ai_tools_detail || 'Not provided'}
- Magic Wand: ${discovery.magic_wand || 'Not provided'}
- Success Vision: ${discovery.success_vision || 'Not provided'}
${discovery.anything_else ? `- Additional: ${discovery.anything_else}` : ''}

**CRITICAL RULES:**
- If web search returns limited info, explicitly state "[LIMITED DATA]" — do NOT invent details
- Include the actual URLs you found as sources
- Estimate revenue range ONLY from observable signals (job postings, office size, funding, etc.)
- Be specific — "5-15 employees" is better than "small company"

**Return ONLY valid JSON matching this exact structure:**
{
  "company_profile": {
    "name": "string",
    "industry": "string",
    "estimated_revenue": "string range",
    "employee_count": "string range",
    "website_summary": "string",
    "products_services": ["string"],
    "key_differentiator": "string",
    "recent_news": "string or [LIMITED DATA]",
    "funding_status": "string or [LIMITED DATA]"
  },
  "contact_profile": {
    "name": "string",
    "role": "string",
    "linkedin_summary": "string or [LIMITED DATA]",
    "background": "string",
    "decision_authority": "high|medium|low|unknown",
    "communication_style_signals": "string"
  },
  "competitive_landscape": {
    "competitors": ["Company A", "Company B"],
    "market_position": "string",
    "competitor_ai_adoption": "string"
  },
  "industry_trends": ["trend 1 with specifics", "trend 2"],
  "existing_tech_stack": ["detected tool/platform"],
  "ai_opportunity_signals": ["signal from their form + research"],
  "research_confidence": "high|medium|low",
  "sources_consulted": 0,
  "raw_sources": ["url1", "url2"]
}`;

    // Progress: Claude API call starting
    await supabase.from('discoveries').update({ progress_pct: 20 }).eq('id', discoveryId);

    const response = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }, 180_000); // 3 min for multi-search

    if (!response.ok) {
      const errText = await response.text();
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
      researchBrief = { raw_research: researchText, research_confidence: 'low' };
    }

    // Save and advance
    await supabase.from('discoveries').update({
      research_brief: researchBrief,
      pipeline_status: 'scoping',
      pipeline_step_completed_at: new Date().toISOString(),
      pipeline_started_at: null,
      pipeline_retry_count: 0,
      progress_pct: 35,
    }).eq('id', discoveryId);

    const tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

    // Write to shared context (Path 3 output)
    await writeContext(supabase, {
      pipelineId: discoveryId,
      fromAgent: 'visionary',
      toAgent: 'nexus',
      pathName: 'visionary_to_nexus_researched',
      payload: {
        research_brief: researchBrief,
        tokens_used: tokensUsed,
        sources_consulted: (researchBrief.sources_consulted as number) || 0,
        research_confidence: (researchBrief.research_confidence as string) || 'unknown',
      },
    });

    await Promise.all([
      recordMetric(supabase, 'visionary', 'research_tokens', tokensUsed, { discovery_id: discoveryId }),
      logAction(supabase, 'visionary', 'research-discovery', {
        geometryPattern: 'metatrons_cube',
        output: {
          status: 'complete',
          tokens_used: tokensUsed,
          sources: (researchBrief.sources_consulted as number) || 0,
          confidence: (researchBrief.research_confidence as string) || 'unknown',
        },
        tokensUsed,
        latencyMs: Date.now() - start,
      }),
      updateHeartbeat(supabase, 'visionary'),
    ]);

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
