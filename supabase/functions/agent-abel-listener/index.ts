// =============================================================================
// Agent: Abel Listener — Realtime watcher + fallback processor for cain_tasks
// Primary: local Realtime listener (abel-realtime.mjs) handles task execution
// This edge function serves as:
//   1. Acknowledgment layer — logs new tasks to cain_log
//   2. Stale task detector — flags tasks stuck in open/in_progress for too long
//   3. Health check endpoint — returns listener status
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/pipeline-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: Record<string, unknown> = {};

  // 1. Check for open tasks that haven't been picked up (stale > 10 minutes)
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: staleTasks, error: staleErr } = await supabase
    .from('cain_tasks')
    .select('id, title, status, created_at')
    .eq('assigned_to', 'abel')
    .in('status', ['open'])
    .lt('created_at', tenMinAgo)
    .order('created_at', { ascending: true })
    .limit(5);

  if (staleTasks && staleTasks.length > 0) {
    results.stale_tasks = staleTasks.length;
    // Log alert for stale tasks
    await supabase.from('cain_log').insert({
      entry: `Abel listener alert: ${staleTasks.length} task(s) open for 10+ minutes — local listener may be down. Tasks: ${staleTasks.map(t => t.title).join(', ')}`,
      created_by: 'abel',
    });
  } else {
    results.stale_tasks = 0;
  }

  // 2. Check for tasks stuck in_progress > 10 minutes (possible crash)
  const { data: stuckTasks } = await supabase
    .from('cain_tasks')
    .select('id, title, status, created_at')
    .eq('assigned_to', 'abel')
    .eq('status', 'in_progress')
    .lt('created_at', tenMinAgo)
    .limit(5);

  if (stuckTasks && stuckTasks.length > 0) {
    results.stuck_tasks = stuckTasks.length;
    // Reset stuck tasks back to open so they can be retried
    for (const task of stuckTasks) {
      await supabase.from('cain_tasks')
        .update({ status: 'open' })
        .eq('id', task.id);

      await supabase.from('cain_log').insert({
        entry: `Abel listener: reset stuck task back to open — ${task.title} (was in_progress for 10+ min)`,
        created_by: 'abel',
      });
    }
  } else {
    results.stuck_tasks = 0;
  }

  // 3. Get current task stats
  const { count: openCount } = await supabase
    .from('cain_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', 'abel')
    .eq('status', 'open');

  const { count: doneCount } = await supabase
    .from('cain_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', 'abel')
    .eq('status', 'done');

  const { count: inProgressCount } = await supabase
    .from('cain_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', 'abel')
    .eq('status', 'in_progress');

  results.open = openCount || 0;
  results.in_progress = inProgressCount || 0;
  results.done = doneCount || 0;

  return new Response(
    JSON.stringify({
      ok: true,
      agent: 'abel-listener',
      checked_at: new Date().toISOString(),
      ...results,
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
});
