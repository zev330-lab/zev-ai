// =============================================================================
// Pipeline: Free Summary (Email + Discovery Page)
// 
// 1. Generates 5-section personalized content via Claude (structured JSON)
// 2. Stores it in free_summary_content JSONB on the discovery record
// 3. Sends an email with the content + link to /discovery/[id] page
//
// Triggered by advance_pipeline() after pipeline_status = 'complete' &&
// free_summary_sent_at IS NULL. Also invocable manually from admin UI.
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import { logAction, updateHeartbeat } from '../_shared/agent-utils.ts';
import { callClaude, getAnthropicKey, jsonResponse, CORS_HEADERS } from '../_shared/pipeline-utils.ts';

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

    // Guard: only process complete discoveries
    if (discovery.pipeline_status !== 'complete') {
      return jsonResponse({ error: 'Pipeline not complete — cannot generate summary' }, 400);
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const pageUrl = supabaseUrl ? '' : ''; // filled below from env or config
    
    // Build the discovery page URL
    const siteUrl = Deno.env.get('SITE_URL') || 'https://askzev.ai';
    const discoveryPageUrl = `${siteUrl}/discovery/${discoveryId}`;

    // ── Generate personalized content via Claude ─────────────────────────────
    const anthropicKey = getAnthropicKey();
    let summaryContent: Record<string, string> | null = null;
    let tokensUsed = 0;
    let claudeSucceeded = false;

    if (anthropicKey) {
      try {
        const prompt = buildClaudePrompt(discovery, discoveryPageUrl);

        const claudeRes = await callClaude(anthropicKey, {
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }, 90_000);

        if (claudeRes.ok) {
          const result = await claudeRes.json();
          let rawText = '';
          for (const block of result.content ?? []) {
            if (block.type === 'text') rawText += block.text;
          }
          tokensUsed = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

          // Parse JSON response
          try {
            // Claude might wrap in ```json ... ```
            const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed.mirror && parsed.future && parsed.guitar_line) {
              summaryContent = parsed;
              claudeSucceeded = true;
            }
          } catch (parseErr) {
            console.error('[free-summary] JSON parse failed:', parseErr, 'Raw:', rawText.substring(0, 200));
          }
        } else {
          const errText = await claudeRes.text();
          console.error(`[free-summary] Claude error ${claudeRes.status}: ${errText}`);
        }
      } catch (claudeErr) {
        console.error('[free-summary] Claude call failed:', claudeErr);
      }
    }

    // ── Store summary content in discovery record ────────────────────────────
    const updateData: Record<string, unknown> = {};
    if (summaryContent) {
      updateData.free_summary_content = summaryContent;
    }
    updateData.discovery_page_url = discoveryPageUrl;

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('discoveries')
        .update(updateData)
        .eq('id', discoveryId);
    }

    // ── Send email if address available ──────────────────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailId: string | null = null;
    let emailSent = false;

    if (resendKey && discovery.email) {
      const emailHtml = buildEmailHtml(firstName, summaryContent, discoveryPageUrl, discovery);
      const emailText = buildEmailText(firstName, summaryContent, discoveryPageUrl);

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
          html: emailHtml,
          text: emailText,
        }),
      });

      if (emailRes.ok) {
        const resendData = await emailRes.json();
        emailId = resendData?.id ?? null;
        emailSent = true;
      } else {
        const resendError = await emailRes.text();
        console.error(`[free-summary] Resend error ${emailRes.status}: ${resendError}`);
      }
    }

    // ── Mark as sent (even if email wasn't sent — page is still generated) ───
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
          email_sent: emailSent,
          page_url: discoveryPageUrl,
          claude_succeeded: claudeSucceeded,
          tokens_used: tokensUsed,
          latency_ms: Date.now() - start,
        },
        tokensUsed,
        latencyMs: Date.now() - start,
        tierUsed: 1,
      }),
      updateHeartbeat(supabase, 'catalyst'),
    ]);

    return jsonResponse({
      status: 'complete',
      email_id: emailId,
      email_sent: emailSent,
      page_url: discoveryPageUrl,
      claude_succeeded: claudeSucceeded,
      tokens_used: tokensUsed,
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[pipeline-free-summary] Fatal error:', errorMsg);

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
// Claude prompt — returns structured JSON with 5 sections
// ---------------------------------------------------------------------------
function buildClaudePrompt(discovery: Record<string, unknown>, pageUrl: string): string {
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

  return `You're Zev Steinmetz, an AI consultant. Direct, human, never pitchy. Smart friend who knows AI deeply — not a salesperson. 18 months building production AI systems. Real deployments, real businesses, real results.

Here's what a prospect submitted on your discovery form:

${fields}

---

Return a JSON object with exactly these 5 keys. Each value is HTML (use <p> tags for paragraphs, <em> for emphasis, <strong> for key phrases). No markdown. No section labels or headers inside the content.

{
  "mirror": "...",
  "future": "...",
  "guitar_line": "...",
  "context": "...",
  "cta": "..."
}

MIRROR (2-3 <p> tags):
Start with "It sounds like..." or "It looks like..." — a Voss labeling statement. Reflect their exact pain back using their specific words. Reference their actual company/industry/role. Make them feel genuinely seen. Use their specific language, not generic AI consultant language.

FUTURE (3-4 <p> tags):
Paint what Monday morning looks like for them AFTER the right AI setup. Visceral and concrete. Name the specific painful thing from repetitive_work or pain_points and contrast it with a specific tangible outcome. Not "AI will save you time" — the actual changed moment. Ground it in their industry/role.

GUITAR_LINE (2-3 <p> tags):
Honest, soft observation about AI tool experimentation. If they mentioned specific tools (ChatGPT, etc), reference them by name. Something like: "You've probably already tried a few AI tools. Got something decent out of it and then hit a wall. That's not a tool problem — it's a musician problem. Having the tools isn't the same as knowing how to use them for your specific situation."

CONTEXT (2-3 <p> tags):
Not a pitch. Just who Zev is. Short. "I've spent the last 18 months building production AI systems, not demos. [One specific real example — adapt to their industry: ops/customer service/sales/content/data but keep it real, not inflated. Can mention Steinmetz Real Estate as a specific example if relevant.] That's the difference between someone who uses the guitar and someone who knows how to make it sing."

CTA (1-2 <p> tags):
Two clean paths, no pressure. Just text — no buttons (buttons are added separately by the page). "If you want to explore this yourself, the $499 Insight Report lays out exactly what to build, in what order, with honest tradeoffs at each decision point. If you'd rather talk through it, that's what the Strategy Session is for. Either way, you now have a clearer picture."

Voice rules: conversational but precise. Never: leverage, synergy, transform, revolutionize, game-changer, holistic, seamless, streamline. No exclamation points. No corporate language. Write like someone who's genuinely thought about their situation.

Return ONLY the JSON object. No explanation before or after. No markdown code block.`;
}

// ---------------------------------------------------------------------------
// Build HTML email with page link
// ---------------------------------------------------------------------------
function buildEmailHtml(
  firstName: string,
  content: Record<string, string> | null,
  pageUrl: string,
  discovery: Record<string, unknown>
): string {
  const name = discovery.name as string;

  // Build body from structured content or fallback
  let bodyHtml = '';
  if (content) {
    bodyHtml = [
      content.mirror || '',
      content.future || '',
      content.guitar_line || '',
      content.context || '',
      content.cta || '',
    ].filter(Boolean).join('\n    ');
  } else {
    bodyHtml = buildFallbackEmailBody(firstName, discovery);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>From Zev</title>
  <style>
    body { margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.75; color: #1a1a1a; background: #ffffff; }
    .wrap { max-width: 600px; margin: 48px auto; padding: 0 24px; }
    p { margin: 0 0 20px 0; }
    strong { font-weight: bold; }
    a { color: #1a1a1a; }
    .page-cta { margin: 32px 0; padding: 24px; background: #f8f8fb; border-radius: 12px; border-left: 3px solid #7c9bf5; }
    .page-cta p { margin: 0 0 12px 0; font-size: 15px; }
    .page-cta a.btn { display: inline-block; background: #7c9bf5; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-family: -apple-system, sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; }
    .sig { margin-top: 32px; color: #555; }
  </style>
</head>
<body>
  <div class="wrap">
    <p>${firstName},</p>
    ${bodyHtml}

    <div class="page-cta">
      <p>I put together a personal summary of what I see in your situation — and what I think is actually worth doing about it. It's on a page I built for you:</p>
      <a href="${pageUrl}" class="btn">View your personal summary →</a>
    </div>

    <p class="sig">— Zev<br>
    <a href="https://askzev.ai">askzev.ai</a> · <a href="mailto:hello@askzev.ai">hello@askzev.ai</a></p>
  </div>
</body>
</html>`;
}

function buildEmailText(
  firstName: string,
  content: Record<string, string> | null,
  pageUrl: string
): string {
  const sections = content
    ? [content.mirror, content.future, content.guitar_line, content.context, content.cta]
        .filter(Boolean)
        .map(s => (s || '').replace(/<[^>]+>/g, '').replace(/\n\n+/g, '\n\n').trim())
        .join('\n\n')
    : '';

  return `${firstName},

${sections}

I put together a personal summary of what I see in your situation:
${pageUrl}

— Zev
askzev.ai | hello@askzev.ai`;
}

function buildFallbackEmailBody(firstName: string, discovery: Record<string, unknown>): string {
  return `
    <p>I just finished reviewing what you submitted and I wanted to reach out before we connect.</p>

    <p>A few things stood out about your situation. I've got some specific thoughts on where AI could
    actually move the needle for you — and equally importantly, where I'd tell you not to bother.</p>

    <p>You've probably already experimented with a few AI tools. Maybe got something useful out of
    ChatGPT for a week and then hit a wall. That's not a tool problem — that's a musician problem.
    The tools can do extraordinary things. Getting them to do extraordinary things for YOUR business
    is a different skill entirely.</p>

    <p>For what it's worth: I've spent the last 18 months building production AI systems, not demos.
    Real deployments, real results, real businesses. Steinmetz Real Estate runs on this same framework:
    automated transaction management and lead qualification running 24/7.</p>
  `.trim();
}
