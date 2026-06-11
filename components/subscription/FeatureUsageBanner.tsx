import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import type { SubscriptionFeatureId } from '../../lib/subscriptionFeatures';

interface FeatureUsageBannerProps {
  featureId: SubscriptionFeatureId;
  compact?: boolean;
  /** Render inline in a toolbar row (no extra vertical margin). */
  inline?: boolean;
}

const FeatureUsageBanner: React.FC<FeatureUsageBannerProps> = ({
  featureId,
  compact = false,
  inline = false,
}) => {
  const { getFeatureUsage } = useSubscription();
  const usage = getFeatureUsage(featureId);

  if (usage.source !== 'trial') return null;

  if (compact) {
    const pill = (
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-orange-200/70 bg-white/80 px-2.5 py-1.5 text-[11px] leading-tight text-gray-600 shadow-sm backdrop-blur-sm dark:border-orange-900/40 dark:bg-gray-900/70 dark:text-gray-300 sm:px-3 sm:text-xs">
          <Sparkles className="h-3 w-3 shrink-0 text-[#ff7a00]" aria-hidden />
          <span className="truncate">
            Free trial · <strong className="font-semibold text-gray-800 dark:text-gray-100">{usage.used}/{usage.limit}</strong> used
            {usage.remaining > 0 ? (
              <> · <strong className="font-semibold text-[#ea580c]">{usage.remaining}</strong> left</>
            ) : (
              <> · limit reached</>
            )}
          </span>
        </div>
    );

    if (inline) return pill;

    return (
      <div className="mb-2 mt-1 flex justify-start px-1 sm:mb-2.5">
        {pill}
      </div>
    );
  }

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
