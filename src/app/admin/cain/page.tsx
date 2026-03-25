// ─── /admin/cain ─────────────────────────────────────────────────────────────
// Server component: fetches tasks + log from Supabase, injects secrets from
// env vars (Buffer password), then hands off to the CainDashboard client
// component for all interactive UI + Realtime subscription.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

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

  // Inject Buffer password from env var — keeps it out of source code + DB.
  // Set BUFFER_PASSWORD in Vercel environment variables.
  const bufferPassword = process.env.BUFFER_PASSWORD ?? '[set BUFFER_PASSWORD in Vercel env]';

  const tasks: DBTask[] = (rawTasks ?? []).map(task => ({
    ...task,
    actions: ((task.actions ?? []) as TaskAction[]).map(action => {
      if (action.type !== 'info') return action;
      const info = action as InfoAction;

      // Replace [BUFFER_PASSWORD] placeholder if present
      let rows = info.rows.map(row =>
        row.value === '[BUFFER_PASSWORD]' ? { ...row, value: bufferPassword } : row
      );

      // Or inject password row after Login if it's absent (migration 024 omitted it)
      const hasPassword = rows.some(r => r.label === 'Password');
      const loginIdx = rows.findIndex(r => r.label === 'Login' && r.value === 'zev330@gmail.com');
      if (!hasPassword && loginIdx !== -1) {
        rows = [
          ...rows.slice(0, loginIdx + 1),
          { label: 'Password', value: bufferPassword, secret: true },
          ...rows.slice(loginIdx + 1),
        ];
      }

      return { ...info, rows };
    }),
  }));

  return <CainDashboard tasks={tasks} log={(log ?? []) as DBLog[]} />;
}
