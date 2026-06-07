import React, { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Check, X, Crown } from 'lucide-react';
import { useNavigation, useAuth } from '../../context/appContext';
import { savePendingPlan, clearPendingPlan } from '../../lib/pendingPlanStorage';
import { userHasActivePremiumSubscription } from '../../services/subscriptionApi';
import {
  DISPLAY_PRICING_PLANS,
  PRICING_FEATURES,
  formatInr,
  isFeatureIncluded,
  type PlanId,
  type PricingPlanConfig,
} from '../../data/pricingPlans';
import {
  FREE_USE_LIMIT,
  isAlwaysFreeFeature,
  isTrialGatedFeature,
} from '../../lib/subscriptionFeatures';

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
    return isAlwaysFreeFeature(featureId) || isTrialGatedFeature(featureId);
  }
  return isFeatureIncluded(plan, featureId) || isAlwaysFreeFeature(featureId);
}

const PlanCard: React.FC<{
  plan: PricingPlanConfig;
  index: number;
  inView: boolean;
  isHighlighted: boolean;
  checkingPlanId: string | null;
  onSubscribe: (planId: PlanId) => void;
  onStartFree: () => void;
  onHover: () => void;
}> = ({ plan, index, inView, isHighlighted, checkingPlanId, onSubscribe, onStartFree, onHover }) => {
  const isFree = plan.id === 'free';
  const isChecking = checkingPlanId === plan.id;

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
        onClick={() => (isFree ? onStartFree() : onSubscribe(plan.id))}
        disabled={Boolean(checkingPlanId)}
        className={`relative mb-8 w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 disabled:opacity-70 ${
          isHighlighted
            ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white shadow-[0_8px_24px_rgba(255,122,0,0.35)] hover:brightness-110'
            : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#333]'
        }`}
      >
        {isChecking ? 'Checking…' : plan.ctaLabel}
      </button>

      <div className="relative flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          What&apos;s included
        </p>
        <ul className="space-y-3">
          {PRICING_FEATURES.map((feature) => {
            const freeForAll = isAlwaysFreeFeature(feature.id);
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
                    {freeForAll && included && (
                      <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Free for all
                      </span>
                    )}
                    {trialOnFree && included && (
                      <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        {FREE_USE_LIMIT} free uses
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

const PricingPlansSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { navigateTo } = useNavigation();
  const { isLoggedIn, userId, userEmail } = useAuth();
  const [checkingPlanId, setCheckingPlanId] = useState<string | null>(null);
  const [alreadyPremiumOpen, setAlreadyPremiumOpen] = useState(false);
  const [paymentDetailsError, setPaymentDetailsError] = useState<string | null>(null);
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(null);

  const defaultHighlightedPlanId =
    DISPLAY_PRICING_PLANS.find((p) => p.isPopular)?.id ?? DISPLAY_PRICING_PLANS[0]?.id;
  const highlightedPlanId = hoveredPlanId ?? defaultHighlightedPlanId;

  const handleStartFree = () => {
    clearPendingPlan();
    if (isLoggedIn) {
      navigateTo('dashboard');
    } else {
      navigateTo('auth');
    }
  };

  const handleSubscribe = async (planId: PlanId) => {
    if (planId === 'free') {
      handleStartFree();
      return;
    }

    setPaymentDetailsError(null);
    savePendingPlan(planId);

    if (!isLoggedIn || !userId) {
      navigateTo('auth');
      return;
    }

    if (!userEmail?.trim()) {
      setPaymentDetailsError(
        'Payment details required: add your email in Settings before purchasing.'
      );
      return;
    }

    setCheckingPlanId(planId);
    try {
      const isPremium = await userHasActivePremiumSubscription(userId);
      if (isPremium) {
        clearPendingPlan();
        setAlreadyPremiumOpen(true);
        return;
      }
      navigateTo('subscriptionCheckout');
    } finally {
      setCheckingPlanId(null);
    }
  };

  return (
    <section
      id="pricing"
      ref={ref}
      className="relative py-20 md:py-28 bg-[#F7F7F7] dark:bg-[#0a0a0a] overflow-hidden transition-colors duration-300"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <p className="text-gray-500 dark:text-[#a1a1a1] uppercase tracking-[0.2em] text-sm font-semibold mb-4">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Plans for every <span className="text-[#ff7a00]">career stage</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-[640px] mx-auto">
            Unlock dashboard tools for job hunt, interview prep, and portfolio — priced for the
            Indian market in INR.
          </p>
        </motion.div>

        {paymentDetailsError && (
          <div className="mb-6 max-w-xl mx-auto rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
            <span>{paymentDetailsError}</span>
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="shrink-0 text-xs font-semibold text-[#ff7a00] hover:underline"
            >
              Go to Settings
            </button>
          </div>
        )}

        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-5 items-stretch"
          onMouseLeave={() => setHoveredPlanId(null)}
        >
          {DISPLAY_PRICING_PLANS.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={index}
              inView={inView}
              isHighlighted={highlightedPlanId === plan.id}
              checkingPlanId={checkingPlanId}
              onSubscribe={handleSubscribe}
              onStartFree={handleStartFree}
              onHover={() => setHoveredPlanId(plan.id)}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 text-center text-sm text-gray-500 dark:text-gray-500 max-w-xl mx-auto leading-relaxed"
        >
          Prices include GST where applicable.
        </motion.p>
      </div>

      {alreadyPremiumOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1a1a] p-6 shadow-xl border border-gray-200 dark:border-[#2a2a2a] text-center"
            role="dialog"
            aria-labelledby="already-premium-title"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1E26]">
              <Crown className="h-7 w-7 text-amber-400 fill-amber-400/30" strokeWidth={2} />
            </div>
            <h3 id="already-premium-title" className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              You are already a premium user
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your active subscription includes premium dashboard features. Head to the dashboard to
              use them.
            </p>
            <button
              type="button"
              onClick={() => {
                setAlreadyPremiumOpen(false);
                navigateTo('dashboard');
              }}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#ff7a00] to-[#ff9533]"
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => setAlreadyPremiumOpen(false)}
              className="w-full mt-2 py-2 text-sm text-gray-500 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PricingPlansSection;
