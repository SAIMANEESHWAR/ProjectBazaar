import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crown } from 'lucide-react';
import { useAuth, useNavigation } from '../context/appContext';
import { usePremium } from '../context/PremiumContext';
import { useSubscription } from '../context/SubscriptionContext';
import { PRICING_PLANS, formatInr, type PlanId } from '../data/pricingPlans';
import { getStoredAuth } from '../lib/authStorage';
import { clearPendingPlan, getPendingPlan } from '../lib/pendingPlanStorage';
import { isPaidPlanId, isUpgrade } from '../lib/planUpgrade';
import { goToSubscriptionPlans } from '../lib/subscriptionNavigation';
import { getRazorpayScriptStatus } from '../lib/razorpayCheckout';
import { trackCustomEvent } from '../lib/analytics';
import { runSubscriptionPaymentFlow } from '../lib/subscriptionPaymentFlow';
import {
  createSubscription,
  getActiveSubscription,
  subscriptionRecordToCookie,
} from '../services/subscriptionApi';

const SubscriptionCheckoutPage: React.FC = () => {
  const { isLoggedIn, userId, userEmail } = useAuth();
  const { navigateTo } = useNavigation();
  const { setIsPremium } = usePremium();
  const { applySubscription, subscription, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [invalidCheckout, setInvalidCheckout] = useState(false);
  const [paymentDetailsRequired, setPaymentDetailsRequired] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [razorpayScriptError, setRazorpayScriptError] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(subscription?.planId ?? null);
  const preflightDoneRef = useRef(false);

  const storedAuth = useMemo(() => getStoredAuth(), [isLoggedIn, userId, authReady]);
  const effectiveUserId = userId ?? storedAuth.userId;
  const effectiveEmail = userEmail ?? storedAuth.email ?? undefined;
  const effectiveLoggedIn = isLoggedIn || storedAuth.isLoggedIn;
  const planId = useMemo(() => getPendingPlan(), [authReady]);
  const plan = useMemo(
    () => (planId ? PRICING_PLANS.find((p) => p.id === planId) ?? null : null),
    [planId]
  );
  const isUpgradeCheckout = Boolean(
    currentPlanId && isPaidPlanId(currentPlanId) && plan && isUpgrade(currentPlanId, plan.id)
  );

  useEffect(() => {
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!plan) return;
    trackCustomEvent('view_subscription_checkout', {
      plan_id: plan.id,
      plan_name: plan.name,
      value: plan.priceInr,
      currency: 'INR',
      is_upgrade: isUpgradeCheckout,
    });
  }, [plan, isUpgradeCheckout]);

  useEffect(() => {
    const { status, error: scriptErr } = getRazorpayScriptStatus();
    if (status === 'error' && scriptErr) {
      setRazorpayScriptError(scriptErr);
    }
  }, [checkoutReady, paying]);

  const finishSubscription = useCallback(
    (record: Parameters<typeof subscriptionRecordToCookie>[0]) => {
      applySubscription(subscriptionRecordToCookie(record));
      setIsPremium(true);
      clearPendingPlan();
      void refreshSubscription();
      navigateTo('dashboard');
    },
    [applySubscription, navigateTo, refreshSubscription, setIsPremium]
  );

  const startPayment = useCallback(async () => {
    if (!effectiveUserId || !plan || paying) return;

    setError(null);
    setDemoMode(false);
    setPaying(true);

    try {
      const outcome = await runSubscriptionPaymentFlow({
        userId: effectiveUserId,
        planId: plan.id as PlanId,
        userEmail: effectiveEmail,
        upgradeFromPlanId: isUpgradeCheckout ? currentPlanId ?? undefined : undefined,
      });

      if (outcome.status === 'success') {
        finishSubscription(outcome.record);
        return;
      }
      if (outcome.status === 'demo_mode') {
        setDemoMode(true);
        setError(outcome.message);
        return;
      }
      if (outcome.status === 'cancelled') {
        return;
      }
      setError(outcome.message);
    } finally {
      setPaying(false);
    }
  }, [
    currentPlanId,
    effectiveEmail,
    effectiveUserId,
    finishSubscription,
    isUpgradeCheckout,
    paying,
    plan,
  ]);

  const handleDevActivate = async () => {
    if (!effectiveUserId || !plan) return;
    setError(null);
    setPaying(true);
    try {
      const result = await createSubscription(effectiveUserId, plan.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      finishSubscription(result.data);
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    if (!authReady || !effectiveLoggedIn || !effectiveUserId || !plan) {
      if (authReady) setLoading(false);
      return;
    }
    if (preflightDoneRef.current) return;
    preflightDoneRef.current = true;

    void (async () => {
      setLoading(true);
      if (!effectiveEmail?.trim()) {
        setPaymentDetailsRequired(true);
        setLoading(false);
        return;
      }
      const record = await getActiveSubscription(effectiveUserId);
      const activePlanId = record?.planId ?? subscription?.planId ?? null;
      setCurrentPlanId(activePlanId);

      if (activePlanId && isPaidPlanId(activePlanId)) {
        if (!isUpgrade(activePlanId, plan.id)) {
          clearPendingPlan();
          setInvalidCheckout(true);
          setLoading(false);
          return;
        }
      }

      setCheckoutReady(true);
      setLoading(false);
    })();
  }, [authReady, effectiveEmail, effectiveLoggedIn, effectiveUserId, plan, subscription?.planId]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] dark:bg-[#0a0a0a]">
        <div className="w-10 h-10 rounded-full border-2 border-[#ff7a00] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!effectiveLoggedIn || !effectiveUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] dark:bg-[#0a0a0a] px-5">
        <div className="text-center max-w-sm">
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to continue checkout.</p>
          <button
            type="button"
            onClick={() => navigateTo('auth')}
            className="px-6 py-3 rounded-xl bg-[#ff7a00] text-white font-semibold"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] dark:bg-[#0a0a0a] px-5">
        <div className="text-center max-w-sm">
          <p className="text-gray-600 dark:text-gray-400 mb-6">No plan selected.</p>
          <button
            type="button"
            onClick={() => goToSubscriptionPlans(navigateTo)}
            className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold"
          >
            View plans
          </button>
        </div>
      </div>
    );
  }

  if (invalidCheckout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] dark:bg-[#0a0a0a] px-5">
        <div className="text-center max-w-sm w-full rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Plan change not available
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            You cannot purchase this plan from checkout. Choose an upgrade option on the plans page.
          </p>
          <button
            type="button"
            onClick={() => goToSubscriptionPlans(navigateTo)}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#ff7a00] to-[#ff9533]"
          >
            View plans
          </button>
        </div>
      </div>
    );
  }

  if (paymentDetailsRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] dark:bg-[#0a0a0a] px-5">
        <div className="text-center max-w-sm w-full rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-[#1a1a1a] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Payment details required
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Add your email in Settings before completing payment. Razorpay needs it for receipts and
            payment confirmation.
          </p>
          <button
            type="button"
            onClick={() => {
              clearPendingPlan();
              navigateTo('dashboard');
            }}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#ff7a00] to-[#ff9533] mb-2"
          >
            Go to Settings
          </button>
          <button
            type="button"
            onClick={() => {
              clearPendingPlan();
              goToSubscriptionPlans(navigateTo);
            }}
            className="w-full py-2 text-sm text-gray-500 hover:underline"
          >
            Back to plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] dark:bg-[#0a0a0a] px-5">
      <div className="text-center max-w-md w-full rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-6 shadow-sm">
        {loading && (
          <>
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#ff7a00] border-t-transparent animate-spin mb-4" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">Preparing checkout…</p>
          </>
        )}

        {checkoutReady && !loading && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1E26]">
              <Crown className="h-6 w-6 text-amber-400 fill-amber-400/30" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {isUpgradeCheckout ? `Upgrade to ${plan.name}` : plan.name}
            </h2>
            {isUpgradeCheckout && currentPlanId && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Upgrading from {subscription?.planName ?? currentPlanId}. Full price applies; your
                current plan will be replaced.
              </p>
            )}
            <p className="text-2xl font-bold text-[#ff7a00] mb-1">
              {formatInr(plan.priceInr)}
              <span className="text-sm font-normal text-gray-500">{plan.periodLabel}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Click below to open secure Razorpay checkout (UPI, cards, wallets).
            </p>

            {razorpayScriptError && (
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3">
                {razorpayScriptError} If checkout does not open, disable ad blockers and allow{' '}
                <span className="font-mono text-xs">checkout.razorpay.com</span>.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
            )}

            <button
              type="button"
              disabled={paying}
              onClick={() => void startPayment()}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#ff7a00] to-[#ff9533] disabled:opacity-60 mb-3"
            >
              {paying ? 'Opening Razorpay…' : `Pay ${formatInr(plan.priceInr)} with Razorpay`}
            </button>

            {demoMode && (
              <button
                type="button"
                disabled={paying}
                onClick={() => void handleDevActivate()}
                className="w-full py-3 rounded-xl font-semibold border border-dashed border-gray-400 text-gray-700 dark:text-gray-300 disabled:opacity-60 mb-3"
              >
                Activate plan (dev / test mode)
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                clearPendingPlan();
                goToSubscriptionPlans(navigateTo);
              }}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Back to plans
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCheckoutPage;
