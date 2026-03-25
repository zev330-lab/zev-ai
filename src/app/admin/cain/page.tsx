// ─── /admin/cain ─────────────────────────────────────────────────────────────
// Server component: fetches tasks + log from Supabase, injects secrets from
// env vars (Buffer password), then hands off to the CainDashboard client
// component for all interactive UI.
// ─────────────────────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from '@/lib/supabase';
import CainDashboard from './CainDashboard';
import type { DBTask, DBLog, TaskAction, InfoAction } from './CainDashboard';

export default async function CainPage() {
  const supabase = getSupabaseAdmin();

  const [{ data: rawTasks }, { data: log }] = await Promise.all([
    supabase
      .from('cain_tasks')
      .select('*')
      .order('created_at', { ascending: true }),
    supabase
      .from('cain_log')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  // Inject Buffer password from env var — keeps it out of source code + DB seed.
  // Set BUFFER_PASSWORD in Vercel environment variables.
  const bufferPassword = process.env.BUFFER_PASSWORD ?? '[set BUFFER_PASSWORD in Vercel env]';

  const tasks: DBTask[] = (rawTasks ?? []).map(task => ({
    ...task,
    actions: ((task.actions ?? []) as TaskAction[]).map(action => {
      if (action.type !== 'info') return action;
      const info = action as InfoAction;
      return {
        ...info,
        rows: info.rows.map(row =>
          row.value === '[BUFFER_PASSWORD]' ? { ...row, value: bufferPassword } : row
        ),
      };
    }),
  }));

  return <CainDashboard tasks={tasks} log={(log ?? []) as DBLog[]} />;
}
