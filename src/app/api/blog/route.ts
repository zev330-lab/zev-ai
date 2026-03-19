import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/blog — public: list published blog posts
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, tags, reading_time_min, published_at, author')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    // Table may not exist yet — return empty array
    return NextResponse.json([]);
  }

  return NextResponse.json(data || []);
}
