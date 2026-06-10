import React, { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { useNavigation, useAuth } from '../../context/appContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { savePendingPlan, clearPendingPlan } from '../../lib/pendingPlanStorage';
import { goToSubscriptionPlans } from '../../lib/subscriptionNavigation';
import { isPaidPlanId } from '../../lib/planUpgrade';
import {
  DISPLAY_PRICING_PLANS,
  type PlanId,
} from '../../data/pricingPlans';
import { PlanCardsGrid } from '../subscription/PlanCardsGrid';

const PricingPlansSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { navigateTo } = useNavigation();
  const { isLoggedIn, userId, userEmail } = useAuth();
  const { subscription } = useSubscription();
  const [checkingPlanId, setCheckingPlanId] = useState<string | null>(null);
  const [paymentDetailsError, setPaymentDetailsError] = useState<string | null>(null);
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(null);

  const currentPlanId = subscription?.planId ?? null;

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

    if (currentPlanId && isPaidPlanId(currentPlanId)) {
      goToSubscriptionPlans(navigateTo);
      return;
    }

    setCheckingPlanId(planId);
    try {
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

        <PlanCardsGrid
          plans={DISPLAY_PRICING_PLANS}
          inView={inView}
          highlightedPlanId={hoveredPlanId}
          checkingPlanId={checkingPlanId}
          currentPlanId={currentPlanId}
          onSubscribe={handleSubscribe}
          onStartFree={handleStartFree}
          onHoverPlan={setHoveredPlanId}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 text-center text-sm text-gray-500 dark:text-gray-500 max-w-xl mx-auto leading-relaxed"
        >
          Prices include GST where applicable.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingPlansSection;
