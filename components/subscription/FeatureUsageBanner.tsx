import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import type { SubscriptionFeatureId } from '../../lib/subscriptionFeatures';

interface FeatureUsageBannerProps {
  featureId: SubscriptionFeatureId;
}

const FeatureUsageBanner: React.FC<FeatureUsageBannerProps> = ({ featureId }) => {
  const { getFeatureUsage } = useSubscription();
  const usage = getFeatureUsage(featureId);

  if (usage.source !== 'trial') return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200/60 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200">
      <Sparkles className="h-4 w-4 text-[#ff7a00] shrink-0" aria-hidden />
      <span>
        Free trial: used <strong>{usage.used}</strong> of <strong>{usage.limit}</strong> completed
        uses
        {usage.remaining > 0 ? (
          <>
            {' '}
            (<strong>{usage.remaining}</strong> remaining)
          </>
        ) : (
          <> — limit reached</>
        )}
      </span>
    </div>
  );
};

export default FeatureUsageBanner;
