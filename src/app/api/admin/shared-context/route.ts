import { NextResponse } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  if (!token || !(await isValidSession(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Recent shared context entries (last 24h)
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { data: context } = await supabase
    .from('tola_shared_context')
    .select('*')
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false })
    .limit(100);

  // Active pipelines
  const { data: activePipelines } = await supabase
    .from('discoveries')
    .select('id, name, company, pipeline_status, pipeline_track, progress_pct, pipeline_error, quality_gate_score, revision_count, created_at, pipeline_started_at')
    .not('pipeline_status', 'in', '("complete","failed")')
    .order('created_at', { ascending: false })
    .limit(20);

  // Tier 3 queue (pipeline items needing approval)
  const { data: tier3Queue } = await supabase
    .from('tola_shared_context')
    .select('*')
    .eq('tier_level', 3)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  // Also get discoveries in 'complete' status that haven't been delivered (free/zevgt3 tracks needing Crown review)
  const { data: awaitingReview } = await supabase
    .from('discoveries')
    .select('id, name, company, pipeline_status, pipeline_track, quality_gate_score, created_at')
    .eq('pipeline_status', 'complete')
    .is('delivered_at', null)
    .in('pipeline_track', ['free', 'friends_family_zevgt3'])
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    context: context || [],
    activePipelines: activePipelines || [],
    tier3Queue: tier3Queue || [],
    awaitingReview: awaitingReview || [],
  });
}
