// =============================================================================
// Pipeline: Catalyst Send — Sends approved nurture emails via Resend
// Lotus engine: progressive relationship building
// Runs every 15 min via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

interface ApprovedEmail {
  id: string;
  sequence_id: string;
  step_number: number;
  subject: string;
  body_html: string;
  body_text: string;
}

interface NurtureSequence {
  id: string;
  discovery_id: string | null;
  prospect_email: string;
  prospect_name: string;
  sequence_type: string;
  current_step: number;
  metadata: Record<string, unknown>;
}

// Delay config per sequence type (hours after current step to send next)
const POST_DISCOVERY_DELAYS = [0, 48, 120, 240]; // immediate, 2d, 5d, 10d
const POST_FORM_DELAYS = [0, 24]; // immediate, 1d

function getNextDelay(type: string, nextStep: number): number | null {
  const delays = type === 'post_discovery' ? POST_DISCOVERY_DELAYS : POST_FORM_DELAYS;
  if (nextStep >= delays.length) return null; // sequence complete
  // Return hours until next step (relative to now, not cumulative)
  return type === 'post_discovery'
    ? [48, 72, 120][nextStep - 1] ?? null   // step 1→48h, step 2→72h after step 1, step 3→120h after step 2
    : [24][nextStep - 1] ?? null;             // step 1→24h
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'catalyst')) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }
    await updateHeartbeat(supabase, 'catalyst');

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('[pipeline-catalyst-send] RESEND_API_KEY not set');
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });
    }

    // Find approved emails ready to send
    const { data: approvedEmails } = await supabase
      .from('nurture_emails')
      .select('id, sequence_id, step_number, subject, body_html, body_text')
      .eq('status', 'approved')
      .is('sent_at', null)
      .order('created_at', { ascending: true })
      .limit(5); // batch limit

    if (!approvedEmails || approvedEmails.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    let sentCount = 0;
    let failCount = 0;

    for (const email of approvedEmails as ApprovedEmail[]) {
      // Get the parent sequence
      const { data: seq } = await supabase
        .from('nurture_sequences')
        .select('*')
        .eq('id', email.sequence_id)
        .single();

      if (!seq || seq.status !== 'active') continue;

      const sequence = seq as NurtureSequence;

      // Send via Resend
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Zev Steinmetz <hello@askzev.ai>',
            to: [sequence.prospect_email.trim()],
            subject: email.subject,
            html: email.body_html,
            text: email.body_text,
          }),
        });

        if (!emailResponse.ok) {
          const errText = await emailResponse.text();
          console.error(`[pipeline-catalyst-send] Resend error for ${email.id}:`, errText);
          failCount++;
          continue;
        }

        // Mark email as sent
        const now = new Date().toISOString();
        await supabase.from('nurture_emails').update({
          status: 'sent',
          sent_at: now,
        }).eq('id', email.id);

        // Advance the sequence
        const nextStep = sequence.current_step + 1;
        const maxSteps = sequence.sequence_type === 'post_discovery' ? 4 : 2;
        const delayHours = getNextDelay(sequence.sequence_type, nextStep);

        if (nextStep >= maxSteps || delayHours === null) {
          // Sequence complete
          await supabase.from('nurture_sequences').update({
            current_step: nextStep,
            status: 'completed',
            last_sent_at: now,
            updated_at: now,
          }).eq('id', sequence.id);
        } else {
          // Schedule next step
          const nextSendAt = new Date(Date.now() + delayHours * 3600000).toISOString();
          await supabase.from('nurture_sequences').update({
            current_step: nextStep,
            next_send_at: nextSendAt,
            last_sent_at: now,
            updated_at: now,
          }).eq('id', sequence.id);
        }

        sentCount++;
      } catch (sendErr) {
        console.error(`[pipeline-catalyst-send] Failed to send ${email.id}:`, sendErr);
        failCount++;
      }
    }

    await recordMetric(supabase, 'catalyst', 'nurture_emails_sent', sentCount);

    if (failCount > 0) {
      await recordMetric(supabase, 'catalyst', 'nurture_emails_failed', failCount);
    }

    await logAction(supabase, 'catalyst', 'nurture-send', {
      geometryPattern: 'lotus',
      output: { sent: sentCount, failed: failCount, total: approvedEmails.length },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({
      sent: sentCount,
      failed: failCount,
    }), { status: 200 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[pipeline-catalyst-send]', msg);
    await logAction(supabase, 'catalyst', 'nurture-send-error', {
      output: { error: msg },
      latencyMs: Date.now() - start,
    });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
