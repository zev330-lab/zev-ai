import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/funnel/create-checkout
 * Creates a Stripe Checkout session for the $499 AI Roadmap.
 * Body: { lead_id: string, email?: string }
 */
export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const { lead_id, email } = await req.json();
  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Verify the lead exists
  const { data: lead, error: fetchErr } = await supabase
    .from('funnel_leads')
    .select('id, email, name, company, stripe_payment_id')
    .eq('id', lead_id)
    .single();

  if (fetchErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Check if already purchased
  if (lead.stripe_payment_id) {
    return NextResponse.json({ error: 'Roadmap already purchased' }, { status: 409 });
  }

  const customerEmail = email || lead.email;
  const stripe = new Stripe(stripeKey);

  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${proto}://${host}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'AI Implementation Roadmap',
            description: `Personalized roadmap for ${lead.name}${lead.company ? ` — ${lead.company}` : ''}. Includes current state analysis, future vision, 4 implementation phases with DIY/Hybrid/Professional options. Credits toward $2,500 consultation.`,
          },
          unit_amount: 49900, // $499.00
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id: lead.id,
      email: customerEmail,
      product: 'ai_roadmap',
    },
    success_url: `${baseUrl}/roadmap/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/discover?canceled=true`,
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}
