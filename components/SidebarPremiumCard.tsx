import React from 'react';
import { ArrowUp, Crown } from 'lucide-react';
import { useNavigation } from '../App';
import { goToSubscriptionPlans } from '../lib/subscriptionNavigation';

interface SidebarPremiumCardProps {
  expanded: boolean;
  onNavigate?: () => void;
}

const SidebarPremiumCard: React.FC<SidebarPremiumCardProps> = ({ expanded, onNavigate }) => {
  const { navigateTo } = useNavigation();

  const handleUpgrade = () => {
    onNavigate?.();
    goToSubscriptionPlans(navigateTo);
  };

  if (!expanded) {
    return (
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={handleUpgrade}
          className="group relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5dcc8] via-[#e8a574] to-[#b8652a] shadow-md transition-transform hover:scale-105"
          title="Upgrade to Premium"
          aria-label="Upgrade to Premium"
        >
          <Crown className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
          <div className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-50">
            Get Premium
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f5dcc8] via-[#edb88a] to-[#b8652a] p-4 shadow-md">
        <h3 className="text-base font-bold leading-tight text-[#1a2744]">Get Premium Now!</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#3d4a5c]">
          Reach special features by subscribing to our plan.
        </p>
        <button
          type="button"
          onClick={handleUpgrade}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-semibold text-[#ff7a00] shadow-sm transition-all hover:bg-orange-50 hover:shadow-md"
        >
          Upgrade Now
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default SidebarPremiumCard;
