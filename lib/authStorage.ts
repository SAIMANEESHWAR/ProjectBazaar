import type { UserRole } from '../context/appContext';

/** Read session from localStorage (same shape as login API stores in userData). */
export function getStoredAuth(): {
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  isLoggedIn: boolean;
} {
  if (typeof window === 'undefined') {
    return { userId: null, email: null, role: null, isLoggedIn: false };
  }
  const session = localStorage.getItem('authSession') === 'true';
  const raw = localStorage.getItem('userData');
  if (!session || !raw) {
    return { userId: null, email: null, role: null, isLoggedIn: false };
  }
  try {
    const data = JSON.parse(raw) as { userId?: string; email?: string; role?: string };
    if (!data.userId || !data.email) {
      return { userId: null, email: null, role: null, isLoggedIn: false };
    }
    const role: UserRole = data.role === 'admin' ? 'admin' : 'user';
    return {
      userId: data.userId,
      email: data.email,
      role,
      isLoggedIn: true,
    };
  } catch {
    return { userId: null, email: null, role: null, isLoggedIn: false };
  }
}
