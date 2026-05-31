import React from 'react';
import type { SubscriptionCookiePayload } from '../lib/subscriptionCookie';
import { getSubscriptionDisplayInfo } from '../lib/premiumSubscriptionDisplay';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface PremiumSubscriptionTooltipProps {
  subscription: SubscriptionCookiePayload;
  /** Tooltip opens above (header/badge) or to the right (sidebar). */
  placement?: 'bottom' | 'right';
  className?: string;
  children: React.ReactNode;
}

export function PremiumSubscriptionTooltipContent({
  subscription,
}: {
  subscription: SubscriptionCookiePayload;
}) {
  const info = getSubscriptionDisplayInfo(subscription);

  return (
    <div className="w-56 text-left">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
        Premium plan
      </p>
      <p className="mt-1 text-sm font-bold text-white">{info.planName}</p>
      {info.priceLabel && <p className="text-xs text-gray-300">{info.priceLabel}</p>}
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
    </div>
  );
}

const PremiumSubscriptionTooltip: React.FC<PremiumSubscriptionTooltipProps> = ({
  subscription,
  placement = 'bottom',
  className = '',
  children,
}) => {
  const side = placement === 'right' ? 'right' : 'bottom';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={8}
          collisionPadding={12}
          className={`z-[200] w-auto max-w-[min(16rem,calc(100vw-1.5rem))] border-0 bg-gray-900 px-3.5 py-3 text-white shadow-xl ${className}`}
        >
          <PremiumSubscriptionTooltipContent subscription={subscription} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PremiumSubscriptionTooltip;
