// One-time migration runner for admin use only
// POST /api/admin/run-migration with { migration: '021' }
// Protected by admin session cookie

import { NextResponse } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

const MIGRATIONS: Record<string, string[]> = {
  '021': [
    'ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS phone TEXT',
    'ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS free_summary_content JSONB',
    'ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS discovery_page_url TEXT',
  ],
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_auth')?.value;
  
  if (!sessionToken || !(await isValidSession(sessionToken))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { migration } = await request.json();
  const statements = MIGRATIONS[migration];

  if (!statements) {
    return NextResponse.json({ error: `Unknown migration: ${migration}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of statements) {
    try {
      // Use raw SQL via postgrest rpc if available, or via service role
      const { error } = await supabase.rpc('exec_sql', { query: sql }).single();
      if (error) {
        // Try direct approach via schema query
        results.push({ sql, ok: false, error: error.message });
      } else {
        results.push({ sql, ok: true });
      }
    } catch (e) {
      results.push({ sql, ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ results });
}
