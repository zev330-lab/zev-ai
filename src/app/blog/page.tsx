import type { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase';
import { BlogList } from '@/components/blog-list';

export const metadata: Metadata = {
  title: 'Blog — AI Implementation Insights',
  description: 'Practical strategies for deploying AI systems that drive real business outcomes. No hype, no theory — just what works.',
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  reading_time_min: number;
  published_at: string;
  author: string;
}

async function getPosts(): Promise<BlogPost[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, tags, reading_time_min, published_at, author')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (data as BlogPost[]) || [];
}

export const revalidate = 300; // revalidate every 5 min

export default async function BlogPage() {
  const posts = await getPosts();
  return <BlogList posts={posts} />;
}
