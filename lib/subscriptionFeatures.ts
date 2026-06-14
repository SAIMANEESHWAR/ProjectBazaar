import type { DashboardView } from '../context/DashboardContext';

import { PREP_VIEWS } from '../context/DashboardContext';

import type { PlanId } from '../data/pricingPlans';



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

  | 'company-posts'

  | 'peer-interview';



export const PENDING_PLAN_STORAGE_KEY = 'pendingPlan';



/** Default free completed uses per feature (keep in sync with lambda). */

export const FREE_USE_LIMIT = 2;



/**

 * Extra trial uses for paid-plan subscribers on features not in their plan.

 * Keep in sync with lambda/feature_entitlement.py PLAN_TRIAL_LIMITS.

 */

export const PLAN_TRIAL_LIMITS: Partial<

  Record<PlanId, Partial<Record<SubscriptionFeatureId, number>>>

> = {

  monthly: {

    portfolio: 4,

    'live-ai': 4,

  },

  yearly: {

    portfolio: 7,

  },

};



/** Features with no subscription or trial limits (logged-in users). */

export const ALWAYS_FREE_FEATURES: SubscriptionFeatureId[] = [

  'company-posts',

  'coding',

  'hackathons',

  'peer-interview',

];



/** Features subject to trial when not in active plan. */

export const TRIAL_FEATURES: SubscriptionFeatureId[] = [

  'preparation',

  'live-ai',

  'ats-scorer',

  'portfolio',

  'resume-builder',

];



/** @deprecated Use TRIAL_FEATURES */

export const TRIAL_GATED_FEATURES: SubscriptionFeatureId[] = TRIAL_FEATURES;



export function isAlwaysFreeFeature(featureId: string): boolean {

  return (ALWAYS_FREE_FEATURES as string[]).includes(featureId);

}



export function isTrialGatedFeature(featureId: string): boolean {

  return (TRIAL_FEATURES as string[]).includes(featureId);

}



/** Trial limit for a feature on a pricing plan card (null = no trial badge). */

export function getPlanTrialBadgeLimit(

  planId: PlanId,

  featureId: string,

  includedInPlan: boolean

): number | null {

  if (planId === 'free') {

    return isTrialGatedFeature(featureId) && includedInPlan ? FREE_USE_LIMIT : null;

  }

  const override = PLAN_TRIAL_LIMITS[planId]?.[featureId as SubscriptionFeatureId];

  if (override != null && !includedInPlan) {

    return override;

  }

  return null;

}



const VIEW_TO_FEATURE: Partial<Record<DashboardView, SubscriptionFeatureId>> = {

  hackathons: 'hackathons',

  'ats-scorer': 'ats-scorer',

  'coding-questions': 'coding',

  'build-portfolio': 'portfolio',

  'build-resume': 'resume-builder',

  'company-posts': 'company-posts',

  'live-peer-requests': 'peer-interview',

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

