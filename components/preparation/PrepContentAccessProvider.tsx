import { useCallback, useMemo, useState, type ReactNode } from 'react';
import PremiumUpsellModal from '../PremiumUpsellModal';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  PREP_FREE_MAX_PAGE,
  PrepContentAccessContext,
} from './prepContentAccess';

export function PrepContentAccessProvider({ children }: { children: ReactNode }) {
  const { hasFeature } = useSubscription();
  const hasFullPrepAccess = hasFeature('preparation');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const promptUpgrade = useCallback(() => setUpgradeOpen(true), []);
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);

  const guardPageChange = useCallback(
    (page: number, onChange: (page: number) => void) => {
      if (hasFullPrepAccess || page <= PREP_FREE_MAX_PAGE) {
        onChange(page);
        return true;
      }
      promptUpgrade();
      return false;
    },
    [hasFullPrepAccess, promptUpgrade]
  );

  const requireFullAccess = useCallback(
    (onAllowed?: () => void) => {
      if (hasFullPrepAccess) {
        onAllowed?.();
        return true;
      }
      promptUpgrade();
      return false;
    },
    [hasFullPrepAccess, promptUpgrade]
  );

  const value = useMemo(
    () => ({
      hasFullPrepAccess,
      canViewAnswers: hasFullPrepAccess,
      promptUpgrade,
      guardPageChange,
      requireFullAccess,
    }),
    [hasFullPrepAccess, promptUpgrade, guardPageChange, requireFullAccess]
  );

  return (
    <PrepContentAccessContext.Provider value={value}>
      {children}
      <PremiumUpsellModal isOpen={upgradeOpen} onClose={closeUpgrade} />
    </PrepContentAccessContext.Provider>
  );
}
