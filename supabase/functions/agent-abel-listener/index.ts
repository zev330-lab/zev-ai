// =============================================================================
// Agent: Abel Listener — Realtime watcher for cain_tasks
// Subscribes to cain_tasks INSERT events where assigned_to='abel' and status='open'
// Acknowledges new tasks by writing to cain_log
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // How long to keep the listener alive (default 120s, safe under Edge Function limits)
  const listenDurationMs = 120_000;
  const processed: string[] = [];

  const channel = supabase
    .channel('abel-task-watcher')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'cain_tasks',
        filter: 'assigned_to=eq.abel',
      },
      async (payload) => {
        const task = payload.new as { id: string; title: string; status: string; assigned_to: string };

        // Only acknowledge open tasks
        if (task.status !== 'open') return;

        // Deduplicate within this invocation
        if (processed.includes(task.id)) return;
        processed.push(task.id);

        // Write acknowledgment to cain_log
        await supabase.from('cain_log').insert({
          entry: `Abel acknowledged task: ${task.title}`,
          created_by: 'abel',
        });

        console.log(`Abel acknowledged task: ${task.id} — ${task.title}`);
      },
    )
    .subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`);
    });

  // Keep the function alive for the listen duration
  await new Promise((resolve) => setTimeout(resolve, listenDurationMs));

  // Clean up
  await supabase.removeChannel(channel);

  return new Response(
    JSON.stringify({
      ok: true,
      listened_for_ms: listenDurationMs,
      tasks_acknowledged: processed.length,
      task_ids: processed,
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
});
