import React from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import {
  PRICING_FEATURES,
  formatInr,
  isFeatureIncluded,
  type PlanId,
  type PricingPlanConfig,
} from '../../data/pricingPlans';
import { FREE_USE_LIMIT, isTrialGatedFeature } from '../../lib/subscriptionFeatures';
import { getPlanActionLabel, getUpgradeCtaLabel } from '../../lib/planUpgrade';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function featureIncludedInPlan(plan: PricingPlanConfig, featureId: string): boolean {
  if (plan.id === 'free') {
    return isTrialGatedFeature(featureId);
  }
  return isFeatureIncluded(plan, featureId);
}

export interface PlanCardProps {
  plan: PricingPlanConfig;
  index: number;
  inView: boolean;
  isHighlighted: boolean;
  checkingPlanId: string | null;
  currentPlanId: string | null;
  showFreePlan?: boolean;
  onSubscribe: (planId: PlanId) => void;
  onStartFree: () => void;
  onHover: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  index,
  inView,
  isHighlighted,
  checkingPlanId,
  currentPlanId,
  onSubscribe,
  onStartFree,
  onHover,
}) => {
  const isFree = plan.id === 'free';
  const isChecking = checkingPlanId === plan.id;
  const action = getPlanActionLabel(currentPlanId, plan.id);
  const isCurrent = action === 'Current plan';
  const isDisabled =
    Boolean(checkingPlanId) || isCurrent || action === 'Downgrade not available';

  const ctaLabel = isChecking
    ? 'Checking…'
    : isFree
      ? 'Start free'
      : getUpgradeCtaLabel(currentPlanId, plan.id, plan.name);

  const handleClick = () => {
    if (isDisabled) return;
    if (isFree) {
      onStartFree();
      return;
    }
    onSubscribe(plan.id);
  };

  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      onMouseEnter={onHover}
      className={`relative flex flex-col rounded-2xl border p-6 md:p-7 transition-all duration-300 ${
        isHighlighted
          ? 'border-[#ff7a00]/50 bg-white dark:bg-[#141414] shadow-[0_0_48px_rgba(255,122,0,0.15)] md:scale-[1.02] z-10'
          : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] md:scale-100'
      }`}
    >
      {isCurrent && (
        <span className="absolute top-4 right-4 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Current
        </span>
      )}

      {isHighlighted && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-40 dark:opacity-60 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(255,122,0,0.35) 0%, transparent 65%)',
          }}
          aria-hidden
        />
      )}

      <div className="relative mb-3">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {plan.name}
        </h3>
      </div>

      <p className="relative text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 min-h-[2.75rem]">
        {plan.description}
      </p>

      <div className="relative mb-8 flex flex-wrap items-baseline gap-2">
        <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          {isFree ? '₹0' : formatInr(plan.priceInr)}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{plan.periodLabel}</span>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`relative mb-8 w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
          isHighlighted && !isDisabled
            ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white shadow-[0_8px_24px_rgba(255,122,0,0.35)] hover:brightness-110'
            : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#333]'
        }`}
      >
        {ctaLabel}
      </button>

      <div className="relative flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          What&apos;s included
        </p>
        <ul className="space-y-3">
          {PRICING_FEATURES.map((feature) => {
            const trialOnFree = isFree && isTrialGatedFeature(feature.id);
            const included = featureIncludedInPlan(plan, feature.id);
            return (
              <li key={feature.id} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    included
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-500 dark:text-red-400'
                  }`}
                  aria-hidden
                >
                  {included ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <X className="h-3 w-3" strokeWidth={3} />
                  )}
                </span>
                <div className={included ? '' : 'opacity-45'}>
                  <span
                    className={`block text-sm font-medium ${
                      included
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {feature.title}
                    {trialOnFree && included && (
                      <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        {FREE_USE_LIMIT} free tries
                      </span>
                    )}
                  </span>
                  <span
                    className={`block text-xs mt-0.5 ${
                      included
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {feature.description}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.article>
  );
};

export interface PlanCardsGridProps {
  plans: PricingPlanConfig[];
  inView: boolean;
  highlightedPlanId: string | null;
  checkingPlanId: string | null;
  currentPlanId: string | null;
  onSubscribe: (planId: PlanId) => void;
  onStartFree: () => void;
  onHoverPlan: (planId: string | null) => void;
}

export const PlanCardsGrid: React.FC<PlanCardsGridProps> = ({
  plans,
  inView,
  highlightedPlanId,
  checkingPlanId,
  currentPlanId,
  onSubscribe,
  onStartFree,
  onHoverPlan,
}) => {
  const defaultHighlighted =
    plans.find((p) => p.isPopular)?.id ?? plans[0]?.id ?? null;
  const activeHighlight = highlightedPlanId ?? defaultHighlighted;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-5 items-stretch"
      onMouseLeave={() => onHoverPlan(null)}
    >
      {plans.map((plan, index) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          index={index}
          inView={inView}
          isHighlighted={activeHighlight === plan.id}
          checkingPlanId={checkingPlanId}
          currentPlanId={currentPlanId}
          onSubscribe={onSubscribe}
          onStartFree={onStartFree}
          onHover={() => onHoverPlan(plan.id)}
        />
      ))}
    </div>
  );
};
