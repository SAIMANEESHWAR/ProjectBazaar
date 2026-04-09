export type AuthProvider = 'legacy' | 'cognito';

const AUTH_SESSION_KEY = 'authSession';
const AUTH_PROVIDER_KEY = 'authProvider';
const ID_TOKEN_KEY = 'authIdToken';
const ACCESS_TOKEN_KEY = 'authAccessToken';
const REFRESH_TOKEN_KEY = 'authRefreshToken';

export type StoredTokens = {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
};

export function setAuthSession(provider: AuthProvider, tokens?: StoredTokens) {
  localStorage.setItem(AUTH_SESSION_KEY, 'true');
  localStorage.setItem(AUTH_PROVIDER_KEY, provider);
  if (tokens?.idToken) localStorage.setItem(ID_TOKEN_KEY, tokens.idToken);
  if (tokens?.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens?.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function getAuthProvider(): AuthProvider {
  const provider = localStorage.getItem(AUTH_PROVIDER_KEY);
  return provider === 'cognito' ? 'cognito' : 'legacy';
}

export function getIdToken(): string | null {
  return localStorage.getItem(ID_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function buildAuthHeaders(base: HeadersInit = {}): HeadersInit {
  const headers: Record<string, string> = {
    ...(base as Record<string, string>),
  };
  const token = getIdToken() || getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_PROVIDER_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
