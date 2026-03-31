import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

/**
 * POST /api/funnel/retry
 * Manual retry for flagged funnel leads.
 * Body: { lead_id?: string } — if omitted, retries all flagged leads.
 * Auth: Bearer service_role_key OR admin session cookie.
 */
export async function POST(req: NextRequest) {
  // Auth: service role key or admin session
  const auth = req.headers.get('authorization') ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasServiceKey = serviceKey && auth === `Bearer ${serviceKey}`;
  const cookie = req.cookies.get('admin_auth')?.value;
  const hasSession = await isValidSession(cookie);

  if (!hasServiceKey && !hasSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const leadId = body.lead_id;

  // Fetch leads to retry
  let query = supabase
    .from('funnel_leads')
    .select('id, name, email, retry_count')
    .eq('retry_flag', true)
    .is('email_sent_at', null)
    .order('created_at', { ascending: true })
    .limit(10);

  if (leadId) {
    query = supabase
      .from('funnel_leads')
      .select('id, name, email, retry_count')
      .eq('id', leadId)
      .is('email_sent_at', null)
      .limit(1);
  }

  const { data: leads, error: fetchErr } = await query;
  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ message: 'No leads to retry', retried: 0 });
  }

  // Cap retries at 5
  const eligible = leads.filter(l => (l.retry_count || 0) < 5);
  if (eligible.length === 0) {
    return NextResponse.json({ message: 'All flagged leads have exceeded max retries (5)', retried: 0 });
  }

  const baseUrl = getBaseUrl(req);
  const results: { id: string; name: string; success: boolean; error?: string }[] = [];

  for (const lead of eligible) {
    try {
      // Reset processing state
      await supabase
        .from('funnel_leads')
        .update({ processing_started_at: null, processing_error: null })
        .eq('id', lead.id);

      const res = await fetch(`${baseUrl}/api/funnel/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ lead_id: lead.id }),
      });

      const data = await res.json();
      results.push({
        id: lead.id,
        name: lead.name,
        success: res.ok && data.success,
        error: data.error,
      });
    } catch (err) {
      results.push({
        id: lead.id,
        name: lead.name,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    retried: results.length,
    results,
  });
}

/**
 * GET /api/funnel/retry
 * List leads that need retry.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasServiceKey = serviceKey && auth === `Bearer ${serviceKey}`;
  const cookie = req.cookies.get('admin_auth')?.value;
  const hasSession = await isValidSession(cookie);

  if (!hasServiceKey && !hasSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('funnel_leads')
    .select('id, name, email, company, deal_stage, retry_flag, retry_count, processing_error, created_at')
    .eq('retry_flag', true)
    .is('email_sent_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data, count: data?.length || 0 });
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}
