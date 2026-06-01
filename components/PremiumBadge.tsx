import React from 'react';
import { Crown } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { isActiveSubscription } from '../lib/premiumSubscriptionDisplay';
import PremiumSubscriptionTooltip from './PremiumSubscriptionTooltip';

interface PremiumBadgeProps {
  className?: string;
  /** Show plan details on hover (default true). */
  showTooltip?: boolean;
  /** Smaller badge for sidebar profile row. */
  compact?: boolean;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  className = '',
  showTooltip = true,
  compact = false,
}) => {
  const { subscription } = useSubscription();

  if (!isActiveSubscription(subscription)) return null;

  const badge = (
    <span
      className={`inline-flex max-w-full items-center rounded-md bg-[#1A1E26] font-semibold text-[#5E97F6] cursor-default ${
        compact
          ? 'gap-1 px-1.5 py-0.5 text-[10px]'
          : 'gap-1.5 px-2.5 py-1 text-xs'
      }`}
    >
      <Crown
        className={`shrink-0 text-amber-400 fill-amber-400/30 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`}
        strokeWidth={2.25}
      />
      Premium
    </span>
  );

  if (!showTooltip) {
    return <span className={`inline-flex ${className}`}>{badge}</span>;
  }

  return (
    <PremiumSubscriptionTooltip subscription={subscription} placement="bottom">
      <button
        type="button"
        className={`inline-flex shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 rounded-md ${className}`}
        aria-label="View premium plan details"
        onClick={(e) => e.stopPropagation()}
      >
        {badge}
      </button>
    </PremiumSubscriptionTooltip>
  );
};

export default PremiumBadge;
