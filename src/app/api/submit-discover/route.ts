import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Detect new funnel form vs legacy form
    const isFunnelForm = 'path' in body;

    if (isFunnelForm) {
      return handleFunnelSubmission(body);
    }
    return handleLegacySubmission(body);
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// New multi-screen funnel form
// ---------------------------------------------------------------------------
async function handleFunnelSubmission(body: Record<string, unknown>) {
  const name = (body.name as string)?.trim();
  const email = (body.email as string)?.trim();
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Insert into funnel_leads
  const { data: lead, error: leadErr } = await supabase.from('funnel_leads').insert({
    path: body.path || null,
    audience: body.audience || null,
    pain_text: body.pain_text || null,
    acknowledgment_text: body.acknowledgment_text || null,
    hope_text: body.hope_text || null,
    details_json: body.details_json || {},
    audio_url: body.audio_url || null,
    name,
    email,
    phone: (body.phone as string)?.trim() || null,
    company: (body.company as string)?.trim() || null,
    referral_source: body.referral_source || null,
  }).select('id').single();

  if (leadErr) {
    console.error('Funnel lead insert error:', leadErr);
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 });
  }

  // 2. Also create a discovery to feed the pipeline
  const painText = (body.pain_text as string) || '';
  const hopeText = (body.hope_text as string) || '';
  const details = (body.details_json as Record<string, unknown>) || {};

  const { data: discovery, error: discErr } = await supabase.from('discoveries').insert({
    name,
    email,
    phone: (body.phone as string)?.trim() || null,
    company: (body.company as string)?.trim() || null,
    business_overview: details.appDescription || details.bothWorkOverview || painText || null,
    pain_points: painText || null,
    magic_wand: details.unsureMagicWand || null,
    success_vision: hopeText || null,
    ai_experience: details.aiExperience || null,
    team_size: details.teamSize || null,
    anything_else: body.audio_url ? `Audio recording: ${body.audio_url}` : null,
    pipeline_status: 'pending',
    pipeline_track: 'free',
  }).select('id').single();

  if (discErr) {
    console.error('Discovery insert error (non-blocking):', discErr);
  }

  // Link funnel lead to discovery
  if (discovery?.id && lead?.id) {
    await supabase.from('funnel_leads')
      .update({ discovery_id: discovery.id })
      .eq('id', lead.id);
  }

  // 3. Write to shared context: Crown -> Nexus (Path 1)
  if (discovery?.id) {
    try {
      await supabase.from('tola_shared_context').insert({
        pipeline_id: discovery.id,
        pipeline_type: 'discovery',
        from_agent: 'crown',
        to_agent: 'nexus',
        path_name: 'crown_to_nexus',
        payload: {
          discovery_id: discovery.id,
          funnel_lead_id: lead?.id,
          contact_name: name,
          company: (body.company as string)?.trim() || null,
          email,
          pipeline_track: 'free',
          form_responses: {
            path: body.path,
            audience: body.audience,
            pain_text: painText,
            hope_text: hopeText,
            details: details,
            audio_url: body.audio_url || null,
          },
        },
      });
    } catch (contextErr) {
      console.error('Shared context write failed (non-blocking):', contextErr);
    }
  }

  // 4. Send emails
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Notification to Zev
    try {
      const pathLabel = body.path === 'app' ? 'Build Something' : body.path === 'solution' ? 'AI Optimization' : 'Not Sure';
      const audienceLabel = body.audience === 'personal' ? 'Personal' : body.audience === 'business' ? 'Business' : 'Both';

      const fields = [
        `Name: ${name}`,
        `Email: ${email}`,
        body.phone ? `Phone: ${body.phone}` : '',
        body.company ? `Company: ${body.company}` : '',
        `Path: ${pathLabel}`,
        `Audience: ${audienceLabel}`,
        '',
        `Pain Point:\n${painText || '—'}`,
        '',
        `Hope / Success Vision:\n${hopeText || '—'}`,
        '',
        `Details:\n${JSON.stringify(details, null, 2)}`,
        body.audio_url ? `\nAudio: ${body.audio_url}` : '',
        body.referral_source ? `\nReferral: ${body.referral_source}` : '',
      ].filter(Boolean).join('\n');

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'askzev.ai <hello@askzev.ai>',
        to: process.env.NOTIFICATION_EMAIL || 'zev330@gmail.com',
        subject: `New discovery from ${name}${body.company ? ` — ${body.company}` : ''}`,
        text: `New discovery form submission on askzev.ai\n\n${fields}`,
      });
    } catch (emailErr) {
      console.error('Notification email error:', emailErr);
    }

    // Confirmation to prospect
    try {
      const firstName = name.split(/\s+/)[0];
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Zev Steinmetz <hello@askzev.ai>',
        to: email,
        subject: `Got it, ${firstName} — your free AI analysis is on its way`,
        text: [
          `Hi ${firstName},`,
          '',
          `Thanks for taking the time to share what's going on. I've received everything and I'm already working on your personalized analysis.`,
          '',
          `Here's what happens next:`,
          `- I'll review what you shared and do some research specific to your situation`,
          `- You'll get a response that's tailored to you — not a template`,
          `- No pitch, no pressure — just an honest take on where AI could help`,
          '',
          `Check your inbox — you should have something from me soon.`,
          '',
          `If you have questions in the meantime, just reply to this email.`,
          '',
          `— Zev`,
          '',
          `Zev Steinmetz`,
          `askzev.ai`,
        ].join('\n'),
      });
    } catch (confirmErr) {
      console.error('Confirmation email error:', confirmErr);
    }
  }

  // 5. Trigger pipeline
  if (discovery?.id && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pipeline-guardian`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ discovery_id: discovery.id }),
    }).catch((err) => console.error('Pipeline trigger failed:', err));
  }

  return NextResponse.json({
    success: true,
    funnel_lead_id: lead?.id ?? null,
    discovery_id: discovery?.id ?? null,
    page_url: discovery?.id ? `/discovery/${discovery.id}` : null,
  });
}

// ---------------------------------------------------------------------------
// Legacy single-page form (backward compatible)
// ---------------------------------------------------------------------------
async function handleLegacySubmission(body: Record<string, unknown>) {
  if (!(body.name as string)?.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const promoCode = ((body.promoCode as string)?.trim().toUpperCase()) || null;
  const isFriendsFamily = promoCode === 'ZEVGT3';
  const pipelineTrack = (body.pipeline_track as string) ||
    (isFriendsFamily ? 'friends_family_zevgt3' : 'free');

  const { data: inserted, error: dbError } = await supabase.from('discoveries').insert({
    name: (body.name as string).trim(),
    email: (body.email as string)?.trim() || null,
    phone: (body.phone as string)?.trim() || null,
    company: (body.company as string)?.trim() || null,
    role: (body.role as string)?.trim() || null,
    business_overview: (body.business as string)?.trim() || null,
    team_size: (body.teamSize as string) || null,
    pain_points: (body.painPoints as string)?.trim() || null,
    repetitive_work: (body.repetitiveWork as string)?.trim() || null,
    ai_experience: (body.aiExperience as string) || null,
    ai_tools_detail: (body.aiDetails as string)?.trim() || null,
    magic_wand: (body.magicWand as string)?.trim() || null,
    success_vision: (body.success as string)?.trim() || null,
    anything_else: (body.anythingElse as string)?.trim() || null,
    promo_code: promoCode,
    is_friends_family: isFriendsFamily,
    pipeline_status: 'pending',
    pipeline_track: pipelineTrack,
    stripe_payment_id: (body.stripe_payment_id as string) || null,
  }).select('id').single();

  if (dbError) {
    console.error('Supabase insert error:', dbError);
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 });
  }

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
          contact_name: (body.name as string).trim(),
          company: (body.company as string)?.trim() || null,
          email: (body.email as string)?.trim() || null,
          pipeline_track: pipelineTrack,
          is_friends_family: isFriendsFamily,
          promo_code: promoCode,
          form_responses: {
            role: (body.role as string)?.trim(),
            business_overview: (body.business as string)?.trim(),
            team_size: body.teamSize,
            pain_points: (body.painPoints as string)?.trim(),
            repetitive_work: (body.repetitiveWork as string)?.trim(),
            ai_experience: body.aiExperience,
            magic_wand: (body.magicWand as string)?.trim(),
            success_vision: (body.success as string)?.trim(),
          },
          stripe_payment_id: (body.stripe_payment_id as string) || null,
        },
      });
    } catch (contextErr) {
      console.error('Shared context write failed (non-blocking):', contextErr);
    }
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);

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
        subject: `${trackLabel ? trackLabel + ' ' : ''}New discovery from ${body.name}${body.company ? ` — ${body.company}` : ''}${isFriendsFamily ? ' \u{1F91D}' : ''}`,
        text: `New discovery form submission on askzev.ai${isFriendsFamily ? '\n\n\u{2B50} FRIENDS & FAMILY REFERRAL \u2014 Free Insight Report applies (code: ZevGT3)' : ''}\n\n${fields}`,
      });
    } catch (emailError) {
      console.error('Resend notification email error:', emailError);
    }

    if ((body.email as string)?.trim()) {
      try {
        const firstName = (body.name as string).trim().split(/\s+/)[0];
        const isPaid = pipelineTrack === 'paid_499';

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Zev Steinmetz <hello@askzev.ai>',
          to: (body.email as string).trim(),
          subject: isPaid
            ? `${firstName}, your AI Insight Report is being prepared`
            : `Got it, ${firstName} \u2014 I'm preparing for our conversation`,
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
                `- No generic pitch \u2014 just an honest conversation about where AI can (and can't) help`,
                '',
                `If you have any questions before we meet, just reply to this email.`,
                '',
                `Looking forward to it,`,
                `Zev`,
                '',
                `\u2014`,
                `Zev Steinmetz`,
                `askzev.ai`,
              ].join('\n'),
        });
      } catch (confirmError) {
        console.error('Resend confirmation email error:', confirmError);
      }
    }
  }

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
}
