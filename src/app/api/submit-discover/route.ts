import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    // Insert into Supabase with pipeline status (service role bypasses RLS)
    const supabase = getSupabaseAdmin();
    const promoCode = body.promoCode?.trim().toUpperCase() || null;
    const isFriendsFamily = promoCode === 'ZEVGT3';

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
    }).select('id').single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 });
    }

    // Send emails via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // 1. Notification to Zev
      try {
        const fields = [
          `Name: ${body.name}`,
          body.email ? `Email: ${body.email}` : '',
          body.phone ? `Phone: ${body.phone}` : '',
          `Company: ${body.company || '—'}`,
          `Role: ${body.role || '—'}`,
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
          subject: `New discovery form from ${body.name}${body.company ? ` — ${body.company}` : ''}${isFriendsFamily ? ' 🤝 [FRIENDS & FAMILY]' : ''}`,
          text: `New discovery form submission on askzev.ai${isFriendsFamily ? '\n\n⭐ FRIENDS & FAMILY REFERRAL — Free Insight Report applies (code: ZevGT3)' : ''}\n\n${fields}`,
        });
      } catch (emailError) {
        console.error('Resend notification email error:', emailError);
      }

      // 2. Confirmation to prospect
      if (body.email?.trim()) {
        try {
          const firstName = body.name.trim().split(/\s+/)[0];
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Zev Steinmetz <hello@askzev.ai>',
            to: body.email.trim(),
            subject: `Got it, ${firstName} — I'm preparing for our conversation`,
            text: [
              `Hi ${firstName},`,
              '',
              `Thanks for taking the time to fill out the discovery form. I've received your responses and I'm already preparing for our conversation.`,
              '',
              `Here's what happens next:`,
              `- I'll review your answers and do some research on ${body.company || 'your business'}`,
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

    // Trigger Guardian immediately (fast, no Claude call).
    // Even if this fire-and-forget fails, the pg_cron worker polls every 60s
    // and will pick up any discovery with pipeline_status='pending'.
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
