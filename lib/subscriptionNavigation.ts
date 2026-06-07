import type { Page } from '../context/appContext';
import type { PlanId } from '../data/pricingPlans';

type NavigateTo = (page: Page) => void;

const HIGHLIGHT_STORAGE_KEY = 'subscriptionPlansHighlight';

export function setSubscriptionPlansHighlight(planId: PlanId | null): void {
  if (planId) {
    sessionStorage.setItem(HIGHLIGHT_STORAGE_KEY, planId);
  } else {
    sessionStorage.removeItem(HIGHLIGHT_STORAGE_KEY);
  }
}

export function getSubscriptionPlansHighlight(): PlanId | null {
  const raw = sessionStorage.getItem(HIGHLIGHT_STORAGE_KEY);
  if (raw === 'monthly' || raw === 'yearly' || raw === 'lifetime' || raw === 'free') {
    return raw;
  }
  return null;
}

export function clearSubscriptionPlansHighlight(): void {
  sessionStorage.removeItem(HIGHLIGHT_STORAGE_KEY);
}

/** Navigate to the dedicated subscription plans page (all upgrade CTAs use this). */
export function goToSubscriptionPlans(
  navigateTo: NavigateTo,
  options?: { highlightPlanId?: PlanId }
): void {
  if (options?.highlightPlanId) {
    setSubscriptionPlansHighlight(options.highlightPlanId);
  }
  navigateTo('subscriptionPlans');
}
