import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

/**
 * GET /api/admin/pipeline
 * Returns all funnel_leads for the pipeline board.
 *
 * PATCH /api/admin/pipeline
 * Updates a lead's deal_stage (or other fields like notes).
 * Body: { lead_id: string, deal_stage?: string, notes?: string }
 */

async function authorize(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true;
  const cookie = req.cookies.get('admin_auth')?.value;
  return isValidSession(cookie);
}

export async function GET(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: leads, error } = await supabase
    .from('funnel_leads')
    .select('id, created_at, name, email, phone, company, path, audience, pain_text, hope_text, acknowledgment_text, details_json, audio_url, deal_stage, research_json, email_sent_at, roadmap_purchased_at, roadmap_url, stripe_payment_id, processing_error, retry_count, notes')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: leads || [] });
}

export async function PATCH(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { lead_id, deal_stage, notes } = body;

  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (deal_stage !== undefined) updates.deal_stage = deal_stage;
  if (notes !== undefined) updates.notes = notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('funnel_leads')
    .update(updates)
    .eq('id', lead_id)
    .select('id, deal_stage, notes')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lead: data });
}
