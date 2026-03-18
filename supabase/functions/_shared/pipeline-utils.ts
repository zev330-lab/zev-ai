import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Call Claude API with AbortController timeout and retry on 429.
 */
export async function callClaude(
  anthropicKey: string,
  body: Record<string, unknown>,
  timeoutMs = 150_000,
  maxRetries = 3,
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

      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
        const waitMs = Math.min(retryAfter * 1000, 90_000);
        console.log(`[callClaude] Rate limited (429). Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${maxRetries}`);
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
 * Trigger the next pipeline function.
 *
 * Strategy: Start the fetch, then race it against a 5s timer.
 * Once 5s pass, the HTTP request has been sent to Supabase's edge
 * (TCP + TLS + headers are flushed). We abort and return — the
 * target function is already executing server-side regardless of
 * whether we read the response.
 */
export async function triggerNext(
  functionName: string,
  discoveryId: string,
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const controller = new AbortController();

  try {
    const fetchPromise = fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ discovery_id: discoveryId }),
      signal: controller.signal,
    });

    // Wait up to 5s for the request to be sent and accepted
    const result = await Promise.race([
      fetchPromise.then((r) => ({ ok: true, status: r.status })),
      new Promise<{ ok: boolean; status: string }>((resolve) =>
        setTimeout(() => resolve({ ok: true, status: 'timeout-but-sent' }), 5_000)
      ),
    ]);

    console.log(`[triggerNext] ${functionName} for ${discoveryId}: ${result.status}`);
  } catch (err) {
    console.error(`[triggerNext] ${functionName} failed:`, err);
  } finally {
    // Abort to free resources — the request is already in flight server-side
    controller.abort();
  }
}

/**
 * Fail a discovery pipeline with an error message.
 */
export async function failPipeline(
  supabase: SupabaseClient,
  discoveryId: string,
  step: string,
  errorMsg: string,
): Promise<void> {
  await supabase.from('discoveries').update({
    pipeline_status: 'failed',
    pipeline_error: `${step} failed: ${errorMsg}`,
  }).eq('id', discoveryId);
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
