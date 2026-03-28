import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

function isValidApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key');
  if (!key) return false;

  const opusKey = process.env.OPUS_API_KEY?.trim();
  const cainKey = process.env.CAIN_API_KEY?.trim();

  return (!!opusKey && key === opusKey) || (!!cainKey && key === cainKey);
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  if (isValidApiKey(req)) return true;
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const to_agent = searchParams.get('to_agent');
  const since = searchParams.get('since');

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('opus_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (status) query = query.eq('status', status);
  if (to_agent) query = query.eq('to_agent', to_agent);
  if (since) query = query.gte('created_at', since);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, message_type, to_agent, from_agent } = body as {
    message?: string;
    message_type?: string;
    to_agent?: string;
    from_agent?: string;
  };

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const validTypes = ['directive', 'question', 'status_update', 'response'];
  const msgType = message_type && validTypes.includes(message_type) ? message_type : 'directive';

  const validAgents = ['opus', 'cain', 'zev'];
  const sender = from_agent && validAgents.includes(from_agent) ? from_agent : 'zev';
  const recipient = to_agent && validAgents.includes(to_agent) ? to_agent : 'cain';

  const supabase = getSupabaseAdmin();

  const { data: msg, error: msgErr } = await supabase
    .from('opus_messages')
    .insert({
      from_agent: sender,
      to_agent: recipient,
      message: message.trim(),
      message_type: msgType,
      status: 'unread',
    })
    .select()
    .single();

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  // Log to tola_agent_log
  await supabase.from('tola_agent_log').insert({
    agent_id: null,
    action: `opus_send_message`,
    input: { from_agent: sender, to_agent: recipient, message_type: msgType },
    output: { message_id: msg.id },
    tier_used: 1,
  });

  return NextResponse.json(msg, { status: 201 });
}
