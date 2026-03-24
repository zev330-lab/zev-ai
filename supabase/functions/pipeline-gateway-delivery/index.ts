// =============================================================================
// Pipeline Gateway Delivery — Delivers approved insight reports (Path 7)
//   - Generates report URL (/discovery/[id])
//   - Sends delivery email via Resend
//   - Marks pipeline complete
//   - Notifies Crown (Path 8)
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat, recordMetric } from '../_shared/agent-utils.ts';
import { jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';
import { writeContext } from '../_shared/context-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();

  try {
    const { discovery_id } = await req.json();
    if (!discovery_id) return jsonResponse({ error: 'discovery_id required' }, 400);

    const supabase = getServiceClient();

    const { data: discovery } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discovery_id)
      .single();

    if (!discovery) return jsonResponse({ error: 'Discovery not found' }, 404);

    const reportData = discovery.report_data as Record<string, unknown> | null;
    if (!reportData) {
      return jsonResponse({ error: 'No report_data to deliver' }, 400);
    }

    const report = (reportData.report || reportData) as Record<string, unknown>;
    const track = (discovery.pipeline_track as string) || 'free';
    const reportUrl = `https://askzev.ai/discovery/${discovery_id}`;

    // ── Send delivery email ──────────────────────────────────────────────
    let emailSent = false;
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (resendKey && discovery.email) {
      const firstName = ((discovery.name as string) || 'there').split(/\s+/)[0];
      const company = (discovery.company as string) || 'your business';
      const execSummary = (report.executive_summary as string) || '';
      const fitLevel = (report.fit_for_zev_ai as string) || 'exploratory';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0a0e1a; padding: 40px 32px; text-align: center; }
    .header h1 { color: #7c9bf5; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: #c4b5e0; margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .body h2 { color: #0a0e1a; font-size: 20px; margin: 0 0 16px; }
    .body p { line-height: 1.6; color: #555; }
    .summary-box { background: #f8f9ff; border-left: 4px solid #7c9bf5; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .summary-box p { margin: 0; color: #333; font-size: 15px; }
    .cta { display: inline-block; background: #7c9bf5; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .footer { background: #0a0e1a; padding: 24px 32px; text-align: center; }
    .footer p { color: #888; font-size: 12px; margin: 4px 0; }
    .footer a { color: #7c9bf5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Insight Report is Ready</h1>
      <p>Prepared for ${company}</p>
    </div>
    <div class="body">
      <h2>Hi ${firstName},</h2>
      <p>I've completed the analysis of ${company}. Here's a quick preview:</p>

      <div class="summary-box">
        <p>${execSummary}</p>
      </div>

      <p>Your full report includes:</p>
      <ul style="color: #555; line-height: 2;">
        <li>Detailed market and competitive research</li>
        <li>Specific AI opportunities with impact estimates</li>
        <li>Decision frameworks for your key choices</li>
        <li>Honest assessment of what will and won't work</li>
        <li>Concrete next steps you can take immediately</li>
      </ul>

      <center>
        <a href="${reportUrl}" class="cta">View Your Full Report</a>
      </center>

      ${fitLevel === 'strong' ? `<p>Based on my analysis, there's a strong fit between what you need and what I build. I'd love to discuss this further — feel free to reply to this email or <a href="https://askzev.ai/discover" style="color: #7c9bf5;">schedule a deeper discovery</a>.</p>` : ''}
      ${fitLevel === 'moderate' ? `<p>I've identified some promising opportunities, though there are a few things we'd need to explore together first. Reply to this email if you'd like to discuss.</p>` : ''}

      <p>Best,<br><strong>Zev Steinmetz</strong><br>askzev.ai</p>
    </div>
    <div class="footer">
      <p><a href="https://askzev.ai">askzev.ai</a></p>
      <p>AI consulting that builds, not just advises.</p>
    </div>
  </div>
</body>
</html>`;

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Zev Steinmetz <hello@askzev.ai>',
            to: [discovery.email],
            subject: `Your AI Insight Report for ${company} is Ready`,
            html: emailHtml,
          }),
        });

        emailSent = emailResponse.ok;
        if (!emailSent) {
          console.error('[Gateway] Email send failed:', await emailResponse.text());
        }
      } catch (emailErr) {
        console.error('[Gateway] Email error:', emailErr);
      }
    }

    // ── Update discovery as delivered ────────────────────────────────────
    const now = new Date().toISOString();
    await supabase.from('discoveries').update({
      pipeline_status: 'complete',
      pipeline_completed_at: now,
      pipeline_step_completed_at: now,
      pipeline_started_at: null,
      delivered_at: now,
      report_url: reportUrl,
      progress_pct: 100,
    }).eq('id', discovery_id);

    // Update contact status
    if (discovery.email) {
      await supabase.from('contacts')
        .update({ status: 'proposal_sent' })
        .eq('email', discovery.email);
    }

    // ── Write delivery confirmation to shared context (Path 7) ──────────
    const deliveryPayload = {
      delivered: true,
      delivery_method: 'email',
      report_url: reportUrl,
      email_sent_to: (discovery.email as string) || null,
      email_sent: emailSent,
      delivered_at: now,
      pipeline_track: track,
    };

    await writeContext(supabase, {
      pipelineId: discovery_id,
      fromAgent: 'gateway',
      toAgent: 'nexus',
      pathName: 'gateway_to_nexus_delivered',
      payload: deliveryPayload,
    });

    // ── Notify Zev (Path 8: Crown notification) ─────────────────────────
    if (resendKey) {
      const fitEmoji = (report.fit_for_zev_ai as string) === 'strong' ? '🟢' :
                        (report.fit_for_zev_ai as string) === 'moderate' ? '🟡' : '⚪';
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'TOLA Gateway <alerts@askzev.ai>',
            to: [Deno.env.get('NOTIFICATION_EMAIL') || 'zev330@gmail.com'],
            subject: `${fitEmoji} Insight Report Delivered: ${discovery.name} — ${discovery.company || 'N/A'}`,
            html: `<h2>Insight Report Delivered</h2>
<p><strong>Prospect:</strong> ${discovery.name} at ${discovery.company || 'N/A'}</p>
<p><strong>Track:</strong> ${track}${track === 'paid_499' ? ' ($499 revenue)' : ''}</p>
<p><strong>Fit:</strong> ${report.fit_for_zev_ai || 'unknown'}</p>
<p><strong>Quality Score:</strong> ${discovery.quality_gate_score || 'N/A'}</p>
<p><strong>Report:</strong> <a href="${reportUrl}">${reportUrl}</a></p>
<p><strong>Email Sent:</strong> ${emailSent ? 'Yes' : 'No'}</p>
<hr>
<p><a href="https://askzev.ai/admin/discoveries">View in Admin</a></p>`,
          }),
        });
      } catch (notifyErr) {
        console.error('[Gateway] Crown notification failed:', notifyErr);
      }
    }

    await Promise.all([
      logAction(supabase, 'gateway', 'deliver-report', {
        geometryPattern: 'flower_of_life',
        output: deliveryPayload,
        latencyMs: Date.now() - start,
      }),
      updateHeartbeat(supabase, 'gateway'),
      recordMetric(supabase, 'gateway', 'report_delivered', 1, {
        discovery_id,
        track,
        email_sent: emailSent,
      }),
    ]);

    return jsonResponse({
      status: 'delivered',
      report_url: reportUrl,
      email_sent: emailSent,
      track,
    });

  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown delivery error' }, 500);
  }
});
