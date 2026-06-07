import type { PlanId } from '../data/pricingPlans';
import { PRICING_PLANS } from '../data/pricingPlans';
import { getSubscriptionFromCookie } from './subscriptionCookie';
import { isActiveSubscription } from './premiumSubscriptionDisplay';
import type { SubscriptionRecord } from '../services/subscriptionApi';

function addMonthsIso(startIso: string, months: number): string {
  const start = new Date(startIso);
  const year = start.getUTCFullYear();
  let month = start.getUTCMonth() + months;
  let y = year;
  while (month > 11) {
    month -= 12;
    y += 1;
  }
  const day = Math.min(start.getUTCDate(), 28);
  return new Date(Date.UTC(y, month, day, start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds())).toISOString();
}

/** Build subscription record locally (no Lambda / Razorpay). */
export function buildLocalSubscriptionRecord(userId: string, planId: PlanId): SubscriptionRecord {
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    throw new Error('Invalid plan');
  }

  const startDate = new Date().toISOString();
  let endDate: string | null = null;
  if (planId === 'monthly') {
    endDate = addMonthsIso(startDate, 1);
  } else if (planId === 'yearly') {
    endDate = addMonthsIso(startDate, 12);
  }

  return {
    subscriptionId: `bypass_${crypto.randomUUID()}`,
    userId,
    planId,
    planName: plan.name,
    priceInr: plan.priceInr,
    status: 'active',
    startDate,
    endDate,
    enabledFeatures: [...plan.includedFeatureIds],
    paymentStatus: 'bypass',
    paymentId: null,
  };
}

/** Premium from cookie (frontend bypass until Razorpay is wired). */
export function hasLocalPremiumEntitlement(): boolean {
  return isActiveSubscription(getSubscriptionFromCookie());
}
