import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import Pagination from './Pagination';
import { fetchJobs, fetchSavedResumeSkillNames, getJobHuntUserId, toggleJobSave } from '../services/buyerApi';
import type { JobListing } from '../services/buyerApi';
import { splitSkillsToChips } from '../lib/jobSkills';
import { computeJobSkillMatchPercent } from '../lib/jobSkillMatch';
import { useJobHuntShell } from '../context/JobHuntShellContext';
import jobHuntHeroImage from './icons/vecteezy_png-3d-render-of-a-woman-working-on-a-laptop-against_67218466.png';

interface JobHuntPageProps {
  toggleSidebar?: () => void;
}

const SAVED_KEY = 'pb_job_hunt_saved';

function formatJobDate(ts?: number): string {
  if (ts == null || Number.isNaN(ts)) return '';
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calendar-day distance from posting date to today (local): “Posted today”, “Posted N days ago” */
function relativePosted(ts?: number): string {
  if (ts == null || Number.isNaN(ts)) return '';
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const posted = new Date(ms);
  if (Number.isNaN(posted.getTime())) return '';

  const postedDay = startOfLocalDay(posted);
  const today = startOfLocalDay(new Date());
  const diffDays = Math.round((today.getTime() - postedDay.getTime()) / 86400000);

  if (diffDays < 0) {
    return `Posted ${posted.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted 1 day ago';
  if (diffDays <= 999) {
    return `Posted ${diffDays} days ago`;
  }
  const label = formatJobDate(ts);
  return label ? `Posted ${label}` : '';
}

function companyInitials(name?: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

/** High-res favicon for known boards when company logo is missing / broken */
function providerLogoUrl(sourcePlatform?: string): string | undefined {
  const raw = sourcePlatform?.trim().toLowerCase();
  if (!raw) return undefined;
  const pairs: [string, string][] = [
    ['indeed', 'indeed.com'],
    ['naukri', 'naukri.com'],
    ['internshala', 'internshala.com'],
    ['linkedin', 'linkedin.com'],
    ['glassdoor', 'glassdoor.com'],
    ['foundit', 'foundit.in'],
    ['monster', 'foundit.in'],
    ['shine', 'shine.com'],
    ['cutshort', 'cutshort.io'],
    ['wellfound', 'wellfound.com'],
    ['angel', 'wellfound.com'],
  ];
  for (const [needle, domain] of pairs) {
    if (raw.includes(needle)) {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    }
  }
  return undefined;
}

/** Hash company name to a stable pastel for logo tiles */
function logoTone(name?: string): { bg: string; text: string } {
  const palettes = [
    { bg: 'bg-amber-100', text: 'text-amber-900' },
    { bg: 'bg-sky-100', text: 'text-sky-900' },
    { bg: 'bg-violet-100', text: 'text-violet-900' },
    { bg: 'bg-emerald-100', text: 'text-emerald-900' },
    { bg: 'bg-rose-100', text: 'text-rose-900' },
  ];
  let h = 0;
  const s = name || 'x';
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % 997;
  return palettes[h % palettes.length];
}

function JobCompanyAvatar({
  company,
  logoUrl,
  sourcePlatform,
}: {
  company?: string;
  logoUrl?: string;
  sourcePlatform?: string;
}) {
  const [companyImgFailed, setCompanyImgFailed] = useState(false);
  const [providerImgFailed, setProviderImgFailed] = useState(false);
  const companySrc = logoUrl?.trim();
  const providerSrc = providerLogoUrl(sourcePlatform);

  const showCompany = Boolean(companySrc && !companyImgFailed);
  const showProvider = !showCompany && Boolean(providerSrc && !providerImgFailed);
  const tone = logoTone(company);

  return (
    <div
      className="flex h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
      aria-hidden
      title={sourcePlatform ? `Listed on ${sourcePlatform}` : undefined}
    >
      {showCompany ? (
        <img
          src={companySrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setCompanyImgFailed(true)}
        />
      ) : showProvider ? (
        <img
          src={providerSrc}
          alt=""
          className="h-full w-full object-contain p-2"
          onError={() => setProviderImgFailed(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center text-base font-bold ${tone.bg} ${tone.text}`}
        >
          {companyInitials(company)}
        </div>
      )}
    </div>
  );
}

function matchBadgeColors(percent: number): {
  pill: string;
  track: string;
  arc: string;
} {
  const p = Math.max(0, Math.min(100, percent));
  if (p < 40) {
    return {
      pill: 'border-rose-200 bg-rose-50 text-rose-950',
      track: '#fecdd3',
      arc: '#e11d48',
    };
  }
  if (p < 65) {
    return {
      pill: 'border-amber-200 bg-amber-50 text-amber-950',
      track: '#fde68a',
      arc: '#d97706',
    };
  }
  if (p < 85) {
    return {
      pill: 'border-sky-200 bg-sky-50 text-sky-950',
      track: '#bae6fd',
      arc: '#0284c7',
    };
  }
  return {
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    track: '#d1fae5',
    arc: '#059669',
  };
}

function JobMatchBadge({ percent }: { percent: number | null }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const offset = percent != null ? c * (1 - percent / 100) : 0;

  if (percent === null) {
    return (
      <span
        className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500"
        title="Add skills under Settings → Resume and save to see how roles match your profile"
      >
        No skills to match
      </span>
    );
  }

  const { pill, track, arc } = matchBadgeColors(percent);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pill}`}
      title="Share of your resume skills found in this job’s description or required skills"
    >
      <svg width={20} height={20} viewBox="0 0 20 20" className="shrink-0 -rotate-90" aria-hidden>
        <circle cx="10" cy="10" r={r} fill="none" stroke={track} strokeWidth="2.5" />
        <circle
          cx="10"
          cy="10"
          r={r}
          fill="none"
          stroke={arc}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      {percent}% match
    </span>
  );
}

function SourcePlatformRow({ sourcePlatform }: { sourcePlatform: string }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoSrc = providerLogoUrl(sourcePlatform);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Source</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {logoSrc && !logoFailed ? (
          <img
            src={logoSrc}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg border border-gray-100 bg-white object-contain p-1.5 shadow-sm"
            onError={() => setLogoFailed(true)}
          />
        ) : null}
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600">
          {sourcePlatform}
        </span>
      </div>
    </div>
  );
}

type WorkMode = 'remote' | 'hybrid' | 'onsite';

function jobWorkBlob(job: JobListing): string {
  return `${job.location || ''} ${job.description || ''} ${job.job_title || ''}`.toLowerCase();
}

function matchesWorkMode(job: JobListing, mode: WorkMode): boolean {
  const b = jobWorkBlob(job);
  if (mode === 'remote') {
    return (
      /\bremote\b/.test(b) ||
      b.includes('work from home') ||
      b.includes('wfh')
    );
  }
  if (mode === 'hybrid') return /\bhybrid\b/.test(b);
  if (mode === 'onsite') {
    if (/\bremote\b/.test(b) || /\bhybrid\b/.test(b) || b.includes('wfh')) return false;
    return b.length > 0;
  }
  return true;
}

function loadSavedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

/** Matches list/card save key so sidebar Save uses the same id as the star on the card */
type JobDetailSelection = { job: JobListing; saveId: string };

interface JobDetailPanelProps {
  job: JobListing;
  onClose: () => void;
  saved: boolean;
  onToggleSave: () => void;
  openApply: (job: JobListing) => void;
  userSkillNames: string[];
}

function JobDetailPanel({
  job,
  onClose,
  saved,
  onToggleSave,
  openApply,
  userSkillNames,
}: JobDetailPanelProps) {
  const posted =
    relativePosted(job.scraped_at ?? job.created_at) ||
    formatJobDate(job.scraped_at ?? job.created_at);
  const desc = job.description?.trim() || '';
  const matchPercent = computeJobSkillMatchPercent(userSkillNames, job);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="job-detail-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close job details"
      />
      <aside className="absolute right-0 top-0 flex h-full max-h-[100dvh] w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl sm:max-w-xl">
        <header className="shrink-0 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 flex-1 gap-4">
              <JobCompanyAvatar
                company={job.company}
                logoUrl={job.company_logo}
                sourcePlatform={job.source_platform}
              />
              <div className="min-w-0">
                <h2
                  id="job-detail-title"
                  className="text-xl font-bold leading-snug text-black"
                >
                  {job.job_title || 'Untitled role'}
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-600">{job.company || 'Company'}</p>
                <p className="mt-2 text-sm font-bold text-gray-900">
                  {job.salary?.trim() ? job.salary : 'Not disclosed'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              <JobMatchBadge percent={matchPercent} />
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 text-sm text-gray-700">
            {job.location ? (
              <div className="flex gap-2">
                <span className="shrink-0 text-gray-400" aria-hidden>
                  <MapPin className="inline h-4 w-4 align-text-bottom" />
                </span>
                <span>{job.location}</span>
              </div>
            ) : null}
            {job.job_type ? (
              <div className="flex gap-2">
                <span className="shrink-0 text-gray-400" aria-hidden>
                  <Briefcase className="inline h-4 w-4 align-text-bottom" />
                </span>
                <span>{job.job_type}</span>
              </div>
            ) : null}
            {job.experience_level ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Experience</p>
                <p className="mt-1">{job.experience_level}</p>
              </div>
            ) : null}
            {job.source_platform ? <SourcePlatformRow sourcePlatform={job.source_platform} /> : null}
            {posted ? (
              <div className="flex gap-2 text-gray-500">
                <Clock className="h-4 w-4 shrink-0" aria-hidden />
                <span>{posted}</span>
              </div>
            ) : null}
          </div>

          {desc ? (
            <section className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Description</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{desc}</p>
            </section>
          ) : null}

          {job.skills?.trim() ? (
            <section className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Skills</h3>
              <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                {splitSkillsToChips(job.skills.trim()).map((skill, i) => (
                  <li key={`${skill.slice(0, 48)}-${i}`}>
                    <span className="inline-block max-w-full rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {job.apply_link?.trim() ? (
            <section className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Apply link</h3>
              <p className="mt-2 break-all text-sm text-orange-700 underline">
                <a href={job.apply_link.trim()} target="_blank" rel="noopener noreferrer">
                  {job.apply_link.trim()}
                </a>
              </p>
            </section>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onToggleSave}
            className={`inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-2 py-2 text-sm font-medium transition-colors ${
              saved ? 'text-amber-800 hover:text-amber-900' : 'text-gray-700 hover:text-gray-900'
            }`}
            aria-pressed={saved}
          >
            <Star className={`h-4 w-4 ${saved ? 'fill-amber-400 text-amber-500' : ''}`} />
            {saved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => openApply(job)}
            disabled={!job.apply_link?.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </footer>
      </aside>
    </div>
  );
}

const JobHuntPage: React.FC<JobHuntPageProps> = ({ toggleSidebar }) => {
  const { jobOpenRequest, consumeJobOpenRequest, savedJobsNavTick, browseAllNavTick } =
    useJobHuntShell();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [titleDraft, setTitleDraft] = useState('');
  const [locDraft, setLocDraft] = useState('');
  const [queryTitle, setQueryTitle] = useState('');
  const [queryLoc, setQueryLoc] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<WorkMode[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(loadSavedIds);
  const [detailSelection, setDetailSelection] = useState<JobDetailSelection | null>(null);
  const [jobListTab, setJobListTab] = useState<'all' | 'saved'>('all');
  const [userSkillNames, setUserSkillNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      const uid = getJobHuntUserId();
      if (!uid) {
        if (!cancelled) setUserSkillNames([]);
        return;
      }
      void fetchSavedResumeSkillNames(uid).then((names) => {
        if (!cancelled) setUserSkillNames(names);
      });
    };

    sync();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'userData' || e.key === null) sync();
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') sync();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const loadPage = useCallback(async (mode: 'full' | 'refresh' = 'full') => {
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    const offset = (currentPage - 1) * itemsPerPage;
    const uid = getJobHuntUserId();
    try {
      if (jobListTab === 'saved' && !uid) {
        setJobs([]);
        setTotal(0);
        return;
      }
      const result = await fetchJobs({
        limit: itemsPerPage,
        offset,
        userId: uid || undefined,
        savedOnly: jobListTab === 'saved',
      });
      if (result.success && result.data) {
        setJobs(result.data.jobs);
        setTotal(result.data.total);
        setSavedIds((prev) => {
          const next = new Set(prev);
          result.data!.jobs.forEach((j) => {
            if (!j.id || typeof j.saved !== 'boolean') return;
            if (j.saved) next.add(j.id);
            else next.delete(j.id);
          });
          try {
            localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
          } catch {
            /* ignore */
          }
          return next;
        });
      } else {
        setError(result.error?.message || 'Failed to load jobs');
        setJobs([]);
        setTotal(0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
      setJobs([]);
      setTotal(0);
    } finally {
      if (mode === 'refresh') {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [currentPage, itemsPerPage, jobListTab]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!jobOpenRequest) return;
    setDetailSelection({
      job: jobOpenRequest.job,
      saveId: jobOpenRequest.saveId || jobOpenRequest.job.id || '',
    });
    consumeJobOpenRequest();
  }, [jobOpenRequest, consumeJobOpenRequest]);

  const savedNavTickHandled = useRef(0);
  useEffect(() => {
    if (savedJobsNavTick === 0 || savedJobsNavTick === savedNavTickHandled.current) return;
    savedNavTickHandled.current = savedJobsNavTick;
    setJobListTab('saved');
    setCurrentPage(1);
    setDetailSelection(null);
  }, [savedJobsNavTick]);

  const browseAllTickHandled = useRef(0);
  useEffect(() => {
    if (browseAllNavTick === 0 || browseAllNavTick === browseAllTickHandled.current) return;
    browseAllTickHandled.current = browseAllNavTick;
    setJobListTab('all');
    setCurrentPage(1);
    setDetailSelection(null);
  }, [browseAllNavTick]);

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage) || 1);

  const jobTypeOptions = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach((j) => {
      if (j.job_type?.trim()) s.add(j.job_type.trim());
    });
    return [...s].sort();
  }, [jobs]);

  const experienceOptions = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach((j) => {
      if (j.experience_level?.trim()) s.add(j.experience_level.trim());
    });
    return [...s].sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const qt = queryTitle.trim().toLowerCase();
    const ql = queryLoc.trim().toLowerCase();
    return jobs.filter((job) => {
      if (qt && !job.job_title?.toLowerCase().includes(qt)) return false;
      if (ql && !(`${job.location || ''}`.toLowerCase().includes(ql))) return false;
      if (selectedJobTypes.length > 0) {
        const jt = job.job_type?.trim();
        if (!jt || !selectedJobTypes.includes(jt)) return false;
      }
      if (selectedExperience.length > 0) {
        const ex = job.experience_level?.trim();
        if (!ex || !selectedExperience.includes(ex)) return false;
      }
      if (selectedWorkModes.length > 0) {
        const ok = selectedWorkModes.some((m) => matchesWorkMode(job, m));
        if (!ok) return false;
      }
      return true;
    });
  }, [jobs, queryTitle, queryLoc, selectedJobTypes, selectedExperience, selectedWorkModes]);

  const runSearch = () => {
    setQueryTitle(titleDraft.trim());
    setQueryLoc(locDraft.trim());
  };

  const toggleIn = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
  };

  const toggleWorkMode = (mode: WorkMode) => {
    setSelectedWorkModes((prev) =>
      prev.includes(mode) ? prev.filter((x) => x !== mode) : [...prev, mode]
    );
  };

  const openApply = (job: JobListing) => {
    const url = job.apply_link?.trim();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleSave = useCallback(
    async (id: string) => {
      const uid = getJobHuntUserId();
      const willSave = !savedIds.has(id);
      if (uid) {
        const r = await toggleJobSave(uid, id, willSave);
        if (!r.success) {
          setError(r.error?.message || 'Could not update saved job');
          return;
        }
      }
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.add(id);
        else next.delete(id);
        try {
          localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
        return next;
      });
      if (jobListTab === 'saved' && !willSave) {
        void loadPage('refresh');
      }
    },
    [savedIds, jobListTab, loadPage]
  );

  useEffect(() => {
    if (!detailSelection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailSelection(null);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [detailSelection]);

  useEffect(() => {
    setDetailSelection(null);
  }, [currentPage, jobListTab]);

  const clearFilters = () => {
    setSelectedJobTypes([]);
    setSelectedExperience([]);
    setSelectedWorkModes([]);
    setTitleDraft('');
    setLocDraft('');
    setQueryTitle('');
    setQueryLoc('');
  };

  const huntUserId = getJobHuntUserId();

  const resultsTitle =
    jobListTab === 'saved'
      ? 'Saved jobs'
      : queryTitle || queryLoc
        ? `Search results for ‘${[queryTitle, queryLoc].filter(Boolean).join('’ · ‘')}’`
        : 'Open roles';

  const filterSummaryParts: string[] = [];
  if (queryTitle.trim()) filterSummaryParts.push(queryTitle.trim());
  if (queryLoc.trim()) filterSummaryParts.push(queryLoc.trim());

  return (
    <>
    <div className="mt-3 sm:mt-6 -mx-1 sm:mx-0 space-y-4 sm:space-y-5">
      {/* Dark hero + pill search (reference-style) */}
      <section className="relative overflow-hidden rounded-2xl bg-black px-4 py-6 text-white shadow-xl sm:rounded-3xl sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0c1829] via-black to-black"
          aria-hidden
        />
        <div className="pointer-events-none absolute right-0 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-orange-500/18 blur-3xl lg:right-[2%]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-start lg:gap-6 xl:gap-8">
          <div className="min-w-0 w-full max-w-xl lg:max-w-[min(100%,28rem)] xl:max-w-[32rem] shrink-0">
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3 lg:mb-4">
              {toggleSidebar ? (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="rounded-lg border border-white/15 bg-white/5 p-2 text-white hover:bg-white/10 lg:hidden"
                  aria-label="Toggle sidebar"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              ) : null}
            </div>

            <div className="mb-4 sm:mb-5">
              <h1 className="text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl">
                Find Your Dream Job Here
              </h1>
              <p className="mt-2 text-xs text-white/55 sm:text-sm">
                Search roles from top boards in one place — filter by location and keywords.
              </p>
            </div>

            <div className="flex w-full flex-col gap-1.5 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-black/5 sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full sm:p-1 sm:pl-4 sm:pr-1 sm:shadow-xl">
              <label className="flex min-h-[40px] min-w-0 flex-1 cursor-text items-center gap-2.5 px-2.5 sm:min-h-0 sm:gap-3 sm:px-0 sm:pl-1 sm:py-2">
                <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                <input
                  type="search"
                  placeholder="Job title or keyword"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
              </label>
              <div className="hidden h-7 w-px shrink-0 self-center bg-gray-200 sm:block" />
              <label className="flex min-h-[40px] min-w-0 flex-1 cursor-text items-center gap-2.5 px-2.5 sm:min-h-0 sm:gap-3 sm:px-0 sm:py-2">
                <MapPin className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                <input
                  type="search"
                  placeholder="Add country or city"
                  value={locDraft}
                  onChange={(e) => setLocDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
              </label>
              <button
                type="button"
                onClick={runSearch}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 sm:rounded-full sm:px-7 sm:py-2.5"
              >
                <Search className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
                Search
              </button>
            </div>
          </div>

          <div
            className="relative flex w-full justify-center min-h-0 lg:min-w-0 lg:flex-1 lg:justify-end lg:pl-4"
            aria-hidden
          >
            <img
              src={jobHuntHeroImage}
              alt=""
              width={480}
              height={480}
              decoding="async"
              className="h-auto w-full max-w-[220px] select-none object-contain object-bottom drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:max-w-[260px] lg:max-h-[min(300px,36vh)] lg:w-auto lg:max-w-[min(320px,34vw)] xl:max-h-[min(340px,38vh)] xl:max-w-[360px]"
            />
          </div>
        </div>
      </section>

      <div className="rounded-2xl bg-gray-50/80 p-4 sm:p-6 lg:p-8">

      {isLoading && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <div className="hidden h-72 animate-pulse rounded-2xl border border-gray-200 bg-white lg:block" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            ))}
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!isLoading && !error && jobs.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          {jobListTab === 'saved' && !huntUserId ? (
            <>
              <p className="font-medium text-gray-700">Sign in to see saved jobs</p>
              <p className="mt-2 text-sm text-gray-500">
                Saved roles are tied to your account when you are logged in. You can still browse open roles below.
              </p>
              <button
                type="button"
                onClick={() => {
                  setJobListTab('all');
                  setCurrentPage(1);
                }}
                className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Browse all roles
              </button>
            </>
          ) : jobListTab === 'saved' ? (
            <>
              <p className="font-medium text-gray-700">No saved jobs yet</p>
              <p className="mt-2 text-sm text-gray-500">
                Save jobs with the star on a card or in the job panel, or browse all listings to find roles.
              </p>
              <button
                type="button"
                onClick={() => {
                  setJobListTab('all');
                  setCurrentPage(1);
                }}
                className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Browse all roles
              </button>
            </>
          ) : (
            <>
              <p className="font-medium text-gray-700">No job listings yet</p>
              <p className="mt-2 text-sm text-gray-500">
                After the next sync, roles will appear here. Set{' '}
                <code className="rounded bg-gray-100 px-1 text-xs">VITE_GET_JOBS_DETAILS_URL</code> to your jobs API.
              </p>
            </>
          )}
        </div>
      )}

      {!isLoading && !error && jobs.length > 0 && (
        <>
          <header className="mb-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 font-serif text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {resultsTitle}
              </h1>
              <button
                type="button"
                onClick={() => void loadPage('refresh')}
                disabled={isLoading || isRefreshing}
                aria-label="Load latest jobs from the server"
                aria-busy={isRefreshing}
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-900 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-1 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                title="Load the latest job listings from the server"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  aria-hidden
                />
                <span className="whitespace-nowrap">Latest jobs</span>
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-800">{filteredJobs.length}</span> of{' '}
              <span className="font-semibold text-gray-800">{jobs.length}</span> on this page
              {total > jobs.length ? (
                <>
                  {' '}
                  (<span className="font-medium text-gray-700">{total}</span> total in index)
                </>
              ) : null}
              {filterSummaryParts.length > 0 ? (
                <span className="text-gray-400"> · {filterSummaryParts.join(' · ')}</span>
              ) : null}
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
            {/* Filters */}
            <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900">Filter</h2>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Reset
                </button>
              </div>

              <details className="group border-b border-gray-100 py-3" open>
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  Job type
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-180" />
                </summary>
                <ul className="mt-3 space-y-2.5 pl-0.5">
                  {jobTypeOptions.length === 0 ? (
                    <li className="text-xs text-gray-500">No types on this page</li>
                  ) : (
                    jobTypeOptions.map((t) => (
                      <li key={t}>
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedJobTypes.includes(t)}
                            onChange={() => toggleIn(selectedJobTypes, t, setSelectedJobTypes)}
                            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                          <span className="text-sm text-gray-700">{t}</span>
                        </label>
                      </li>
                    ))
                  )}
                </ul>
              </details>

              <details className="group border-b border-gray-100 py-3" open>
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  Work setting
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-180" />
                </summary>
                <ul className="mt-3 space-y-2.5 pl-0.5">
                  {(
                    [
                      ['remote', 'Remote'],
                      ['hybrid', 'Hybrid'],
                      ['onsite', 'In office / Onsite'],
                    ] as const
                  ).map(([key, label]) => (
                    <li key={key}>
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedWorkModes.includes(key)}
                          onChange={() => toggleWorkMode(key)}
                          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </details>

              <details className="group py-3" open>
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  Experience
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-180" />
                </summary>
                <ul className="mt-3 space-y-2.5 pl-0.5">
                  {experienceOptions.length === 0 ? (
                    <li className="text-xs text-gray-500">No levels on this page</li>
                  ) : (
                    experienceOptions.map((t) => (
                      <li key={t}>
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedExperience.includes(t)}
                            onChange={() => toggleIn(selectedExperience, t, setSelectedExperience)}
                            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                          <span className="text-sm text-gray-700">{t}</span>
                        </label>
                      </li>
                    ))
                  )}
                </ul>
              </details>

              <p className="mt-4 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-400">
                Filters apply to the current page. Paginate to load more from the server.
              </p>
            </aside>

            {/* List */}
            <div className="min-w-0 space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
                  <p className="font-medium text-gray-800">No listings match your filters</p>
                  <p className="mt-2 text-sm text-gray-500">Adjust filters or search terms.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredJobs.map((job, index) => {
                  const id = job.id || `job-${index}`;
                  const posted = relativePosted(job.scraped_at ?? job.created_at) || formatJobDate(job.scraped_at ?? job.created_at);
                  const desc = job.description?.trim() || '';
                  const matchPercent = computeJobSkillMatchPercent(userSkillNames, job);

                  return (
                    <article
                      key={id}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details: ${job.job_title || 'Job'}`}
                      onClick={() => setDetailSelection({ job, saveId: id })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setDetailSelection({ job, saveId: id });
                        }
                      }}
                      className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                    >
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-5 sm:p-6">
                        <JobCompanyAvatar
                          company={job.company}
                          logoUrl={job.company_logo}
                          sourcePlatform={job.source_platform}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h2 className="text-lg font-bold leading-snug text-gray-900 sm:text-xl">
                                {job.job_title || 'Untitled role'}
                              </h2>
                              <p className="mt-0.5 text-sm font-medium text-gray-600">
                                {job.company || 'Company'}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2 sm:items-end">
                              <p className="text-sm font-bold text-gray-900 sm:text-right">
                                {job.salary?.trim() ? job.salary : 'Not disclosed'}
                              </p>
                              <JobMatchBadge percent={matchPercent} />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:text-sm">
                            {job.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                                {job.location}
                              </span>
                            ) : null}
                            {job.job_type ? (
                              <span className="inline-flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                                {job.job_type}
                              </span>
                            ) : null}
                            {job.source_platform ? (
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600">
                                {job.source_platform}
                              </span>
                            ) : null}
                            {posted ? (
                              <span className="inline-flex items-center gap-1 text-gray-400">
                                <Clock className="h-3.5 w-3.5" aria-hidden />
                                {posted}
                              </span>
                            ) : null}
                          </div>

                          {desc ? (
                            <div className="mt-4">
                              <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">{desc}</p>
                            </div>
                          ) : null}

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void toggleSave(id);
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-2 py-2 text-sm font-medium transition-colors ${
                                savedIds.has(id)
                                  ? 'text-amber-800 hover:text-amber-900'
                                  : 'text-gray-700 hover:text-gray-900'
                              }`}
                              aria-pressed={savedIds.has(id)}
                            >
                              <Star
                                className={`h-4 w-4 ${savedIds.has(id) ? 'fill-amber-400 text-amber-500' : ''}`}
                                aria-hidden
                              />
                              {savedIds.has(id) ? 'Saved' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openApply(job);
                              }}
                              disabled={!job.apply_link}
                              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Apply
                              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {total > 0 && (
            <div className="mt-10 border-t border-gray-200 pt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={total}
                onItemsPerPageChange={(n) => {
                  setItemsPerPage(n);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </>
      )}

      </div>
    </div>

      {detailSelection ? (
        <JobDetailPanel
          job={detailSelection.job}
          onClose={() => setDetailSelection(null)}
          saved={savedIds.has(detailSelection.saveId)}
          onToggleSave={() => void toggleSave(detailSelection.saveId)}
          openApply={openApply}
          userSkillNames={userSkillNames}
        />
      ) : null}
    </>
  );
};

export default JobHuntPage;
