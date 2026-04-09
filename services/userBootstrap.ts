import { buildAuthHeaders, getIdToken } from '@/lib/authSession';

export type BootstrapUserData = {
  userId: string;
  email: string;
  role: UIRole;
};

type UIRole = 'user' | 'admin';

/**
 * Links Cognito sub to legacy Users row (by email) or creates an OTP-only user.
 * No-op if VITE_USER_BOOTSTRAP_ENDPOINT is unset or token missing.
 */
export async function bootstrapCognitoUser(): Promise<BootstrapUserData | null> {
  const url = String(import.meta.env.VITE_USER_BOOTSTRAP_ENDPOINT || '').trim();
  if (!url) return null;

  const token = getIdToken();
  if (!token) return null;

  const res = await fetch(url, {
    method: 'POST',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ idToken: token }),
  });

  const data = (await res.json()) as {
    success?: boolean;
    data?: { userId?: string; email?: string; role?: string };
  };

  if (!res.ok || !data.success || !data.data?.userId) {
    return null;
  }

  const role: UIRole = data.data.role === 'admin' ? 'admin' : 'user';
  return {
    userId: data.data.userId,
    email: String(data.data.email || ''),
    role,
  };
}
