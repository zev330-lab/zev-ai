import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * @deprecated LEGACY — This webhook writes to the `discoveries` table (old pipeline).
 * The new webhook is at /api/funnel/roadmap-webhook/route.ts and writes to `funnel_leads`.
 * Keeping this alive temporarily in case Stripe is still sending events to this endpoint.
 * TODO: Remove once Stripe webhook URL is updated to /api/funnel/roadmap-webhook.
 */
export async function POST(request: Request) {
  console.warn('[DEPRECATED] Legacy Stripe webhook at /api/webhooks/stripe was called. Update Stripe to use /api/funnel/roadmap-webhook instead.');
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    // Verify webhook signature if STRIPE_WEBHOOK_SECRET is set
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      const crypto = await import('crypto');
      const elements = sig.split(',');
      const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
      const signature = elements.find(e => e.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !signature) {
        return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 });
      }

      const signedPayload = `${timestamp}.${body}`;
      const expectedSig = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      if (signature !== expectedSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(body);

    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object;
    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerName = session.customer_details?.name || 'Paid Customer';
    const paymentId = session.payment_intent || session.id;

    if (!customerEmail) {
      console.error('[Stripe Webhook] No customer email in session:', session.id);
      return NextResponse.json({ error: 'No customer email' }, { status: 400 });
    }

    // Extract metadata (form data passed through Stripe checkout)
    const meta = session.metadata || {};

    const supabase = getSupabaseAdmin();

    // Check for duplicate payment
    const { data: existing } = await supabase
      .from('discoveries')
      .select('id')
      .eq('stripe_payment_id', paymentId)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Create discovery with paid track
    const { data: inserted, error: dbError } = await supabase.from('discoveries').insert({
      name: customerName,
      email: customerEmail,
      company: meta.company || null,
      role: meta.role || null,
      business_overview: meta.business_overview || null,
      team_size: meta.team_size || null,
      pain_points: meta.pain_points || null,
      repetitive_work: meta.repetitive_work || null,
      ai_experience: meta.ai_experience || null,
      magic_wand: meta.magic_wand || null,
      success_vision: meta.success_vision || null,
      pipeline_status: 'pending',
      pipeline_track: 'paid_499',
      stripe_payment_id: paymentId,
    }).select('id').single();

    if (dbError) {
      console.error('[Stripe Webhook] DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to create discovery' }, { status: 500 });
    }

    // Write to shared context: Crown → Nexus (Path 1)
    if (inserted?.id) {
      await supabase.from('tola_shared_context').insert({
        pipeline_id: inserted.id,
        pipeline_type: 'discovery',
        from_agent: 'crown',
        to_agent: 'nexus',
        path_name: 'crown_to_nexus',
        payload: {
          discovery_id: inserted.id,
          contact_name: customerName,
          company: meta.company || null,
          email: customerEmail,
          pipeline_track: 'paid_499',
          stripe_payment_id: paymentId,
          form_responses: meta,
        },
      });

      // Trigger Guardian immediately
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pipeline-guardian`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ discovery_id: inserted.id }),
        }).catch(err => console.error('[Stripe Webhook] Pipeline trigger failed:', err));
      }
    }

    // Log revenue
    await supabase.from('tola_agent_log').insert({
      agent_id: 'crown',
      action: 'paid-discovery-received',
      output: {
        discovery_id: inserted?.id,
        email: customerEmail,
        company: meta.company,
        payment_id: paymentId,
        amount: 499,
      },
    });

    return NextResponse.json({ received: true, discovery_id: inserted?.id });
  } catch (err) {
    console.error('[Stripe Webhook] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
