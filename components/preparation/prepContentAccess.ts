import { createContext, useContext, useEffect } from 'react';

/** Free users may only browse the first page of paginated prep lists. */
export const PREP_FREE_MAX_PAGE = 1;

export interface PrepContentAccessContextValue {
  hasFullPrepAccess: boolean;
  canViewAnswers: boolean;
  promptUpgrade: () => void;
  guardPageChange: (page: number, onChange: (page: number) => void) => boolean;
  requireFullAccess: (onAllowed?: () => void) => boolean;
}

export const PrepContentAccessContext = createContext<
  PrepContentAccessContextValue | undefined
>(undefined);

export function usePrepContentAccess(): PrepContentAccessContextValue {
  const ctx = useContext(PrepContentAccessContext);
  if (!ctx) {
    throw new Error('usePrepContentAccess must be used within PrepContentAccessProvider');
  }
  return ctx;
}

/** Keep free users on page 1 if subscription lapses or state was restored beyond limit. */
export function useClampPrepPage(
  currentPage: number,
  setCurrentPage: (page: number) => void
): void {
  const { hasFullPrepAccess } = usePrepContentAccess();
  useEffect(() => {
    if (!hasFullPrepAccess && currentPage > PREP_FREE_MAX_PAGE) {
      setCurrentPage(PREP_FREE_MAX_PAGE);
    }
  }, [hasFullPrepAccess, currentPage, setCurrentPage]);
}
