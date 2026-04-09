import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootstrapCognitoUser } from '../../services/userBootstrap';

const store = new Map<string, string>();

describe('bootstrapCognitoUser', () => {
  beforeEach(() => {
    store.clear();
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_USER_BOOTSTRAP_ENDPOINT', 'https://example.com/bootstrap');
    (localStorage.getItem as any).mockImplementation((key: string) =>
      store.has(key) ? store.get(key)! : null
    );
    (localStorage.setItem as any).mockImplementation((key: string, value: string) => {
      store.set(key, value);
    });
    vi.mocked(fetch).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns null when no bootstrap URL', async () => {
    vi.unstubAllEnvs();
    store.set('authIdToken', 'tok');
    expect(await bootstrapCognitoUser()).toBeNull();
  });

  it('returns null when no id token', async () => {
    expect(await bootstrapCognitoUser()).toBeNull();
  });

  it('returns mapped user on success', async () => {
    store.set('authIdToken', 'id.jwt.here');
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { userId: 'legacy-1', email: 'a@b.com', role: 'user' },
      }),
    } as Response);

    const out = await bootstrapCognitoUser();
    expect(out).toEqual({
      userId: 'legacy-1',
      email: 'a@b.com',
      role: 'user',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/bootstrap',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
