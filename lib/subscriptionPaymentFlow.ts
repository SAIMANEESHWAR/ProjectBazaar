import type { PlanId } from '../data/pricingPlans';
import { PRICING_PLANS } from '../data/pricingPlans';
import { logRazorpayError, openRazorpayCheckout } from './razorpayCheckout';
import {
  createSubscriptionOrder,
  isSubscriptionApiConfigured,
  verifySubscriptionPayment,
  type SubscriptionRecord,
} from '../services/subscriptionApi';

export type SubscriptionPaymentOutcome =
  | { status: 'success'; record: SubscriptionRecord }
  | { status: 'demo_mode'; message: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function runSubscriptionPaymentFlow(options: {
  userId: string;
  planId: PlanId;
  userEmail?: string;
}): Promise<SubscriptionPaymentOutcome> {
  const plan = PRICING_PLANS.find((p) => p.id === options.planId);
  if (!plan) {
    return { status: 'error', message: 'Invalid plan selected' };
  }

  if (!isSubscriptionApiConfigured()) {
    return {
      status: 'error',
      message: 'Subscription API is not configured. Add VITE_SUBSCRIPTION_API_URL to .env.local.',
    };
  }

  let orderResponse: Awaited<ReturnType<typeof createSubscriptionOrder>>;
  try {
    orderResponse = await createSubscriptionOrder(
      options.userId,
      options.planId,
      options.userEmail
    );
  } catch (err) {
    logRazorpayError('create_subscription_order_network', err);
    return { status: 'error', message: 'Could not reach payment server. Try again.' };
  }

  if (!orderResponse.success || !orderResponse.razorpayOrderId) {
    logRazorpayError('create_subscription_order_failed', orderResponse);
    const msg = orderResponse.message || orderResponse.error?.message || 'Could not start payment';
    if (msg.toLowerCase().includes('already a premium') || orderResponse.error?.code === 'ALREADY_PREMIUM') {
      return { status: 'error', message: 'You are already a premium user' };
    }
    return { status: 'error', message: msg };
  }

  if (orderResponse.demoMode || orderResponse.key === 'rzp_test_demo') {
    return {
      status: 'demo_mode',
      message:
        'Razorpay is not configured on the server. Use test activation or add RAZORPAY keys to the subscription Lambda.',
    };
  }

  if (!orderResponse.key || !orderResponse.amount) {
    return { status: 'error', message: 'Incomplete payment details from server' };
  }

  return new Promise((resolve) => {
    void openRazorpayCheckout({
      key: orderResponse.key!,
      amount: orderResponse.amount!,
      currency: orderResponse.currency || 'INR',
      name: orderResponse.name || 'CodeXCareer',
      description: orderResponse.description || `${plan.name} subscription`,
      orderId: orderResponse.razorpayOrderId!,
      prefill: {
        email: options.userEmail || orderResponse.prefill?.email,
        contact: orderResponse.prefill?.contact,
      },
      onDismiss: () => resolve({ status: 'cancelled' }),
      onFailed: (message) => resolve({ status: 'error', message }),
      onSuccess: async (payment) => {
        try {
          const verifyResult = await verifySubscriptionPayment({
            userId: options.userId,
            planId: options.planId,
            razorpay_payment_id: payment.razorpay_payment_id,
            razorpay_order_id: payment.razorpay_order_id,
            razorpay_signature: payment.razorpay_signature,
          });
          if (!verifyResult.ok) {
            resolve({ status: 'error', message: verifyResult.message });
            return;
          }
          resolve({ status: 'success', record: verifyResult.data });
        } catch {
          resolve({
            status: 'error',
            message: 'Payment succeeded but activation failed. Contact support with your payment ID.',
          });
        }
      },
    }).catch((err) => {
      logRazorpayError('open_checkout', err);
      resolve({
        status: 'error',
        message: err instanceof Error ? err.message : 'Could not open payment window.',
      });
    });
  });
}
