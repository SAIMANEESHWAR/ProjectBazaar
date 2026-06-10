const STORAGE_KEY = 'pb_live_interview_job_prefill';

export interface LiveInterviewJobPrefill {
  jobId: string;
  jobTitle: string;
  jdText: string;
  resumeText: string;
  company?: string;
  source: 'job-hunt';
}

export function setLiveInterviewJobPrefill(payload: LiveInterviewJobPrefill): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeLiveInterviewJobPrefill(): LiveInterviewJobPrefill | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as LiveInterviewJobPrefill;
    if (
      parsed?.source !== 'job-hunt' ||
      typeof parsed.jobTitle !== 'string' ||
      typeof parsed.jdText !== 'string' ||
      typeof parsed.resumeText !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
