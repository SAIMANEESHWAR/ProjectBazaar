import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ChevronLeft,
  Circle,
  CloudUpload,
  Loader2,
  Menu,
  Search,
  Sparkles,
  Timer,
  User,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import { useNavigation, useAuth } from '../App';
import { useDashboard } from '../context/DashboardContext';
import {
  MOCK_COMPANY_NAMES,
  MOCK_INTERVIEWERS,
  MOCK_INTERVIEW_ROUNDS,
  MOCK_ROLE_TITLES,
  PRACTICE_INSTRUCTION_STEPS,
  PREREQUISITE_CHECK_LABELS,
  getInterviewScript,
  getMockResults,
  inferTrackFromText,
  LEVEL_OPTIONS,
  type InterviewLevelId,
  type InterviewTrackId,
} from '../data/liveMockInterviewMockData';

type HubTab = 'role' | 'company' | 'jd' | 'resume' | 'custom';
type Phase = 'hub' | 'setup' | 'prerequisite' | 'warming' | 'live' | 'results';

const HUB_TABS: { id: HubTab; label: string }[] = [
  { id: 'role', label: 'Role Based' },
  { id: 'company', label: 'Company Based' },
  { id: 'jd', label: 'JD Based' },
  { id: 'resume', label: 'Resume Toolkit' },
  { id: 'custom', label: 'Create Your Own' },
];

const formatMmSs = (totalSec: number) => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const pageCanvas =
  'min-h-full bg-gradient-to-b from-orange-50/40 via-[#FAFAFA] to-[#F5F4F2] dark:from-gray-900 dark:via-gray-900 dark:to-gray-950';

interface LiveMockInterviewPageProps {
  embedded?: boolean;
  toggleSidebar?: () => void;
}

const LiveMockInterviewPage: React.FC<LiveMockInterviewPageProps> = ({
  embedded = false,
  toggleSidebar,
}) => {
  const { navigateTo } = useNavigation();
  const { isLoggedIn } = useAuth();
  const { dashboardMode, setActiveView } = useDashboard();

  const [phase, setPhase] = useState<Phase>('hub');
  const [hubTab, setHubTab] = useState<HubTab>('role');
  const [roleSearch, setRoleSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [selectedRoleTitle, setSelectedRoleTitle] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState('');

  const [jdJobTitle, setJdJobTitle] = useState('');
  const [jdInterviewType, setJdInterviewType] = useState('');
  const [jdDescription, setJdDescription] = useState('');

  const [customRoleName, setCustomRoleName] = useState('');
  const [customRound, setCustomRound] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customStep, setCustomStep] = useState<1 | 2>(1);

  const [track, setTrack] = useState<InterviewTrackId>('swe');
  const [level, setLevel] = useState<InterviewLevelId>('mid');
  const [setupRoundId, setSetupRoundId] = useState<string>('role-related');
  const [interviewerId, setInterviewerId] = useState(MOCK_INTERVIEWERS[0].id);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [prereqChecks, setPrereqChecks] = useState<boolean[]>(() =>
    PREREQUISITE_CHECK_LABELS.map(() => false)
  );
  const [warmProgress, setWarmProgress] = useState(0);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [revealCount, setRevealCount] = useState(1);
  const [aiState, setAiState] = useState<'idle' | 'speaking' | 'listening'>('speaking');
  const [finishedFullSession, setFinishedFullSession] = useState(false);

  const interviewer = useMemo(
    () => MOCK_INTERVIEWERS.find((i) => i.id === interviewerId) ?? MOCK_INTERVIEWERS[0],
    [interviewerId]
  );
  const interviewerDisplayName = interviewer.name;

  const script = useMemo(() => getInterviewScript(track), [track]);
  const currentSegment = script[segmentIndex];
  const visibleTurns = currentSegment ? currentSegment.turns.slice(0, revealCount) : [];
  const atEndOfSegment = currentSegment ? revealCount >= currentSegment.turns.length : false;
  const atEndOfInterview = atEndOfSegment && segmentIndex >= script.length - 1;

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return MOCK_ROLE_TITLES;
    return MOCK_ROLE_TITLES.filter((r) => r.toLowerCase().includes(q));
  }, [roleSearch]);

  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return MOCK_COMPANY_NAMES;
    return MOCK_COMPANY_NAMES.filter((c) => c.toLowerCase().includes(q));
  }, [companySearch]);

  useEffect(() => {
    if (phase !== 'live') return;
    const id = window.setInterval(() => setElapsedSec((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!visibleTurns.length) return;
    const last = visibleTurns[visibleTurns.length - 1];
    setAiState(last.speaker === 'ai' ? 'speaking' : 'listening');
  }, [visibleTurns]);

  /** Simulate compatibility checklist progression */
  useEffect(() => {
    if (phase !== 'prerequisite') return;
    setPrereqChecks(PREREQUISITE_CHECK_LABELS.map(() => false));
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setPrereqChecks((prev) => {
        const next = [...prev];
        if (i - 1 < next.length) next[i - 1] = true;
        return next;
      });
      if (i >= PREREQUISITE_CHECK_LABELS.length) window.clearInterval(t);
    }, 550);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'warming') return;
    setWarmProgress(0);
    const start = performance.now();
    const dur = 2800;
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / dur) * 100);
      setWarmProgress(p);
      if (p < 100) frame = requestAnimationFrame(tick);
      else {
        setPhase('live');
        setElapsedSec(0);
        setSegmentIndex(0);
        setRevealCount(1);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const goBackNav = useCallback(() => {
    if (embedded) {
      setActiveView(dashboardMode === 'preparation' ? 'prep-hub' : 'dashboard');
    } else {
      navigateTo(isLoggedIn ? 'dashboard' : 'home');
    }
  }, [embedded, dashboardMode, setActiveView, navigateTo, isLoggedIn]);

  const goMockAssessments = useCallback(() => {
    if (embedded) setActiveView('mock-assessment');
    else navigateTo('mockAssessment');
  }, [embedded, setActiveView, navigateTo]);

  const resetAll = useCallback(() => {
    setPhase('hub');
    setHubTab('role');
    setRoleSearch('');
    setCompanySearch('');
    setSelectedRoleTitle(null);
    setSelectedCompanyName(null);
    setSessionLabel('');
    setJdJobTitle('');
    setJdInterviewType('');
    setJdDescription('');
    setCustomRoleName('');
    setCustomRound('');
    setCustomCompany('');
    setCustomStep(1);
    setTrack('swe');
    setLevel('mid');
    setSetupRoundId('role-related');
    setInterviewerId(MOCK_INTERVIEWERS[0].id);
    setAudioOn(true);
    setVideoOn(true);
    setTermsAccepted(false);
    setWarmProgress(0);
    setElapsedSec(0);
    setSegmentIndex(0);
    setRevealCount(1);
    setFinishedFullSession(false);
  }, []);

  const goToSetupFromHub = useCallback(
    (label: string, inferSource: string) => {
      setSessionLabel(label);
      setTrack(inferTrackFromText(inferSource));
      setPhase('setup');
    },
    []
  );

  const handleJdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdJobTitle.trim() || !jdDescription.trim()) return;
    goToSetupFromHub(jdJobTitle.trim(), `${jdJobTitle} ${jdDescription}`);
  };

  const handleCustomNext = () => {
    if (!customRoleName.trim()) return;
    if (customStep === 1) {
      setCustomStep(2);
      return;
    }
    goToSetupFromHub(
      customCompany.trim()
        ? `${customRoleName} · ${customCompany}`
        : customRoleName,
      customRoleName
    );
  };

  const setupValid =
    termsAccepted && audioOn && videoOn && interviewerId;

  const startFromSetup = () => {
    if (!setupValid) return;
    setPhase('prerequisite');
  };

  const prereqComplete = prereqChecks.every(Boolean);

  const startAfterPrereq = () => {
    if (!prereqComplete) return;
    setPhase('warming');
  };

  const goToResults = useCallback((full: boolean) => {
    setFinishedFullSession(full);
    setPhase('results');
  }, []);

  const handleContinueConversation = () => {
    if (!currentSegment) return;
    if (revealCount < currentSegment.turns.length) {
      setRevealCount((c) => c + 1);
      return;
    }
    if (segmentIndex < script.length - 1) {
      setSegmentIndex((i) => i + 1);
      setRevealCount(1);
    } else {
      goToResults(true);
    }
  };

  const results = useMemo(
    () => getMockResults(track, level, elapsedSec),
    [track, level, elapsedSec, phase]
  );

  const continueLabel = atEndOfSegment
    ? atEndOfInterview
      ? 'Finish & view results'
      : 'Next topic'
    : visibleTurns[visibleTurns.length - 1]?.speaker === 'you'
      ? 'Show interviewer reply'
      : 'Play my response (demo)';

  const shell =
    `${pageCanvas} text-gray-900 dark:text-gray-100 ` +
    (embedded ? 'min-h-0 w-full max-w-6xl mx-auto rounded-xl' : 'min-h-screen');

  const pillTabBar =
    'inline-flex flex-wrap items-center justify-center gap-1 p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md shadow-orange-900/5 border border-gray-200/80 dark:border-gray-700';

  const tabBtn = (active: boolean) =>
    `px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
      active
        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
        : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
    }`;

  const cardLift = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-black/40';

  const gridCard = (selected: boolean) =>
    `rounded-xl border-2 text-center py-5 px-3 font-semibold text-gray-900 dark:text-white transition-all shadow-sm ${
      selected
        ? 'border-orange-500 bg-orange-50/90 dark:bg-orange-500/15 ring-2 ring-orange-500/30'
        : 'border-transparent bg-white dark:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-500/40'
    }`;

  const inner = (
    <>
      {embedded && toggleSidebar && (
        <div className="flex items-center gap-2 mb-4 lg:hidden">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            if (phase === 'hub') goBackNav();
            else if (phase === 'setup') setPhase('hub');
            else if (phase === 'live' || phase === 'results') resetAll();
            else if (phase === 'warming') setPhase('setup');
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-orange-600"
        >
          <ChevronLeft className="w-4 h-4" />
          {phase === 'hub'
            ? embedded
              ? dashboardMode === 'preparation'
                ? 'Prep hub'
                : 'Dashboard'
              : isLoggedIn
                ? 'Dashboard'
                : 'Home'
            : phase === 'live' || phase === 'results'
              ? 'Exit to hub'
              : 'Back'}
        </button>
        <button
          type="button"
          onClick={goMockAssessments}
          className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline"
        >
          Mock assessments
        </button>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'hub' && (
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-8 pb-12"
          >
            <div className="flex justify-center">
              <div className={pillTabBar}>
                {HUB_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setHubTab(t.id)}
                    className={tabBtn(hubTab === t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {hubTab === 'role' && (
              <div className="max-w-4xl mx-auto space-y-8 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-500/30 px-4 py-1.5 text-sm font-semibold text-orange-700 dark:text-orange-300 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  3000+ roles · Demo data
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                  Role-specific{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
                    AI mock interviews
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-base leading-relaxed">
                  Practice role-specific interviews with realistic prompts. Improve articulation and structure with an instant
                  feedback-style report (demo).
                </p>
                <div className={`${cardLift} p-2 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto`}>
                  <div className="flex flex-1 items-center gap-3 px-4 py-2">
                    <Search className="w-5 h-5 text-gray-400 shrink-0" />
                    <input
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      placeholder="Search for roles (e.g. Software Engineer, Data Analyst)"
                      className="w-full bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 outline-none text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm uppercase tracking-wide px-8 py-3 shadow-md shadow-orange-500/25"
                  >
                    Search
                  </button>
                </div>
                <div className="text-left max-w-4xl mx-auto">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-orange-500 text-orange-600">
                      <User className="w-5 h-5" />
                    </span>
                    Roles
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {filteredRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRoleTitle(role)}
                        className={gridCard(selectedRoleTitle === role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  {selectedRoleTitle && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => goToSetupFromHub(selectedRoleTitle, selectedRoleTitle)}
                        className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 shadow-lg shadow-orange-500/30 text-sm uppercase tracking-wide"
                      >
                        Continue with {selectedRoleTitle}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hubTab === 'company' && (
              <div className="max-w-5xl mx-auto space-y-8 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-500/30 px-4 py-1.5 text-sm font-semibold text-orange-700 dark:text-orange-300 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  1000+ companies · Demo data
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  Company-specific{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
                    AI mock interviews
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Practice with company-flavored scenarios. This demo uses the same scripted flow with your selection on the report
                  header.
                </p>
                <div className={`${cardLift} p-2 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto`}>
                  <div className="flex flex-1 items-center gap-3 px-4 py-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      placeholder="Search for companies (e.g. Google, Stripe, Netflix)"
                      className="w-full bg-transparent outline-none text-sm dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-xl bg-orange-500 text-white font-bold text-sm uppercase px-8 py-3"
                  >
                    Search
                  </button>
                </div>
                <div className="text-left">
                  <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-orange-500 text-orange-600">
                      <Building2 className="w-5 h-5" />
                    </span>
                    Companies
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredCompanies.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCompanyName(c)}
                        className={gridCard(selectedCompanyName === c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {selectedCompanyName && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTrack('swe');
                          goToSetupFromHub(`${selectedCompanyName} interview`, 'software engineer');
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-orange-500 text-white font-bold px-8 py-3.5 shadow-lg text-sm uppercase"
                      >
                        Continue with {selectedCompanyName}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hubTab === 'jd' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Job description–based interview</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Fill the details below to shape your practice session (demo — no file upload stored).
                  </p>
                </div>
                <form onSubmit={handleJdSubmit} className={`${cardLift} p-6 sm:p-8 space-y-6`}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                        Job title <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        value={jdJobTitle}
                        onChange={(e) => setJdJobTitle(e.target.value)}
                        placeholder="Enter job title"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                        Interview type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={jdInterviewType}
                        onChange={(e) => setJdInterviewType(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm dark:bg-gray-900 dark:text-white bg-white"
                      >
                        <option value="">Select type</option>
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">
                        Add job description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={jdDescription}
                        onChange={(e) => setJdDescription(e.target.value)}
                        placeholder="Paste key responsibilities and requirements…"
                        rows={8}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm dark:bg-gray-900 resize-y min-h-[180px]"
                      />
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 flex flex-col items-center justify-center text-center gap-3 bg-gray-50/50 dark:bg-gray-900/40">
                      <CloudUpload className="w-10 h-10 text-orange-500" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drag and drop files here</p>
                      <p className="text-xs text-gray-500">— OR —</p>
                      <button
                        type="button"
                        className="rounded-xl bg-orange-500 text-white text-xs font-bold uppercase px-6 py-2.5"
                      >
                        Browse files
                      </button>
                      <p className="text-xs text-gray-400">Demo only — no upload processed</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase text-sm px-10 py-3 shadow-md"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            )}

            {hubTab === 'resume' && (
              <div className={`${cardLift} max-w-lg mx-auto p-10 text-center space-y-4`}>
                <Briefcase className="w-12 h-12 text-orange-500 mx-auto" />
                <h2 className="text-xl font-bold">Resume toolkit</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  In a full build, we parse your resume to tailor questions. Here you can continue with a generic practice session.
                </p>
                <button
                  type="button"
                  onClick={() => goToSetupFromHub('Resume-based practice', 'software engineer resume')}
                  className="w-full rounded-xl bg-orange-500 text-white font-bold py-3 uppercase text-sm"
                >
                  Continue with resume profile (demo)
                </button>
              </div>
            )}

            {hubTab === 'custom' && (
              <div className="max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your own customized interviews</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Build a session label for your practice run. Demo uses the standard scripted dialogue.
                  </p>
                </div>
                <div className={`${cardLift} overflow-hidden`}>
                  <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-orange-50/50 dark:bg-orange-500/10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        Step {customStep} of 2
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white">Role details</p>
                    </div>
                    <div className="flex gap-1">
                      <div className={`h-2 w-10 rounded-full ${customStep >= 1 ? 'bg-orange-500' : 'bg-gray-200'}`} />
                      <div className={`h-2 w-10 rounded-full ${customStep >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`} />
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    {customStep === 1 && (
                      <>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                            <Briefcase className="w-4 h-4" /> Add role / position name
                          </label>
                          <input
                            value={customRoleName}
                            onChange={(e) => setCustomRoleName(e.target.value)}
                            placeholder="e.g. Data Analyst"
                            className="w-full rounded-xl border px-4 py-3 text-sm dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                            <User className="w-4 h-4" /> Select round
                          </label>
                          <select
                            value={customRound}
                            onChange={(e) => setCustomRound(e.target.value)}
                            className="w-full rounded-xl border px-4 py-3 text-sm dark:bg-gray-900 bg-white"
                          >
                            <option value="">Select round</option>
                            {MOCK_INTERVIEW_ROUNDS.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                            <Building2 className="w-4 h-4" /> Company name (optional)
                          </label>
                          <input
                            value={customCompany}
                            onChange={(e) => setCustomCompany(e.target.value)}
                            placeholder="e.g. Amazon"
                            className="w-full rounded-xl border px-4 py-3 text-sm dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}
                    {customStep === 2 && (
                      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <strong className="text-gray-900 dark:text-white">Role:</strong> {customRoleName}
                        </p>
                        <p>
                          <strong className="text-gray-900 dark:text-white">Round:</strong>{' '}
                          {MOCK_INTERVIEW_ROUNDS.find((r) => r.id === customRound)?.label || '—'}
                        </p>
                        {customCompany && (
                          <p>
                            <strong className="text-gray-900 dark:text-white">Company:</strong> {customCompany}
                          </p>
                        )}
                        <p>Confirm to open interview setup and choose your AI interviewer.</p>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCustomNext}
                      disabled={customStep === 1 && (!customRoleName.trim() || !customRound)}
                      className="inline-flex items-center gap-2 rounded-full bg-orange-500 text-white font-bold px-6 py-2.5 text-sm disabled:opacity-40"
                    >
                      {customStep === 1 ? 'Next step' : 'Continue'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto pb-12"
          >
            <div className={`${cardLift} overflow-hidden`}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Interview details</h2>
                <button
                  type="button"
                  onClick={() => setPhase('hub')}
                  className="h-9 w-9 rounded-lg border-2 border-orange-500 text-orange-600 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-500/10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 bg-gray-100/80 dark:bg-gray-900/60 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Test</p>
                  <p className="font-bold text-gray-900 dark:text-white">{sessionLabel}</p>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">ProjectBazaar</span>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Select round <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_INTERVIEW_ROUNDS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSetupRoundId(r.id)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold border-2 transition-all ${
                          setupRoundId === r.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300'
                            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-3">
                    Select your interviewer <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MOCK_INTERVIEWERS.map((inv) => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => setInterviewerId(inv.id)}
                        className={`rounded-xl border-2 p-3 text-center transition-all ${
                          interviewerId === inv.id
                            ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-500/10 ring-2 ring-orange-500/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div
                          className={`mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold text-lg flex items-center justify-center mb-2 ${
                            interviewerId === inv.id ? 'ring-4 ring-orange-400/50' : ''
                          }`}
                        >
                          {inv.initial}
                        </div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{inv.name}</p>
                        <p className="text-xs text-gray-500">{inv.locale}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Experience level <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LEVEL_OPTIONS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLevel(l.id)}
                        className={`rounded-xl px-4 py-2 text-sm font-medium border-2 ${
                          level === l.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Practice settings <span className="text-red-500">*</span>
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audioOn}
                        onChange={(e) => setAudioOn(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">Audio</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoOn}
                        onChange={(e) => setVideoOn(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">Video</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Note: In production, recordings may be deleted per policy (demo only).</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    I agree with the{' '}
                    <button type="button" className="text-orange-600 font-semibold hover:underline">
                      terms and conditions
                    </button>
                    .
                  </span>
                </label>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/30">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Attempts remaining: 3</p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setPhase('hub')}
                    className="rounded-xl border-2 border-gray-300 dark:border-gray-600 px-6 py-2.5 text-sm font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={startFromSetup}
                    disabled={!setupValid}
                    className="rounded-xl bg-orange-500 text-white px-6 py-2.5 text-sm font-bold uppercase disabled:opacity-40 shadow-md"
                  >
                    Start practice
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'prerequisite' && (
          <motion.div
            key="prereq"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Practice prerequisite</h2>
                <button
                  type="button"
                  onClick={() => setPhase('setup')}
                  className="h-9 w-9 rounded-lg border-2 border-orange-500 text-orange-600 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-0 md:divide-x divide-gray-100 dark:divide-gray-700">
                <div className="p-5 sm:p-6 space-y-4">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                    <span className="w-1 h-6 rounded-full bg-orange-500" />
                    Interview practice instructions
                  </h3>
                  <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-video flex items-end justify-center pb-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="relative z-10 text-xs font-bold text-white/90">Demo preview</span>
                    <button
                      type="button"
                      className="relative z-10 mb-2 rounded-lg bg-emerald-500 text-white text-xs font-bold px-4 py-2 shadow-lg"
                    >
                      Start answer
                    </button>
                  </div>
                  <ol className="space-y-2">
                    {PRACTICE_INSTRUCTION_STEPS.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                    <span className="w-1 h-6 rounded-full bg-orange-500" />
                    Compatibility test
                  </h3>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    Setup checklist ({prereqChecks.filter(Boolean).length}/{PREREQUISITE_CHECK_LABELS.length})
                  </p>
                  <ul className="space-y-3">
                    {PREREQUISITE_CHECK_LABELS.map((label, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        {prereqChecks[i] ? (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </span>
                        ) : (
                          <Loader2 className="w-6 h-6 shrink-0 text-sky-500 animate-spin" />
                        )}
                        <span className={prereqChecks[i] ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'}>{label}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={startAfterPrereq}
                    disabled={!prereqComplete}
                    className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 dark:disabled:bg-orange-900 text-white font-bold uppercase py-3.5 text-sm shadow-lg disabled:cursor-not-allowed transition-colors"
                  >
                    Start practice
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'warming' && (
          <motion.div
            key="warm"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-[50vh] items-center justify-center py-16"
          >
            <div className={`${cardLift} max-w-md w-full p-10 text-center shadow-orange-200/40 dark:shadow-none`}>
              <div className="mx-auto h-16 w-16 rounded-full bg-orange-500 shadow-lg shadow-orange-500/40 mb-6" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Warming up…</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Your interview is starting soon…</p>
              <div className="mt-8 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-100"
                  style={{ width: `${warmProgress}%` }}
                />
              </div>
              <div className="mt-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Interview tip</p>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mt-1">
                  Take your time and think before you speak.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'live' && currentSegment && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  Live
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{sessionLabel}</span>
                <span className="text-xs text-gray-500">· {interviewerDisplayName}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-sm tabular-nums text-gray-700 dark:text-gray-300">
                <Timer className="w-4 h-4 text-orange-500" />
                {formatMmSs(elapsedSec)}
              </div>
            </div>
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden shadow-lg">
                  <div className="aspect-video bg-gradient-to-br from-orange-900/95 via-gray-900 to-gray-900 flex flex-col items-center justify-center p-6 relative">
                    <div
                      className={`absolute inset-0 opacity-30 ${aiState === 'speaking' ? 'animate-pulse bg-orange-500/20' : ''}`}
                    />
                    <div className="relative z-10 h-24 w-24 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-3xl flex items-center justify-center shadow-xl ring-4 ring-white/10">
                      {interviewer.initial}
                    </div>
                    <p className="relative z-10 mt-4 font-semibold text-white">{interviewerDisplayName}</p>
                    <p className="relative z-10 text-sm text-orange-100/90 flex items-center gap-2 mt-1">
                      {aiState === 'speaking' ? (
                        <>
                          <Volume2 className="w-4 h-4" /> Speaking
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" /> Listening
                        </>
                      )}
                    </p>
                  </div>
                  <div className="p-4 flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2">
                      <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                      Connected
                    </span>
                    <span>
                      Part {segmentIndex + 1}/{script.length}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => goToResults(false)}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  End session early
                </button>
              </div>
              <div className="lg:col-span-3 flex flex-col min-h-[360px]">
                <div className="flex-1 rounded-2xl border border-gray-200 dark:bg-gray-800 dark:border-gray-600 bg-white flex flex-col overflow-hidden shadow-lg">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-start gap-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Current section</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{currentSegment.topic}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[min(50vh,480px)]" aria-live="polite">
                    {visibleTurns.map((turn, idx) => (
                      <motion.div
                        key={`${currentSegment.id}-${idx}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${turn.speaker === 'you' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                            turn.speaker === 'ai'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm'
                              : 'bg-orange-500 text-white rounded-tr-sm'
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">
                            {turn.speaker === 'ai' ? interviewerDisplayName : 'You (demo)'}
                          </p>
                          {turn.text}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={handleContinueConversation}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm shadow-md"
                    >
                      {continueLabel}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto pb-12">
            <div className={`${cardLift} overflow-hidden`}>
              <div className="text-center border-b border-gray-100 dark:border-gray-700 px-6 py-5 bg-gray-50/80 dark:bg-gray-900/40">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Session complete</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Interview results</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{sessionLabel}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {finishedFullSession ? 'Full session completed (demo rubric).' : 'Session ended before completion — illustrative scores.'}
                </p>
              </div>
              <div className="p-6 sm:p-8 space-y-8">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-600 p-8 text-center bg-gradient-to-b from-orange-50 to-white dark:from-orange-500/10 dark:to-transparent">
                  <p className="text-sm font-medium text-gray-600">Overall score (demo)</p>
                  <p className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent tabular-nums mt-2">
                    {results.overall}
                  </p>
                  <p className="text-sm text-gray-500 mt-2 font-mono">{formatMmSs(elapsedSec)}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-gray-500">Breakdown</h3>
                  {results.dimensions.map((d) => (
                    <div key={d.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{d.label}</span>
                        <span className="font-semibold tabular-nums">
                          {d.score}/{d.max}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                          style={{ width: `${(d.score / d.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-green-200 bg-green-50/50 dark:bg-green-950/20 p-4">
                    <h4 className="font-bold text-green-800 dark:text-green-300 text-sm mb-2 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Strengths
                    </h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                      {results.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <h4 className="font-bold text-sm mb-2 text-amber-900 dark:text-amber-200">Growth areas</h4>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {results.improvements.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                  {results.coachNote}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-xl border-2 border-orange-500 text-orange-700 dark:text-orange-300 font-bold px-6 py-3 text-sm"
                  >
                    New session
                  </button>
                  <button
                    type="button"
                    onClick={goMockAssessments}
                    className="rounded-xl bg-orange-500 text-white font-bold px-6 py-3 text-sm shadow-md"
                  >
                    Mock assessments
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  const wrap = (
    <div className={embedded ? `${shell} px-1` : shell}>
      <div className={embedded ? 'py-2' : 'py-6 px-4 sm:px-6'}>
        <div className="max-w-6xl mx-auto">{inner}</div>
      </div>
    </div>
  );

  if (embedded) return wrap;

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-gray-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-base font-bold text-gray-900 dark:text-white"
          >
            Project<span className="text-orange-500">Bazaar</span>
          </button>
          <nav className="flex gap-4 text-sm font-medium">
            <button type="button" onClick={() => navigateTo(isLoggedIn ? 'dashboard' : 'home')} className="text-gray-600 hover:text-orange-600">
              {isLoggedIn ? 'Dashboard' : 'Home'}
            </button>
            <button type="button" onClick={() => navigateTo('mockAssessment')} className="text-orange-600">
              Mock assessments
            </button>
          </nav>
        </div>
      </header>
      <main>{wrap}</main>
    </div>
  );
};

export default LiveMockInterviewPage;
