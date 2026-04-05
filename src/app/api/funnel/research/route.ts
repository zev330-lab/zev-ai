import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/funnel/research
 * Light research on a funnel lead: domain analysis, industry signals, brief summary.
 * Auth: Bearer service_role_key
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { lead_id } = await req.json();
  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: lead, error: fetchErr } = await supabase
    .from('funnel_leads')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (fetchErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Skip if already researched
  if (lead.research_json && Object.keys(lead.research_json).length > 0) {
    return NextResponse.json({ skipped: true, reason: 'already_researched' });
  }

  // Build context from lead data
  const emailDomain = lead.email?.includes('@')
    ? lead.email.split('@')[1]
    : null;

  const details = lead.details_json || {};
  const detailsSummary = Object.entries(details)
    .filter(([, v]) => v && (typeof v === 'string' ? v.trim() : true))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');

  // If audio exists, note it (actual transcription would need a speech-to-text service)
  let audioNote = '';
  if (lead.audio_url) {
    audioNote = '\n\nNote: The lead also submitted a voice recording. The audio URL is available but transcription is not yet processed.';
  }

  const isAppPath = lead.path === 'app';

  const prompt = isAppPath
    ? `You are a research analyst for a software development practice (askzev.ai). A new lead wants an app or product built. Research their project idea and produce a brief analysis focused on technical feasibility and competitive landscape.

Lead information:
- Name: ${lead.name}
- Email: ${lead.email}${emailDomain ? ` (domain: ${emailDomain})` : ''}
- Company: ${lead.company || 'Not provided'}
- Referral source: ${lead.referral_source || 'Not specified'}

Project details:
${detailsSummary || 'None'}${audioNote}

Return ONLY valid JSON:
{
  "person_summary": "1-2 sentences about who this person likely is based on their name, email domain, and company",
  "company_analysis": "What we can infer about their company/organization. If personal email, note that.",
  "industry": "Best guess at their industry or the market their app targets",
  "competitor_landscape": "2-3 existing apps or products in the same space — name specific competitors if possible",
  "technical_feasibility": "Brief assessment of technical complexity and key technical considerations for their described app",
  "market_insight": "One genuinely useful insight about the market they're entering or the problem they're solving — something specific and actionable",
  "research_confidence": "low|medium|high — how confident are we in this analysis",
  "talking_points": ["point 1", "point 2", "point 3"]
}`
    : `You are a research analyst for an AI consulting practice (askzev.ai). A new lead just submitted a discovery form. Do quick, light research and produce a brief summary.

Lead information:
- Name: ${lead.name}
- Email: ${lead.email}${emailDomain ? ` (domain: ${emailDomain})` : ''}
- Company: ${lead.company || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Form path: ${lead.path || 'unknown'} (${lead.path === 'solution' ? 'wants AI optimization' : 'not sure yet'})
- Audience: ${lead.audience || 'unknown'}
- Referral source: ${lead.referral_source || 'Not specified'}

Their pain point:
${lead.pain_text || 'Not provided'}

Their vision (6 months from now):
${lead.hope_text || 'Not provided'}

Additional details:
${detailsSummary || 'None'}${audioNote}

Return ONLY valid JSON:
{
  "person_summary": "1-2 sentences about who this person likely is based on their name, email domain, and company",
  "company_analysis": "What we can infer about their company/organization from the email domain and any details provided. If personal email, note that.",
  "industry": "Best guess at their industry or domain",
  "pain_analysis": "What their pain point really means — the underlying business/personal problem",
  "ai_opportunities": "2-3 specific AI applications that could help their situation",
  "specific_insight": "One genuinely useful, specific insight we can offer them right now — something actionable, not generic",
  "research_confidence": "low|medium|high — how confident are we in this analysis",
  "talking_points": ["point 1", "point 2", "point 3"]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[funnel/research] Claude API error:', res.status, errText);
      return NextResponse.json({ error: `Claude API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[funnel/research] Failed to parse JSON from Claude response');
      return NextResponse.json({ error: 'Failed to parse research' }, { status: 500 });
    }

    const research = JSON.parse(jsonMatch[0]);

    // Store in DB
    const { error: updateErr } = await supabase
      .from('funnel_leads')
      .update({ research_json: research })
      .eq('id', lead_id);

    if (updateErr) {
      console.error('[funnel/research] DB update error:', updateErr);
      return NextResponse.json({ error: 'Failed to save research' }, { status: 500 });
    }

    return NextResponse.json({ success: true, research });
  } catch (err) {
    console.error('[funnel/research] Error:', err);
    return NextResponse.json({ error: 'Research failed' }, { status: 500 });
  }
}
