/** Cookie key for client-side subscription entitlements (UX gating). */
export const SUBSCRIPTION_COOKIE_KEY = 'cx_subscription';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface SubscriptionCookiePayload {
  planId: string;
  subscriptionId: string;
  planName?: string;
  startDate: string;
  endDate: string | null;
  enabledFeatures: string[];
  status: SubscriptionStatus;
}

function parseCookieValue(raw: string): SubscriptionCookiePayload | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as SubscriptionCookiePayload;
    if (!parsed?.planId || !Array.isArray(parsed.enabledFeatures)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSubscriptionFromCookie(): SubscriptionCookiePayload | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SUBSCRIPTION_COOKIE_KEY}=`));
  if (!match) return null;
  const value = match.slice(SUBSCRIPTION_COOKIE_KEY.length + 1);
  const payload = parseCookieValue(value);
  if (!payload) return null;
  if (payload.endDate) {
    const end = new Date(payload.endDate).getTime();
    if (!Number.isNaN(end) && end < Date.now()) {
      return { ...payload, status: 'expired' };
    }
  }
  return payload;
}

function cookieMaxAgeSeconds(endDate: string | null): number {
  if (!endDate) return 60 * 60 * 24 * 365 * 10;
  const end = new Date(endDate).getTime();
  const diff = Math.floor((end - Date.now()) / 1000);
  return Math.max(diff, 60 * 60);
}

export function setSubscriptionCookie(payload: SubscriptionCookiePayload): void {
  if (typeof document === 'undefined') return;
  const maxAge = cookieMaxAgeSeconds(payload.endDate);
  const value = encodeURIComponent(JSON.stringify(payload));
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SUBSCRIPTION_COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearSubscriptionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SUBSCRIPTION_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasFeatureInCookie(featureId: string): boolean {
  const sub = getSubscriptionFromCookie();
  if (!sub || sub.status !== 'active') return false;
  return sub.enabledFeatures.includes(featureId);
}
