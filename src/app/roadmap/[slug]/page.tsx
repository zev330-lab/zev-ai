import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { RoadmapContent } from './roadmap-content';

// Force dynamic rendering — unique slug per user
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Your AI Implementation Roadmap',
    description: 'A personalized AI implementation roadmap prepared by Zev.AI',
    robots: { index: false, follow: false },
  };
}

export default async function RoadmapPage({ params }: Props) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch roadmap by slug
  const { data: roadmap, error } = await supabase
    .from('roadmaps')
    .select('id, slug, content_json, created_at, lead_id')
    .eq('slug', slug)
    .single();

  if (error || !roadmap) {
    notFound();
  }

  // Fetch lead info for the header
  const { data: lead } = await supabase
    .from('funnel_leads')
    .select('name, company, email')
    .eq('id', roadmap.lead_id)
    .single();

  // Track view (fire-and-forget — don't block render)
  supabase
    .from('roadmaps')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', roadmap.id)
    .then(() => {});

  return (
    <RoadmapContent
      content={roadmap.content_json}
      name={lead?.name || 'Friend'}
      company={lead?.company || null}
      createdAt={roadmap.created_at}
      slug={roadmap.slug}
    />
  );
}
