import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/funnel/webhook
 * Fired by pg_net trigger on funnel_leads INSERT.
 * Orchestrates: research → email generation → send.
 * Auth: Bearer service_role_key
 */
export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get('authorization') ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lead_id } = await req.json();
  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch the lead
  const { data: lead, error: fetchErr } = await supabase
    .from('funnel_leads')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (fetchErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Dedup: skip if already processing or email already sent
  if (lead.email_sent_at) {
    return NextResponse.json({ skipped: true, reason: 'email_already_sent' });
  }
  if (lead.processing_started_at) {
    const started = new Date(lead.processing_started_at).getTime();
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    if (started > fiveMinAgo) {
      return NextResponse.json({ skipped: true, reason: 'already_processing' });
    }
    // Stale processing — allow retry
  }

  // Mark as processing
  await supabase
    .from('funnel_leads')
    .update({ processing_started_at: new Date().toISOString(), processing_error: null, retry_flag: false })
    .eq('id', lead_id);

  const baseUrl = getBaseUrl(req);

  try {
    // Step 1: Research
    const researchRes = await fetch(`${baseUrl}/api/funnel/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ lead_id }),
    });

    if (!researchRes.ok) {
      const err = await researchRes.text();
      throw new Error(`Research failed: ${err}`);
    }

    // Step 2: Email (60s cooldown between Claude calls is handled inside each route)
    const emailRes = await fetch(`${baseUrl}/api/funnel/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ lead_id }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      throw new Error(`Email failed: ${err}`);
    }

    return NextResponse.json({ success: true, lead_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[funnel/webhook] Pipeline failed for ${lead_id}:`, message);

    await supabase
      .from('funnel_leads')
      .update({
        processing_error: message,
        retry_flag: true,
        retry_count: (lead.retry_count || 0) + 1,
      })
      .eq('id', lead_id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}
