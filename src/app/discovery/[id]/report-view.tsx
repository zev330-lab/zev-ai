'use client';

import Link from 'next/link';

interface Opportunity {
  title: string;
  description: string;
  expected_impact: string;
  honest_assessment: string;
  what_i_would_do: string;
}

interface DecisionFork {
  question: string;
  options: string[];
  my_recommendation: string;
  why: string;
}

interface Report {
  executive_summary: string;
  key_findings: string[];
  opportunities: Opportunity[];
  decision_forks: DecisionFork[];
  next_steps: string;
  fit_for_zev_ai: string;
}

interface Discovery {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  report_data: {
    report: Report;
    synthesis_confidence: string;
    delivery_ready: boolean;
  };
  quality_gate_score: number | null;
  delivered_at: string | null;
  pipeline_track: string;
  created_at: string;
}

export function ReportView({ discovery }: { discovery: Discovery }) {
  const report = discovery.report_data.report;
  const company = discovery.company || discovery.name;

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold" style={{ color: '#7c9bf5' }}>
            zev.ai
          </Link>
          <span className="text-sm" style={{ color: '#888' }}>
            AI Insight Report
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="mb-12">
          <p className="text-sm font-medium mb-3" style={{ color: '#7c9bf5' }}>
            Prepared for {company}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-source-serif)', color: '#f0f0f5' }}>
            AI Insight Report
          </h1>
          <p className="text-lg" style={{ color: '#888' }}>
            {discovery.name}{discovery.role ? ` — ${discovery.role}` : ''}
            {discovery.delivered_at && (
              <span className="ml-3">
                {new Date(discovery.delivered_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
          </p>
        </div>

        {/* Executive Summary */}
        <section className="mb-12 p-8 rounded-xl" style={{ background: 'rgba(124, 155, 245, 0.08)', borderLeft: '4px solid #7c9bf5' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#7c9bf5' }}>
            Executive Summary
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: '#d0d0da' }}>
            {report.executive_summary}
          </p>
        </section>

        {/* Key Findings */}
        {report.key_findings?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-source-serif)', color: '#f0f0f5' }}>
              Key Findings
            </h2>
            <div className="space-y-4">
              {report.key_findings.map((finding, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#7c9bf5', color: '#0a0e1a' }}>
                    {i + 1}
                  </span>
                  <p className="pt-1" style={{ color: '#d0d0da' }}>{finding}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Opportunities */}
        {report.opportunities?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-source-serif)', color: '#f0f0f5' }}>
              Opportunities
            </h2>
            <div className="space-y-6">
              {report.opportunities.map((opp, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3" style={{ color: '#f0f0f5' }}>
                      {opp.title}
                    </h3>
                    <p className="mb-4" style={{ color: '#d0d0da' }}>{opp.description}</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg" style={{ background: 'rgba(124, 155, 245, 0.06)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7c9bf5' }}>
                          Expected Impact
                        </p>
                        <p className="text-sm" style={{ color: '#d0d0da' }}>{opp.expected_impact}</p>
                      </div>
                      <div className="p-4 rounded-lg" style={{ background: 'rgba(196, 181, 224, 0.06)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#c4b5e0' }}>
                          Honest Assessment
                        </p>
                        <p className="text-sm" style={{ color: '#d0d0da' }}>{opp.honest_assessment}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(100, 200, 150, 0.06)', borderLeft: '3px solid rgba(100, 200, 150, 0.4)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgb(100, 200, 150)' }}>
                        What I Would Do
                      </p>
                      <p className="text-sm" style={{ color: '#d0d0da' }}>{opp.what_i_would_do}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Decision Forks */}
        {report.decision_forks?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-source-serif)', color: '#f0f0f5' }}>
              Decision Points
            </h2>
            <div className="space-y-6">
              {report.decision_forks.map((fork, i) => (
                <div key={i} className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#f0f0f5' }}>
                    {fork.question}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    {fork.options.map((option, j) => (
                      <div key={j} className="p-3 rounded-lg text-sm" style={{ background: 'rgba(124, 155, 245, 0.06)', color: '#d0d0da' }}>
                        <span className="font-semibold" style={{ color: '#7c9bf5' }}>Option {String.fromCharCode(65 + j)}:</span>{' '}
                        {option}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg" style={{ background: 'rgba(124, 155, 245, 0.1)', borderLeft: '3px solid #7c9bf5' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#7c9bf5' }}>My Recommendation</p>
                    <p className="text-sm" style={{ color: '#d0d0da' }}>{fork.my_recommendation}</p>
                    {fork.why && (
                      <p className="text-sm mt-2" style={{ color: '#888' }}>
                        <em>{fork.why}</em>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Next Steps */}
        {report.next_steps && (
          <section className="mb-12 p-8 rounded-xl" style={{ background: 'rgba(100, 200, 150, 0.06)', border: '1px solid rgba(100, 200, 150, 0.15)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-source-serif)', color: '#f0f0f5' }}>
              Next Steps
            </h2>
            <div className="whitespace-pre-line" style={{ color: '#d0d0da' }}>
              {report.next_steps}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-source-serif)', color: '#f0f0f5' }}>
            Ready to Move Forward?
          </h2>
          <p className="mb-6" style={{ color: '#888' }}>
            {"Let's discuss these findings and build a plan tailored to your business."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discover"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-center transition-colors"
              style={{ background: '#7c9bf5', color: '#0a0e1a' }}
            >
              Start a Deeper Discovery
            </Link>
            <Link
              href="/contact"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-center transition-colors"
              style={{ border: '1px solid #7c9bf5', color: '#7c9bf5' }}
            >
              Get in Touch
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center">
        <p className="text-sm" style={{ color: '#555' }}>
          This report was prepared by{' '}
          <Link href="/" style={{ color: '#7c9bf5' }}>zev.ai</Link>
          {' '}using multi-agent AI research and analysis.
        </p>
      </footer>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Report',
            name: `AI Insight Report — ${company}`,
            description: report.executive_summary,
            author: {
              '@type': 'Person',
              name: 'Zev Steinmetz',
              url: 'https://askzev.ai/about',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Zev.AI',
              url: 'https://askzev.ai',
            },
            dateCreated: discovery.created_at,
            datePublished: discovery.delivered_at,
            about: {
              '@type': 'Organization',
              name: company,
            },
          }),
        }}
      />
    </div>
  );
}
