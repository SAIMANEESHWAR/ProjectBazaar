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
  <span className="absolute -bottom-0.5 -right-0.5 z-10 group">
    <span
      className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#1A1E26] shadow-sm"
      aria-label="Premium member"
    >
      <Crown
        className="h-2.5 w-2.5 text-amber-400 fill-amber-400/40"
        strokeWidth={2.5}
      />
    </span>
    <PremiumSubscriptionTooltip
      subscription={subscription}
      placement={tooltipPlacement}
    />
  </span>
);

export default PremiumAvatarIndicator;
