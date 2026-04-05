import { NextRequest, NextResponse } from 'next/server';
import { isValidSession } from '@/lib/auth';

async function isAuthed(req: NextRequest) {
  return isValidSession(req.cookies.get('admin_auth')?.value);
}

const BASE_URL = 'https://askzev.ai';
const TIMEOUT_MS = 10000;

const PUBLIC_PAGES = ['/', '/services', '/approach', '/work', '/about', '/blog', '/contact', '/discover'];

interface PageResult {
  url: string;
  status: number;
  has_jsonld: boolean;
  jsonld_valid: boolean;
  has_title: boolean;
  has_description: boolean;
  has_og_title: boolean;
  has_og_description: boolean;
  pass: boolean;
  issues: string[];
}

interface InfraCheck {
  status: number;
  pass: boolean;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function extractMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) return m[1];
  }
  return null;
}

function extractOgMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) return m[1];
  }
  return null;
}

async function checkPage(path: string): Promise<PageResult> {
  const url = `${BASE_URL}${path}`;
  const issues: string[] = [];
  let status = 0;
  let has_jsonld = false;
  let jsonld_valid = false;
  let has_title = false;
  let has_description = false;
  let has_og_title = false;
  let has_og_description = false;

  try {
    const res = await fetchWithTimeout(url, TIMEOUT_MS);
    status = res.status;

    if (status !== 200) {
      issues.push(`HTTP ${status}`);
    } else {
      const html = await res.text();

      // JSON-LD check
      const jsonldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (jsonldMatch) {
        has_jsonld = true;
        try {
          JSON.parse(jsonldMatch[1]);
          jsonld_valid = true;
        } catch {
          jsonld_valid = false;
          issues.push('Invalid JSON-LD');
        }
      } else {
        issues.push('No JSON-LD schema');
      }

      // Title
      has_title = /<title>[^<]+<\/title>/i.test(html);
      if (!has_title) issues.push('No <title>');

      // Meta description
      has_description = !!extractMeta(html, 'description');
      if (!has_description) issues.push('No meta description');

      // OG tags
      has_og_title = !!extractOgMeta(html, 'og:title');
      if (!has_og_title) issues.push('No og:title');

      has_og_description = !!extractOgMeta(html, 'og:description');
      if (!has_og_description) issues.push('No og:description');
    }
  } catch (err) {
    status = 0;
    issues.push(err instanceof Error ? err.message : 'Fetch failed');
  }

  const pass = status === 200 && has_title && has_description && has_jsonld && jsonld_valid;

  return { url, status, has_jsonld, jsonld_valid, has_title, has_description, has_og_title, has_og_description, pass, issues };
}

async function checkInfra(path: string): Promise<InfraCheck> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, TIMEOUT_MS);
    return { status: res.status, pass: res.status === 200 };
  } catch {
    return { status: 0, pass: false };
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const run_at = new Date().toISOString();

  // Run all checks in parallel
  const [pageResults, sitemapCheck, robotsCheck] = await Promise.all([
    Promise.all(PUBLIC_PAGES.map(checkPage)),
    checkInfra('/sitemap.xml'),
    checkInfra('/robots.txt'),
  ]);

  const pages_checked = pageResults.length;
  const pages_passed = pageResults.filter(p => p.pass).length;
  const pages_failed = pages_checked - pages_passed;
  const infraPassed = (sitemapCheck.pass ? 1 : 0) + (robotsCheck.pass ? 1 : 0);
  const totalChecks = pages_checked + 2;
  const totalPassed = pages_passed + infraPassed;
  const score = Math.round((totalPassed / totalChecks) * 100);

  const checks: Record<string, PageResult> = {};
  for (const r of pageResults) {
    checks[r.url.replace(BASE_URL, '')] = r;
  }

  const result = {
    score,
    run_at,
    summary: { pages_checked, pages_passed, pages_failed },
    checks,
    infrastructure: {
      sitemap: sitemapCheck,
      robots: robotsCheck,
    },
  };

  // Store in Supabase
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase');
    const supabase = getSupabaseAdmin();
    await supabase.from('seo_audit_results').insert({
      run_at,
      pages_checked,
      pages_passed,
      pages_failed,
      score,
      results: result,
    });
  } catch {
    // Non-fatal — return results even if storage fails
  }

  return NextResponse.json(result);
}
