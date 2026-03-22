import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    // Insert into Supabase
    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase.from('contacts').insert({
      name: name.trim(),
      email: email.trim(),
      company: company?.trim() || null,
      message: message.trim(),
    });

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 });
    }

    // Send email notification
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'zev.ai <onboarding@resend.dev>',
          to: process.env.NOTIFICATION_EMAIL || 'zev330@gmail.com',
          subject: `New inquiry from ${name}${company ? ` — ${company}` : ''}`,
          text: [
            `New contact form submission on zev.ai`,
            ``,
            `Name: ${name}`,
            `Email: ${email}`,
            company ? `Company: ${company}` : '',
            ``,
            `Message:`,
            message,
          ].filter(Boolean).join('\n'),
        });
      } catch (emailError) {
        console.error('Resend email error:', emailError);
        // Don't fail the request — form data is already saved
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
