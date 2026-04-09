import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildAuthHeaders,
  clearAuthSession,
  getAuthProvider,
  getIdToken,
  setAuthSession,
} from '../../lib/authSession';
import { decodeJwtPayload } from '../../lib/jwt';

describe('auth session utils', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    (localStorage.getItem as any).mockImplementation((key: string) =>
      store.has(key) ? store.get(key) : null
    );
    (localStorage.setItem as any).mockImplementation((key: string, value: string) => {
      store.set(key, String(value));
    });
    (localStorage.removeItem as any).mockImplementation((key: string) => {
      store.delete(key);
    });
    (localStorage.clear as any).mockImplementation(() => {
      store.clear();
    });
  });

  it('stores and reads provider and id token', () => {
    setAuthSession('cognito', { idToken: 'token-123' });
    expect(getAuthProvider()).toBe('cognito');
    expect(getIdToken()).toBe('token-123');
  });

  it('builds authorization header when token exists', () => {
    setAuthSession('cognito', { idToken: 'jwt-abc' });
    const headers = buildAuthHeaders({ 'Content-Type': 'application/json' }) as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jwt-abc');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('clears local auth session', () => {
    setAuthSession('legacy', { idToken: 'x' });
    clearAuthSession();
    expect(getIdToken()).toBeNull();
    expect(getAuthProvider()).toBe('legacy');
  });
});

describe('jwt payload decode', () => {
  it('decodes payload for valid jwt shape', () => {
    const payload = btoa(JSON.stringify({ sub: 'u1', email: 'a@b.com' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const token = `h.${payload}.s`;
    const parsed = decodeJwtPayload(token);
    expect(parsed?.sub).toBe('u1');
  });

  it('returns null for malformed token', () => {
    expect(decodeJwtPayload('invalid')).toBeNull();
  });
});
