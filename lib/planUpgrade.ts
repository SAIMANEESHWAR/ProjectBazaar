import { PRICING_PLANS, type PlanId } from '../data/pricingPlans';

/** Paid plan tier order (keep in sync with lambda/subscription_handler.py PLAN_RANK). */
export const PLAN_RANK: Record<'monthly' | 'yearly' | 'lifetime', number> = {
  monthly: 1,
  yearly: 2,
  lifetime: 3,
};

const PAID_PLAN_IDS = Object.keys(PLAN_RANK) as Array<keyof typeof PLAN_RANK>;

export function isPaidPlanId(planId: string | null | undefined): planId is keyof typeof PLAN_RANK {
  return Boolean(planId && planId in PLAN_RANK);
}

export function getPlanRank(planId: string | null | undefined): number {
  if (!isPaidPlanId(planId)) return 0;
  return PLAN_RANK[planId];
}

export function isUpgrade(fromPlanId: string | null | undefined, toPlanId: PlanId): boolean {
  if (toPlanId === 'free') return false;
  if (!isPaidPlanId(toPlanId)) return false;
  const fromRank = getPlanRank(fromPlanId);
  const toRank = getPlanRank(toPlanId);
  if (fromRank === 0) return true;
  return toRank > fromRank;
}

export function getAvailableUpgrades(currentPlanId: string | null | undefined): PlanId[] {
  const currentRank = getPlanRank(currentPlanId);
  return PRICING_PLANS.filter((p) => {
    if (!isPaidPlanId(p.id)) return false;
    return PLAN_RANK[p.id] > currentRank;
  }).map((p) => p.id);
}

export type PlanActionLabel =
  | 'Current plan'
  | 'Upgrade'
  | 'Buy now'
  | 'Downgrade not available'
  | 'Start free';

export function getPlanActionLabel(
  currentPlanId: string | null | undefined,
  targetPlanId: PlanId
): PlanActionLabel {
  if (targetPlanId === 'free') return 'Start free';
  if (!isPaidPlanId(targetPlanId)) return 'Buy now';

  const currentRank = getPlanRank(currentPlanId);
  const targetRank = PLAN_RANK[targetPlanId];

  if (currentRank === 0) return 'Buy now';
  if (targetRank === currentRank) return 'Current plan';
  if (targetRank > currentRank) return 'Upgrade';
  return 'Downgrade not available';
}

export function getUpgradeCtaLabel(
  currentPlanId: string | null | undefined,
  targetPlanId: PlanId,
  targetPlanName?: string
): string {
  const action = getPlanActionLabel(currentPlanId, targetPlanId);
  if (action === 'Upgrade' && targetPlanName) return `Upgrade to ${targetPlanName}`;
  if (action === 'Buy now') return 'Buy now';
  if (action === 'Current plan') return 'Current plan';
  if (action === 'Downgrade not available') return 'Not available';
  if (action === 'Start free') return 'Start free';
  return action;
}

export { PAID_PLAN_IDS };
