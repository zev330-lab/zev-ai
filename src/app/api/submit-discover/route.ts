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
    const { data: inserted, error: dbError } = await supabase.from('discoveries').insert({
      name: body.name.trim(),
      email: body.email?.trim() || null,
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
          from: 'zev.ai <onboarding@resend.dev>',
          to: 'zev330@gmail.com',
          subject: `New discovery form from ${body.name}${body.company ? ` — ${body.company}` : ''}`,
          text: `New discovery form submission on zev.ai\n\n${fields}`,
        });
      } catch (emailError) {
        console.error('Resend notification email error:', emailError);
      }

      // 2. Confirmation to prospect
      if (body.email?.trim()) {
        try {
          const firstName = body.name.trim().split(/\s+/)[0];
          await resend.emails.send({
            from: 'Zev Steinmetz <onboarding@resend.dev>',
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
              `zev.ai`,
            ].join('\n'),
          });
        } catch (confirmError) {
          console.error('Resend confirmation email error:', confirmError);
        }
      }
    }

    // Trigger pipeline: Guardian → Visionary → Architect → Oracle
    // Each step is a separate Edge Function that chains to the next via fire-and-forget.
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
        .catch((err) => console.error('Pipeline trigger failed:', err));
    } else if (inserted?.id) {
      console.warn('Pipeline trigger skipped — missing SUPABASE env vars.',
        { url: !!process.env.NEXT_PUBLIC_SUPABASE_URL, key: !!process.env.SUPABASE_SERVICE_ROLE_KEY });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
