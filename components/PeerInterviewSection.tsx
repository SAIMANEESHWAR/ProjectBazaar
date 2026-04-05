import React, { useMemo, useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  ChevronRight,
  Clock,
  Globe,
  Hash,
  Inbox,
  MessageSquare,
  Search,
  Target,
  User,
  UserPlus2,
  Users,
  X,
} from 'lucide-react';
import {
  PEER_EXPERIENCE_LEVEL_OPTIONS,
  PEER_INTERVIEW_TYPE_OPTIONS,
  PEER_TECH_FILTER_LABELS,
  PEER_TECH_FILTER_SLUGS,
  PEER_TIMEZONE_REGION_OPTIONS,
  type PeerExperienceLevelId,
  type PeerInterviewCategoryId,
  type PeerTechFilterSlug,
  type PeerTimezoneRegionId,
  labelForPeerCategory,
} from '../data/peerInterviewMockData';
import { getPeerSlotPresets, mergeSlotsWithTimezoneNote } from '../data/peerInterviewSlotPresets';
import { useNavigation } from '../App';
import { useDashboard } from '../context/DashboardContext';
import { usePeerInterviewQueue } from '../context/PeerInterviewQueueContext';
import type { PeerConnectionOffer, PeerWaitlistEntry } from '../types/peerInterviewQueue';
import { appendPeerConnectionOffer } from '../utils/peerInterviewQueueActions';
import { cachedFetchUserProfile } from '../services/buyerApi';
import { extractProfilePhotoUrl, syncPeerListingToBackend } from '../services/peerInterviewApi';

type CategoryFilter = 'all' | PeerInterviewCategoryId;

const PAGE_BG =
  'relative w-full min-w-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-gray-950 dark:via-slate-950 dark:to-gray-950 rounded-3xl border border-gray-200/90 dark:border-gray-800 shadow-sm overflow-hidden';

const AVATAR_GRADIENTS = [
  'from-violet-600 to-indigo-800',
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-700',
  'from-fuchsia-500 to-purple-800',
] as const;

function avatarGradientClass(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[n];
}

function initialsFromDisplayName(name: string): string {
  const cleaned = name.replace(/\([^)]*\)/g, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? '';
    const b = parts[parts.length - 1][0] ?? '';
    return (a + b).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || '?';
}

const SELECT =
  'w-full min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 transition';

const CATEGORY_BADGE: Record<PeerInterviewCategoryId, string> = {
  dsa: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  'system-design':
    'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
  behavioral: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  pm: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
  sql: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900',
  dsml: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
  frontend: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900',
};

const btnPrimary =
  'rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-semibold text-sm px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const scheduleBtnPrimary =
  'rounded-xl bg-gradient-to-r from-[#f97316] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm px-5 py-2.5 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none';

const scheduleInput =
  'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3.5 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 focus:border-[#f97316]/50 transition-shadow';

const scheduleLabel = 'flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide';

function regionLabel(id: PeerTimezoneRegionId | undefined): string {
  if (!id) return '';
  return PEER_TIMEZONE_REGION_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function experienceLabel(id: PeerExperienceLevelId | undefined): string {
  if (!id) return '';
  return PEER_EXPERIENCE_LEVEL_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function parseTechInput(raw: string): string[] {
  return raw
    .split(/[,]+/)
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
}

const peerAvatarShell =
  'shrink-0 rounded-2xl ring-[3px] ring-white dark:ring-gray-900 shadow-md shadow-gray-900/15 dark:shadow-black/50 overflow-hidden bg-gray-200 dark:bg-gray-800';

function PeerAvatar({
  entryId,
  displayName,
  avatarUrl,
  sizeClass,
  fallbackTextClass = 'text-lg sm:text-xl',
}: {
  entryId: string;
  displayName: string;
  avatarUrl?: string;
  sizeClass: string;
  fallbackTextClass?: string;
}) {
  const [broken, setBroken] = useState(false);
  const grad = avatarGradientClass(entryId);
  const initials = initialsFromDisplayName(displayName);
  const showImg = Boolean(avatarUrl?.trim()) && !broken;

  if (!showImg) {
    return (
      <div
        className={`${peerAvatarShell} ${sizeClass} bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white ${fallbackTextClass}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${peerAvatarShell} ${sizeClass} relative`}>
      <img
        src={avatarUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

export interface PeerInterviewSectionProps {
  viewerDisplayName?: string;
  viewerUserId?: string | null;
  /** When false (standalone live page), "My requests" also navigates to dashboard. Default true. */
  embedded?: boolean;
}

const PeerInterviewSection: React.FC<PeerInterviewSectionProps> = ({
  viewerDisplayName = 'You',
  viewerUserId = null,
  embedded = true,
}) => {
  const myName = viewerDisplayName;
  const { waitlist, setWaitlist, refreshWaitlistFromBackend, peerWaitlistBackendError } =
    usePeerInterviewQueue();
  const { setActiveView } = useDashboard();
  const { navigateTo } = useNavigation();

  const goToMyRequestsDashboard = () => {
    setActiveView('live-peer-requests');
    if (!embedded) {
      navigateTo('dashboard');
    }
  };

  const [peerScope, setPeerScope] = useState<'all' | 'others'>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [experienceFilter, setExperienceFilter] = useState<'all' | PeerExperienceLevelId>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | PeerTimezoneRegionId>('all');
  const [techFilter, setTechFilter] = useState<'all' | PeerTechFilterSlug>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<1 | 2 | 3>(1);
  const [scheduleCategory, setScheduleCategory] = useState<PeerInterviewCategoryId | null>(null);
  const [practiceMode, setPracticeMode] = useState<'peers' | 'friend'>('peers');
  const [scheduleHeadline, setScheduleHeadline] = useState('');
  const [scheduleRoleTitle, setScheduleRoleTitle] = useState('');
  const [scheduleSkills, setScheduleSkills] = useState('');
  const [scheduleExperience, setScheduleExperience] = useState<PeerExperienceLevelId>('fresher');
  const [scheduleRegion, setScheduleRegion] = useState<PeerTimezoneRegionId>('ist');
  const [scheduleTechRaw, setScheduleTechRaw] = useState('');
  const [scheduleTimezone, setScheduleTimezone] = useState('');

  const [connectForId, setConnectForId] = useState<string | null>(null);
  const [slotDraft, setSlotDraft] = useState<string[]>(() => getPeerSlotPresets('ist'));

  const [profileDetailId, setProfileDetailId] = useState<string | null>(null);

  const profileDetailEntry = useMemo(
    () => (profileDetailId ? waitlist.find((w) => w.id === profileDetailId) ?? null : null),
    [profileDetailId, waitlist],
  );

  useEffect(() => {
    if (!profileDetailId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileDetailId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profileDetailId]);

  const clearFilters = () => {
    setPeerScope('all');
    setCategoryFilter('all');
    setExperienceFilter('all');
    setRegionFilter('all');
    setTechFilter('all');
    setSearchQuery('');
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return waitlist.filter((w) => {
      if (peerScope === 'others' && w.isMine) return false;
      if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
      if (experienceFilter !== 'all' && w.experienceLevel !== experienceFilter) return false;
      if (regionFilter !== 'all' && w.timezoneRegion !== regionFilter) return false;
      if (techFilter !== 'all') {
        const tags = w.techTags ?? [];
        if (!tags.includes(techFilter)) return false;
      }
      if (q) {
        const hay = [
          w.displayName,
          w.roleTitle,
          w.orgOrContext,
          w.skills,
          w.practiceGoal,
          w.queueIntent,
          w.bio,
          labelForPeerCategory(w.category),
          ...(w.techTags ?? []),
          ...(w.mockInterviewRounds ?? []),
          ...(w.targetCompanies ?? []),
          ...(w.preferredLanguages ?? []),
          ...(w.availabilityWindows ?? []),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    waitlist,
    peerScope,
    categoryFilter,
    experienceFilter,
    regionFilter,
    techFilter,
    searchQuery,
  ]);

  const incomingRequests = useMemo(() => {
    const rows: Array<PeerConnectionOffer & { listingId: string; listingTitle: string }> = [];
    for (const w of waitlist) {
      if (!w.isMine) continue;
      const listingTitle = w.practiceGoal ?? w.displayName;
      for (const c of w.connections ?? []) {
        rows.push({ ...c, listingId: w.id, listingTitle });
      }
    }
    rows.sort(
      (a, b) =>
        new Date(b.requestedAt ?? 0).getTime() - new Date(a.requestedAt ?? 0).getTime(),
    );
    return rows;
  }, [waitlist]);

  const openSchedule = () => {
    setScheduleStep(1);
    setScheduleCategory(null);
    setPracticeMode('peers');
    setScheduleHeadline('');
    setScheduleRoleTitle('');
    setScheduleSkills('');
    setScheduleExperience('fresher');
    setScheduleRegion('ist');
    setScheduleTechRaw('');
    setScheduleTimezone('');
    setSlotDraft(getPeerSlotPresets('ist'));
    setScheduleOpen(true);
  };

  const addToWaitlistFromSchedule = async () => {
    const skills = scheduleSkills.trim();
    const headline = scheduleHeadline.trim();
    if (!skills || !scheduleCategory || !headline) return;
    const techTags = parseTechInput(scheduleTechRaw);
    const id = `me-${Date.now()}`;
    const availabilityWindows = scheduleTimezone.trim()
      ? mergeSlotsWithTimezoneNote(slotDraft, scheduleTimezone.trim())
      : [...slotDraft].filter(Boolean).slice(0, 5);

    let listingAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&size=256&background=0f172a&color=ffffff&bold=true`;
    if (viewerUserId) {
      try {
        const prof = await cachedFetchUserProfile(viewerUserId);
        const fromSettings = extractProfilePhotoUrl(prof);
        if (fromSettings) listingAvatarUrl = fromSettings;
      } catch {
        /* keep fallback */
      }
    }

    const catLabel = labelForPeerCategory(scheduleCategory);
    const newEntry: PeerWaitlistEntry & { id: string } = {
      id,
      displayName: `${myName} (you)`,
      roleTitle:
        scheduleRoleTitle.trim() ||
        (practiceMode === 'friend' ? `Private practice · ${catLabel}` : `Peer queue · ${catLabel}`),
      orgOrContext: regionLabel(scheduleRegion),
      category: scheduleCategory,
      skills:
        skills +
        (practiceMode === 'friend' ? ' · Mode: practice with a friend' : ' · Mode: practice with peers'),
      waitingSince: 'just now',
      isMine: true,
      practiceMode,
      connections: [],
      practiceGoal: headline,
      queueIntent: `Looking for reciprocal mocks for ${catLabel}${
        practiceMode === 'friend' ? ' (invite-only with a friend)' : ' with community peers'
      }.`,
      mockInterviewRounds: [
        `${catLabel} session`,
        practiceMode === 'peers' ? 'Open queue · propose slots after connect' : 'Private calendar with friend',
      ],
      bio:
        practiceMode === 'peers'
          ? 'Joined from live mock interview flow; filters above reflect how others can find you.'
          : 'Practice-with-friend mode — share your invite outside the public queue.',
      experienceLevel: scheduleExperience,
      timezoneRegion: scheduleRegion,
      techTags: techTags.length ? techTags : undefined,
      availabilityWindows,
      preferredLanguages: ['English'],
      avatarUrl: listingAvatarUrl,
    };
    setWaitlist((prev) => [newEntry, ...prev.filter((p) => !p.isMine)]);
    if (viewerUserId) {
      void (async () => {
        const sync = await syncPeerListingToBackend(viewerUserId, newEntry);
        if (sync.ok) {
          await refreshWaitlistFromBackend(viewerUserId);
        }
      })();
    }
    goToMyRequestsDashboard();
    setScheduleOpen(false);
    setScheduleStep(1);
    setScheduleHeadline('');
    setScheduleRoleTitle('');
    setScheduleSkills('');
    setScheduleTechRaw('');
    setScheduleTimezone('');
  };

  const sendConnect = (targetId: string) => {
    const fromName = myName;
    const offer: PeerConnectionOffer = {
      id: `co-${Date.now()}`,
      fromName,
      slots: [...slotDraft].filter(Boolean),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      fromUserId: viewerUserId ?? undefined,
    };
    appendPeerConnectionOffer(setWaitlist, targetId, offer);
    setConnectForId(null);
  };

  const scheduleTitle =
    scheduleStep === 1
      ? 'Pick your interview track'
      : scheduleStep === 2
        ? 'How do you want to practice?'
        : 'Finish your listing';

  const scheduleStepLabels = ['Interview type', 'Format', 'Your details'] as const;

  const filterExcludedAll = waitlist.length > 0 && filtered.length === 0;

  const renderFilters = (compact: boolean) => (
    <div
      className={
        compact ? 'space-y-3' : 'grid grid-cols-2 md:grid-cols-3 min-[1200px]:grid-cols-7 gap-3 w-full min-w-0'
      }
    >
      <div className="min-w-0">
        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">
          Peers
        </label>
        <select
          value={peerScope}
          onChange={(e) => setPeerScope(e.target.value as 'all' | 'others')}
          className={SELECT}
        >
          <option value="all">Everyone in queue</option>
          <option value="others">Hide my listing</option>
        </select>
      </div>
      <div className="min-w-0">
        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">
          Interview type
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          className={SELECT}
        >
          <option value="all">All types</option>
          {PEER_INTERVIEW_TYPE_OPTIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
              {t.beta ? ' (Beta)' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">
          Experience
        </label>
        <select
          value={experienceFilter}
          onChange={(e) => setExperienceFilter(e.target.value as typeof experienceFilter)}
          className={SELECT}
        >
          <option value="all">All levels</option>
          {PEER_EXPERIENCE_LEVEL_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">
          Region
        </label>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value as typeof regionFilter)}
          className={SELECT}
        >
          <option value="all">All regions</option>
          {PEER_TIMEZONE_REGION_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">
          Tech focus
        </label>
        <select
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value as typeof techFilter)}
          className={SELECT}
        >
          <option value="all">Any stack</option>
          {PEER_TECH_FILTER_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {PEER_TECH_FILTER_LABELS[slug]}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 col-span-2 md:col-span-3 min-[1200px]:col-span-2">
        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1 truncate">
          Search
        </label>
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, goal, skills, company, tags…"
            className={`${SELECT} pl-8`}
            autoComplete="off"
          />
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );

  return (
    <div className={PAGE_BG}>
      {peerWaitlistBackendError && viewerUserId && (
        <div className="px-4 sm:px-5 pt-3">
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 px-3 py-2.5 flex flex-wrap items-center gap-2 justify-between">
            <p className="text-xs text-amber-900 dark:text-amber-100 leading-snug min-w-0 flex-1">
              Peer queue sync: {peerWaitlistBackendError}
            </p>
            <button
              type="button"
              onClick={() => void refreshWaitlistFromBackend(viewerUserId)}
              className="shrink-0 text-xs font-bold text-amber-900 dark:text-amber-100 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <div className="sticky top-0 z-20 border-b border-gray-200/80 dark:border-gray-800 bg-gradient-to-b from-white via-slate-50/95 to-slate-50/90 dark:from-gray-950 dark:via-slate-950 dark:to-slate-950 backdrop-blur-sm">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Peer practice queue
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Match by interview type, experience, region, and stack. Connect to propose times — Meet link unlocks when
                someone accepts.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:hidden px-4 sm:px-5 pb-4 pt-1 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Filters</h3>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={goToMyRequestsDashboard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/90 dark:bg-orange-950/35 text-orange-800 dark:text-orange-200 text-[11px] font-bold px-3 py-2 hover:bg-orange-100/90 dark:hover:bg-orange-950/55 transition-all"
              >
                <Inbox className="h-3.5 w-3.5 shrink-0" />
                My requests
                {incomingRequests.length > 0 && (
                  <span className="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {incomingRequests.length > 9 ? '9+' : incomingRequests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={openSchedule}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f97316] to-amber-500 text-white text-[11px] font-bold px-3 py-2 shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Schedule interview
              </button>
            </div>
          </div>
          {renderFilters(true)}
        </div>

        <div className="hidden lg:block px-4 sm:px-5 pb-4 pt-1 w-full min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Filters</h3>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={goToMyRequestsDashboard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/90 dark:bg-orange-950/35 text-orange-800 dark:text-orange-200 text-[11px] font-bold px-3 py-2 hover:bg-orange-100/90 dark:hover:bg-orange-950/55 transition-all"
              >
                <Inbox className="h-3.5 w-3.5 shrink-0" />
                My requests
                {incomingRequests.length > 0 && (
                  <span className="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {incomingRequests.length > 9 ? '9+' : incomingRequests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={openSchedule}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f97316] to-amber-500 text-white text-[11px] font-bold px-3 py-2 shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Schedule interview
              </button>
            </div>
          </div>
          {renderFilters(false)}
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 sm:py-6 w-full min-w-0">
        <section className="space-y-3 w-full min-w-0 max-w-none">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {filterExcludedAll ? 'No matching peers' : 'Queue is empty'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {filterExcludedAll
                  ? 'Try Reset or broaden interview type, region, or tech filters.'
                  : 'Schedule an interview to list yourself so others can find you.'}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={goToMyRequestsDashboard}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/90 dark:bg-orange-950/35 text-orange-800 dark:text-orange-200 text-xs font-bold px-4 py-2.5 hover:bg-orange-100/90 dark:hover:bg-orange-950/55 transition-colors w-full sm:w-auto"
                >
                  <Inbox className="h-4 w-4 shrink-0" />
                  My requests
                  {incomingRequests.length > 0 && (
                    <span className="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                      {incomingRequests.length > 9 ? '9+' : incomingRequests.length}
                    </span>
                  )}
                </button>
                {filterExcludedAll ? (
                  <>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline py-2"
                    >
                      Clear filters &amp; search
                    </button>
                    <button
                      type="button"
                      onClick={openSchedule}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f97316] to-amber-500 text-white text-xs font-bold px-4 py-2.5 shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all w-full sm:w-auto"
                    >
                      <Calendar className="h-4 w-4 shrink-0" />
                      Schedule interview
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={openSchedule}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f97316] to-amber-500 text-white text-xs font-bold px-4 py-2.5 shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all w-full sm:w-auto"
                  >
                    <Calendar className="h-4 w-4 shrink-0" />
                    Schedule interview
                  </button>
                )}
              </div>
            </div>
          ) : (
            filtered.map((entry) => {
              const sessionTitle =
                entry.practiceGoal ?? `${entry.displayName} — ${labelForPeerCategory(entry.category)}`;
              const techTags = entry.techTags ?? [];
              const extraTech = techTags.length > 2 ? techTags.length - 2 : 0;

              return (
                <article
                  key={entry.id}
                  className={`group rounded-2xl border bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:border-gray-300/90 dark:hover:border-gray-600 transition-all duration-200 w-full min-w-0 overflow-hidden ${
                    entry.isMine
                      ? 'border-orange-200/90 dark:border-orange-800/80 ring-1 ring-orange-100/80 dark:ring-orange-950/50'
                      : 'border-gray-200/90 dark:border-gray-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-stretch">
                    <button
                      type="button"
                      onClick={() => setProfileDetailId(entry.id)}
                      className="flex items-center gap-3.5 sm:gap-4 text-left w-full sm:w-[min(100%,15.5rem)] shrink-0 p-4 sm:p-5 sm:border-r border-gray-100 dark:border-gray-800 hover:bg-slate-50/90 dark:hover:bg-gray-800/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500/35"
                      aria-label={`View full profile: ${entry.displayName}`}
                    >
                      <PeerAvatar
                        entryId={entry.id}
                        displayName={entry.displayName}
                        avatarUrl={entry.avatarUrl}
                        sizeClass="h-[3.75rem] w-[3.75rem] sm:h-16 sm:w-16"
                      />
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">
                          {entry.displayName}
                        </p>
                        {entry.roleTitle ? (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug line-clamp-2 flex items-start gap-1">
                            <Briefcase className="h-3 w-3 shrink-0 mt-0.5 opacity-55" />
                            <span>{entry.roleTitle}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Open profile</p>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-2 group-hover:translate-x-0.5 transition-transform">
                          Profile
                          <ChevronRight className="h-3.5 w-3.5 opacity-85" />
                        </span>
                      </div>
                    </button>

                    <div className="flex-1 min-w-0 flex flex-col justify-center px-4 py-4 sm:px-6 sm:py-5 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                      <p className="text-sm sm:text-[15px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {sessionTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_BADGE[entry.category]}`}
                        >
                          {labelForPeerCategory(entry.category)}
                        </span>
                        {experienceLabel(entry.experienceLevel) && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-gray-700">
                            {experienceLabel(entry.experienceLevel)}
                          </span>
                        )}
                        {regionLabel(entry.timezoneRegion) && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-gray-700">
                            {regionLabel(entry.timezoneRegion)}
                          </span>
                        )}
                        {techTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 border border-orange-100 dark:border-orange-900/50"
                          >
                            {PEER_TECH_FILTER_LABELS[tag as PeerTechFilterSlug] ?? tag}
                          </span>
                        ))}
                        {extraTech > 0 && (
                          <span className="text-[10px] font-medium text-gray-400">+{extraTech}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                        Waiting <span className="text-gray-600 dark:text-gray-400 font-medium">{entry.waitingSince}</span>
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0 justify-center p-4 sm:p-5 sm:pl-3 sm:border-l border-gray-100 dark:border-gray-800 sm:min-w-[7.5rem]">
                      {!entry.isMine && (
                        <button
                          type="button"
                          onClick={() => setConnectForId(entry.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 sm:py-3 text-xs font-bold uppercase tracking-wide hover:bg-gray-800 dark:hover:bg-white shadow-md transition-colors"
                        >
                          <UserPlus2 className="h-4 w-4 shrink-0" />
                          Connect
                        </button>
                      )}
                      {entry.isMine && (
                        <button
                          type="button"
                          onClick={goToMyRequestsDashboard}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/90 dark:bg-orange-950/35 px-3 py-2.5 sm:py-3 text-[11px] font-bold text-orange-800 dark:text-orange-200 hover:bg-orange-100/90 dark:hover:bg-orange-950/55 transition-colors"
                        >
                          <Inbox className="h-4 w-4 shrink-0 opacity-90" />
                          {(entry.connections ?? []).length > 0
                            ? `My requests (${(entry.connections ?? []).length})`
                            : 'My requests'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {profileDetailEntry && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="peer-profile-title"
          onClick={() => setProfileDetailId(null)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[min(92dvh,720px)] sm:rounded-2xl rounded-t-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-y-auto flex-1 min-h-0 p-5 sm:p-6 space-y-5">
              <button
                type="button"
                onClick={() => setProfileDetailId(null)}
                className="absolute top-3 right-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                aria-label="Close profile"
              >
                <X className="h-5 w-5" />
              </button>

              {(() => {
                const e = profileDetailEntry;
                const pq =
                  e.queueIntent ??
                  `Peer practice for ${labelForPeerCategory(e.category)} — open to matching on this track.`;
                const sessionTitle =
                  e.practiceGoal ?? `${e.displayName} — ${labelForPeerCategory(e.category)}`;

                return (
                  <>
                    <div className="flex gap-4 pr-10 items-start">
                      <PeerAvatar
                        entryId={e.id}
                        displayName={e.displayName}
                        avatarUrl={e.avatarUrl}
                        sizeClass="h-[5.25rem] w-[5.25rem] sm:h-24 sm:w-24"
                        fallbackTextClass="text-2xl"
                      />
                      <div className="min-w-0 pt-0.5 flex-1">
                        <h2
                          id="peer-profile-title"
                          className="text-lg font-bold text-gray-900 dark:text-white leading-tight"
                        >
                          {e.displayName}
                        </h2>
                        {e.roleTitle && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            {e.roleTitle}
                          </p>
                        )}
                        {e.orgOrContext && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{e.orgOrContext}</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 p-3.5 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">In queue for</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{pq}</p>
                      {(e.mockInterviewRounds?.length ?? 0) > 0 && (
                        <ul className="flex flex-wrap gap-1.5 pt-1">
                          {(e.mockInterviewRounds ?? []).map((r) => (
                            <li
                              key={r}
                              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            >
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Session focus</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{sessionTitle}</p>
                    </div>

                    {e.bio && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">About</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{e.bio}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Prep &amp; topics</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{e.skills}</p>
                    </div>

                    {(e.targetCompanies?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1.5">Target companies</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(e.targetCompanies ?? []).map((co) => (
                            <span
                              key={co}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                            >
                              {co}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3.5 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 font-medium">Experience</p>
                        <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                          {experienceLabel(e.experienceLevel) || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Region</p>
                        <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                          {regionLabel(e.timezoneRegion) || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Languages</p>
                        <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                          {(e.preferredLanguages ?? []).join(', ') || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">Track</p>
                        <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                          {labelForPeerCategory(e.category)}
                        </p>
                      </div>
                    </div>

                    {(e.techTags?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1.5">Tech</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(e.techTags ?? []).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 border border-orange-100 dark:border-orange-900/50"
                            >
                              {PEER_TECH_FILTER_LABELS[tag as PeerTechFilterSlug] ?? tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(e.availabilityWindows?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1.5">Availability</p>
                        <ul className="space-y-1.5">
                          {(e.availabilityWindows ?? []).map((win) => (
                            <li
                              key={win}
                              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              {win}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-gray-400">
                      In queue <span className="font-medium text-gray-600 dark:text-gray-400">{e.waitingSince}</span>
                    </p>

                    {e.isMine && (
                      <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 p-3.5 space-y-2">
                        <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Connection requests</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          See who reached out, when they connected, and accept a slot from{' '}
                          <span className="font-semibold text-gray-800 dark:text-gray-200">My requests</span>.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDetailId(null);
                            goToMyRequestsDashboard();
                          }}
                          className="w-full rounded-xl border border-orange-300 dark:border-orange-800 bg-white dark:bg-gray-900 py-2.5 text-xs font-bold text-orange-800 dark:text-orange-200 hover:bg-orange-50/80 dark:hover:bg-orange-950/40 transition-colors"
                        >
                          Open My requests
                          {(e.connections ?? []).length > 0
                            ? ` (${(e.connections ?? []).length})`
                            : ''}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 p-4 flex gap-2 bg-slate-50/80 dark:bg-gray-900/80">
              <button
                type="button"
                onClick={() => setProfileDetailId(null)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
              >
                Close
              </button>
              {!profileDetailEntry.isMine && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileDetailId(null);
                    setConnectForId(profileDetailEntry.id);
                  }}
                  className="flex-1 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 text-sm font-bold"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {connectForId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Propose time slots</h3>
              <button
                type="button"
                onClick={() => setConnectForId(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Use clear day + time + timezone (e.g. <span className="font-medium">Tue 7–9 PM IST</span>). Your match
              sees these on the request.
            </p>
            {slotDraft.map((s, i) => (
              <input
                key={i}
                value={s}
                onChange={(e) => {
                  const next = [...slotDraft];
                  next[i] = e.target.value;
                  setSlotDraft(next);
                }}
                className="w-full mb-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder={`Proposed slot ${i + 1}`}
              />
            ))}
            <button type="button" onClick={() => sendConnect(connectForId)} className={`mt-2 w-full ${btnPrimary}`}>
              Send connection request
            </button>
          </div>
        </div>
      )}

      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-[3px]">
          <div className="bg-white dark:bg-gray-950 w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl border border-gray-200 dark:border-gray-800 max-h-[min(92dvh,800px)] overflow-hidden flex flex-col shadow-2xl shadow-orange-900/10 dark:shadow-black/50">
            <div className="relative overflow-hidden border-b border-orange-100/80 dark:border-orange-950/50 bg-gradient-to-br from-orange-50/95 via-white to-amber-50/40 dark:from-orange-950/30 dark:via-gray-950 dark:to-gray-950 px-5 sm:px-6 pt-5 pb-4">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_-20%,rgba(249,115,22,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_100%_-20%,rgba(249,115,22,0.08),transparent)] pointer-events-none" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-gray-900/80 border border-orange-200/60 dark:border-orange-900/50 px-2.5 py-1 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-[#f97316]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c] dark:text-orange-400">
                      Schedule interview
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{scheduleTitle}</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Step {scheduleStep} of 3 — {scheduleStepLabels[scheduleStep - 1]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800 shrink-0 text-gray-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative flex gap-2 mt-4">
                {([1, 2, 3] as const).map((s) => (
                  <div key={s} className="flex-1 flex flex-col gap-2">
                    <div
                      className={`h-1 rounded-full transition-colors ${
                        scheduleStep >= s ? 'bg-gradient-to-r from-[#f97316] to-amber-400' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide truncate ${
                        scheduleStep === s
                          ? 'text-[#ea580c] dark:text-orange-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {scheduleStepLabels[s - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6 flex-1 min-h-0 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-950 dark:to-gray-950">
              {scheduleStep === 1 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {PEER_INTERVIEW_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const sel = scheduleCategory === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setScheduleCategory(opt.id)}
                        className={`rounded-2xl border-2 p-4 text-left transition-all duration-200 flex gap-3 items-start ${
                          sel
                            ? 'border-[#f97316] bg-orange-50/90 dark:bg-orange-950/25 ring-2 ring-orange-500/25 shadow-md shadow-orange-500/10'
                            : 'border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-orange-200 dark:hover:border-orange-900/60 hover:shadow-sm'
                        }`}
                      >
                        <div
                          className={`rounded-xl p-2 shrink-0 ${sel ? 'bg-orange-500/15 text-[#ea580c]' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                        >
                          <Icon className="w-7 h-7" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{opt.label}</span>
                            {opt.beta && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                                Beta
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{opt.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {scheduleStep === 2 && (
                <div className="space-y-3 max-w-lg mx-auto">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-1">
                    This matches how you&apos;ll appear to others in the queue.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPracticeMode('peers')}
                    className={`w-full rounded-2xl border-2 p-5 text-left transition-all flex gap-4 items-start ${
                      practiceMode === 'peers'
                        ? 'border-[#f97316] bg-orange-50/90 dark:bg-orange-950/25 ring-2 ring-orange-500/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-orange-200/80'
                    }`}
                  >
                    <div className="rounded-xl bg-orange-500/10 p-2.5 text-[#ea580c]">
                      <Users className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Peer queue</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        List yourself so others can find you, connect, and swap mock sessions.
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticeMode('friend')}
                    className={`w-full rounded-2xl border-2 p-5 text-left transition-all flex gap-4 items-start ${
                      practiceMode === 'friend'
                        ? 'border-[#f97316] bg-orange-50/90 dark:bg-orange-950/25 ring-2 ring-orange-500/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-orange-200/80'
                    }`}
                  >
                    <div className="rounded-xl bg-gray-100 dark:bg-gray-800 p-2.5 text-gray-700 dark:text-gray-300">
                      <UserPlus2 className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">With a friend</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Private practice — same form helps your card stay consistent if you share a link later.
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {scheduleStep === 3 && scheduleCategory && (
                <div className="max-w-lg mx-auto space-y-6">
                  <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white dark:bg-gray-900 border border-orange-100 dark:border-orange-900/40 shadow-sm">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/10 text-[#c2410c] dark:text-orange-300 px-2.5 py-1 text-[11px] font-bold border border-orange-200/50 dark:border-orange-900/50">
                      <Target className="h-3 w-3" />
                      {labelForPeerCategory(scheduleCategory)}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      {practiceMode === 'peers' ? 'Peer queue' : 'Friend mode'}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4 shadow-sm">
                    <p className={scheduleLabel}>
                      <User className="h-4 w-4 text-[#f97316]" />
                      You
                    </p>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                        Role or title <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={scheduleRoleTitle}
                        onChange={(e) => setScheduleRoleTitle(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer · Final-year CS"
                        className={scheduleInput}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4 shadow-sm">
                    <p className={scheduleLabel}>
                      <MessageSquare className="h-4 w-4 text-[#f97316]" />
                      Session
                    </p>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                        Headline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={scheduleHeadline}
                        onChange={(e) => setScheduleHeadline(e.target.value)}
                        placeholder="What you want to practice — one sharp line"
                        className={scheduleInput}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                        Prep &amp; topics <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={scheduleSkills}
                        onChange={(e) => setScheduleSkills(e.target.value)}
                        rows={4}
                        placeholder="Stack, difficulty, what you want feedback on…"
                        className={`${scheduleInput} resize-y min-h-[100px]`}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                        <Hash className="h-3.5 w-3.5 text-gray-400" />
                        Tech tags <span className="text-gray-400 font-normal">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={scheduleTechRaw}
                        onChange={(e) => setScheduleTechRaw(e.target.value)}
                        placeholder="React, TypeScript, system design…"
                        className={scheduleInput}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4 shadow-sm">
                    <p className={scheduleLabel}>
                      <Briefcase className="h-4 w-4 text-[#f97316]" />
                      Matching <span className="text-gray-400 font-normal normal-case tracking-normal">(filters)</span>
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                          Experience
                        </label>
                        <select
                          value={scheduleExperience}
                          onChange={(e) => setScheduleExperience(e.target.value as PeerExperienceLevelId)}
                          className={`${scheduleInput} py-2.5`}
                        >
                          {PEER_EXPERIENCE_LEVEL_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                          Region
                        </label>
                        <select
                          value={scheduleRegion}
                          onChange={(e) => setScheduleRegion(e.target.value as PeerTimezoneRegionId)}
                          className={`${scheduleInput} py-2.5`}
                        >
                          {PEER_TIMEZONE_REGION_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 shadow-sm">
                    <div>
                      <p className={scheduleLabel}>
                        <Clock className="h-4 w-4 text-[#f97316]" />
                        Your windows
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                        Defaults follow <span className="font-semibold text-gray-700 dark:text-gray-300">Region</span>{' '}
                        above — edit freely. These are stored on your listing and help peers propose compatible times.
                      </p>
                      {slotDraft.map((s, i) => (
                        <input
                          key={i}
                          type="text"
                          value={s}
                          onChange={(e) => {
                            const next = [...slotDraft];
                            next[i] = e.target.value;
                            setSlotDraft(next);
                          }}
                          className={`${scheduleInput} mb-2`}
                          placeholder={`Availability window ${i + 1}`}
                        />
                      ))}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                        <Globe className="h-4 w-4 text-[#f97316]" />
                        Timezone note <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={scheduleTimezone}
                        onChange={(e) => setScheduleTimezone(e.target.value)}
                        placeholder="e.g. Asia/Kolkata or America/New_York — appended to each window for clarity"
                        className={scheduleInput}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 px-2">
                    Others use these fields to filter the queue — keep it honest so matches are worth your time.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 sm:gap-3 px-5 sm:px-6 py-4 border-t border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950">
              <button
                type="button"
                onClick={() => {
                  if (scheduleStep === 3) setScheduleStep(2);
                  else if (scheduleStep === 2) setScheduleStep(1);
                  else setScheduleOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {scheduleStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {scheduleStep === 1 && (
                <button
                  type="button"
                  disabled={!scheduleCategory}
                  onClick={() => setScheduleStep(2)}
                  className={scheduleBtnPrimary}
                >
                  Continue
                </button>
              )}
              {scheduleStep === 2 && (
                <button type="button" onClick={() => setScheduleStep(3)} className={scheduleBtnPrimary}>
                  Continue
                </button>
              )}
              {scheduleStep === 3 && (
                <button
                  type="button"
                  disabled={!scheduleSkills.trim() || !scheduleHeadline.trim()}
                  onClick={addToWaitlistFromSchedule}
                  className={`${scheduleBtnPrimary} inline-flex items-center justify-center gap-2`}
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  Schedule the interview
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerInterviewSection;
