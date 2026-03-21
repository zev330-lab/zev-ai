const SESSION_PREFIX = 'zev-ai-v1:';

export async function sessionToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${SESSION_PREFIX}${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !cookieValue) return false;
  const expected = await sessionToken(password);
  return cookieValue === expected;
}
