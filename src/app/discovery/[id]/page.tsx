import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';

// This page is public — UUID-based so not guessable
// Server component: fetch discovery, render personalized page
// No auth required (anon-accessible via service role read)

export const dynamic = 'force-dynamic';

interface Discovery {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  business_overview: string | null;
  pain_points: string | null;
  magic_wand: string | null;
  success_vision: string | null;
  ai_experience: string | null;
  ai_tools_detail: string | null;
  free_summary_content: Record<string, string> | null;
  pipeline_status: string;
  created_at: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('discoveries')
    .select('name, company')
    .eq('id', id)
    .single();

  const name = data?.name ?? 'Your';
  const company = data?.company ? ` — ${data.company}` : '';

  return {
    title: `${name}'s AI Summary${company} | Zev Steinmetz`,
    description: 'Your personalized AI opportunity summary from Zev Steinmetz.',
    robots: { index: false, follow: false },
  };
}

export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validate UUID format to prevent SQL injection
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) notFound();

  const supabase = getSupabaseAdmin();
  // Use select('*') so the page works even before migration adds new columns
  const { data: discovery, error } = await supabase
    .from('discoveries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !discovery) notFound();

  const d = discovery as Discovery;
  const firstName = d.name.trim().split(/\s+/)[0];
  const summary = d.free_summary_content;

  // If pipeline isn't complete yet, show waiting state
  const isProcessing = d.pipeline_status !== 'complete';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{PAGE_STYLES}</style>
      </head>
      <body>
        <div className="page-wrap">
          {/* Header */}
          <header className="page-header">
            <div className="header-inner">
              <a href="https://askzev.ai" className="logo-link">
                <span className="logo-text">Zev Steinmetz</span>
                <span className="logo-dot">·</span>
                <span className="logo-sub">askzev.ai</span>
              </a>
            </div>
          </header>

          <main className="main-content">
            {/* Hero */}
            <section className="hero-section">
              <p className="hero-label">Personal Summary</p>
              <h1 className="hero-title">
                {firstName}, here&rsquo;s what I noticed.
              </h1>
              {d.company && (
                <p className="hero-sub">{d.company}{d.role ? ` · ${d.role}` : ''}</p>
              )}
            </section>

            {isProcessing ? (
              <ProcessingState firstName={firstName} />
            ) : summary ? (
              <SummaryContent summary={summary} firstName={firstName} discovery={d} />
            ) : (
              <FallbackContent firstName={firstName} discovery={d} />
            )}
          </main>

          <footer className="page-footer">
            <p className="footer-text">
              Prepared personally by Zev Steinmetz ·{' '}
              <a href="mailto:hello@askzev.ai" className="footer-link">hello@askzev.ai</a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

function ProcessingState({ firstName }: { firstName: string }) {
  return (
    <div className="processing-state">
      <div className="processing-icon">⏳</div>
      <h2 className="processing-title">Still preparing, {firstName}.</h2>
      <p className="processing-body">
        Your summary is being generated. Check back in a few minutes — 
        or watch for an email from hello@askzev.ai.
      </p>
    </div>
  );
}

function SummaryContent({
  summary,
  firstName,
  discovery,
}: {
  summary: Record<string, string>;
  firstName: string;
  discovery: Discovery;
}) {
  return (
    <div className="summary-wrap">
      {/* Section 1: The Mirror */}
      <section className="summary-section">
        <p className="section-label">What I heard</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: summary.mirror || buildMirrorFallback(discovery) }} />
      </section>

      <div className="section-divider" />

      {/* Section 2: The Specific Future */}
      <section className="summary-section">
        <p className="section-label">What could change</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: summary.future || buildFutureFallback(discovery) }} />
      </section>

      <div className="section-divider" />

      {/* Section 3: The Guitar Line */}
      <section className="summary-section">
        <p className="section-label">The honest part</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: summary.guitar_line || GUITAR_LINE_FALLBACK }} />
      </section>

      <div className="section-divider" />

      {/* Section 4: Context */}
      <section className="summary-section">
        <p className="section-label">For context</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: summary.context || CONTEXT_FALLBACK }} />
      </section>

      <div className="section-divider" />

      {/* Section 5: What's Available */}
      <section className="summary-section cta-section">
        <p className="section-label">What&rsquo;s available</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: summary.cta || '' }} />
        <div className="cta-cards">
          <a
            href="https://buy.stripe.com/3cI5kFd4Rb2h87NclQ9R606"
            className="cta-card cta-card-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <p className="cta-card-label">Explore on your own</p>
            <p className="cta-card-title">$499 Insight Report</p>
            <p className="cta-card-desc">
              Exactly what to build, in what order, with honest tradeoffs at each step. 
              Delivered in 48 hours. Credited toward your build.
            </p>
            <span className="cta-card-action">Get the Report →</span>
          </a>
          <a
            href="https://askzev.ai/discover"
            className="cta-card cta-card-secondary"
          >
            <p className="cta-card-label">Talk it through</p>
            <p className="cta-card-title">Strategy Session</p>
            <p className="cta-card-desc">
              A real conversation about your specific situation. 
              No slides. No pitch. Just honest thinking about what to do next.
            </p>
            <span className="cta-card-action">Schedule a Call →</span>
          </a>
        </div>
        <p className="cta-note">
          Questions? Reply to the email or reach out at{' '}
          <a href="mailto:hello@askzev.ai" className="cta-note-link">hello@askzev.ai</a>
        </p>
      </section>
    </div>
  );
}

function FallbackContent({
  firstName,
  discovery,
}: {
  firstName: string;
  discovery: Discovery;
}) {
  return (
    <div className="summary-wrap">
      <section className="summary-section">
        <p className="section-label">What I heard</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: buildMirrorFallback(discovery) }} />
      </section>

      <div className="section-divider" />

      <section className="summary-section">
        <p className="section-label">What could change</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: buildFutureFallback(discovery) }} />
      </section>

      <div className="section-divider" />

      <section className="summary-section">
        <p className="section-label">The honest part</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: GUITAR_LINE_FALLBACK }} />
      </section>

      <div className="section-divider" />

      <section className="summary-section">
        <p className="section-label">For context</p>
        <div className="section-body" dangerouslySetInnerHTML={{ __html: CONTEXT_FALLBACK }} />
      </section>

      <div className="section-divider" />

      <section className="summary-section cta-section">
        <p className="section-label">What&rsquo;s available</p>
        <div className="cta-cards">
          <a
            href="https://buy.stripe.com/3cI5kFd4Rb2h87NclQ9R606"
            className="cta-card cta-card-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <p className="cta-card-label">Explore on your own</p>
            <p className="cta-card-title">$499 Insight Report</p>
            <p className="cta-card-desc">
              Exactly what to build, in what order, with honest tradeoffs at each step. 
              Delivered in 48 hours. Credited toward your build.
            </p>
            <span className="cta-card-action">Get the Report →</span>
          </a>
          <a
            href="https://askzev.ai/discover"
            className="cta-card cta-card-secondary"
          >
            <p className="cta-card-label">Talk it through</p>
            <p className="cta-card-title">Strategy Session</p>
            <p className="cta-card-desc">
              A real conversation about your specific situation.
            </p>
            <span className="cta-card-action">Schedule a Call →</span>
          </a>
        </div>
        <p className="cta-note">
          Questions?{' '}
          <a href="mailto:hello@askzev.ai" className="cta-note-link">hello@askzev.ai</a>
        </p>
      </section>
    </div>
  );
}

// --- Fallback builders (used when summary column is null) ---

function buildMirrorFallback(d: Discovery): string {
  const company = d.company ? `at ${d.company}` : '';
  const pain = d.pain_points ? `It sounds like the thing eating at you most is: <em>${d.pain_points.substring(0, 150)}${d.pain_points.length > 150 ? '...' : ''}</em>` : '';
  const business = d.business_overview ? `It looks like you&rsquo;re running ${d.business_overview.substring(0, 120)}${d.business_overview.length > 120 ? '...' : ''}` : '';
  return `<p>${business}${company ? ` ${company}` : ''}.</p>${pain ? `<p>${pain}</p>` : ''}`;
}

function buildFutureFallback(d: Discovery): string {
  const wand = d.magic_wand;
  const vision = d.success_vision;
  if (!wand && !vision) {
    return '<p>Based on what you shared, there are specific places where the right AI setup would remove friction from your day — not in theory, but in the actual tasks that slow you down.</p>';
  }
  const parts = [];
  if (wand) parts.push(`<p>You said if you could fix one thing, it would be: <em>&ldquo;${wand.substring(0, 200)}${wand.length > 200 ? '...' : ''}&rdquo;</em> — that&rsquo;s exactly the kind of thing that&rsquo;s solvable.</p>`);
  if (vision) parts.push(`<p>And your version of success in 12 months: <em>&ldquo;${vision.substring(0, 200)}${vision.length > 200 ? '...' : ''}&rdquo;</em> — I have specific thoughts on how AI gets you there.</p>`);
  return parts.join('\n');
}

const GUITAR_LINE_FALLBACK = `
<p>You&rsquo;ve probably already tried a few AI tools. Got something decent out of it, then hit a wall. That&rsquo;s not a tool problem — it&rsquo;s a musician problem.</p>
<p>Having the tools isn&rsquo;t the same as knowing how to use them for your specific situation. ChatGPT can do extraordinary things. Getting it to do extraordinary things for <em>your</em> business is a completely different skill.</p>
`;

const CONTEXT_FALLBACK = `
<p>I&rsquo;ve spent the last 18 months building production AI systems — not demos, not proof-of-concepts. Real deployments for real businesses. Steinmetz Real Estate runs on this same framework: automated transaction management, lead qualification, and market analysis that runs 24/7 without anyone touching it.</p>
<p>That&rsquo;s the difference between someone who knows how to use the tools and someone who knows how to make them work for a specific business.</p>
`;

// --- CSS (inlined for standalone page that works without Next.js CSS pipeline) ---

const PAGE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0a0e1a;
    --navy-light: #111827;
    --periwinkle: #7c9bf5;
    --periwinkle-hover: #96aff8;
    --lavender: #c4b5e0;
    --foreground: #d0d0da;
    --foreground-strong: #f0f0f5;
    --muted: #6b7280;
    --border: rgba(255,255,255,0.08);
    --section-bg: rgba(255,255,255,0.03);
  }

  html, body {
    background: var(--navy);
    color: var(--foreground);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  a { color: inherit; text-decoration: none; }

  .page-wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .page-header {
    border-bottom: 1px solid var(--border);
    padding: 20px 24px;
    position: sticky;
    top: 0;
    background: rgba(10, 14, 26, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 10;
  }
  .header-inner {
    max-width: 680px;
    margin: 0 auto;
    display: flex;
    align-items: center;
  }
  .logo-link { display: flex; align-items: center; gap: 8px; }
  .logo-text {
    font-size: 15px;
    font-weight: 600;
    color: var(--foreground-strong);
    letter-spacing: -0.01em;
  }
  .logo-dot { color: var(--muted); font-size: 14px; }
  .logo-sub { color: var(--periwinkle); font-size: 13px; }

  /* Main */
  .main-content {
    flex: 1;
    max-width: 680px;
    margin: 0 auto;
    padding: 64px 24px 80px;
    width: 100%;
  }

  /* Hero */
  .hero-section { margin-bottom: 56px; }
  .hero-label {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--periwinkle);
    font-weight: 600;
    margin-bottom: 16px;
  }
  .hero-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700;
    color: var(--foreground-strong);
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 12px;
  }
  .hero-sub {
    font-size: 14px;
    color: var(--muted);
    letter-spacing: 0.02em;
  }

  /* Processing state */
  .processing-state {
    text-align: center;
    padding: 80px 0;
  }
  .processing-icon { font-size: 40px; margin-bottom: 24px; }
  .processing-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--foreground-strong);
    margin-bottom: 12px;
  }
  .processing-body {
    font-size: 16px;
    color: var(--foreground);
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.7;
  }

  /* Summary sections */
  .summary-wrap { display: flex; flex-direction: column; gap: 0; }

  .summary-section {
    padding: 40px 0;
  }

  .section-label {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--periwinkle);
    font-weight: 600;
    margin-bottom: 20px;
  }

  .section-body {
    font-size: 17px;
    line-height: 1.75;
    color: var(--foreground);
  }

  .section-body p {
    margin-bottom: 16px;
  }

  .section-body p:last-child { margin-bottom: 0; }

  .section-body em {
    color: var(--foreground-strong);
    font-style: italic;
  }

  .section-body strong { color: var(--foreground-strong); font-weight: 600; }

  .section-divider {
    height: 1px;
    background: var(--border);
    margin: 0;
  }

  /* CTA section */
  .cta-section { padding-bottom: 0; }

  .cta-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 8px;
    margin-bottom: 24px;
  }

  @media (max-width: 560px) {
    .cta-cards { grid-template-columns: 1fr; }
  }

  .cta-card {
    display: flex;
    flex-direction: column;
    padding: 24px;
    border-radius: 16px;
    border: 1px solid var(--border);
    transition: border-color 0.2s, transform 0.2s;
    cursor: pointer;
    text-decoration: none;
  }

  .cta-card:hover {
    border-color: var(--periwinkle);
    transform: translateY(-2px);
  }

  .cta-card-primary {
    background: rgba(124, 155, 245, 0.08);
  }

  .cta-card-secondary {
    background: var(--section-bg);
  }

  .cta-card-label {
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 600;
    margin-bottom: 6px;
  }

  .cta-card-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--foreground-strong);
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .cta-card-desc {
    font-size: 14px;
    line-height: 1.65;
    color: var(--foreground);
    flex: 1;
    margin-bottom: 20px;
  }

  .cta-card-action {
    font-size: 14px;
    font-weight: 600;
    color: var(--periwinkle);
    margin-top: auto;
  }

  .cta-card-primary .cta-card-action { color: var(--periwinkle-hover); }

  .cta-note {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.6;
  }

  .cta-note-link {
    color: var(--periwinkle);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* Footer */
  .page-footer {
    border-top: 1px solid var(--border);
    padding: 24px;
    text-align: center;
  }

  .footer-text {
    font-size: 13px;
    color: var(--muted);
  }

  .footer-link {
    color: var(--periwinkle);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* Mobile */
  @media (max-width: 640px) {
    .main-content { padding: 48px 20px 64px; }
    .page-header { padding: 16px 20px; }
    .summary-section { padding: 32px 0; }
    .section-body { font-size: 16px; }
  }
`;
