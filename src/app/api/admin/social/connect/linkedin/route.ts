import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidSession(cookieStore.get('admin_auth')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/social/connect/linkedin/callback`;
  const scope = 'openid profile email w_member_social';
  const state = crypto.randomUUID();

  // Store state in cookie for CSRF protection
  const response = NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`
  );
  response.cookies.set('linkedin_oauth_state', state, { httpOnly: true, maxAge: 600 });
  return response;
}
