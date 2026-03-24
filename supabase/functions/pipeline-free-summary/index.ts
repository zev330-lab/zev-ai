// =============================================================================
// Pipeline: Free Summary Email
// Generates a personalized 5-section email via Claude, sends via Resend.
// Triggered by advance_pipeline() after pipeline_status = 'complete' &&
// free_summary_sent_at IS NULL. Also invocable manually from admin UI.
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';

// ---------------------------------------------------------------------------
// Fallback email — sent if Claude API fails. Still has value; doesn't leave
// the prospect with nothing.
// ---------------------------------------------------------------------------
function buildFallbackEmail(name: string, firstName: string): string {
  return `
    <p>${firstName},</p>

    <p>I just finished reviewing what you submitted and I wanted to reach out before we connect.</p>

    <p>A few things stood out about your situation. I've got some specific thoughts on where AI could
    actually move the needle for you — and equally importantly, where I'd tell you not to bother.</p>

    <p>You've probably already experimented with a few AI tools. Maybe got something useful out of
    ChatGPT for a week and then hit a wall. That's not a tool problem — that's a musician problem.
    The tools can do extraordinary things. Getting them to do extraordinary things for YOUR business
    is a different skill entirely.</p>

    <p>For what it's worth: I've spent the last 18 months building production AI systems, not demos.
    Real deployments, real results, real businesses. That's the difference between someone who uses
    the guitar and someone who knows how to make it sing.</p>

    <p>If you want to try this yourself, the <strong>$499 Insight Report</strong> lays out exactly what to build,
    in what order, with the honest tradeoffs at each decision point — so you know what you're getting into.
    If you'd rather skip that and have a real conversation about what this looks like for your specific
    business, that's the <strong>Strategy Session</strong>. Either way, you now know what you're dealing with.</p>

    <p>— Zev</p>
  `.trim();
}

// ---------------------------------------------------------------------------
// Wrap Claude-generated body in a clean HTML email template
// ---------------------------------------------------------------------------
function buildEmailHtml(firstName: string, bodyText: string): string {
  // Convert plain paragraphs to HTML (Claude returns \n\n separated paragraphs)
  const paragraphs = bodyText
    .trim()
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>From Zev</title>
  <style>
    body {
      margin: 0; padding: 0;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 16px; line-height: 1.75;
      color: #1a1a1a; background: #ffffff;
    }
    .wrap {
      max-width: 600px; margin: 48px auto; padding: 0 24px;
    }
    p {
      margin: 0 0 20px 0;
    }
    strong { font-weight: bold; }
    a { color: #1a1a1a; }
    .greeting { margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="wrap">
    <p class="greeting">${firstName},</p>
    ${paragraphs}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const start = Date.now();
  let discoveryId: string | undefined;

  try {
    const body = await req.json();
    discoveryId = body.discovery_id;
    if (!discoveryId) return jsonResponse({ error: 'discovery_id required' }, 400);

    const supabase = getServiceClient();

    // Fetch full discovery record
    const { data: discovery, error: fetchErr } = await supabase
      .from('discoveries')
      .select('*')
      .eq('id', discoveryId)
      .single();

    if (fetchErr || !discovery) {
      return jsonResponse({ error: 'Discovery not found' }, 404);
    }

    // Guard: only send to complete discoveries
    if (discovery.pipeline_status !== 'complete') {
      return jsonResponse({ error: 'Pipeline not complete — cannot send summary' }, 400);
    }

    // Guard: must have an email address
    if (!discovery.email) {
      return jsonResponse({ error: 'No email address on discovery — cannot send summary' }, 400);
    }

    // Guard: already sent? (unless forced)
    const force = body.force === true;
    if (discovery.free_summary_sent_at && !force) {
      return jsonResponse({
        status: 'already_sent',
        sent_at: discovery.free_summary_sent_at,
        message: 'Summary already sent. Pass force:true to resend.',
      });
    }

    const firstName = (discovery.name as string).trim().split(/\s+/)[0];
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!resendKey) {
      return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500);
    }

    // ── Generate personalized body via Claude ────────────────────────────────
    const anthropicKey = getAnthropicKey();
    let emailBody = '';
    let tokensUsed = 0;
    let claudeSucceeded = false;

    if (anthropicKey) {
      try {
        const prompt = buildClaudePrompt(discovery);

        const claudeRes = await callClaude(anthropicKey, {
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }, 90_000);

        if (claudeRes.ok) {
          const result = await claudeRes.json();
          for (const block of result.content ?? []) {
            if (block.type === 'text') emailBody += block.text;
          }
          tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);
          if (emailBody.trim().length > 200) {
            claudeSucceeded = true;
          }
        } else {
          const errText = await claudeRes.text();
          console.error(`[free-summary] Claude error ${claudeRes.status}: ${errText}`);
        }
      } catch (claudeErr) {
        console.error('[free-summary] Claude call failed:', claudeErr);
      }
    }

    // ── Fall back to canned summary if Claude failed ─────────────────────────
    const htmlBody = claudeSucceeded
      ? buildEmailHtml(firstName, emailBody)
      : buildEmailHtml(firstName, buildFallbackEmail(discovery.name as string, firstName));

    // ── Send via Resend ──────────────────────────────────────────────────────
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Zev Steinmetz <hello@askzev.ai>',
        to: [discovery.email as string],
        subject: `What I noticed about your situation`,
        html: htmlBody,
        // Plain-text fallback
        text: claudeSucceeded
          ? emailBody
          : buildFallbackEmail(discovery.name as string, firstName),
      }),
    });

    if (!emailRes.ok) {
      const resendError = await emailRes.text();
      throw new Error(`Resend error ${emailRes.status}: ${resendError}`);
    }

    const resendData = await emailRes.json();
    const emailId = resendData?.id ?? null;

    // ── Update discovery record ──────────────────────────────────────────────
    await supabase
      .from('discoveries')
      .update({ free_summary_sent_at: new Date().toISOString() })
      .eq('id', discoveryId);

    // ── Log to TOLA ──────────────────────────────────────────────────────────
    await Promise.all([
      logAction(supabase, 'catalyst', 'send-free-summary', {
        geometryPattern: 'seed-of-life',
        input: { discovery_id: discoveryId, to: discovery.email },
        output: {
          email_id: emailId,
          claude_succeeded: claudeSucceeded,
          tokens_used: tokensUsed,
          fallback_used: !claudeSucceeded,
          latency_ms: Date.now() - start,
        },
        tokensUsed,
        latencyMs: Date.now() - start,
        tierUsed: 1,
      }),
      updateHeartbeat(supabase, 'catalyst'),
    ]);

    return jsonResponse({
      status: 'sent',
      email_id: emailId,
      to: discovery.email,
      claude_succeeded: claudeSucceeded,
      tokens_used: tokensUsed,
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[pipeline-free-summary] Fatal error:', errorMsg);

    // Log failure
    if (discoveryId) {
      try {
        const supabase = getServiceClient();
        await logAction(supabase, 'catalyst', 'send-free-summary-failed', {
          geometryPattern: 'seed-of-life',
          input: { discovery_id: discoveryId },
          output: { error: errorMsg, latency_ms: Date.now() - start },
          latencyMs: Date.now() - start,
        });
      } catch { /* best effort */ }
    }

    return jsonResponse({ error: errorMsg }, 500);
  }
});

// ---------------------------------------------------------------------------
// Build the Claude prompt from discovery data
// ---------------------------------------------------------------------------
function buildClaudePrompt(discovery: Record<string, unknown>): string {
  const fields = [
    `Name: ${discovery.name || 'Not provided'}`,
    `Company: ${discovery.company || 'Not provided'}`,
    `Role: ${discovery.role || 'Not provided'}`,
    `Business Overview: ${discovery.business_overview || 'Not provided'}`,
    `Team Size: ${discovery.team_size || 'Not provided'}`,
    `Pain Points: ${discovery.pain_points || 'Not provided'}`,
    `Repetitive Work They Want To Eliminate: ${discovery.repetitive_work || 'Not provided'}`,
    `AI Experience Level: ${discovery.ai_experience || 'None mentioned'}`,
    `AI Tools Previously Used: ${discovery.ai_tools_detail || 'None mentioned'}`,
    `Magic Wand Answer (what they'd fix if they could): ${discovery.magic_wand || 'Not provided'}`,
    `Success Vision (what winning looks like): ${discovery.success_vision || 'Not provided'}`,
    `Anything Else: ${discovery.anything_else || 'Nothing additional'}`,
  ].join('\n');

  return `You're writing a personal email from Zev Steinmetz to a business owner who submitted a discovery form about AI implementation.

Zev is an AI consultant. Direct, human, never pitchy. He sounds like a smart friend who happens to know AI deeply — not a salesperson, not a consultant with slides. He's been building production AI systems for 18 months: real deployments, real businesses, real results.

Here's what the prospect submitted:

${fields}

---

Write the complete email body — no subject line, no greeting (don't start with "Hi" or their name), no signature. Just the body text. Plain paragraphs, separated by blank lines.

The email has exactly 5 parts, written as natural paragraphs with no section labels:

PART 1 — THE MIRROR
Start with a labeling statement ("It sounds like..." or "It looks like..."). Reflect their exact pain back to them using their specific words from the form. Reference their actual situation — company type, the specific thing that's breaking down. Make them feel genuinely seen. 2-3 sentences. Do not be generic.

PART 2 — THE SPECIFIC FUTURE  
Paint what Monday morning looks like for them AFTER. Visceral and concrete. Name the specific painful thing they mentioned (from repetitive_work or pain_points) and contrast it with a specific, tangible outcome — not "AI will save you time" but the actual changed moment. 3-4 sentences. Ground it in their industry and role.

PART 3 — THE GUITAR LINE
Honest, soft observation about the AI experimentation wall. If they mentioned specific tools, reference them. Something like: "You've probably already tried a few AI tools. Got something decent out of it and then hit a wall. That's not a tool problem — that's a musician problem. The tools can do extraordinary things. Getting them to do extraordinary things for YOUR business is a different skill entirely." Adapt the specific tools if they mentioned any. 3-4 sentences.

PART 4 — CREDIBILITY CONTEXT
Not a pitch. Just context about who Zev is. Keep it short. Something like: "For what it's worth: I've spent the last 18 months building production AI systems, not demos. [One specific example of a real outcome — vary this based on their industry if possible, e.g. ops, customer service, sales, content, data — but keep it real and specific, not inflated]. That's the difference between someone who uses the guitar and someone who knows how to make it sing." 3-4 sentences total.

PART 5 — THE FORK
Two clean paths, no pressure, no CTA button. "If you want to try this yourself, the $499 Insight Report lays out exactly what to build, in what order, with the honest tradeoffs at each decision point — so you know what you're getting into. If you'd rather skip that and have a real conversation about what this looks like for your specific business, that's the Strategy Session. Either way, you now have a clearer picture of what you're dealing with."

Then end with:
"— Zev"

---

Total: 600-900 words including the sign-off. 

Voice rules: conversational but precise. Never use the words leverage, synergy, transform, revolutionize, game-changer, holistic, seamless, streamline (unless quoting them). Don't promise specific outcomes. Don't use exclamation points. No corporate language. Write like a person who's genuinely thought about their situation, not like someone running a content template.`;
}
