import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Briefcase,
  ChevronDown,
  Clock,
  MapPin,
  Search,
  Star,
} from 'lucide-react';
import Pagination from './Pagination';
import { fetchJobs } from '../services/buyerApi';
import type { JobListing } from '../services/buyerApi';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

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

function relativePosted(ts?: number): string {
  if (ts == null || Number.isNaN(ts)) return '';
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 7) return `Posted ${days} days ago`;
  if (days < 30) return `Posted ${Math.floor(days / 7)} weeks ago`;
  const label = formatJobDate(ts);
  return label ? `Posted ${label}` : '';
}

function companyInitials(name?: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
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

const JobHuntPage: React.FC<JobHuntPageProps> = ({ toggleSidebar }) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const offset = (currentPage - 1) * itemsPerPage;
    try {
      const result = await fetchJobs({ limit: itemsPerPage, offset });
      if (result.success && result.data) {
        setJobs(result.data.jobs);
        setTotal(result.data.total);
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
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

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

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedJobTypes([]);
    setSelectedExperience([]);
    setSelectedWorkModes([]);
    setTitleDraft('');
    setLocDraft('');
    setQueryTitle('');
    setQueryLoc('');
  };

  const resultsTitle =
    queryTitle || queryLoc
      ? `Search results for ‘${[queryTitle, queryLoc].filter(Boolean).join('’ · ‘')}’`
      : 'Open roles';

  const filterSummaryParts: string[] = [];
  if (queryTitle.trim()) filterSummaryParts.push(queryTitle.trim());
  if (queryLoc.trim()) filterSummaryParts.push(queryLoc.trim());

  return (
    <div className="mt-4 sm:mt-8 -mx-1 sm:mx-0 rounded-2xl bg-gray-50/80 p-4 sm:p-6 lg:p-8">
      {/* Search strip — JobSpot-style neutral */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {toggleSidebar && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="lg:hidden rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <p className="text-sm text-gray-500">
            Curated from major job boards — synced on a schedule.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <label className="flex flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 transition-colors focus-within:border-gray-300 focus-within:bg-white">
            <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
            <input
              type="search"
              placeholder="Job title, keywords"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </label>
          <label className="flex flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 transition-colors focus-within:border-gray-300 focus-within:bg-white">
            <MapPin className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
            <input
              type="search"
              placeholder="City, country, or remote"
              value={locDraft}
              onChange={(e) => setLocDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </label>
          <div className="flex shrink-0 items-center justify-stretch lg:justify-center">
            <HoverBorderGradient
              as="button"
              onClick={runSearch}
              containerClassName="rounded-xl w-full lg:w-auto min-w-[140px]"
              className="flex w-full items-center justify-center gap-2 bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm lg:w-auto"
            >
              <Search className="h-4 w-4 opacity-90" />
              Find jobs
            </HoverBorderGradient>
          </div>
        </div>
      </section>

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
          <p className="font-medium text-gray-700">No job listings yet</p>
          <p className="mt-2 text-sm text-gray-500">
            After the next sync, roles will appear here. Set{' '}
            <code className="rounded bg-gray-100 px-1 text-xs">VITE_GET_JOBS_DETAILS_URL</code> to your jobs API.
          </p>
        </div>
      )}

      {!isLoading && !error && jobs.length > 0 && (
        <>
          <header className="mb-6">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {resultsTitle}
            </h1>
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
                  const tone = logoTone(job.company);
                  const expanded = expandedId === id;
                  const desc = job.description?.trim() || '';
                  const longDesc = desc.length > 220;

                  return (
                    <article
                      key={id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-5 sm:p-6">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-base font-bold ${tone.bg} ${tone.text}`}
                          aria-hidden
                        >
                          {companyInitials(job.company)}
                        </div>

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
                            <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                              {job.salary ? (
                                <p className="text-sm font-bold text-gray-900 sm:text-right">{job.salary}</p>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => toggleSave(id)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  savedIds.has(id)
                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                                aria-pressed={savedIds.has(id)}
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${savedIds.has(id) ? 'fill-amber-400 text-amber-500' : ''}`}
                                />
                                Save
                              </button>
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
                              <p
                                className={`text-sm leading-relaxed text-gray-600 ${
                                  expanded ? '' : 'line-clamp-3'
                                }`}
                              >
                                {desc}
                              </p>
                              {longDesc ? (
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(expanded ? null : id)}
                                  className="mt-1 text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                                >
                                  {expanded ? 'Show less' : 'Read more'}
                                </button>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
                            <button
                              type="button"
                              onClick={() => openApply(job)}
                              disabled={!job.apply_link}
                              className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Apply
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
  );
};

export default JobHuntPage;
