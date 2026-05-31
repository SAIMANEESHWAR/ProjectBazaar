import React from 'react';
import { useNavigation } from '../App';
import { PRICING_FEATURES } from '../data/pricingPlans';
import { UpgradePremiumButton } from './ui/UpgradePremiumButton';

interface SidebarPremiumCardProps {
  expanded: boolean;
  onNavigate?: () => void;
}

const SidebarPremiumCard: React.FC<SidebarPremiumCardProps> = ({ expanded, onNavigate }) => {
  const { navigateTo } = useNavigation();

  const handleUpgrade = () => {
    onNavigate?.();
    navigateTo('home');
    setTimeout(() => {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  if (!expanded) {
    return (
      <div className="group/premium relative px-2 pb-2">
        <UpgradePremiumButton
          compact
          onClick={handleUpgrade}
          highlightNumber={PRICING_FEATURES.length}
        />
        <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/premium:opacity-100">
          Upgrade to Premium
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-[#8e8e93]">
        Unlock all tools
      </p>
      <UpgradePremiumButton
        onClick={handleUpgrade}
        highlightNumber={PRICING_FEATURES.length}
      >
        Upgrade to Premium
      </UpgradePremiumButton>
      <p className="mt-2 text-center text-[10px] leading-snug text-gray-400 dark:text-[#636366]">
        Job hunt, prep mode, AI interviews & more
      </p>
    </div>
  );
};

export default SidebarPremiumCard;
