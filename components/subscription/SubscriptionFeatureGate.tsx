import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth, useNavigation } from '../../context/appContext';
import { useSubscription } from '../../context/SubscriptionContext';
import type { SubscriptionFeatureId } from '../../lib/subscriptionFeatures';
import { FREE_USE_LIMIT, isAlwaysFreeFeature } from '../../lib/subscriptionFeatures';
import { savePendingPlan } from '../../lib/pendingPlanStorage';
import { goToSubscriptionPlans } from '../../lib/subscriptionNavigation';
import FeatureStaticPreview from './FeatureStaticPreview';
import FeatureUsageBanner from './FeatureUsageBanner';

interface SubscriptionFeatureGateProps {
  featureId: SubscriptionFeatureId;
  children: React.ReactNode;
  /** Hide the "Free trial: used X of Y" strip (e.g. Prep Mode uses its own page/answer limits). */
  hideUsageBanner?: boolean;
}

const SubscriptionFeatureGate: React.FC<SubscriptionFeatureGateProps> = ({
  featureId,
  children,
  hideUsageBanner = false,
}) => {
  const { canUseFeature, getFeatureUsage, isLoading } = useSubscription();
  const { isLoggedIn } = useAuth();
  const { navigateTo } = useNavigation();

  if (isAlwaysFreeFeature(featureId)) {
    return <>{children}</>;
  }

  if (isLoading && isLoggedIn) {
    return (
      <div className="flex flex-1 min-h-[200px] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff7a00] border-t-transparent animate-spin" />
      </div>
    );
  }

  const usage = getFeatureUsage(featureId);
  const hasTrialRemaining =
    isLoggedIn && usage.source === 'trial' && usage.remaining > 0;

  if (canUseFeature(featureId) || hasTrialRemaining) {
    return (
      <>
        {!hideUsageBanner && <FeatureUsageBanner featureId={featureId} />}
        {children}
      </>
    );
  }

  const exhausted = usage.source === 'exhausted' || usage.remaining <= 0;

  const goUpgrade = () => {
    goToSubscriptionPlans(navigateTo, { highlightPlanId: 'yearly' });
  };

  const goAuth = () => {
    savePendingPlan('yearly');
    navigateTo('auth');
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col w-full">
      <p className="mb-4 text-sm text-red-500/90">
        {exhausted ? (
          <>
            You&apos;ve used both free trials for this feature.{' '}
            <button
              type="button"
              onClick={goUpgrade}
              className="underline text-[#ff7a00] hover:text-[#ff9533] font-medium"
            >
              Upgrade to Premium
            </button>{' '}
            to continue.
          </>
        ) : (
          <>
            Note: Your current plan does not support this feature.{' '}
            <button
              type="button"
              onClick={goUpgrade}
              className="underline text-[#ff7a00] hover:text-[#ff9533] font-medium"
            >
              Upgrade to Premium
            </button>
          </>
        )}
      </p>

      <div className="relative flex-1 min-h-[min(720px,calc(100vh-11rem))] rounded-2xl overflow-hidden border border-gray-200/80 bg-white shadow-sm">
        <div
          className="h-full min-h-full overflow-hidden select-none pointer-events-none"
          style={{ filter: 'blur(5px)' }}
          aria-hidden
        >
          <FeatureStaticPreview featureId={featureId} />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px] pointer-events-auto">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#ff7a00] bg-white shadow-[0_0_32px_rgba(255,122,0,0.25)]"
            aria-hidden
          >
            <Lock className="h-7 w-7 text-[#ff7a00]" strokeWidth={2} />
          </div>
          <p className="text-center text-gray-800 text-sm px-4 font-medium max-w-sm">
            {exhausted ? (
              <>
                Free trial complete ({FREE_USE_LIMIT} uses).{' '}
                <button
                  type="button"
                  onClick={goUpgrade}
                  className="text-[#ff7a00] font-semibold underline hover:text-[#ff9533]"
                >
                  Upgrade to Premium
                </button>
              </>
            ) : (
              <>
                Click here to{' '}
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={goUpgrade}
                    className="text-[#ff7a00] font-semibold underline hover:text-[#ff9533]"
                  >
                    upgrade to Premium
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goAuth}
                    className="text-[#ff7a00] font-semibold underline hover:text-[#ff9533]"
                  >
                    Login / Sign Up
                  </button>
                )}
              </>
            )}
          </p>
          {exhausted && usage.used > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Used {usage.used} of {usage.limit} free completed uses
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionFeatureGate;
