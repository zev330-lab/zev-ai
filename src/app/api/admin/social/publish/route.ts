import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';
import { publishToPlatform } from '@/lib/social-platforms';
import type { SocialCredentials, PostPayload } from '@/lib/social-platforms';

async function isAuthed(req: NextRequest) {
  // Accept admin cookie OR service role key (for Edge Function calls)
  const serviceKey = req.headers.get('authorization')?.replace('Bearer ', '');
  if (serviceKey && serviceKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return true;
  }
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

// POST /api/admin/social/publish — publish approved posts to platforms
export async function POST(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No post IDs provided' }, { status: 400 });
  }

  if (ids.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 posts per publish batch' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check cost level for image generation
  const { data: configRow } = await supabase
    .from('tola_config')
    .select('value')
    .eq('key', 'image_generation')
    .single();
  const imageEnabled = configRow?.value !== false && configRow?.value !== 'false';

  // Get posts to publish
  const { data: posts, error: postsError } = await supabase
    .from('social_queue')
    .select('*')
    .in('id', ids)
    .in('status', ['approved', 'scheduled']);

  if (postsError || !posts || posts.length === 0) {
    return NextResponse.json({ error: 'No approved posts found' }, { status: 404 });
  }

  // Get platform credentials
  const platforms = [...new Set(posts.map((p) => p.platform))];
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('platform, access_token, user_id, api_config, is_active')
    .in('platform', platforms);

  const credsByPlatform: Record<string, SocialCredentials> = {};
  for (const acc of accounts || []) {
    if (acc.access_token && acc.is_active) {
      credsByPlatform[acc.platform] = {
        platform: acc.platform,
        access_token: acc.access_token,
        user_id: acc.user_id || undefined,
        api_config: acc.api_config || {},
      };
    }
  }

  const results: { id: string; platform: string; success: boolean; postUrl?: string; error?: string }[] = [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zev-ai-swart.vercel.app';

  for (const post of posts) {
    const creds = credsByPlatform[post.platform];
    if (!creds) {
      // Mark as failed — no credentials
      await supabase
        .from('social_queue')
        .update({ publish_error: `No credentials configured for ${post.platform}`, status: 'approved' })
        .eq('id', post.id);
      results.push({ id: post.id, platform: post.platform, success: false, error: 'No credentials' });
      continue;
    }

    // Mark as publishing
    await supabase.from('social_queue').update({ status: 'posted', publish_error: null }).eq('id', post.id);

    // Generate image URL if enabled
    let imageUrl: string | undefined;
    if (imageEnabled) {
      const textPreview = (post.content || '').slice(0, 120);
      const format =
        post.platform === 'instagram'
          ? 'square'
          : post.platform === 'tiktok'
            ? 'portrait'
            : 'landscape';
      imageUrl = `${siteUrl}/api/og/social?text=${encodeURIComponent(textPreview)}&pillar=${encodeURIComponent(post.content_pillar || '')}&format=${format}`;
    }

    const payload: PostPayload = {
      content: post.content,
      imageUrl,
      title: post.blog_posts?.title || 'zev.ai',
    };

    const result = await publishToPlatform(post.platform, creds, payload);

    // Update post with result
    const updateData: Record<string, unknown> = {
      status: result.success ? 'posted' : 'approved',
      published_at: result.success ? new Date().toISOString() : null,
      published_url: result.postUrl || null,
      platform_post_id: result.postId || null,
      publish_error: result.error || null,
      image_url: imageUrl || null,
    };

    await supabase.from('social_queue').update(updateData).eq('id', post.id);

    results.push({
      id: post.id,
      platform: post.platform,
      success: result.success,
      postUrl: result.postUrl,
      error: result.error,
    });
  }

  const successCount = results.filter((r) => r.success).length;
  return NextResponse.json({ results, published: successCount, total: results.length });
}
