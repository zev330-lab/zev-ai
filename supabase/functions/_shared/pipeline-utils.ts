import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Call Claude API with AbortController timeout and retry on 429.
 */
export async function callClaude(
  anthropicKey: string,
  body: Record<string, unknown>,
  timeoutMs = 120_000,
  maxRetries = 1,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      // Retry on 429 (rate limit) or 529 (overloaded) — one retry with short wait
      if ((response.status === 429 || response.status === 529) && attempt < maxRetries) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '15', 10);
        const waitMs = Math.min(retryAfter * 1000, 30_000);
        console.log(`[callClaude] ${response.status} error. Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${maxRetries}`);
        clearTimeout(timer);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`Claude API timed out after ${Math.round(timeoutMs / 1000)}s`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('callClaude: exhausted retries');
}

/**
 * Get cleaned ANTHROPIC_API_KEY from env.
 */
export function getAnthropicKey(): string | null {
  const raw = Deno.env.get('ANTHROPIC_API_KEY');
  if (!raw) return null;
  return raw.replace(/[^\x20-\x7E]/g, '').trim().replace(/^["']|["']$/g, '') || null;
}

/**
 * Fail a discovery pipeline with an error message.
 * Sends a Resend email alert to zev330@gmail.com on failure.
 */
export async function failPipeline(
  supabase: SupabaseClient,
  discoveryId: string,
  step: string,
  errorMsg: string,
): Promise<void> {
  // Fetch discovery for context before updating
  const { data: discovery } = await supabase
    .from('discoveries')
    .select('name, company')
    .eq('id', discoveryId)
    .single();

  await supabase.from('discoveries').update({
    pipeline_status: 'failed',
    pipeline_error: `${step} failed: ${errorMsg}`,
    pipeline_started_at: null,
  }).eq('id', discoveryId);

  // Send failure alert email via Resend
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) {
    const company = discovery?.company || discovery?.name || 'Unknown';
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'TOLA Alerts <alerts@zev.ai>',
          to: ['zev330@gmail.com'],
          subject: `Pipeline Failed: ${company}`,
          html: `<h2>Pipeline Failure Alert</h2>
<p><strong>Discovery ID:</strong> ${discoveryId}</p>
<p><strong>Company:</strong> ${company}</p>
<p><strong>Failed Stage:</strong> ${step}</p>
<p><strong>Error:</strong> ${errorMsg}</p>
<p><strong>Time:</strong> ${new Date().toISOString()}</p>
<hr>
<p><a href="https://zev-ai-swart.vercel.app/admin/discoveries">View in Admin</a></p>`,
        }),
      });
    } catch (emailErr) {
      console.error('[failPipeline] Email alert failed:', emailErr);
    }
  }
}

/**
 * Standard CORS + JSON response helpers for pipeline functions.
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
