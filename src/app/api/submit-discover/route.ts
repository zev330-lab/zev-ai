import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const promoCode = body.promoCode?.trim().toUpperCase() || null;
    const isFriendsFamily = promoCode === 'ZEVGT3';

    // Determine pipeline track: explicit track > promo code > default free
    const pipelineTrack = body.pipeline_track ||
      (isFriendsFamily ? 'friends_family_zevgt3' : 'free');

    const { data: inserted, error: dbError } = await supabase.from('discoveries').insert({
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      company: body.company?.trim() || null,
      role: body.role?.trim() || null,
      business_overview: body.business?.trim() || null,
      team_size: body.teamSize || null,
      pain_points: body.painPoints?.trim() || null,
      repetitive_work: body.repetitiveWork?.trim() || null,
      ai_experience: body.aiExperience || null,
      ai_tools_detail: body.aiDetails?.trim() || null,
      magic_wand: body.magicWand?.trim() || null,
      success_vision: body.success?.trim() || null,
      anything_else: body.anythingElse?.trim() || null,
      promo_code: promoCode,
      is_friends_family: isFriendsFamily,
      pipeline_status: 'pending',
      pipeline_track: pipelineTrack,
      stripe_payment_id: body.stripe_payment_id || null,
    }).select('id').single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 });
    }

    // Write to shared context: Crown → Nexus (Path 1)
    if (inserted?.id) {
      try {
        await supabase.from('tola_shared_context').insert({
          pipeline_id: inserted.id,
          pipeline_type: 'discovery',
          from_agent: 'crown',
          to_agent: 'nexus',
          path_name: 'crown_to_nexus',
          payload: {
            discovery_id: inserted.id,
            contact_name: body.name.trim(),
            company: body.company?.trim() || null,
            email: body.email?.trim() || null,
            pipeline_track: pipelineTrack,
            is_friends_family: isFriendsFamily,
            promo_code: promoCode,
            form_responses: {
              role: body.role?.trim(),
              business_overview: body.business?.trim(),
              team_size: body.teamSize,
              pain_points: body.painPoints?.trim(),
              repetitive_work: body.repetitiveWork?.trim(),
              ai_experience: body.aiExperience,
              magic_wand: body.magicWand?.trim(),
              success_vision: body.success?.trim(),
            },
            stripe_payment_id: body.stripe_payment_id || null,
          },
        });
      } catch (contextErr) {
        console.error('Shared context write failed (non-blocking):', contextErr);
      }
    }

    // Send emails via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // 1. Notification to Zev
      try {
        const trackLabel = pipelineTrack === 'paid_499' ? ' [PAID $499]' :
                           isFriendsFamily ? ' [FRIENDS & FAMILY]' : '';

        const fields = [
          `Name: ${body.name}`,
          body.email ? `Email: ${body.email}` : '',
          body.phone ? `Phone: ${body.phone}` : '',
          `Company: ${body.company || '—'}`,
          `Role: ${body.role || '—'}`,
          `Track: ${pipelineTrack}${trackLabel}`,
          '',
          `Business Overview:\n${body.business || '—'}`,
          '',
          `Team Size: ${body.teamSize || '—'}`,
          '',
          `Pain Points:\n${body.painPoints || '—'}`,
          '',
          `Repetitive Work:\n${body.repetitiveWork || '—'}`,
          '',
          `AI Experience: ${body.aiExperience || '—'}`,
          body.aiDetails ? `AI Details: ${body.aiDetails}` : '',
          '',
          `Magic Wand:\n${body.magicWand || '—'}`,
          '',
          `Success Vision:\n${body.success || '—'}`,
          '',
          body.anythingElse ? `Anything Else:\n${body.anythingElse}` : '',
        ].filter(Boolean).join('\n');

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'askzev.ai <hello@askzev.ai>',
          to: process.env.NOTIFICATION_EMAIL || 'zev330@gmail.com',
          subject: `${trackLabel ? trackLabel + ' ' : ''}New discovery from ${body.name}${body.company ? ` — ${body.company}` : ''}${isFriendsFamily ? ' 🤝' : ''}`,
          text: `New discovery form submission on askzev.ai${isFriendsFamily ? '\n\n⭐ FRIENDS & FAMILY REFERRAL — Free Insight Report applies (code: ZevGT3)' : ''}\n\n${fields}`,
        });
      } catch (emailError) {
        console.error('Resend notification email error:', emailError);
      }

      // 2. Confirmation to prospect
      if (body.email?.trim()) {
        try {
          const firstName = body.name.trim().split(/\s+/)[0];
          const isPaid = pipelineTrack === 'paid_499';

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Zev Steinmetz <hello@askzev.ai>',
            to: body.email.trim(),
            subject: isPaid
              ? `${firstName}, your AI Insight Report is being prepared`
              : `Got it, ${firstName} — I'm preparing for our conversation`,
            text: isPaid
              ? [
                  `Hi ${firstName},`,
                  '',
                  `Thank you for your purchase. Your personalized AI Insight Report for ${body.company || 'your situation'} is now being prepared.`,
                  '',
                  `Here's what's happening right now:`,
                  `- The research agent is analyzing your situation and context`,
                  `- The architecture agent is mapping AI opportunities specific to you`,
                  `- The synthesis agent is preparing your personalized insight report`,
                  '',
                  `You'll receive your report via email within the next 15-30 minutes.`,
                  '',
                  `If you have any questions, reply to this email.`,
                  '',
                  `Best,`,
                  `Zev Steinmetz`,
                  `askzev.ai`,
                ].join('\n')
              : [
                  `Hi ${firstName},`,
                  '',
                  `Thanks for taking the time to fill out the discovery form. I've received your responses and I'm already preparing for our conversation.`,
                  '',
                  `Here's what happens next:`,
                  `- I'll review your answers and do some research on ${body.company || 'your situation'}`,
                  `- I'll come to our meeting with specific ideas tailored to your situation`,
                  `- No generic pitch — just an honest conversation about where AI can (and can't) help`,
                  '',
                  `If you have any questions before we meet, just reply to this email.`,
                  '',
                  `Looking forward to it,`,
                  `Zev`,
                  '',
                  `—`,
                  `Zev Steinmetz`,
                  `askzev.ai`,
                ].join('\n'),
          });
        } catch (confirmError) {
          console.error('Resend confirmation email error:', confirmError);
        }
      }
    }

    // Trigger Guardian immediately (fire-and-forget)
    if (inserted?.id && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pipeline-guardian`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ discovery_id: inserted.id }),
      })
        .then((r) => console.log(`Pipeline trigger for ${inserted.id}: ${r.status}`))
        .catch((err) => console.error('Pipeline trigger failed (pg_cron will retry):', err));
    }

    return NextResponse.json({
      success: true,
      discovery_id: inserted?.id ?? null,
      page_url: inserted?.id ? `/discovery/${inserted.id}` : null,
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
