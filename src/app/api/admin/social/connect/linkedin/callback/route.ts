import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('linkedin_oauth_state')?.value;

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/content?error=linkedin_denied`);
  }

  if (state !== storedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/content?error=linkedin_state_mismatch`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/social/connect/linkedin/callback`;

  // Exchange code for token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/content?error=linkedin_token_failed`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in;

  // Get LinkedIn user profile (person URN)
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();
  const userId = profile.sub; // LinkedIn person ID
  const handle = profile.name || profile.email;

  // Store in Supabase
  const supabase = getSupabaseAdmin();
  await supabase
    .from('social_accounts')
    .update({
      access_token: accessToken,
      user_id: userId,
      handle: handle,
      profile_url: `https://www.linkedin.com/in/${profile.vanityName || userId}`,
      is_active: true,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    })
    .eq('platform', 'linkedin');

  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/content?connected=linkedin`);
  response.cookies.delete('linkedin_oauth_state');
  return response;
}
