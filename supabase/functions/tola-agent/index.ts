// =============================================================================
// TOLA v3.0 — Unified Agent Edge Function ("fat function" pattern)
//
// Single endpoint that routes to all 11 agent handlers.
// Invoked via POST with { "agent": "<id>", "action": "<action>", ... }
//
// Shared infrastructure:
//   - Kill switch check (skip if engaged)
//   - Audit logging (every invocation logged to tola_agent_log)
//   - Heartbeat update (marks agent as healthy + updates timestamp)
// =============================================================================

import { getServiceClient } from '../_shared/supabase.ts';
import {
  checkKillSwitch,
  logAction,
  updateHeartbeat,
  recordMetric,
  jsonResponse,
  CORS_HEADERS,
} from '../_shared/agent-utils.ts';
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Agent handler type
// ---------------------------------------------------------------------------

type AgentHandler = (
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// Sentinel — Merkabah health monitoring
// Triangulated check: API reachability, DB connectivity, agent staleness
// ---------------------------------------------------------------------------

const sentinel: AgentHandler = async (supabase) => {
  const checks: Record<string, unknown> = {};

  // 1. Database connectivity
  const dbStart = Date.now();
  const { error: dbError } = await supabase.from('tola_agents').select('id').limit(1);
  checks.db = { ok: !dbError, latency_ms: Date.now() - dbStart };

  // 2. Check for stale agents (no heartbeat in 5 minutes)
  const { data: agents } = await supabase.from('tola_agents').select('id, last_heartbeat, status');
  const staleThreshold = Date.now() - 5 * 60 * 1000;
  const staleAgents = (agents ?? []).filter((a: { last_heartbeat: string | null }) => {
    if (!a.last_heartbeat) return true;
    return new Date(a.last_heartbeat).getTime() < staleThreshold;
  });

  // Mark stale agents as degraded
  for (const stale of staleAgents) {
    if ((stale as { status: string }).status !== 'offline') {
      await supabase.from('tola_agents').update({ status: 'degraded' }).eq('id', (stale as { id: string }).id);
    }
  }

  checks.stale_agents = staleAgents.map((a: { id: string }) => a.id);

  // 3. Record health metric
  const healthScore = staleAgents.length === 0 && !dbError ? 1.0 : dbError ? 0.0 : 0.5;
  await recordMetric(supabase, 'sentinel', 'system_health', healthScore, {
    db_ok: !dbError,
    stale_count: staleAgents.length,
  });

  return { status: 'complete', checks, health_score: healthScore };
};

// ---------------------------------------------------------------------------
// Foundation — Seed of Life infrastructure maintenance
// Cleanup old logs, aggregate daily metrics
// ---------------------------------------------------------------------------

const foundation: AgentHandler = async (supabase) => {
  // 1. Clean up logs older than 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: deletedLogs } = await supabase
    .from('tola_agent_log')
    .delete()
    .lt('created_at', cutoff)
    .select('*', { count: 'exact', head: true });

  // 2. Clean up metrics older than 90 days
  const metricCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count: deletedMetrics } = await supabase
    .from('tola_agent_metrics')
    .delete()
    .lt('created_at', metricCutoff)
    .select('*', { count: 'exact', head: true });

  // 3. Count current totals for monitoring
  const { count: totalLogs } = await supabase
    .from('tola_agent_log')
    .select('*', { count: 'exact', head: true });
  const { count: totalMetrics } = await supabase
    .from('tola_agent_metrics')
    .select('*', { count: 'exact', head: true });

  return {
    status: 'complete',
    cleaned: { logs: deletedLogs ?? 0, metrics: deletedMetrics ?? 0 },
    totals: { logs: totalLogs ?? 0, metrics: totalMetrics ?? 0 },
  };
};

// ---------------------------------------------------------------------------
// Nexus — Flower of Life intelligent routing
// Classifies incoming contacts/discoveries by urgency
// ---------------------------------------------------------------------------

const nexus: AgentHandler = async (supabase) => {
  // Fetch unclassified contacts (status = 'new')
  const { data: newContacts } = await supabase
    .from('contacts')
    .select('id, name, message')
    .eq('status', 'new')
    .limit(20);

  let classified = 0;

  for (const contact of newContacts ?? []) {
    // Simple keyword-based urgency scoring (Claude API integration in future)
    const msg = ((contact as { message: string }).message ?? '').toLowerCase();
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'deadline'];
    const highValueKeywords = ['enterprise', 'scale', 'multiple', 'team', 'budget'];

    const isUrgent = urgencyKeywords.some((k) => msg.includes(k));
    const isHighValue = highValueKeywords.some((k) => msg.includes(k));

    if (isUrgent || isHighValue) {
      // Add notes for Crown review
      const notes = [
        isUrgent ? '[NEXUS: URGENT]' : '',
        isHighValue ? '[NEXUS: HIGH-VALUE]' : '',
      ].filter(Boolean).join(' ');

      await supabase
        .from('contacts')
        .update({ notes })
        .eq('id', (contact as { id: string }).id)
        .is('notes', null); // Only if no existing notes

      classified++;
    }
  }

  return { status: 'complete', processed: newContacts?.length ?? 0, classified };
};

// ---------------------------------------------------------------------------
// Stub handlers for remaining agents
// Each performs a minimal heartbeat and logs readiness.
// Full implementations will be added as the system matures.
// ---------------------------------------------------------------------------

function createStub(agentId: string, geometryEngine: string): AgentHandler {
  return async () => ({
    status: 'ready',
    agent: agentId,
    geometry_engine: geometryEngine,
    message: `${agentId} agent is online and awaiting activation.`,
  });
}

const crown: AgentHandler = createStub('crown', 'seed_of_life');
const visionary: AgentHandler = createStub('visionary', 'metatrons_cube');
const architect: AgentHandler = createStub('architect', 'sri_yantra');
const oracle: AgentHandler = createStub('oracle', 'torus');
const catalyst: AgentHandler = createStub('catalyst', 'lotus');
const guardian: AgentHandler = createStub('guardian', 'yin_yang');
const prism: AgentHandler = createStub('prism', 'vortex');
const gateway: AgentHandler = createStub('gateway', 'flower_of_life');

// ---------------------------------------------------------------------------
// Agent registry
// ---------------------------------------------------------------------------

const AGENTS: Record<string, AgentHandler> = {
  crown,
  visionary,
  architect,
  oracle,
  catalyst,
  guardian,
  nexus,
  sentinel,
  prism,
  foundation,
  gateway,
};

// Geometry engine mapping for log enrichment
const GEOMETRY_MAP: Record<string, string> = {
  crown: 'seed_of_life',
  visionary: 'metatrons_cube',
  architect: 'sri_yantra',
  oracle: 'torus',
  catalyst: 'lotus',
  guardian: 'yin_yang',
  nexus: 'flower_of_life',
  sentinel: 'merkabah',
  prism: 'vortex',
  foundation: 'seed_of_life',
  gateway: 'flower_of_life',
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { agent, action = 'default', ...payload } = body;

    if (!agent || !AGENTS[agent]) {
      return jsonResponse({ error: `Unknown agent: ${agent}` }, 400);
    }

    const supabase = getServiceClient();

    // Kill switch check
    const killed = await checkKillSwitch(supabase, agent);
    if (killed) {
      await logAction(supabase, agent, `${action}_blocked`, {
        geometryPattern: GEOMETRY_MAP[agent],
        output: { reason: 'kill_switch_engaged' },
      });
      return jsonResponse({ error: `Agent ${agent} is disabled` }, 403);
    }

    // Execute handler
    const start = Date.now();
    const result = await AGENTS[agent](supabase, { action, ...payload });
    const latencyMs = Date.now() - start;

    // Log action + update heartbeat
    await Promise.all([
      logAction(supabase, agent, action, {
        geometryPattern: GEOMETRY_MAP[agent],
        output: result,
        latencyMs,
      }),
      updateHeartbeat(supabase, agent),
    ]);

    return jsonResponse({ agent, action, result, latency_ms: latencyMs });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      500,
    );
  }
});
