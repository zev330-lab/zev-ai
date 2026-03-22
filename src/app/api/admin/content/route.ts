import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { isValidSession } from '@/lib/auth';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
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
          url: 'https://askzev.ai/about',
        },
        publisher: {
          '@type': 'Organization',
          name: 'zev.ai',
          url: 'https://askzev.ai',
        },
        datePublished: updates.published_at,
        dateModified: updates.updated_at,
        mainEntityOfPage: `https://askzev.ai/blog/${post.slug}`,
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

  // On publish: revalidate pages + auto-create knowledge entry
  if (updates.status === 'published') {
    revalidatePath('/blog');
    const { data: pubPost } = await supabase.from('blog_posts').select('slug, title, content, category, tags').eq('id', id).single();
    if (pubPost?.slug) {
      revalidatePath(`/blog/${pubPost.slug}`);
    }
    // Auto-create knowledge entry if not already synced
    if (pubPost) {
      const { data: existing } = await supabase.from('knowledge_entries').select('id').eq('source', 'article').eq('source_ref', id).single();
      if (!existing) {
        await supabase.from('knowledge_entries').insert({
          title: pubPost.title,
          content: pubPost.content,
          source: 'article',
          source_ref: id,
          tags: [...(pubPost.tags || []), pubPost.category].filter(Boolean),
        });
      }
    }

    // Internal linking: scan other published posts for keyword overlap
    if (pubPost?.content && pubPost?.title) {
      try {
        const { data: otherPosts } = await supabase
          .from('blog_posts')
          .select('id, slug, title, content')
          .eq('status', 'published')
          .neq('id', id)
          .limit(50);

        if (otherPosts && otherPosts.length > 0) {
          // Extract key phrases from new post title (words 4+ chars)
          const keywords = pubPost.title.toLowerCase()
            .split(/\s+/)
            .filter((w: string) => w.length >= 4 && !['with', 'your', 'from', 'that', 'this', 'what', 'when', 'should', 'about'].includes(w));

          let linksAdded = 0;
          for (const other of otherPosts) {
            if (!other.content) continue;
            // Check if other post mentions keywords but doesn't already link to new post
            const hasKeyword = keywords.some((kw: string) => other.content.toLowerCase().includes(kw));
            const alreadyLinked = other.content.includes(`/blog/${pubPost.slug}`);

            if (hasKeyword && !alreadyLinked) {
              // Find first occurrence of a keyword and add link as a related post note at the bottom
              const relatedSection = `\n\n> **Related:** [${pubPost.title}](/blog/${pubPost.slug})`;
              if (!other.content.includes('**Related:**')) {
                await supabase.from('blog_posts').update({
                  content: other.content + relatedSection,
                }).eq('id', other.id);
                linksAdded++;
                if (other.slug) revalidatePath(`/blog/${other.slug}`);
              }
            }
          }

          if (linksAdded > 0) {
            await supabase.from('tola_agent_log').insert({
              agent_id: 'gateway',
              action: 'internal-links-added',
              output: { post_slug: pubPost.slug, links_added: linksAdded },
            });
          }
        }
      } catch {
        // Silent fail — internal linking is non-critical
      }
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
