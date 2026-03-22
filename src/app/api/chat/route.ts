import { NextRequest, NextResponse } from 'next/server';

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
Multi-agent AI systems using coordination patterns from nature. 11 specialized agents, 22 communication pathways, 3-tier human oversight (80% autonomous, 15% notify, 5% full stop). The same agents that build your system stay running after deployment.

PERSONALITY:
- Be knowledgeable, direct, and genuinely helpful
- Keep responses concise — 2-3 sentences unless they ask for detail
- Don't be pushy, but naturally guide interested visitors toward starting a discovery at /discover
- Don't make up information you don't have
- If someone asks something you can't answer, suggest they start a discovery or reach out at hello@zev.ai
- You can discuss AI implementation topics broadly — you're an expert
- Mirror the site's tone: confident, practical, no jargon unless the visitor is technical`;

// Simple in-memory rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 }); // 1 min window
    return true;
  }
  if (entry.count >= 10) return false; // Max 10 messages per minute
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

    // Limit conversation context to last 10 messages
    const trimmed = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content.slice(0, 2000),
    }));

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
      const err = await res.json().catch(() => ({}));
      console.error('Claude API error:', res.status, err);
      return NextResponse.json(
        { response: "I'm having trouble connecting right now. You can reach us at hello@zev.ai or start a discovery at /discover." },
        { status: 200 },
      );
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "I couldn't generate a response. Please try again.";

    return NextResponse.json({ response: text });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { response: "Something went wrong. Please reach out at hello@zev.ai." },
      { status: 200 },
    );
  }
}
