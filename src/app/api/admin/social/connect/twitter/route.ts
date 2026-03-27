import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidSession } from '@/lib/auth';

function base64URLEncode(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidSession(cookieStore.get('admin_auth')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'TWITTER_CLIENT_ID not configured' }, { status: 500 });
  }

  // PKCE challenge
  const codeVerifier = base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = base64URLEncode(new Uint8Array(digest));

  const state = crypto.randomUUID();
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/social/connect/twitter/callback`;
  const scope = 'tweet.read tweet.write users.read offline.access';

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('twitter_oauth_state', state, { httpOnly: true, maxAge: 600 });
  response.cookies.set('twitter_code_verifier', codeVerifier, { httpOnly: true, maxAge: 600 });
  return response;
}
