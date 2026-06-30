// Google OAuth 2.0 implicit flow for browser-only apps (no backend).
// The token comes back in the URL hash — no server-side exchange needed,
// so no client_secret is required.

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function startOAuthFlow(clientId: string): void {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function parseTokenFromUrl(): { accessToken: string; expiresIn: number } | null {
  // Token comes back in the URL hash: #access_token=...&expires_in=...
  const hash = window.location.hash.substring(1);
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const expiresIn = parseInt(params.get('expires_in') ?? '3600', 10);
  if (!accessToken) return null;
  // Remove hash from URL so it's not visible / re-processed
  window.history.replaceState(null, '', window.location.pathname);
  return { accessToken, expiresIn };
}

// Keep this export so App.tsx doesn't need changing — it's a no-op now
export async function parseCodeFromUrl(): Promise<{ accessToken: string; expiresIn: number } | null> {
  return parseTokenFromUrl();
}
