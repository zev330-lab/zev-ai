import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/funnel/roadmap-webhook
 * Stripe webhook for successful $499 roadmap payments.
 * Verifies signature, updates deal_stage, triggers roadmap generation.
 */
export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error('[roadmap-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('[roadmap-webhook] Signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Only handle checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};

  // Only process roadmap purchases
  if (metadata.product !== 'ai_roadmap') {
    return NextResponse.json({ received: true, ignored: 'not_roadmap' });
  }

  const leadId = metadata.lead_id;
  if (!leadId) {
    console.error('[roadmap-webhook] No lead_id in session metadata');
    return NextResponse.json({ error: 'Missing lead_id in metadata' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch lead
  const { data: lead, error: fetchErr } = await supabase
    .from('funnel_leads')
    .select('id, stripe_payment_id')
    .eq('id', leadId)
    .single();

  if (fetchErr || !lead) {
    console.error('[roadmap-webhook] Lead not found:', leadId);
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Deduplicate: skip if already processed
  if (lead.stripe_payment_id) {
    console.log('[roadmap-webhook] Already processed payment for lead:', leadId);
    return NextResponse.json({ received: true, skipped: 'already_processed' });
  }

  // Update funnel_leads with payment info
  const { error: updateErr } = await supabase
    .from('funnel_leads')
    .update({
      stripe_payment_id: session.payment_intent as string || session.id,
      deal_stage: 'roadmap_purchased',
      roadmap_purchased_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (updateErr) {
    console.error('[roadmap-webhook] Failed to update lead:', updateErr);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }

  // Trigger roadmap generation (fire-and-forget)
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${proto}://${host}`;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  fetch(`${baseUrl}/api/funnel/generate-roadmap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      lead_id: leadId,
      stripe_payment_id: session.payment_intent as string || session.id,
    }),
  }).catch(err => {
    console.error('[roadmap-webhook] Failed to trigger roadmap generation:', err);
  });

  return NextResponse.json({ received: true, lead_id: leadId });
}
