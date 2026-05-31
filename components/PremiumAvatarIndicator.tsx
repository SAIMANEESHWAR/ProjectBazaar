import React from 'react';
import { Crown } from 'lucide-react';
import type { SubscriptionCookiePayload } from '../lib/subscriptionCookie';
import PremiumSubscriptionTooltip from './PremiumSubscriptionTooltip';

interface PremiumAvatarIndicatorProps {
  subscription: SubscriptionCookiePayload;
  /** Collapsed sidebar: tooltip opens to the right. Expanded: same. */
  tooltipPlacement?: 'bottom' | 'right';
}

const PremiumAvatarIndicator: React.FC<PremiumAvatarIndicatorProps> = ({
  subscription,
  tooltipPlacement = 'right',
}) => (
  <PremiumSubscriptionTooltip subscription={subscription} placement={tooltipPlacement}>
    <button
      type="button"
      className="absolute -bottom-0.5 -right-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#1A1E26] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80"
      aria-label="View premium plan details"
      onClick={(e) => e.stopPropagation()}
    >
      <Crown
        className="h-2.5 w-2.5 text-amber-400 fill-amber-400/40"
        strokeWidth={2.5}
      />
    </button>
  </PremiumSubscriptionTooltip>
);

export default PremiumAvatarIndicator;
