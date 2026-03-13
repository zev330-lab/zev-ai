import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    // Insert into Supabase
    const supabase = getSupabaseClient();
    const { error: dbError } = await supabase.from('discoveries').insert({
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
    });

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 });
    }

    // Send email notification
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
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
          to: 'zev@zev.ai',
          subject: `New discovery form from ${body.name}${body.company ? ` — ${body.company}` : ''}`,
          text: `New discovery form submission on zev.ai\n\n${fields}`,
        });
      } catch (emailError) {
        console.error('Resend email error:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
