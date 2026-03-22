import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, content, published_at, author, category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  const items = (posts || []).map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://zev.ai/blog/${post.slug}</link>
      <guid isPermaLink="true">https://zev.ai/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      <author>hello@zev.ai (${post.author || 'Zev Steinmetz'})</author>
      <category>${post.category}</category>
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>zev.ai Blog</title>
    <link>https://zev.ai/blog</link>
    <description>Practical insights on AI implementation, multi-agent systems, and turning AI investment into measurable business outcomes.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://zev.ai/blog/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
