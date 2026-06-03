/**
 * Optional Authorization: Bearer from Google ID token (after google_oauth_exchange).
 */
export function getOAuthIdToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('oauthIdToken');
}

export function authHeaders(): Record<string, string> {
  const t = getOAuthIdToken();
  if (t) return { Authorization: `Bearer ${t}` };
  return {};
}
