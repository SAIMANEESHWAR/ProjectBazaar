import type { DashboardView } from '../context/DashboardContext';
import { PREP_VIEWS } from '../context/DashboardContext';

/** Pricing feature id (data/pricingPlans.ts) */
export type SubscriptionFeatureId =
  | 'job-hunt'
  | 'preparation'
  | 'live-ai'
  | 'hackathons'
  | 'ats-scorer'
  | 'coding'
  | 'portfolio'
  | 'resume-builder'
  | 'company-posts';

export const PENDING_PLAN_STORAGE_KEY = 'pendingPlan';

/** Free completed uses per feature for users without plan entitlement (keep in sync with lambda). */
export const FREE_USE_LIMIT = 2;

/** All career dashboard features subject to trial when not in active plan. */
export const TRIAL_FEATURES: SubscriptionFeatureId[] = [
  'job-hunt',
  'preparation',
  'live-ai',
  'hackathons',
  'ats-scorer',
  'coding',
  'portfolio',
  'resume-builder',
  'company-posts',
];

/** @deprecated All features are trial-gated for free users — use TRIAL_FEATURES */
export const ALWAYS_FREE_FEATURES: SubscriptionFeatureId[] = [];

/** @deprecated Use TRIAL_FEATURES */
export const TRIAL_GATED_FEATURES: SubscriptionFeatureId[] = TRIAL_FEATURES;

export function isAlwaysFreeFeature(_featureId: string): boolean {
  return false;
}

export function isTrialGatedFeature(featureId: string): boolean {
  return (TRIAL_FEATURES as string[]).includes(featureId);
}

const VIEW_TO_FEATURE: Partial<Record<DashboardView, SubscriptionFeatureId>> = {
  'job-hunt': 'job-hunt',
  hackathons: 'hackathons',
  'ats-scorer': 'ats-scorer',
  'coding-questions': 'coding',
  'build-portfolio': 'portfolio',
  'build-resume': 'resume-builder',
  'company-posts': 'company-posts',
  'live-mock-interview': 'live-ai',
  'live-peer-requests': 'live-ai',
  'live-mock-interview-dashboard': 'live-ai',
};

for (const view of PREP_VIEWS) {
  VIEW_TO_FEATURE[view] = 'preparation';
}

export function getFeatureIdForView(view: DashboardView): SubscriptionFeatureId | null {
  return VIEW_TO_FEATURE[view] ?? null;
}

export function isGatedDashboardView(view: DashboardView): boolean {
  return getFeatureIdForView(view) !== null;
}
