import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const SYSTEM_PROMPT = `You are the AI assistant for zev.ai, an AI consulting practice run by Zev Steinmetz in Boston.

WHAT ZEV.AI DOES:
I build and deploy production AI agent systems for businesses. Not strategy decks — working software with measurable results. Multi-agent systems that automate real workflows, integrated into existing operations, running 24/7.

SERVICES:
- Assess ($2,500+, 2-3 weeks): AI opportunity roadmap. We analyze workflows, competitive landscape, and score opportunities by ROI. Deliverable: prioritized roadmap with costed recommendations.
- Build ($5,000+, 4-12 weeks): Production AI system designed, built, deployed, integrated. Multi-agent architecture, automated workflows, dashboards. 30 days post-launch support.
- Optimize ($5,000/mo): Fractional AI officer embedded in your team. Weekly sessions, continuous monitoring, quarterly roadmaps, priority support.
- Scale (Custom pricing): Enterprise multi-system deployment. Shared intelligence across departments, unified oversight, cross-product automation.

CASE STUDIES:
- ButcherBox (D2C): AI agents handling 73% of subscription inquiries autonomously
- Blank Industries (Manufacturing): 6 disconnected systems unified, 90% faster reporting
- Rosen Media Group (Media): 2.5x content output after AI pipeline deployment

APPROACH:
Multi-agent AI systems using coordination patterns from nature. 11 specialized agents, 22 communication pathways, 3-tier human oversight.

CONVERSATION STYLE:
- Be knowledgeable, direct, and genuinely helpful. Keep responses concise.
- Naturally ask the visitor's name if they haven't shared it yet.
- If they describe a business challenge, ask follow-up questions: What industry? How big is the team? What tools do they use currently?
- If they seem interested, suggest starting a discovery or sharing their email so Zev can follow up personally.
- Don't be pushy or interrogate. Let the conversation flow naturally.
- You can discuss AI topics broadly — you're an expert.
- If someone shares their email, acknowledge it warmly and confirm someone will reach out.`;

const EXTRACTION_PROMPT = `Extract contact and business information that the HUMAN (not the assistant) shared in this conversation. Return ONLY valid JSON:
{"name":null,"email":null,"company":null,"role":null,"business_overview":null,"pain_points":null,"interest_level":"none"}
Rules:
- Only include info the human explicitly stated
- interest_level: "none" (just browsing), "low" (curious), "medium" (asking about services/pricing), "high" (shared email, asked to be contacted, described specific problems)
- Return the JSON object only, no markdown, no explanation`;

// Simple in-memory rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { response: "I'm not available right now. Please reach out at hello@zev.ai or start a discovery at /discover." },
      { status: 200 },
    );
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { response: "You're sending messages too quickly. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const trimmed = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content.slice(0, 2000),
    }));

    // Get main chat response
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: trimmed,
      }),
    });

    if (!res.ok) {
      console.error('Claude API error:', res.status);
      return NextResponse.json(
        { response: "I'm having trouble right now. Reach out at hello@zev.ai or start a discovery at /discover." },
        { status: 200 },
      );
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "I couldn't generate a response. Please try again.";

    // Lead extraction — after 3+ user messages, extract info and feed to pipeline
    const userMsgCount = trimmed.filter((m: { role: string }) => m.role === 'user').length;
    if (userMsgCount >= 3) {
      try {
        await extractAndStoreLead(apiKey, trimmed);
      } catch (e) {
        console.error('Lead extraction failed:', e);
      }
    }

    return NextResponse.json({ response: text });
  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json(
      { response: "Something went wrong. Please reach out at hello@zev.ai." },
      { status: 200 },
    );
  }
}

async function extractAndStoreLead(apiKey: string, messages: { role: string; content: string }[]) {
  const convo = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: EXTRACTION_PROMPT,
      messages: [{ role: 'user', content: convo }],
    }),
  });

  if (!res.ok) return;
  const data = await res.json();
  const rawText = data.content?.[0]?.text;
  if (!rawText) return;

  const jsonStr = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  let extracted: Record<string, string | null>;
  try {
    extracted = JSON.parse(jsonStr);
  } catch {
    return;
  }

  if (!extracted.name && !extracted.email) return;

  const supabase = getSupabaseAdmin();

  // Create contact if we have an email (check for duplicates)
  if (extracted.email) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', extracted.email)
      .maybeSingle();

    if (!existing) {
      await supabase.from('contacts').insert({
        name: extracted.name || 'Chat Visitor',
        email: extracted.email,
        company: extracted.company || null,
        message: `[Via chat] ${extracted.pain_points || extracted.business_overview || 'Engaged via website chat'}`,
        status: 'new',
      });
    }
  }

  // Create discovery if high interest + enough business context
  if (
    extracted.interest_level === 'high' &&
    extracted.email &&
    (extracted.pain_points || extracted.business_overview)
  ) {
    const { data: existingDisc } = await supabase
      .from('discoveries')
      .select('id')
      .eq('email', extracted.email)
      .maybeSingle();

    if (!existingDisc) {
      await supabase.from('discoveries').insert({
        name: extracted.name || 'Chat Lead',
        email: extracted.email,
        company: extracted.company || null,
        role: extracted.role || null,
        business_overview: extracted.business_overview || null,
        pain_points: extracted.pain_points || null,
        pipeline_status: 'pending',
      });
    }
  }

  // Log to agent activity so other agents can see the lead capture
  await supabase.from('tola_agent_log').insert({
    agent_id: 'catalyst',
    action: 'chat-lead-extracted',
    output: {
      name: extracted.name,
      email: extracted.email ? '***' : null,
      interest_level: extracted.interest_level,
      created_contact: !!extracted.email,
      created_discovery: extracted.interest_level === 'high',
    },
  });
}
