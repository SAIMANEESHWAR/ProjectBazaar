import { useCallback, useMemo, useState, type ReactNode } from 'react';
import PremiumUpsellModal from './PremiumUpsellModal';
import { useSubscription } from '../context/SubscriptionContext';
import {
  JOB_HUNT_FREE_MAX_PAGE,
  JobHuntContentAccessContext,
} from './jobHuntContentAccess';

export function JobHuntContentAccessProvider({ children }: { children: ReactNode }) {
  const { hasFeature } = useSubscription();
  const hasFullJobHuntAccess = hasFeature('job-hunt');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const promptUpgrade = useCallback(() => setUpgradeOpen(true), []);
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);

  const guardPageChange = useCallback(
    (page: number, onChange: (page: number) => void) => {
      if (hasFullJobHuntAccess || page <= JOB_HUNT_FREE_MAX_PAGE) {
        onChange(page);
        return true;
      }
      promptUpgrade();
      return false;
    },
    [hasFullJobHuntAccess, promptUpgrade]
  );

  const value = useMemo(
    () => ({
      hasFullJobHuntAccess,
      promptUpgrade,
      guardPageChange,
    }),
    [hasFullJobHuntAccess, promptUpgrade, guardPageChange]
  );

  return (
    <JobHuntContentAccessContext.Provider value={value}>
      {children}
      <PremiumUpsellModal isOpen={upgradeOpen} onClose={closeUpgrade} />
    </JobHuntContentAccessContext.Provider>
  );
}
