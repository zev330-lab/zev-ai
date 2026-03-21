import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

const VALID_KEYS = [
  'cost_level',
  'auto_publish',
  'image_generation',
  'posting_frequency',
  'heygen_enabled',
  'heygen_api_key',
  'heygen_avatar_id',
  'seo_mode',
];

// GET /api/admin/settings — read all config
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('tola_config').select('key, value, updated_at');

  if (error) {
    // Table might not exist yet
    return NextResponse.json({});
  }

  const config: Record<string, unknown> = {};
  for (const row of data || []) {
    // Strip wrapper quotes from JSON strings
    config[row.key] = row.value;
  }

  return NextResponse.json(config);
}

// PATCH /api/admin/settings — update config keys
export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const updates: { key: string; value: unknown }[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (!VALID_KEYS.includes(key)) continue;
    updates.push({ key, value: JSON.stringify(value) });
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid keys to update' }, { status: 400 });
  }

  for (const { key, value } of updates) {
    await supabase
      .from('tola_config')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }

  return NextResponse.json({ success: true, updated: updates.length });
}
