/**
 * Google OAuth (PKCE). OAuth client id is loaded from your login Lambda (`google_oauth_config`);
 * only GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET live in Lambda env — not in Vite.
 */

const GOOGLE_PKCE_VERIFIER_KEY = 'google_pkce_verifier';
const GOOGLE_OAUTH_STATE_KEY = 'google_oauth_state';
const CACHED_CLIENT_ID_KEY = 'google_oauth_client_id_cache';

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr.buffer);
}

async function sha256Base64Url(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

export function getGoogleRedirectUri(): string {
  return (
    import.meta.env.VITE_GOOGLE_REDIRECT_URI?.trim() ||
    `${typeof window !== 'undefined' ? window.location.origin : ''}/auth`
  );
}

/** Load Google Web client id from login Lambda (same place as client secret). */
export async function fetchGoogleOAuthConfig(
  loginApiUrl: string
): Promise<{ googleEnabled: boolean; clientId?: string }> {
  const res = await fetch(loginApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'google_oauth_config' }),
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { googleEnabled?: boolean; clientId?: string };
  };
  if (!json.success || !json.data) {
    return { googleEnabled: false };
  }
  const { googleEnabled, clientId } = json.data;
  if (googleEnabled && clientId) {
    try {
      sessionStorage.setItem(CACHED_CLIENT_ID_KEY, clientId);
    } catch {
      /* ignore */
    }
  }
  return { googleEnabled: Boolean(googleEnabled), clientId };
}

function getCachedClientId(): string | null {
  try {
    return sessionStorage.getItem(CACHED_CLIENT_ID_KEY);
  } catch {
    return null;
  }
}

/** Start Google sign-in; client id is read from Lambda (cached after fetchGoogleOAuthConfig). */
export async function startGoogleDirectSignIn(loginApiUrl: string): Promise<void> {
  let clientId: string | null = getCachedClientId();
  if (!clientId) {
    const cfg = await fetchGoogleOAuthConfig(loginApiUrl);
    clientId = cfg.clientId ?? null;
  }
  if (!clientId) {
    throw new Error('Google sign-in is not enabled on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the login Lambda.');
  }

  const verifier = randomVerifier();
  const challenge = await sha256Base64Url(verifier);
  const state = randomVerifier();

  sessionStorage.setItem(GOOGLE_PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);

  const redirectUri = getGoogleRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export function readOAuthCallbackParams(): {
  code: string | null;
  state: string | null;
  error: string | null;
  errorDescription: string | null;
} {
  const search = new URLSearchParams(window.location.search);
  return {
    code: search.get('code'),
    state: search.get('state'),
    error: search.get('error'),
    errorDescription: search.get('error_description'),
  };
}

export function clearOAuthParamsFromUrl(): void {
  const url = new URL(window.location.href);
  if (!url.search) return;
  url.search = '';
  window.history.replaceState({}, '', url.pathname + url.hash);
}

export function validateGoogleOAuthState(returnedState: string | null): boolean {
  const expected = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
  if (!expected || !returnedState || expected !== returnedState) {
    return false;
  }
  sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
  return true;
}

export function takeGooglePkceVerifier(): string | null {
  const v = sessionStorage.getItem(GOOGLE_PKCE_VERIFIER_KEY);
  if (v) sessionStorage.removeItem(GOOGLE_PKCE_VERIFIER_KEY);
  return v;
}
