import type { SubscriptionCookiePayload } from './subscriptionCookie';
import { formatInr, PRICING_PLANS, type PlanId } from '../data/pricingPlans';

export interface SubscriptionDisplayInfo {
  planName: string;
  priceLabel: string;
  startDate: string;
  endDateLabel: string;
  featureCount: number;
  isLifetime: boolean;
}

function formatSubscriptionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function getSubscriptionDisplayInfo(
  subscription: SubscriptionCookiePayload
): SubscriptionDisplayInfo {
  const plan = PRICING_PLANS.find((p) => p.id === subscription.planId);
  const planName =
    subscription.planName ||
    plan?.name ||
    subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1);

  const priceLabel = plan
    ? `${formatInr(plan.priceInr)}${plan.periodLabel}`
    : '';

  const isLifetime = subscription.planId === 'lifetime' || !subscription.endDate;

  return {
    planName,
    priceLabel,
    startDate: formatSubscriptionDate(subscription.startDate),
    endDateLabel: isLifetime
      ? 'Lifetime access'
      : formatSubscriptionDate(subscription.endDate!),
    featureCount: subscription.enabledFeatures.length,
    isLifetime,
  };
}

export function isActiveSubscription(
  subscription: SubscriptionCookiePayload | null | undefined
): subscription is SubscriptionCookiePayload {
  if (!subscription || subscription.status !== 'active') return false;
  if (subscription.endDate) {
    const end = new Date(subscription.endDate).getTime();
    if (!Number.isNaN(end) && end < Date.now()) return false;
  }
  return true;
}

export function planIdLabel(planId: string): string {
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  return plan?.name ?? planId;
}

export function isKnownPlanId(planId: string): planId is PlanId {
  return PRICING_PLANS.some((p) => p.id === planId);
}
