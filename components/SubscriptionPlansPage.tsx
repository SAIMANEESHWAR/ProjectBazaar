import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowLeft, Crown } from 'lucide-react';
import { useAuth, useNavigation } from '../context/appContext';
import { useSubscription } from '../context/SubscriptionContext';
import { DISPLAY_PRICING_PLANS, PRICING_PLANS, type PlanId } from '../data/pricingPlans';
import { clearPendingPlan, savePendingPlan } from '../lib/pendingPlanStorage';
import {
  clearSubscriptionPlansHighlight,
  getSubscriptionPlansHighlight,
} from '../lib/subscriptionNavigation';
import { getAvailableUpgrades, isPaidPlanId, isUpgrade } from '../lib/planUpgrade';
import { getActiveSubscription } from '../services/subscriptionApi';
import { PlanCardsGrid } from './subscription/PlanCardsGrid';

const SubscriptionPlansPage: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { navigateTo } = useNavigation();
  const { isLoggedIn, userId, userEmail } = useAuth();
  const { subscription } = useSubscription();
  const [checkingPlanId, setCheckingPlanId] = useState<string | null>(null);
  const [paymentDetailsError, setPaymentDetailsError] = useState<string | null>(null);
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(() =>
    getSubscriptionPlansHighlight()
  );
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(
    subscription?.planId ?? null
  );

  useEffect(() => {
    clearSubscriptionPlansHighlight();
  }, []);

  useEffect(() => {
    if (subscription?.planId) {
      setCurrentPlanId(subscription.planId);
    }
  }, [subscription?.planId]);

  useEffect(() => {
    if (!userId) return;
    void getActiveSubscription(userId).then((record) => {
      if (record?.planId) setCurrentPlanId(record.planId);
    });
  }, [userId]);

  const displayPlans = useMemo(() => {
    if (!currentPlanId || !isPaidPlanId(currentPlanId)) {
      return DISPLAY_PRICING_PLANS;
    }
    return [DISPLAY_PRICING_PLANS[0], ...PRICING_PLANS];
  }, [currentPlanId]);

  const availableUpgrades = useMemo(
    () => getAvailableUpgrades(currentPlanId),
    [currentPlanId]
  );

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

    if (currentPlanId && isPaidPlanId(currentPlanId) && !isUpgrade(currentPlanId, planId)) {
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
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigateTo(isLoggedIn ? 'dashboard' : 'home')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#ff7a00] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#ff7a00]" />
            <span className="font-semibold text-gray-900 dark:text-white">Subscription plans</span>
          </div>
        </div>
      </div>

      <section ref={ref} className="relative py-12 md:py-20 overflow-hidden">
        <div className="relative max-w-[1400px] mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 md:mb-14"
          >
            <p className="text-gray-500 dark:text-[#a1a1a1] uppercase tracking-[0.2em] text-sm font-semibold mb-4">
              Pricing
            </p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              Choose your <span className="text-[#ff7a00]">career plan</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-[640px] mx-auto">
              {currentPlanId && isPaidPlanId(currentPlanId)
                ? availableUpgrades.length > 0
                  ? `You're on the ${subscription?.planName ?? currentPlanId} plan. Upgrade anytime for more features.`
                  : `You're on the ${subscription?.planName ?? currentPlanId} plan — our best tier. Enjoy full access.`
                : 'Unlock dashboard tools for job hunt, interview prep, and portfolio — priced for the Indian market in INR.'}
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
            plans={displayPlans}
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
            Prices include GST where applicable. Upgrades are charged at the full plan price; your
            previous plan is replaced immediately.
          </motion.p>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPlansPage;
