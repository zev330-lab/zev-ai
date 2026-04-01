import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

/**
 * POST /api/funnel/generate-roadmap
 * Generates a personalized AI roadmap using Claude Opus, stores in DB, emails the URL.
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

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const { lead_id, stripe_payment_id } = await req.json();
  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch full lead data
  const { data: lead, error: fetchErr } = await supabase
    .from('funnel_leads')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (fetchErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Check if roadmap already exists
  const { data: existingRoadmap } = await supabase
    .from('roadmaps')
    .select('id, slug')
    .eq('lead_id', lead_id)
    .limit(1)
    .single();

  if (existingRoadmap) {
    return NextResponse.json({
      skipped: true,
      reason: 'roadmap_already_exists',
      slug: existingRoadmap.slug,
    });
  }

  // Build rich context for Claude
  const firstName = lead.name?.trim().split(/\s+/)[0] || 'there';
  const research = lead.research_json || {};
  const details = lead.details_json || {};

  const detailsSummary = Object.entries(details)
    .filter(([, v]) => v && (typeof v === 'string' ? v.trim() : true))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');

  let audioNote = '';
  if (lead.audio_url) {
    audioNote = '\n\nNote: The lead submitted a voice recording (URL available but transcription not processed). Factor in that they took time to record audio — this indicates high engagement.';
  }

  const prompt = `You are Zev Steinmetz, an AI implementation consultant (askzev.ai). A client just paid $499 for a personalized AI implementation roadmap. This is a premium deliverable — detailed, specific, actionable, and personalized.

LEAD INFORMATION:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || 'Not specified'}
- Phone: ${lead.phone || 'Not provided'}
- Form path: ${lead.path || 'unknown'} (${lead.path === 'app' ? 'wants to build something specific' : lead.path === 'solution' ? 'wants AI optimization' : 'exploring options'})
- Audience: ${lead.audience || 'unknown'}

THEIR PAIN POINT (in their words):
${lead.pain_text || 'Not provided'}

THEIR 6-MONTH VISION (in their words):
${lead.hope_text || 'Not provided'}

ADDITIONAL FORM DETAILS:
${detailsSummary || 'None'}${audioNote}

RESEARCH ON THEM:
Person: ${research.person_summary || 'No research'}
Company: ${research.company_analysis || 'No data'}
Industry: ${research.industry || 'Unknown'}
Pain analysis: ${research.pain_analysis || 'No analysis'}
AI opportunities: ${typeof research.ai_opportunities === 'string' ? research.ai_opportunities : JSON.stringify(research.ai_opportunities || '')}
Specific insight: ${research.specific_insight || 'None'}
Talking points: ${Array.isArray(research.talking_points) ? research.talking_points.join('; ') : 'None'}

GENERATE A DETAILED ROADMAP with this exact JSON structure. Be highly specific to their situation — reference their actual pain, their industry, their tools, their vision. No generic advice.

{
  "personalized_intro": "2-3 paragraphs addressing them by first name, acknowledging their specific situation, what you found in research, and what this roadmap will give them. Use Chris Voss tactical empathy — label their pain, reference their words.",

  "current_state": {
    "headline": "A short headline for their current situation",
    "pain_reframed": "Their pain point rephrased professionally — not just what they said, but the underlying business impact",
    "current_tools": "What tools/systems they likely use based on research (be specific to their industry)",
    "industry_context": "2-3 sentences about where their industry is with AI adoption — specific trends, not generic",
    "hidden_costs": "The hidden costs of their current approach — what's it actually costing them in time, money, opportunity"
  },

  "future_vision": {
    "headline": "A compelling headline for their future state",
    "outcomes": ["3-5 specific measurable outcomes they can expect", "Be concrete — numbers, percentages, time savings"],
    "timeline": "Realistic timeline to reach their vision",
    "key_metrics": ["3-4 KPIs they should track to measure progress"]
  },

  "phases": [
    {
      "number": 1,
      "title": "Phase 1 title — the quick win / foundation",
      "description": "What this phase accomplishes and why it comes first",
      "duration": "Estimated duration",
      "options": {
        "diy": {
          "label": "Do It Yourself",
          "description": "Detailed steps they can follow on their own",
          "tools": ["Specific tool 1", "Specific tool 2"],
          "steps": ["Step 1 with detail", "Step 2 with detail", "Step 3 with detail"],
          "time_estimate": "X hours/weeks",
          "cost_estimate": "$X — $Y (tool costs only)",
          "pros": ["Pro 1", "Pro 2"],
          "cons": ["Con 1", "Con 2"]
        },
        "hybrid": {
          "label": "Guided Implementation",
          "description": "They do the work with expert guidance and templates",
          "what_you_get": "What's included in the hybrid option",
          "time_estimate": "X hours/weeks",
          "cost_estimate": "$X — $Y",
          "pros": ["Pro 1", "Pro 2"],
          "cons": ["Con 1", "Con 2"]
        },
        "professional": {
          "label": "Done For You",
          "description": "Full implementation by the consulting team",
          "what_you_get": "What's included in the professional option",
          "time_estimate": "X hours/weeks",
          "cost_estimate": "$X — $Y",
          "pros": ["Pro 1", "Pro 2"],
          "cons": ["Con 1", "Con 2"]
        }
      }
    },
    {
      "number": 2,
      "title": "Phase 2 title — building on the foundation",
      "description": "...",
      "duration": "...",
      "options": { "diy": {}, "hybrid": {}, "professional": {} }
    },
    {
      "number": 3,
      "title": "Phase 3 title — scaling and integrating",
      "description": "...",
      "duration": "...",
      "options": { "diy": {}, "hybrid": {}, "professional": {} }
    },
    {
      "number": 4,
      "title": "Phase 4 title — optimization and growth",
      "description": "...",
      "duration": "...",
      "options": { "diy": {}, "hybrid": {}, "professional": {} }
    }
  ],

  "path_forward": {
    "summary": "A warm, encouraging summary of what they now have — this roadmap gives them everything they need to move forward independently.",
    "chosen_path_note": "Note that they can mix and match options across phases — DIY some, get help on others.",
    "consultation_pitch": "A natural, non-salesy note that their $499 credits toward a private consultation where Zev can help them prioritize and execute. Use Voss-style absence of pressure."
  }
}

IMPORTANT RULES:
- Every field must be filled with SPECIFIC content for this lead. No placeholders, no "[insert X here]".
- Phase options must have REAL tool recommendations (e.g., "Make.com", "Zapier", "n8n", not "an automation tool").
- Cost estimates must be realistic ranges.
- The tone is warm, expert, human — like a trusted advisor who genuinely wants them to succeed.
- Reference their actual words (pain_text, hope_text) when relevant.
- Each phase must have all three complete option objects with all fields populated.

Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[generate-roadmap] Claude API error:', res.status, errText);
      return NextResponse.json({ error: `Claude API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[generate-roadmap] Failed to parse JSON from Claude response');
      return NextResponse.json({ error: 'Failed to parse roadmap content' }, { status: 500 });
    }

    const roadmapContent = JSON.parse(jsonMatch[0]);

    // Insert roadmap into DB
    const { data: roadmap, error: insertErr } = await supabase
      .from('roadmaps')
      .insert({
        lead_id,
        content_json: roadmapContent,
        stripe_payment_id: stripe_payment_id || lead.stripe_payment_id || null,
      })
      .select('id, slug')
      .single();

    if (insertErr || !roadmap) {
      console.error('[generate-roadmap] DB insert error:', insertErr);
      return NextResponse.json({ error: 'Failed to save roadmap' }, { status: 500 });
    }

    const roadmapUrl = `https://askzev.ai/roadmap/${roadmap.slug}`;

    // Update funnel_leads
    await supabase
      .from('funnel_leads')
      .update({
        deal_stage: 'roadmap_delivered',
        roadmap_url: roadmapUrl,
      })
      .eq('id', lead_id);

    // Email the roadmap URL to the lead
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Zev Steinmetz <hello@askzev.ai>',
      to: lead.email,
      subject: `${firstName}, your AI Implementation Roadmap is ready`,
      text: [
        `Hi ${firstName},`,
        '',
        `Your personalized AI Implementation Roadmap is ready.`,
        '',
        `${roadmapUrl}`,
        '',
        `This is your private link — it's built from everything you shared and the research I did on your situation. No one else has this URL.`,
        '',
        `Inside you'll find:`,
        `- Where you are now — your current state and what it's costing you`,
        `- Where you're going — concrete outcomes and metrics`,
        `- 4 implementation phases, each with DIY, Guided, and Done-For-You options`,
        `- Real tools, real timelines, real costs`,
        '',
        `You can move forward with this on your own — that's the whole point. But if you want to talk through priorities or get hands-on help, your $499 credits toward a private consultation.`,
        '',
        `Take your time with it. Reply anytime if questions come up.`,
        '',
        `— Zev`,
      ].join('\n'),
    });

    // Notify Zev
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'askzev.ai <hello@askzev.ai>',
        to: process.env.NOTIFICATION_EMAIL || 'zev330@gmail.com',
        subject: `[Roadmap delivered] ${lead.name}${lead.company ? ` — ${lead.company}` : ''} ($499)`,
        text: `Roadmap generated and delivered to ${lead.name} (${lead.email}).\n\nURL: ${roadmapUrl}\n\nPayment: ${stripe_payment_id || lead.stripe_payment_id || 'unknown'}`,
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      roadmap_id: roadmap.id,
      slug: roadmap.slug,
      url: roadmapUrl,
    });
  } catch (err) {
    console.error('[generate-roadmap] Error:', err);
    return NextResponse.json({ error: 'Roadmap generation failed' }, { status: 500 });
  }
}
