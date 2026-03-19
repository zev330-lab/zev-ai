import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

async function isAuthed() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const source = searchParams.get('source');
  const search = searchParams.get('search');

  const supabase = getSupabaseAdmin();
  let query = supabase.from('knowledge_entries').select('id, title, content, source, source_ref, tags, created_at, updated_at').order('created_at', { ascending: false }).limit(50);

  if (source && source !== 'all') query = query.eq('source', source);
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Sync from discoveries
  if (body._action === 'sync_discoveries') {
    const { data: discoveries } = await supabase
      .from('discoveries')
      .select('id, name, company, research_brief, assessment_doc')
      .eq('pipeline_status', 'complete');

    const { data: existing } = await supabase
      .from('knowledge_entries')
      .select('source_ref')
      .eq('source', 'discovery');

    const existingRefs = new Set((existing || []).map((e) => e.source_ref));
    let synced = 0;

    for (const d of discoveries || []) {
      if (existingRefs.has(d.id)) continue;
      const entries = [];
      if (d.research_brief) {
        entries.push({
          title: `Discovery Research: ${d.company || d.name}`,
          content: typeof d.research_brief === 'string' ? d.research_brief : JSON.stringify(d.research_brief, null, 2),
          source: 'discovery',
          source_ref: d.id,
          tags: ['discovery', 'research', d.company || d.name].filter(Boolean),
        });
      }
      if (d.assessment_doc) {
        entries.push({
          title: `Assessment: ${d.company || d.name}`,
          content: d.assessment_doc,
          source: 'discovery',
          source_ref: d.id,
          tags: ['discovery', 'assessment', d.company || d.name].filter(Boolean),
        });
      }
      if (entries.length > 0) {
        await supabase.from('knowledge_entries').insert(entries);
        synced += entries.length;
      }
    }
    return NextResponse.json({ synced });
  }

  // Sync from blog
  if (body._action === 'sync_blog') {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, title, content, category, tags')
      .eq('status', 'published');

    const { data: existing } = await supabase
      .from('knowledge_entries')
      .select('source_ref')
      .eq('source', 'article');

    const existingRefs = new Set((existing || []).map((e) => e.source_ref));
    let synced = 0;

    for (const p of posts || []) {
      if (existingRefs.has(p.id)) continue;
      await supabase.from('knowledge_entries').insert({
        title: p.title,
        content: p.content,
        source: 'article',
        source_ref: p.id,
        tags: [...(p.tags || []), p.category].filter(Boolean),
      });
      synced++;
    }
    return NextResponse.json({ synced });
  }

  // Create entry
  delete body._action;
  const { data, error } = await supabase.from('knowledge_entries').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  updates.updated_at = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('knowledge_entries').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('knowledge_entries').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
