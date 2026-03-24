import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Write an entry to tola_shared_context.
 * Every agent writes here after completing its work.
 */
export async function writeContext(
  supabase: SupabaseClient,
  entry: {
    pipelineId: string;
    pipelineType?: string;
    fromAgent: string;
    toAgent: string;
    pathName: string;
    payload: Record<string, unknown>;
    qualityScore?: number;
    tierLevel?: number;
  },
): Promise<string | null> {
  const { data, error } = await supabase
    .from('tola_shared_context')
    .insert({
      pipeline_id: entry.pipelineId,
      pipeline_type: entry.pipelineType || 'discovery',
      from_agent: entry.fromAgent,
      to_agent: entry.toAgent,
      path_name: entry.pathName,
      payload: entry.payload,
      quality_score: entry.qualityScore ?? null,
      tier_level: entry.tierLevel ?? 1,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[writeContext] Error:', error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Read pending context entries addressed to a specific agent for a pipeline.
 */
export async function readPendingContext(
  supabase: SupabaseClient,
  agentId: string,
  pipelineId?: string,
): Promise<Array<{
  id: string;
  pipeline_id: string;
  pipeline_type: string;
  from_agent: string;
  path_name: string;
  payload: Record<string, unknown>;
  quality_score: number | null;
  tier_level: number;
  created_at: string;
}>> {
  let query = supabase
    .from('tola_shared_context')
    .select('*')
    .eq('to_agent', agentId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);

  if (pipelineId) {
    query = query.eq('pipeline_id', pipelineId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[readPendingContext] Error:', error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Mark a context entry as acted on (processed).
 */
export async function markContextActedOn(
  supabase: SupabaseClient,
  contextId: string,
): Promise<void> {
  await supabase
    .from('tola_shared_context')
    .update({ status: 'acted_on' })
    .eq('id', contextId);
}

/**
 * Get the most recent context entry for a pipeline from a specific agent.
 * Useful for reading the previous agent's output.
 */
export async function getLatestContext(
  supabase: SupabaseClient,
  pipelineId: string,
  fromAgent: string,
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from('tola_shared_context')
    .select('payload')
    .eq('pipeline_id', pipelineId)
    .eq('from_agent', fromAgent)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (data?.payload as Record<string, unknown>) ?? null;
}

/**
 * Get all context entries for a pipeline, ordered chronologically.
 * Useful for building the full communication history.
 */
export async function getPipelineHistory(
  supabase: SupabaseClient,
  pipelineId: string,
): Promise<Array<{
  from_agent: string;
  to_agent: string;
  path_name: string;
  payload: Record<string, unknown>;
  quality_score: number | null;
  status: string;
  created_at: string;
}>> {
  const { data } = await supabase
    .from('tola_shared_context')
    .select('from_agent, to_agent, path_name, payload, quality_score, status, created_at')
    .eq('pipeline_id', pipelineId)
    .order('created_at', { ascending: true });

  return data ?? [];
}
