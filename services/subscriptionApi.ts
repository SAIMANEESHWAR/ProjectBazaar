import type { SubscriptionCookiePayload } from '../lib/subscriptionCookie';
import { FEATURE_ENTITLEMENT_API_URL, SUBSCRIPTION_API_URL } from '../lib/apiConfig';
import { FREE_USE_LIMIT } from '../lib/subscriptionFeatures';

export interface SubscriptionRecord {
  subscriptionId: string;
  userId: string;
  planId: string;
  planName: string;
  priceInr: number;
  status: string;
  startDate: string;
  endDate: string | null;
  enabledFeatures: string[];
  paymentStatus?: string;
  paymentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code?: string; message?: string };
}

async function postFeatureEntitlementRaw(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!FEATURE_ENTITLEMENT_API_URL) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message:
          'Feature entitlement API URL is not set. Add VITE_FEATURE_ENTITLEMENT_API_URL to .env.local.',
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(FEATURE_ENTITLEMENT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok && data.success !== false) {
      return { success: false, error: { message: `Request failed (${res.status})` } };
    }
    return data;
  } catch (e) {
    console.error('featureEntitlementApi error:', e);
    return {
      success: false,
      error: { message: e instanceof Error ? e.message : 'Network error' },
    };
  }
}

async function postFeatureEntitlement<T>(body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const data = await postFeatureEntitlementRaw(body);
  return data as unknown as ApiResponse<T>;
}

async function postSubscriptionRaw(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!SUBSCRIPTION_API_URL) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message:
          'Subscription API URL is not set. Add VITE_SUBSCRIPTION_API_URL to .env.local after deploying Lambda.',
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(SUBSCRIPTION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok && data.success !== false) {
      return { success: false, error: { message: `Request failed (${res.status})` } };
    }
    return data;
  } catch (e) {
    console.error('subscriptionApi error:', e);
    return {
      success: false,
      error: { message: e instanceof Error ? e.message : 'Network error' },
    };
  }
}

async function postSubscription<T>(body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const data = await postSubscriptionRaw(body);
  return data as unknown as ApiResponse<T>;
}

export function subscriptionRecordToCookie(
  record: SubscriptionRecord
): SubscriptionCookiePayload {
  return {
    planId: record.planId,
    subscriptionId: record.subscriptionId,
    planName: record.planName,
    startDate: record.startDate,
    endDate: record.endDate,
    enabledFeatures: record.enabledFeatures ?? [],
    status: record.status === 'active' ? 'active' : 'expired',
  };
}

export async function getActiveSubscription(
  userId: string
): Promise<SubscriptionRecord | null> {
  const res = await postSubscription<SubscriptionRecord | null>({
    action: 'get_active_subscription',
    userId,
  });
  if (!res.success) {
    console.warn('getActiveSubscription:', res.error?.message);
    return null;
  }
  return res.data ?? null;
}

export async function createSubscription(
  userId: string,
  planId: string
): Promise<{ ok: true; data: SubscriptionRecord } | { ok: false; message: string }> {
  const res = await postSubscription<SubscriptionRecord>({
    action: 'create_subscription',
    userId,
    planId,
  });
  if (!res.success || !res.data) {
    return {
      ok: false,
      message: res.error?.message || res.message || 'Could not create subscription',
    };
  }
  return { ok: true, data: res.data };
}

export interface SubscriptionOrderResponse {
  success: boolean;
  orderId?: string;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
  name?: string;
  description?: string;
  planId?: string;
  planName?: string;
  prefill?: { email?: string; contact?: string };
  demoMode?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
}

export interface VerifySubscriptionPaymentRequest {
  userId: string;
  planId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function createSubscriptionOrder(
  userId: string,
  planId: string,
  userEmail?: string
): Promise<SubscriptionOrderResponse> {
  const data = await postSubscriptionRaw({
    action: 'create_subscription_order',
    userId,
    planId,
    userEmail,
  });
  if (!data.success) {
    const err = data.error as SubscriptionOrderResponse['error'];
    return {
      success: false,
      error: err,
      message: err?.message || (data.message as string | undefined),
    };
  }
  return {
    success: true,
    orderId: data.orderId as string,
    razorpayOrderId: data.razorpayOrderId as string,
    amount: data.amount as number,
    currency: data.currency as string,
    key: data.key as string,
    name: data.name as string,
    description: data.description as string,
    planId: data.planId as string,
    planName: data.planName as string,
    prefill: data.prefill as SubscriptionOrderResponse['prefill'],
    demoMode: data.demoMode as boolean | undefined,
  };
}

export async function verifySubscriptionPayment(
  request: VerifySubscriptionPaymentRequest
): Promise<{ ok: true; data: SubscriptionRecord } | { ok: false; message: string }> {
  const res = await postSubscription<SubscriptionRecord>({
    action: 'verify_subscription_payment',
    ...request,
  });
  if (!res.success || !res.data) {
    return {
      ok: false,
      message: res.error?.message || res.message || 'Payment verification failed',
    };
  }
  return { ok: true, data: res.data };
}

export function isSubscriptionApiConfigured(): boolean {
  return Boolean(SUBSCRIPTION_API_URL?.trim());
}

export type FeatureEntitlementSource =
  | 'always_free'
  | 'plan'
  | 'trial'
  | 'exhausted';

export interface FeatureEntitlement {
  featureId: string;
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  source: FeatureEntitlementSource;
}

export async function getFeatureEntitlements(
  userId: string
): Promise<Record<string, FeatureEntitlement>> {
  const res = await postFeatureEntitlement<Record<string, FeatureEntitlement>>({
    action: 'get_feature_entitlements',
    userId,
  });
  if (!res.success || !res.data) {
    console.warn('getFeatureEntitlements:', res.error?.message);
    return {};
  }
  return res.data;
}

export async function consumeFeatureUse(
  userId: string,
  featureId: string,
  sessionId?: string
): Promise<{ ok: true; data: FeatureEntitlement } | { ok: false; message: string }> {
  const res = await postFeatureEntitlement<FeatureEntitlement>({
    action: 'consume_feature_use',
    userId,
    featureId,
    ...(sessionId ? { sessionId } : {}),
  });
  if (!res.success || !res.data) {
    return {
      ok: false,
      message: res.error?.message || res.message || 'Could not record feature use',
    };
  }
  return { ok: true, data: res.data };
}

export function isFeatureEntitlementApiConfigured(): boolean {
  return Boolean(FEATURE_ENTITLEMENT_API_URL?.trim());
}

export { FREE_USE_LIMIT };

/** True when user has a non-expired active subscription on the server. */
export async function userHasActivePremiumSubscription(userId: string): Promise<boolean> {
  const record = await getActiveSubscription(userId);
  if (!record || record.status !== 'active') return false;
  if (record.endDate) {
    const end = new Date(record.endDate).getTime();
    if (!Number.isNaN(end) && end < Date.now()) return false;
  }
  return true;
}
