import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

function isValidApiKey(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true;

  const cainKey = process.env.CAIN_API_KEY?.trim();
  if (cainKey && req.headers.get('x-api-key') === cainKey) return true;

  return false;
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  if (isValidApiKey(req)) return true;
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { to, subject, body: emailBody, task_id } = body as {
    to?: string;
    subject?: string;
    body?: string;
    task_id?: string;
  };

  if (!to || typeof to !== 'string') {
    return NextResponse.json({ error: 'to is required' }, { status: 400 });
  }
  if (!subject || typeof subject !== 'string') {
    return NextResponse.json({ error: 'subject is required' }, { status: 400 });
  }
  if (!emailBody || typeof emailBody !== 'string') {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const resend = new Resend(resendKey);

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Zev Steinmetz <hello@askzev.ai>',
    to: [to.trim()],
    subject: subject.trim(),
    text: emailBody,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();

  // Log to cain_log
  await supabase.from('cain_log').insert({
    entry: `Email sent to ${to.trim()}: ${subject.trim()}`,
    created_by: 'cain',
  });

  // Mark task done if task_id provided
  if (task_id && typeof task_id === 'string') {
    await supabase
      .from('cain_tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completion_notes: `Email sent to ${to.trim()}`,
      })
      .eq('id', task_id);
  }

  return NextResponse.json({ ok: true, messageId: data?.id });
}
