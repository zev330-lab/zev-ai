// =============================================================================
// Pipeline: Catalyst Nurture — Draft email generation for nurture sequences
// Lotus engine: progressive relationship building
// Runs every 30 min via pg_cron
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { checkKillSwitch, logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

interface NurtureSequence {
  id: string;
  discovery_id: string | null;
  prospect_email: string;
  prospect_name: string;
  sequence_type: string;
  current_step: number;
  metadata: Record<string, unknown>;
}

interface Discovery {
  id: string;
  name: string;
  company: string;
  email: string;
  report_data: Record<string, unknown> | null;
  report_url: string | null;
  pipeline_track: string;
  industry: string | null;
}

// ── Sequence definitions ─────────────────────────────────────────────────────

const POST_DISCOVERY_STEPS = [
  { delayHours: 0, key: 'report_ready' },
  { delayHours: 48, key: 'check_in' },
  { delayHours: 120, key: 'value_add' },  // 5 days
  { delayHours: 240, key: 'final' },       // 10 days
];

const POST_FORM_STEPS = [
  { delayHours: 0, key: 'thanks' },
  { delayHours: 24, key: 'started_looking' },
];

function getSteps(type: string) {
  return type === 'post_discovery' ? POST_DISCOVERY_STEPS : POST_FORM_STEPS;
}

function getMaxSteps(type: string) {
  return getSteps(type).length;
}

// ── Email templates ──────────────────────────────────────────────────────────

function generateEmail(
  step: string,
  sequence: NurtureSequence,
  discovery: Discovery | null,
): { subject: string; body_html: string; body_text: string } {
  const firstName = (sequence.prospect_name || 'there').split(/\s+/)[0];
  const company = (sequence.metadata?.company as string) || discovery?.company || 'your organization';
  const reportUrl = (sequence.metadata?.report_url as string) || discovery?.report_url || '';

  switch (step) {
    // ── Post-discovery sequence ──────────────────────────────────────────
    case 'report_ready':
      return {
        subject: `Your AI Insight Report for ${company} is ready`,
        body_html: wrapHtml(`
          <h2>Hi ${firstName},</h2>
          <p>Your personalized AI Insight Report for ${company} is ready to review.</p>
          <p>I've analyzed your situation and put together specific, actionable recommendations — not generic advice.</p>
          <center><a href="${reportUrl}" class="cta">View Your Report</a></center>
          <p>Take a look when you get a chance. I think you'll find some surprising opportunities.</p>
          <p>— Zev</p>
        `),
        body_text: `Hi ${firstName},\n\nYour AI Insight Report for ${company} is ready: ${reportUrl}\n\nTake a look when you get a chance.\n\n— Zev`,
      };

    case 'check_in':
      return {
        subject: `Had a chance to review your report?`,
        body_html: wrapHtml(`
          <h2>Hi ${firstName},</h2>
          <p>Just checking in — did you get a chance to look at the insight report I put together for ${company}?</p>
          <p>If anything stood out or raised questions, I'm happy to walk through it. No pitch, just context.</p>
          ${reportUrl ? `<center><a href="${reportUrl}" class="cta">View Your Report</a></center>` : ''}
          <p>— Zev</p>
        `),
        body_text: `Hi ${firstName},\n\nJust checking in — did you get a chance to look at the insight report for ${company}?\n\nIf anything stood out or raised questions, I'm happy to walk through it.\n\n${reportUrl ? reportUrl + '\n\n' : ''}— Zev`,
      };

    case 'value_add': {
      const industry = discovery?.industry || (sequence.metadata?.industry as string) || '';
      const industryLine = industry
        ? `I've been seeing some interesting shifts in the ${industry} space around AI adoption — thought of your situation.`
        : `I've been seeing some interesting patterns in how organizations like yours are approaching AI — thought of your situation.`;
      return {
        subject: `Something relevant for ${company}`,
        body_html: wrapHtml(`
          <h2>Hi ${firstName},</h2>
          <p>${industryLine}</p>
          <p>The biggest thing I keep noticing: the organizations getting real value from AI aren't the ones with the biggest budgets — they're the ones who started with a focused problem instead of a broad "AI strategy."</p>
          <p>If that resonates, I'd be glad to dig deeper on any of the opportunities from your report.</p>
          <p>— Zev</p>
        `),
        body_text: `Hi ${firstName},\n\n${industryLine}\n\nThe biggest thing I keep noticing: the organizations getting real value from AI aren't the ones with the biggest budgets — they're the ones who started with a focused problem.\n\nIf that resonates, I'd be glad to dig deeper.\n\n— Zev`,
      };
    }

    case 'final':
      return {
        subject: `Last note from me`,
        body_html: wrapHtml(`
          <h2>Hi ${firstName},</h2>
          <p>I don't want to be that person who keeps emailing, so this is my last follow-up.</p>
          <p>Your report for ${company} is still available anytime: ${reportUrl ? `<a href="${reportUrl}" style="color:#7c9bf5;">${reportUrl}</a>` : 'just reply to this email and I\'ll send the link'}</p>
          <p>If the timing isn't right, no worries at all. If something changes down the road, you know where to find me.</p>
          <p>— Zev</p>
        `),
        body_text: `Hi ${firstName},\n\nI don't want to be that person who keeps emailing, so this is my last follow-up.\n\nYour report is still available anytime${reportUrl ? ': ' + reportUrl : ''}.\n\nIf the timing isn't right, no worries. If something changes, you know where to find me.\n\n— Zev`,
      };

    // ── Post-form sequence ───────────────────────────────────────────────
    case 'thanks':
      return {
        subject: `Thanks for reaching out — here's what to expect`,
        body_html: wrapHtml(`
          <h2>Hi ${firstName},</h2>
          <p>Thanks for taking the time to share what's going on with ${company}. I appreciate it.</p>
          <p>Here's what happens next: I'll review your submission and start looking into your industry and situation. You'll hear back from me with either a quick summary or a full insight report, depending on the depth needed.</p>
          <p>In the meantime, feel free to reply to this email if there's anything else you'd like me to know.</p>
          <p>— Zev</p>
        `),
        body_text: `Hi ${firstName},\n\nThanks for sharing what's going on with ${company}.\n\nHere's what happens next: I'll review your submission and start looking into your situation. You'll hear back with either a quick summary or a full insight report.\n\nFeel free to reply if there's anything else.\n\n— Zev`,
      };

    case 'started_looking':
      return {
        subject: `Already started looking into ${company}`,
        body_html: wrapHtml(`
          <h2>Hi ${firstName},</h2>
          <p>Quick update — I've already started looking into ${company} and your industry.</p>
          <p>My process involves real research (not just generic templates), so I want to make sure what I send you is actually useful and specific to your situation.</p>
          <p>You'll hear from me soon with concrete findings.</p>
          <p>— Zev</p>
        `),
        body_text: `Hi ${firstName},\n\nQuick update — I've already started looking into ${company} and your industry.\n\nMy process involves real research, so I want to make sure what I send you is specific to your situation.\n\nYou'll hear from me soon.\n\n— Zev`,
      };

    default:
      return {
        subject: `Following up — ${company}`,
        body_html: wrapHtml(`<h2>Hi ${firstName},</h2><p>Just following up on our earlier conversation about ${company}. Let me know if you'd like to discuss further.</p><p>— Zev</p>`),
        body_text: `Hi ${firstName},\n\nJust following up. Let me know if you'd like to discuss.\n\n— Zev`,
      };
  }
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0a0e1a; padding: 32px; text-align: center; }
    .header h1 { color: #7c9bf5; margin: 0; font-size: 20px; font-weight: 600; }
    .body { padding: 32px; }
    .body h2 { color: #0a0e1a; font-size: 20px; margin: 0 0 16px; }
    .body p { line-height: 1.6; color: #555; margin: 12px 0; }
    .cta { display: inline-block; background: #7c9bf5; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .footer { background: #0a0e1a; padding: 20px 32px; text-align: center; }
    .footer p { color: #888; font-size: 12px; margin: 4px 0; }
    .footer a { color: #7c9bf5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>askzev.ai</h1>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p><a href="https://askzev.ai">askzev.ai</a></p>
      <p>AI consulting that builds, not just advises.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const start = Date.now();
  const supabase = getServiceClient();

  try {
    if (await checkKillSwitch(supabase, 'catalyst')) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }
    await updateHeartbeat(supabase, 'catalyst');

    // Find sequences due for their next email
    const { data: dueSequences } = await supabase
      .from('nurture_sequences')
      .select('*')
      .eq('status', 'active')
      .lte('next_send_at', new Date().toISOString())
      .order('next_send_at', { ascending: true })
      .limit(10);

    if (!dueSequences || dueSequences.length === 0) {
      await logAction(supabase, 'catalyst', 'nurture-check', {
        geometryPattern: 'lotus',
        output: { due_sequences: 0 },
        latencyMs: Date.now() - start,
      });
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    let draftsCreated = 0;
    let sequencesCompleted = 0;

    for (const seq of dueSequences as NurtureSequence[]) {
      const steps = getSteps(seq.sequence_type);
      const maxSteps = getMaxSteps(seq.sequence_type);

      // If current_step >= max steps, mark completed
      if (seq.current_step >= maxSteps) {
        await supabase.from('nurture_sequences').update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        }).eq('id', seq.id);
        sequencesCompleted++;
        continue;
      }

      // Check if there's already a pending/approved email for this step
      const { data: existing } = await supabase
        .from('nurture_emails')
        .select('id')
        .eq('sequence_id', seq.id)
        .eq('step_number', seq.current_step)
        .in('status', ['pending_approval', 'approved'])
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Fetch discovery data if available
      let discovery: Discovery | null = null;
      if (seq.discovery_id) {
        const { data: disc } = await supabase
          .from('discoveries')
          .select('id, name, company, email, report_data, report_url, pipeline_track, industry')
          .eq('id', seq.discovery_id)
          .single();
        discovery = disc as Discovery | null;
      }

      // Generate the email draft
      const stepDef = steps[seq.current_step];
      const email = generateEmail(stepDef.key, seq, discovery);

      const { error: insertError } = await supabase.from('nurture_emails').insert({
        sequence_id: seq.id,
        step_number: seq.current_step,
        subject: email.subject,
        body_html: email.body_html,
        body_text: email.body_text,
        status: 'pending_approval',
      });

      if (!insertError) draftsCreated++;
    }

    // Notify via cain_tasks if there are pending approvals
    if (draftsCreated > 0) {
      const { data: pendingCount } = await supabase
        .from('nurture_emails')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

      const totalPending = pendingCount?.length ?? draftsCreated;

      // Check if there's already an open task for this
      const { data: existingTask } = await supabase
        .from('cain_tasks')
        .select('id')
        .eq('assigned_to', 'cain')
        .ilike('title', '%nurture email%')
        .eq('status', 'open')
        .limit(1);

      if (!existingTask || existingTask.length === 0) {
        await supabase.from('cain_tasks').insert({
          title: `${totalPending} nurture email${totalPending > 1 ? 's' : ''} pending approval`,
          context: `New nurture email drafts need Zev's review at /admin/nurture`,
          priority: 'today',
          status: 'open',
          assigned_to: 'cain',
          created_by: 'abel',
          actions: [
            { type: 'link', label: 'Review Nurture Emails', url: 'https://askzev.ai/admin/nurture' },
          ],
        });

        await supabase.from('cain_log').insert({
          entry: `Catalyst generated ${draftsCreated} nurture email draft(s) — pending Zev's approval`,
          created_by: 'abel',
        });
      }
    }

    await recordMetric(supabase, 'catalyst', 'nurture_drafts_created', draftsCreated);
    await logAction(supabase, 'catalyst', 'nurture-generate', {
      geometryPattern: 'lotus',
      output: { drafts_created: draftsCreated, sequences_completed: sequencesCompleted, due_sequences: dueSequences.length },
      latencyMs: Date.now() - start,
    });

    return new Response(JSON.stringify({
      processed: dueSequences.length,
      drafts_created: draftsCreated,
      sequences_completed: sequencesCompleted,
    }), { status: 200 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[pipeline-catalyst]', msg);
    await logAction(supabase, 'catalyst', 'nurture-error', {
      output: { error: msg },
      latencyMs: Date.now() - start,
    });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
