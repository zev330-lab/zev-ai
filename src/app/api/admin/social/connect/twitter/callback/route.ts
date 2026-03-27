import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('twitter_oauth_state')?.value;
  const codeVerifier = cookieStore.get('twitter_code_verifier')?.value;

  if (error || !code || !codeVerifier) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/content?error=twitter_denied`);
  }

  if (state !== storedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/content?error=twitter_state_mismatch`);
  }

  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/social/connect/twitter/callback`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/content?error=twitter_token_failed`);
  }

  const tokenData = await tokenRes.json();

  // Get Twitter user info
  const userRes = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  const userId = userData.data?.id;
  const handle = userData.data?.username;

  const supabase = getSupabaseAdmin();
  await supabase
    .from('social_accounts')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      user_id: userId,
      handle: `@${handle}`,
      profile_url: `https://x.com/${handle}`,
      is_active: true,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
    })
    .eq('platform', 'twitter');

  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/content?connected=twitter`);
  response.cookies.delete('twitter_oauth_state');
  response.cookies.delete('twitter_code_verifier');
  return response;
}
