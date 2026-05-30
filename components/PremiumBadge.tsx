import React from 'react';
import { Crown } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { isActiveSubscription } from '../lib/premiumSubscriptionDisplay';
import PremiumSubscriptionTooltip from './PremiumSubscriptionTooltip';

interface PremiumBadgeProps {
  className?: string;
  /** Show plan details on hover (default true). */
  showTooltip?: boolean;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  className = '',
  showTooltip = true,
}) => {
  const { subscription } = useSubscription();

  if (!isActiveSubscription(subscription)) return null;

  return (
    <span className={`relative group inline-flex ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#1A1E26] px-2.5 py-1 text-xs font-semibold text-[#5E97F6] cursor-default">
        <Crown
          className="h-3.5 w-3.5 shrink-0 text-amber-400 fill-amber-400/30"
          strokeWidth={2.25}
        />
        Premium
      </span>
      {showTooltip && (
        <PremiumSubscriptionTooltip subscription={subscription} placement="bottom" />
      )}
    </span>
  );
};

export default PremiumBadge;
