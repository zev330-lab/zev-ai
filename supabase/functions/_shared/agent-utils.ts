import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Check whether the given agent's kill switch is engaged.
 * Returns true if the agent should NOT run.
 */
export async function checkKillSwitch(
  supabase: SupabaseClient,
  agentId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('tola_agents')
    .select('kill_switch, is_active')
    .eq('id', agentId)
    .single();

  // Kill switch engaged OR agent deactivated → skip execution
  return data?.kill_switch === true || data?.is_active === false;
}

/**
 * Insert a row into tola_agent_log.
 */
export async function logAction(
  supabase: SupabaseClient,
  agentId: string,
  action: string,
  details: {
    geometryPattern?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    confidence?: number;
    tierUsed?: number;
    tokensUsed?: number;
    latencyMs?: number;
  } = {},
): Promise<void> {
  await supabase.from('tola_agent_log').insert({
    agent_id: agentId,
    action,
    geometry_pattern: details.geometryPattern ?? null,
    input: details.input ?? null,
    output: details.output ?? null,
    confidence: details.confidence ?? null,
    tier_used: details.tierUsed ?? null,
    tokens_used: details.tokensUsed ?? null,
    latency_ms: details.latencyMs ?? null,
  });
}

/**
 * Update the agent's last_heartbeat and set status to healthy.
 */
export async function updateHeartbeat(
  supabase: SupabaseClient,
  agentId: string,
): Promise<void> {
  await supabase
    .from('tola_agents')
    .update({
      last_heartbeat: new Date().toISOString(),
      status: 'healthy',
    })
    .eq('id', agentId);
}

/**
 * Insert a metric data point.
 */
export async function recordMetric(
  supabase: SupabaseClient,
  agentId: string,
  metric: string,
  value: number,
  geometryState?: Record<string, unknown>,
): Promise<void> {
  await supabase.from('tola_agent_metrics').insert({
    agent_id: agentId,
    metric,
    value,
    geometry_state: geometryState ?? null,
  });
}

/**
 * Standard JSON response helper.
 */
export function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * CORS headers for Edge Functions invoked from the browser.
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
