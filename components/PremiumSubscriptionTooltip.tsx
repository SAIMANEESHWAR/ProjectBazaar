import React from 'react';
import type { SubscriptionCookiePayload } from '../lib/subscriptionCookie';
import { getSubscriptionDisplayInfo } from '../lib/premiumSubscriptionDisplay';

interface PremiumSubscriptionTooltipProps {
  subscription: SubscriptionCookiePayload;
  /** Tooltip opens above (header) or to the right (sidebar). */
  placement?: 'bottom' | 'right';
  className?: string;
}

const PremiumSubscriptionTooltip: React.FC<PremiumSubscriptionTooltipProps> = ({
  subscription,
  placement = 'bottom',
  className = '',
}) => {
  const info = getSubscriptionDisplayInfo(subscription);

  const positionClass =
    placement === 'right'
      ? 'left-full top-1/2 -translate-y-1/2 ml-2'
      : 'top-full right-0 mt-2';

  const arrowClass =
    placement === 'right'
      ? 'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900'
      : 'absolute bottom-full right-4 border-4 border-transparent border-b-gray-900';

  return (
    <div
      className={`pointer-events-none absolute z-50 w-56 rounded-xl bg-gray-900 px-3.5 py-3 text-left text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 ${positionClass} ${className}`}
      role="tooltip"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
        Premium plan
      </p>
      <p className="mt-1 text-sm font-bold">{info.planName}</p>
      {info.priceLabel && (
        <p className="text-xs text-gray-300">{info.priceLabel}</p>
      )}
      <div className="mt-2.5 space-y-1 border-t border-white/10 pt-2.5 text-[11px] text-gray-300">
        <p>
          <span className="text-gray-400">Started:</span> {info.startDate}
        </p>
        <p>
          <span className="text-gray-400">{info.isLifetime ? 'Access:' : 'Renews / ends:'}</span>{' '}
          {info.endDateLabel}
        </p>
        <p>
          <span className="text-gray-400">Features unlocked:</span> {info.featureCount}
        </p>
      </div>
      <div className={arrowClass} />
    </div>
  );
};

export default PremiumSubscriptionTooltip;
