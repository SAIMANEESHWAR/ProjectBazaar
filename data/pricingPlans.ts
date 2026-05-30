/** Dashboard career features shown on pricing cards (aligned with dashboard feature cards). */

export interface PricingFeature {

  id: string;

  title: string;

  description: string;

}



export const PRICING_FEATURES: PricingFeature[] = [

  {

    id: 'job-hunt',

    title: 'Job Hunt',

    description: 'Browse roles and track applications quickly.',

  },

  {

    id: 'preparation',

    title: 'Preparation Mode',

    description: 'Practice DSA, system design, and interview rounds.',

  },

  {

    id: 'live-ai',

    title: 'Live AI Interviews',

    description: 'Simulate real interviews with instant feedback.',

  },

  {

    id: 'hackathons',

    title: 'Hackathons',

    description: 'Find upcoming hackathons and register faster.',

  },

  {

    id: 'ats-scorer',

    title: 'ATS Scorer',

    description: 'Check resume match score before applying.',

  },

  {

    id: 'coding',

    title: 'Coding Questions',

    description: 'Sharpen interview skills with curated coding sets.',

  },

  {

    id: 'portfolio',

    title: 'Build Portfolio',

    description: 'Create and publish a project portfolio in minutes.',

  },

  {

    id: 'resume-builder',

    title: 'AI Resume Builder',

    description: 'Build ATS-friendly resumes with live preview.',

  },

  {

    id: 'company-posts',

    title: 'Company Posts',

    description: 'Read and share interview experiences and salary insights.',

  },

];



export type PlanId = 'monthly' | 'yearly' | 'lifetime';



export interface PricingPlanConfig {

  id: PlanId;

  name: string;

  description: string;

  priceInr: number;

  periodLabel: string;

  /** Feature ids included in this plan */

  includedFeatureIds: string[];

  isPopular: boolean;

  ctaLabel: string;

}



/** INR pricing — keep in sync with lambda/subscription_handler.py PLAN_CONFIG */

export const PRICING_PLANS: PricingPlanConfig[] = [

  {

    id: 'monthly',

    name: 'Monthly',

    description: 'Core career tools to kickstart your job search.',

    priceInr: 299,

    periodLabel: '/month',

    includedFeatureIds: [

      'job-hunt',

      'hackathons',

      'company-posts',

      'resume-builder',

    ],

    isPopular: false,

    ctaLabel: 'Buy now',

  },

  {

    id: 'yearly',

    name: 'Yearly',

    description: 'Full interview prep stack — best value for serious candidates.',

    priceInr: 699,

    periodLabel: '/year',

    includedFeatureIds: [

      'job-hunt',

      'preparation',

      'live-ai',

      'hackathons',

      'ats-scorer',

      'coding',

      'resume-builder',

      'company-posts',

    ],

    isPopular: true,

    ctaLabel: 'Buy now',

  },

  {

    id: 'lifetime',

    name: 'Lifetime',

    description: 'One-time access to every career tool — forever.',

    priceInr: 999,

    periodLabel: ' one-time',

    includedFeatureIds: PRICING_FEATURES.map((f) => f.id),

    isPopular: false,

    ctaLabel: 'Buy now',

  },

];



/** Razorpay test checkout amount (Lambda SUBSCRIPTION_TEST_PRICE=1). */

export const SUBSCRIPTION_TEST_PRICE_INR = 1;



export function formatInr(amount: number): string {

  return new Intl.NumberFormat('en-IN', {

    style: 'currency',

    currency: 'INR',

    maximumFractionDigits: 0,

  }).format(amount);

}



export function isFeatureIncluded(plan: PricingPlanConfig, featureId: string): boolean {

  return plan.includedFeatureIds.includes(featureId);

}

