import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

async function isAuthed() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  const auth = cookieStore.get('admin_auth')?.value;
  return auth === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const supabase = getSupabaseAdmin();
  let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Generate slug from title or use auto-generated
  const slug = body.slug || `post-${Date.now()}`;

  const { data, error } = await supabase.from('blog_posts').insert({
    slug,
    title: body.title || '',
    status: body.status || 'draft',
    category: body.category || '',
    ...body,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // If publishing, set published_at and generate schema_data
  if (updates.status === 'published') {
    updates.published_at = updates.published_at || new Date().toISOString();
    updates.updated_at = new Date().toISOString();

    // Fetch the full post to generate schema
    const { data: post } = await supabase.from('blog_posts').select('*').eq('id', id).single();
    if (post) {
      updates.schema_data = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: updates.seo_description || post.seo_description || post.excerpt,
        author: {
          '@type': 'Person',
          name: post.author || 'Zev Steinmetz',
          url: 'https://zev.ai/about',
        },
        publisher: {
          '@type': 'Organization',
          name: 'zev.ai',
          url: 'https://zev.ai',
        },
        datePublished: updates.published_at,
        dateModified: updates.updated_at,
        mainEntityOfPage: `https://zev.ai/blog/${post.slug}`,
        articleSection: post.category,
        keywords: (post.tags || []).join(', '),
        wordCount: (post.content || '').split(/\s+/).length,
        timeRequired: `PT${post.reading_time_min || 5}M`,
      };

      // Move social_posts to social_queue
      if (post.social_posts && Array.isArray(post.social_posts)) {
        const socialInserts = post.social_posts.map((sp: { platform: string; content: string }) => ({
          blog_post_id: id,
          platform: sp.platform,
          content: sp.content,
          status: 'draft',
        }));
        if (socialInserts.length > 0) {
          await supabase.from('social_queue').insert(socialInserts);
        }
      }
    }
  }

  const { error } = await supabase.from('blog_posts').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Revalidate blog pages on publish
  if (updates.status === 'published') {
    revalidatePath('/blog');
    const { data: post } = await supabase.from('blog_posts').select('slug').eq('id', id).single();
    if (post?.slug) {
      revalidatePath(`/blog/${post.slug}`);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/blog');
  return NextResponse.json({ success: true });
}
