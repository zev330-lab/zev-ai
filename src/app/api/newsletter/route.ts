import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Upsert — resubscribe if previously unsubscribed
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        { email: email.toLowerCase().trim(), source: source || 'blog', status: 'active', subscribed_at: new Date().toISOString() },
        { onConflict: 'email' },
      );

    if (error) {
      console.error('Newsletter signup error:', error);
      return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
    }

    // Send welcome email via Resend if configured
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@askzev.ai';
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: 'Welcome to zev.ai — AI Implementation Insights',
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: 600; color: #1a1a2e;">Thanks for subscribing</h1>
                <p style="color: #555; line-height: 1.7; margin-top: 16px;">
                  You'll receive practical insights on deploying AI systems that drive real business outcomes — no hype, no theory, just what works.
                </p>
                <p style="color: #555; line-height: 1.7;">
                  In the meantime, here are a few ways to explore:
                </p>
                <ul style="color: #555; line-height: 2;">
                  <li><a href="https://askzev.ai/work" style="color: #7c9bf5;">See our case studies</a> — real systems, measurable results</li>
                  <li><a href="https://askzev.ai/services" style="color: #7c9bf5;">Explore our services</a> — from assessment to scale</li>
                  <li><a href="https://askzev.ai/discover" style="color: #7c9bf5;">Start your discovery</a> — tell me what you're working on</li>
                </ul>
                <p style="color: #999; font-size: 12px; margin-top: 32px;">
                  Zev Steinmetz · zev.ai · Newton, MA<br/>
                  <a href="https://askzev.ai" style="color: #7c9bf5;">askzev.ai</a>
                </p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr);
        // Don't fail the signup if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
