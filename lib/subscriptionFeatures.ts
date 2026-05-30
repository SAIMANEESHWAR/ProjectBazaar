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

const VIEW_TO_FEATURE: Partial<Record<DashboardView, SubscriptionFeatureId>> = {
  'job-hunt': 'job-hunt',
  'hackathons': 'hackathons',
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
