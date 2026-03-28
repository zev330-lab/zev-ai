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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status, reply_message, reply_type, from_agent } = body as {
    status?: string;
    reply_message?: string;
    reply_type?: string;
    from_agent?: string;
  };

  const supabase = getSupabaseAdmin();

  // Status update
  if (status) {
    const validStatuses = ['unread', 'read', 'actioned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'status must be one of: unread, read, actioned' }, { status: 400 });
    }

    const update: Record<string, unknown> = { status };
    if (status === 'read' || status === 'actioned') {
      update.read_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('opus_messages')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // Reply
  if (reply_message) {
    const validTypes = ['directive', 'question', 'status_update', 'response'];
    const replyType = reply_type && validTypes.includes(reply_type) ? reply_type : 'response';

    const validAgents = ['opus', 'cain', 'zev'];
    const sender = from_agent && validAgents.includes(from_agent) ? from_agent : 'cain';

    // Get original message to determine to_agent
    const { data: original } = await supabase
      .from('opus_messages')
      .select('from_agent')
      .eq('id', id)
      .single();

    const recipient = original?.from_agent || 'opus';

    const { data: reply, error: replyErr } = await supabase
      .from('opus_messages')
      .insert({
        from_agent: sender,
        to_agent: recipient,
        message: reply_message.trim(),
        message_type: replyType,
        status: 'unread',
        in_reply_to: id,
      })
      .select()
      .single();

    if (replyErr) {
      return NextResponse.json({ error: replyErr.message }, { status: 500 });
    }

    // Mark original as actioned
    await supabase
      .from('opus_messages')
      .update({ status: 'actioned', read_at: new Date().toISOString() })
      .eq('id', id);

    // Log to tola_agent_log
    await supabase.from('tola_agent_log').insert({
      agent_id: null,
      action: `opus_reply_message`,
      input: { from_agent: sender, to_agent: recipient, reply_type: replyType },
      output: { message_id: reply.id, in_reply_to: id },
      tier_used: 1,
    });

    return NextResponse.json(reply, { status: 201 });
  }

  return NextResponse.json({ error: 'Provide status or reply_message' }, { status: 400 });
}
