'use client';

// =============================================================================
// TOLA v3.0 — Realtime Supabase hooks
// useRealtimeAgents      — live agent status updates from tola_agents
// useRealtimeActivityFeed — live activity stream from tola_agent_log
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import type { TolaAgent, TolaAgentLog } from '@/lib/tola-agents';

// Determine at module load time whether the Supabase env vars are present.
// We do this once so that both hooks can bail out early without crashing when
// env vars are not yet configured (e.g. local dev without .env.local).
function hasSupabaseConfig(): boolean {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
  );
}

// ---------------------------------------------------------------------------
// useRealtimeAgents
// ---------------------------------------------------------------------------
// Returns all tola_agents rows and keeps them live via Supabase Realtime.
//
// Realtime event flow:
//   1. Mount: fetch full list from REST
//   2. Subscribe to UPDATE events on tola_agents channel
//   3. On each UPDATE: merge changed row into local state by id
//   4. Unmount: remove the channel subscription

export interface UseRealtimeAgentsResult {
  agents: TolaAgent[];
  loading: boolean;
  error: string | null;
}

export function useRealtimeAgents(): UseRealtimeAgentsResult {
  const [agents, setAgents] = useState<TolaAgent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the supabase client so we don't recreate it on each render.
  // We initialise lazily inside the effect so server-side rendering never
  // attempts to call getSupabaseClient() before env vars are available.
  const channelRef = useRef<ReturnType<
    ReturnType<typeof import('@/lib/supabase').getSupabaseClient>['channel']
  > | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        // Dynamic import keeps the supabase client out of the SSR bundle path.
        const { getSupabaseClient } = await import('@/lib/supabase');
        const supabase = getSupabaseClient();

        // --- Initial fetch ---
        const { data, error: fetchError } = await supabase
          .from('tola_agents')
          .select('*')
          .order('created_at', { ascending: true });

        if (!isMounted) return;

        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        setAgents((data as TolaAgent[]) ?? []);
        setLoading(false);

        // --- Realtime subscription (UPDATE events only) ---
        const channel = supabase
          .channel('tola_agents_realtime')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tola_agents',
            },
            (payload) => {
              if (!isMounted) return;
              const updated = payload.new as TolaAgent;
              setAgents((prev) =>
                prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
              );
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        // supabase.removeChannel is the recommended teardown method.
        // We import lazily here to match the bootstrap pattern.
        import('@/lib/supabase').then(({ getSupabaseClient }) => {
          const supabase = getSupabaseClient();
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        });
      }
    };
  }, []);

  return { agents, loading, error };
}

// ---------------------------------------------------------------------------
// useRealtimeActivityFeed
// ---------------------------------------------------------------------------
// Returns the most-recent tola_agent_log entries and prepends new ones live.
//
// Realtime event flow:
//   1. Mount: fetch last 50 rows (DESC) from REST
//   2. Subscribe to INSERT events on tola_agent_log channel
//   3. On each INSERT: prepend to state, trim to max 100
//   4. Unmount: remove the channel subscription

const INITIAL_FETCH_LIMIT = 50;
const MAX_FEED_LENGTH = 100;

export interface UseRealtimeActivityFeedResult {
  entries: TolaAgentLog[];
  loading: boolean;
}

export function useRealtimeActivityFeed(): UseRealtimeActivityFeedResult {
  const [entries, setEntries] = useState<TolaAgentLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const channelRef = useRef<ReturnType<
    ReturnType<typeof import('@/lib/supabase').getSupabaseClient>['channel']
  > | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const { getSupabaseClient } = await import('@/lib/supabase');
        const supabase = getSupabaseClient();

        // --- Initial fetch (newest first) ---
        const { data } = await supabase
          .from('tola_agent_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(INITIAL_FETCH_LIMIT);

        if (!isMounted) return;

        // Reverse so the array is oldest-first in state; the UI can decide
        // rendering order. Prepended inserts will sit at index 0 (newest).
        setEntries(((data as TolaAgentLog[]) ?? []).reverse());
        setLoading(false);

        // --- Realtime subscription (INSERT events only) ---
        const channel = supabase
          .channel('tola_agent_log_realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'tola_agent_log',
            },
            (payload) => {
              if (!isMounted) return;
              const newEntry = payload.new as TolaAgentLog;
              setEntries((prev) => {
                // Prepend newest entry, trim to MAX_FEED_LENGTH
                const next = [newEntry, ...prev];
                return next.length > MAX_FEED_LENGTH
                  ? next.slice(0, MAX_FEED_LENGTH)
                  : next;
              });
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch {
        // Non-critical: activity feed failing should not break the page.
        if (!isMounted) return;
        setLoading(false);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        import('@/lib/supabase').then(({ getSupabaseClient }) => {
          const supabase = getSupabaseClient();
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        });
      }
    };
  }, []);

  return { entries, loading };
}
