import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import { ReportView } from './report-view';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Validate UUID format
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) {
    return { title: 'Not Found' };
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('discoveries')
    .select('name, company, report_data')
    .eq('id', id)
    .single();

  if (!data) {
    return { title: 'Not Found' };
  }

  // If report_data exists, use the full report metadata
  if (data.report_data) {
    const report = (data.report_data as Record<string, unknown>).report as Record<string, unknown> | undefined;
    const company = data.company || data.name;
    const summary = (report?.executive_summary as string) || '';

    return {
      title: `AI Insight Report — ${company}`,
      description: summary.slice(0, 160),
      robots: { index: false, follow: false },
      openGraph: {
        title: `AI Insight Report for ${company}`,
        description: summary.slice(0, 160),
        type: 'article',
        images: [{
          url: `https://askzev.ai/api/og/social?text=${encodeURIComponent(`AI Insight Report: ${company}`)}&pillar=zev.ai&format=landscape&style=blog`,
          width: 1200,
          height: 630,
        }],
      },
    };
  }

  // Fallback for processing/pending state
  const name = data.name ?? 'Your';
  const company = data.company ? ` — ${data.company}` : '';
  return {
    title: `${name}'s AI Summary${company} | Zev Steinmetz`,
    description: 'Your personalized AI opportunity summary from Zev Steinmetz.',
    robots: { index: false, follow: false },
  };
}

export default async function DiscoveryReportPage({ params }: Props) {
  const { id } = await params;

  // Validate UUID format
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) notFound();

  const supabase = getSupabaseAdmin();

  const { data: discovery } = await supabase
    .from('discoveries')
    .select('id, name, company, role, report_data, quality_gate_score, delivered_at, pipeline_track, pipeline_status, created_at')
    .eq('id', id)
    .single();

  if (!discovery) notFound();

  // If report is ready, render full report and track view
  if (discovery.report_data) {
    // Track view for engagement signals (Path 21)
    try {
      await supabase.from('tola_agent_log').insert({
        agent_id: 'gateway',
        action: 'report-view',
        geometry_pattern: 'flower_of_life',
        input: { discovery_id: id },
        output: { viewed_at: new Date().toISOString() },
      });
    } catch {
      // Non-critical, don't block render
    }

    return <ReportView discovery={discovery} />;
  }

  // Processing state — pipeline hasn't completed yet
  const firstName = (discovery.name || 'there').trim().split(/\s+/)[0];
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0e1a',
      color: '#d0d0da',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '24px' }}>&#9203;</div>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#f0f0f5', marginBottom: '12px' }}>
        Still preparing, {firstName}.
      </h2>
      <p style={{ fontSize: '16px', color: '#d0d0da', maxWidth: '400px', lineHeight: 1.7 }}>
        Your report is being generated. Check back in a few minutes —
        or watch for an email from hello@askzev.ai.
      </p>
    </div>
  );
}
