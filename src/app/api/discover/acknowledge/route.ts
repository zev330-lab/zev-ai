import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ acknowledgment: null }, { status: 200 });
  }

  try {
    const { painText, intent, audience } = await request.json();
    if (!painText?.trim()) {
      return NextResponse.json({ acknowledgment: null }, { status: 200 });
    }

    const context = intent === 'build'
      ? 'wants to build a specific tool or app'
      : intent === 'optimize'
        ? 'wants AI to improve how things run'
        : 'not sure what they need yet';

    const audienceCtx = audience === 'personal'
      ? 'This is personal.'
      : audience === 'business'
        ? 'This is for their business.'
        : audience === 'both'
          ? 'This is for both work and personal life.'
          : '';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: `You generate a brief empathetic acknowledgment for someone who shared a pain point on a consulting discovery form. Write exactly 1-2 sentences that:
1. Paraphrase what they said (show you heard them)
2. Name the deeper frustration underneath

Format: "It sounds like [paraphrase] — and that's not just a [surface problem], it's [one level deeper]."

Be warm, specific to what they wrote, and genuine. No jargon. No selling. No questions.`,
        messages: [{
          role: 'user',
          content: `Context: ${context}. ${audienceCtx}\n\nTheir pain point:\n${painText.slice(0, 1000)}`,
        }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ acknowledgment: null }, { status: 200 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || null;

    return NextResponse.json({ acknowledgment: text });
  } catch {
    return NextResponse.json({ acknowledgment: null }, { status: 200 });
  }
}
