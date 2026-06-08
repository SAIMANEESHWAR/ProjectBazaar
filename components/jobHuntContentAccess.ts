import { createContext, useContext, useEffect } from 'react';

/** Free users may only browse the first page of job listings. */
export const JOB_HUNT_FREE_MAX_PAGE = 1;

export interface JobHuntContentAccessContextValue {
  hasFullJobHuntAccess: boolean;
  promptUpgrade: () => void;
  guardPageChange: (page: number, onChange: (page: number) => void) => boolean;
}

export const JobHuntContentAccessContext = createContext<
  JobHuntContentAccessContextValue | undefined
>(undefined);

export function useJobHuntContentAccess(): JobHuntContentAccessContextValue {
  const ctx = useContext(JobHuntContentAccessContext);
  if (!ctx) {
    throw new Error('useJobHuntContentAccess must be used within JobHuntContentAccessProvider');
  }
  return ctx;
}

/** Keep free users on page 1 if subscription lapses or state was restored beyond limit. */
export function useClampJobHuntPage(
  currentPage: number,
  setCurrentPage: (page: number) => void
): void {
  const { hasFullJobHuntAccess } = useJobHuntContentAccess();
  useEffect(() => {
    if (!hasFullJobHuntAccess && currentPage > JOB_HUNT_FREE_MAX_PAGE) {
      setCurrentPage(JOB_HUNT_FREE_MAX_PAGE);
    }
  }, [hasFullJobHuntAccess, currentPage, setCurrentPage]);
}
