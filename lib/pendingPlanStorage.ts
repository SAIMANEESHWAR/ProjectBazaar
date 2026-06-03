import type { PlanId } from '../data/pricingPlans';
import { PRICING_PLANS } from '../data/pricingPlans';
import { PENDING_PLAN_STORAGE_KEY } from './subscriptionFeatures';

const PENDING_PLAN_LOCAL_KEY = 'pendingPlanLocal';

export function savePendingPlan(planId: PlanId): void {
  sessionStorage.setItem(PENDING_PLAN_STORAGE_KEY, planId);
  localStorage.setItem(PENDING_PLAN_LOCAL_KEY, planId);
}

export function getPendingPlan(): PlanId | null {
  const raw =
    sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY) ||
    sessionStorage.getItem('selectedPricingPlan') ||
    localStorage.getItem(PENDING_PLAN_LOCAL_KEY);
  if (raw && PRICING_PLANS.some((p) => p.id === raw)) {
    return raw as PlanId;
  }
  return null;
}

export function clearPendingPlan(): void {
  sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
  sessionStorage.removeItem('selectedPricingPlan');
  localStorage.removeItem(PENDING_PLAN_LOCAL_KEY);
}

export function hasPendingPlan(): boolean {
  return getPendingPlan() !== null;
}
