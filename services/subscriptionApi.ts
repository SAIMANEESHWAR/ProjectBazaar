import type { SubscriptionCookiePayload } from '../lib/subscriptionCookie';
import { SUBSCRIPTION_API_URL } from '../lib/apiConfig';

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
  return data as ApiResponse<T>;
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
