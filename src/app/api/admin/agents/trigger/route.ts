import { NextRequest, NextResponse } from 'next/server';
import { isValidSession } from '@/lib/auth';

const VALID_AGENTS = [
  'tola-agent',
  'pipeline-guardian', 'pipeline-visionary', 'pipeline-architect', 'pipeline-oracle', 'pipeline-proposal',
  'pipeline-content-engine', 'pipeline-social-agent',
  'agent-nexus', 'agent-guardian-bg', 'agent-crown', 'agent-prism',
  'agent-catalyst-bg', 'agent-gateway', 'agent-foundation-bg',
];

async function isAuthed(req: NextRequest) {
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

// POST /api/admin/agents/trigger — invoke an agent via Supabase Edge Function
export async function POST(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { agent, action, ...payload } = body;

  if (!agent) {
    return NextResponse.json({ error: 'agent is required' }, { status: 400 });
  }

  if (!VALID_AGENTS.includes(agent)) {
    return NextResponse.json({ error: 'Invalid agent name' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Pipeline functions are standalone Edge Functions with their own URL
  const isPipelineFunction = agent.startsWith('pipeline-');
  const functionUrl = isPipelineFunction
    ? `${supabaseUrl}/functions/v1/${agent}`
    : `${supabaseUrl}/functions/v1/tola-agent`;
  const functionBody = isPipelineFunction
    ? JSON.stringify(payload)
    : JSON.stringify({ agent, action: action || 'default', ...payload });

  try {
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: functionBody,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Edge Function error' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to invoke agent' },
      { status: 500 },
    );
  }
}
