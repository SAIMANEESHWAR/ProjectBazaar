import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { JobListing } from '../services/buyerApi';

export interface JobHuntShellContextValue {
  jobOpenRequest: { job: JobListing; saveId: string } | null;
  requestOpenJobDetail: (job: JobListing, saveId: string) => void;
  consumeJobOpenRequest: () => void;
  /** Incrementing tick — JobHuntPage switches main list to saved jobs when this changes */
  savedJobsNavTick: number;
  goToSavedJobsList: () => void;
  /** Incrementing tick — JobHuntPage switches main list to all roles */
  browseAllNavTick: number;
  goToBrowseAllJobs: () => void;
}

const defaultValue: JobHuntShellContextValue = {
  jobOpenRequest: null,
  requestOpenJobDetail: () => {},
  consumeJobOpenRequest: () => {},
  savedJobsNavTick: 0,
  goToSavedJobsList: () => {},
  browseAllNavTick: 0,
  goToBrowseAllJobs: () => {},
};

const JobHuntShellContext = createContext<JobHuntShellContextValue>(defaultValue);

export function JobHuntShellProvider({ children }: { children: ReactNode }) {
  const [jobOpenRequest, setJobOpenRequest] = useState<{
    job: JobListing;
    saveId: string;
  } | null>(null);
  const [savedJobsNavTick, setSavedJobsNavTick] = useState(0);
  const [browseAllNavTick, setBrowseAllNavTick] = useState(0);

  const requestOpenJobDetail = useCallback((job: JobListing, saveId: string) => {
    setJobOpenRequest({ job, saveId });
  }, []);

  const consumeJobOpenRequest = useCallback(() => {
    setJobOpenRequest(null);
  }, []);

  const goToSavedJobsList = useCallback(() => {
    setSavedJobsNavTick((t) => t + 1);
  }, []);

  const goToBrowseAllJobs = useCallback(() => {
    setBrowseAllNavTick((t) => t + 1);
  }, []);

  const value = useMemo(
    () => ({
      jobOpenRequest,
      requestOpenJobDetail,
      consumeJobOpenRequest,
      savedJobsNavTick,
      goToSavedJobsList,
      browseAllNavTick,
      goToBrowseAllJobs,
    }),
    [
      jobOpenRequest,
      requestOpenJobDetail,
      consumeJobOpenRequest,
      savedJobsNavTick,
      goToSavedJobsList,
      browseAllNavTick,
      goToBrowseAllJobs,
    ]
  );

  return (
    <JobHuntShellContext.Provider value={value}>{children}</JobHuntShellContext.Provider>
  );
}

export function useJobHuntShell(): JobHuntShellContextValue {
  return useContext(JobHuntShellContext);
}
