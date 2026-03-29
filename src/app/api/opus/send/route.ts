import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, message_type, to_agent, api_key, from_agent: bodyFromAgent } = body as {
    message?: string;
    message_type?: string;
    to_agent?: string;
    api_key?: string;
    from_agent?: string;
  };
  const fromAgent = bodyFromAgent && ['opus','cain','zev','abel'].includes(bodyFromAgent) ? bodyFromAgent : 'opus';

  // Auth: validate api_key
  const opusKey = process.env.OPUS_API_KEY?.trim();
  if (!opusKey || api_key !== opusKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate required fields
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const validTypes = ['directive', 'question', 'status_update', 'response'];
  if (!message_type || !validTypes.includes(message_type)) {
    return NextResponse.json({ error: 'message_type must be one of: directive, question, status_update, response' }, { status: 400 });
  }

  const validAgents = ['opus', 'cain', 'zev'];
  if (!to_agent || !validAgents.includes(to_agent)) {
    return NextResponse.json({ error: 'to_agent must be one of: opus, cain, zev' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Insert message
  const { data: msg, error: msgErr } = await supabase
    .from('opus_messages')
    .insert({
      from_agent: fromAgent,
      to_agent,
      message: message.trim(),
      message_type,
      status: 'unread',
    })
    .select()
    .single();

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  // Create cain_task so Cain picks it up
  await supabase.from('cain_tasks').insert({
    title: `Opus message: ${message.trim().slice(0, 80)}`,
    context: message.trim(),
    priority: 'today',
    assigned_to: 'cain',
    created_by: 'opus',
    status: 'open',
  });

  // Log to tola_agent_log
  await supabase.from('tola_agent_log').insert({
    agent_id: null,
    action: `opus_send_message`,
    input: { to_agent, message_type },
    output: { message_id: msg.id },
    tier_used: 1,
  });

  return NextResponse.json(msg, { status: 201 });
}
