import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

/**
 * POST /api/funnel/email
 * Generate Voss-style personalized email from lead data + research, send via Resend.
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

  // Never send more than one email per lead
  if (lead.email_sent_at) {
    return NextResponse.json({ skipped: true, reason: 'email_already_sent' });
  }

  if (!lead.email) {
    return NextResponse.json({ error: 'Lead has no email' }, { status: 400 });
  }

  const firstName = lead.name?.trim().split(/\s+/)[0] || 'there';
  const research = lead.research_json || {};

  const prompt = `You are Zev Steinmetz, an AI consultant (askzev.ai). Someone just filled out your discovery form. Write them a personalized email using Chris Voss tactical empathy principles. The email should feel like a real person wrote it — plain text, no HTML, no formatting tricks.

LEAD INFO:
- Name: ${lead.name} (first name: ${firstName})
- Company: ${lead.company || 'not specified'}
- Email: ${lead.email}
- Path: ${lead.path === 'app' ? 'wants to build something specific' : lead.path === 'solution' ? 'wants AI to improve operations' : 'not sure what they need'}
- Audience: ${lead.audience || 'unknown'}

WHAT THEY SAID (pain point):
${lead.pain_text || 'Not provided'}

WHAT THEY WANT (6-month vision):
${lead.hope_text || 'Not provided'}

RESEARCH ON THEM:
${research.person_summary || 'No research available'}
${research.company_analysis || ''}
Industry: ${research.industry || 'unknown'}
Pain analysis: ${research.pain_analysis || ''}
AI opportunities: ${typeof research.ai_opportunities === 'string' ? research.ai_opportunities : JSON.stringify(research.ai_opportunities || '')}
Specific insight: ${research.specific_insight || ''}

EMAIL STRUCTURE (follow this exactly):

1. OPENING — Voss label: "Based on what you shared, it sounds like [specific paraphrase of their pain] — and you've probably been dealing with it longer than you'd like."

2. ACCUSATION AUDIT: "I know there's no shortage of people promising AI will fix everything. Most don't deliver. So rather than make another promise, I want to show you something useful right now."

3. ONE FREE, ACTIONABLE INSIGHT: Give them something genuinely useful based on their situation + research. Not a teaser — something they can actually use or implement today. Be specific to their industry/situation.

4. VISION: "What you described — [reference their hope text] — is absolutely achievable. I've built systems that do exactly this for [reference a similar situation from research]."

5. SIGN-OFF: "If any of this resonates, I'd be happy to talk it through. No pitch — just a conversation about what's possible." Then sign with: — Zev

6. P.S.: "If you want the full roadmap with specific tools, timelines, and implementation options mapped to your situation, it's available here: https://askzev.ai/roadmap/purchase?lead=${lead_id} — built from what you shared, delivered within 24 hours. $499 — and it credits toward any future work together."

RULES:
- Plain text only. No HTML, no bold, no bullet points with special chars. Use dashes for lists.
- Write as "I" not "we". This is one person.
- Keep it under 400 words.
- Be warm but not sycophantic. Confident but not salesy.
- The insight must be GENUINELY useful — not "consider using AI for X". Give them something specific they can act on.
- Reference their actual words when possible.

Return ONLY valid JSON:
{
  "subject": "Personalized subject line — not generic, references something specific they said",
  "body": "The full email text"
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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[funnel/email] Claude API error:', res.status, errText);
      return NextResponse.json({ error: `Claude API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[funnel/email] Failed to parse JSON from Claude response');
      return NextResponse.json({ error: 'Failed to parse email' }, { status: 500 });
    }

    const emailContent = JSON.parse(jsonMatch[0]);

    if (!emailContent.subject || !emailContent.body) {
      return NextResponse.json({ error: 'Missing subject or body in generated email' }, { status: 500 });
    }

    // Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: sendErr } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Zev Steinmetz <hello@askzev.ai>',
      to: lead.email,
      subject: emailContent.subject,
      text: emailContent.body,
    });

    if (sendErr) {
      console.error('[funnel/email] Resend error:', sendErr);
      return NextResponse.json({ error: `Email send failed: ${sendErr.message}` }, { status: 502 });
    }

    // Update lead
    const { error: updateErr } = await supabase
      .from('funnel_leads')
      .update({
        email_sent_at: new Date().toISOString(),
        deal_stage: 'email_delivered',
        processing_error: null,
        retry_flag: false,
      })
      .eq('id', lead_id);

    if (updateErr) {
      console.error('[funnel/email] DB update error:', updateErr);
    }

    // Also notify Zev
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'askzev.ai <hello@askzev.ai>',
        to: process.env.NOTIFICATION_EMAIL || 'zev330@gmail.com',
        subject: `[Auto-email sent] ${lead.name}${lead.company ? ` — ${lead.company}` : ''}`,
        text: `Personalized email auto-sent to ${lead.name} (${lead.email}).\n\nSubject: ${emailContent.subject}\n\n--- Email body ---\n${emailContent.body}\n\n--- Research ---\n${JSON.stringify(research, null, 2)}`,
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, subject: emailContent.subject });
  } catch (err) {
    console.error('[funnel/email] Error:', err);
    return NextResponse.json({ error: 'Email generation failed' }, { status: 500 });
  }
}
