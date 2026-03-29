import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Circle,
  Loader2,
  Menu,
  Mic,
  Search,
  Square,
  Timer,
  UploadCloud,
  User,
  Video,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { useNavigation, useAuth } from '../App';
import { useDashboard } from '../context/DashboardContext';
import {
  AI_INTERVIEWER_NAME,
  ESTIMATED_DURATION_MIN,
  getInterviewScript,
  getMockResults,
  inferTrackFromText,
  LEVEL_OPTIONS,
  MOCK_COMPANIES,
  MOCK_INTERVIEW_ROUNDS,
  MOCK_INTERVIEWERS,
  MOCK_ROLE_TITLES,
  PRACTICE_INSTRUCTION_STEPS,
  PREREQUISITE_CHECK_LABELS,
  TRACK_OPTIONS,
  type InterviewLevelId,
  type InterviewTrackId,
} from '../data/liveMockInterviewMockData';
import {
  acquireLocalMedia,
  checkBrowserMediaSupport,
  checkNetworkLatency,
  measureMicInput,
  playSpeakerTestTone,
} from '../utils/liveInterviewMediaCheck';
import interviewerFlowAnimation from '../lottiefiles/ai-animation-interviewer-Flow.json';

type FlowPhase = 'setup' | 'briefing' | 'prereq' | 'warming' | 'live' | 'results';
type SetupTabId = 'role' | 'company' | 'jd' | 'custom';

type PrereqItemStatus = 'pending' | 'running' | 'pass' | 'skip' | 'fail' | 'awaiting_tone';

const initialPrereqStatuses = (): PrereqItemStatus[] =>
  PREREQUISITE_CHECK_LABELS.map(() => 'pending' as PrereqItemStatus);

const PAGE_BG = 'bg-white dark:bg-[#12111a]';
const LV_TITLE = 'text-[#1a1c2e] dark:text-white';

/** Role / company picker — orange + white */
const PICKER_SURFACE =
  'bg-gradient-to-b from-orange-50/90 via-white to-white dark:from-orange-950/25 dark:via-[#12111a] dark:to-[#12111a]';
const PICKER_BORDER = 'border-orange-100/90 dark:border-orange-900/40';
const ACCENT_RING = 'ring-[#f97316]';
const RING_OFFSET_PICKER = 'ring-offset-orange-50 dark:ring-offset-[#12111a]';

const formatMmSs = (totalSec: number) => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface LiveMockInterviewPageProps {
  embedded?: boolean;
  toggleSidebar?: () => void;
}

const SETUP_TABS: { id: SetupTabId; label: string }[] = [
  { id: 'role', label: 'Role Based' },
  { id: 'company', label: 'Company Based' },
  { id: 'jd', label: 'JD Based' },
  { id: 'custom', label: 'Create Your Own' },
];

const LiveMockInterviewPage: React.FC<LiveMockInterviewPageProps> = ({
  embedded = false,
  toggleSidebar,
}) => {
  const { navigateTo } = useNavigation();
  const { isLoggedIn } = useAuth();
  const { dashboardMode, setActiveView } = useDashboard();

  const [phase, setPhase] = useState<FlowPhase>('setup');
  const [setupTab, setSetupTab] = useState<SetupTabId>('role');
  const [roleSearch, setRoleSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [sessionLabel, setSessionLabel] = useState('');
  const [companyName, setCompanyName] = useState<string | undefined>(undefined);
  const [track, setTrack] = useState<InterviewTrackId>('swe');
  const [level, setLevel] = useState<InterviewLevelId>('mid');

  const [customStep, setCustomStep] = useState<1 | 2>(1);
  const [customRole, setCustomRole] = useState('');
  const [customRound, setCustomRound] = useState<string>(MOCK_INTERVIEW_ROUNDS[0].id);
  const [customCompanyOpt, setCustomCompanyOpt] = useState('');

  const [jdJobTitle, setJdJobTitle] = useState('');
  const [jdInterviewType, setJdInterviewType] = useState<InterviewTrackId>('swe');
  const [jdText, setJdText] = useState('');

  const [selectedInterviewerId, setSelectedInterviewerId] = useState(MOCK_INTERVIEWERS[0].id);
  const [selectedRoundId, setSelectedRoundId] = useState<string>(MOCK_INTERVIEW_ROUNDS[0].id);
  const [useAudio, setUseAudio] = useState(true);
  const [useVideo, setUseVideo] = useState(true);
  const [termsOk, setTermsOk] = useState(false);

  const [prereqStatuses, setPrereqStatuses] = useState<PrereqItemStatus[]>(initialPrereqStatuses);
  const [prereqError, setPrereqError] = useState<string | null>(null);
  const [prereqChecksBegun, setPrereqChecksBegun] = useState(false);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const prereqVideoRef = useRef<HTMLVideoElement>(null);
  const liveVideoBindCleanupRef = useRef<(() => void) | null>(null);

  const [warmProgress, setWarmProgress] = useState(0);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [revealCount, setRevealCount] = useState(1);
  const [aiState, setAiState] = useState<'idle' | 'speaking' | 'listening'>('speaking');
  const [finishedFullSession, setFinishedFullSession] = useState(false);

  const interviewerDisplay = useMemo(
    () => MOCK_INTERVIEWERS.find((i) => i.id === selectedInterviewerId)?.name ?? AI_INTERVIEWER_NAME,
    [selectedInterviewerId]
  );

  const script = useMemo(() => getInterviewScript(track), [track]);
  const currentSegment = script[segmentIndex];
  const visibleTurns = currentSegment ? currentSegment.turns.slice(0, revealCount) : [];
  const atEndOfSegment = currentSegment ? revealCount >= currentSegment.turns.length : false;
  const atEndOfInterview = atEndOfSegment && segmentIndex >= script.length - 1;

  /** Last visible line when it is the AI — used to drive speech synthesis in live phase. */
  const liveAiUtterance = useMemo(() => {
    if (phase !== 'live' || !currentSegment) return null;
    const turns = currentSegment.turns.slice(0, revealCount);
    const last = turns[turns.length - 1];
    if (!last || last.speaker !== 'ai') return null;
    return {
      text: last.text,
      key: `${currentSegment.id}-${revealCount}`,
    };
  }, [phase, currentSegment, revealCount]);

  const ttsLang = useMemo(() => {
    const inv = MOCK_INTERVIEWERS.find((i) => i.id === selectedInterviewerId);
    const loc = inv?.locale ?? '';
    if (loc.includes('UK')) return 'en-GB';
    if (loc.includes('IN')) return 'en-IN';
    return 'en-US';
  }, [selectedInterviewerId]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return MOCK_ROLE_TITLES;
    return MOCK_ROLE_TITLES.filter((r) => r.toLowerCase().includes(q));
  }, [roleSearch]);

  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return MOCK_COMPANIES;
    return MOCK_COMPANIES.filter((c) => c.name.toLowerCase().includes(q));
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

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (phase !== 'live' || !useAudio || !liveAiUtterance) {
      window.speechSynthesis.cancel();
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(liveAiUtterance.text);
    utter.lang = ttsLang;
    utter.rate = 0.95;
    utter.pitch = 1;

    const baseLang = ttsLang.split('-')[0] ?? 'en';
    let cancelled = false;
    let didStart = false;
    const applyVoiceAndSpeak = () => {
      if (cancelled || didStart) return;
      const voices = window.speechSynthesis.getVoices();
      const match =
        voices.find((v) => v.lang === ttsLang) ||
        voices.find((v) => v.lang.startsWith(baseLang)) ||
        voices.find((v) => v.default);
      if (match) utter.voice = match;
      didStart = true;
      window.speechSynthesis.speak(utter);
    };
    const onVoicesChanged = () => {
      applyVoiceAndSpeak();
    };

    let timeoutId = 0;
    if (window.speechSynthesis.getVoices().length > 0) {
      applyVoiceAndSpeak();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      timeoutId = window.setTimeout(() => applyVoiceAndSpeak(), 600);
    }

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, [phase, useAudio, liveAiUtterance?.key, liveAiUtterance?.text, ttsLang]);

  const stopLocalMedia = useCallback(() => {
    setLocalMediaStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const prevPhaseRef = useRef<FlowPhase>(phase);
  useEffect(() => {
    if (phase === 'prereq' && prevPhaseRef.current !== 'prereq') {
      stopLocalMedia();
      setPrereqChecksBegun(false);
      setPrereqStatuses(initialPrereqStatuses());
      setPrereqError(null);
    }
    prevPhaseRef.current = phase;
  }, [phase, stopLocalMedia]);

  useEffect(() => {
    if (phase === 'setup' || phase === 'briefing' || phase === 'results') {
      stopLocalMedia();
    }
  }, [phase, stopLocalMedia]);

  /** Bind MediaStream to a preview <video>; call returned cleanup on unmount or before rebinding. */
  const bindPreviewVideo = useCallback((el: HTMLVideoElement, stream: MediaStream) => {
    el.muted = true;
    el.setAttribute('playsinline', '');
    el.playsInline = true;
    el.srcObject = stream;
    const play = () => {
      void el.play().catch(() => undefined);
    };
    play();
    const raf = requestAnimationFrame(play);
    return () => {
      cancelAnimationFrame(raf);
      el.srcObject = null;
    };
  }, []);

  useLayoutEffect(() => {
    const el = prereqVideoRef.current;
    if (!el || !localMediaStream || phase !== 'prereq') return;
    return bindPreviewVideo(el, localMediaStream);
  }, [localMediaStream, phase, bindPreviewVideo]);

  const setLiveUserVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      liveVideoBindCleanupRef.current?.();
      liveVideoBindCleanupRef.current = null;
      if (
        !node ||
        !localMediaStream ||
        phase !== 'live' ||
        !useVideo ||
        localMediaStream.getVideoTracks().length === 0
      ) {
        return;
      }
      liveVideoBindCleanupRef.current = bindPreviewVideo(node, localMediaStream);
    },
    [bindPreviewVideo, localMediaStream, phase, useVideo]
  );

  useEffect(() => {
    if (phase !== 'warming') return;
    setWarmProgress(0);
    const start = performance.now();
    const duration = 2200;
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / duration) * 100);
      setWarmProgress(p);
      if (p < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setPhase('live');
        setElapsedSec(0);
        setSegmentIndex(0);
        setRevealCount(1);
        setFinishedFullSession(false);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const goBack = useCallback(() => {
    if (embedded) {
      setActiveView(dashboardMode === 'preparation' ? 'prep-hub' : 'dashboard');
    } else {
      navigateTo(isLoggedIn ? 'dashboard' : 'home');
    }
  }, [embedded, dashboardMode, setActiveView, navigateTo, isLoggedIn]);

  const goMockAssessments = useCallback(() => {
    if (embedded) {
      setActiveView('mock-assessment');
    } else {
      navigateTo('mockAssessment');
    }
  }, [embedded, setActiveView, navigateTo]);

  const resetSession = useCallback(() => {
    stopLocalMedia();
    setPhase('setup');
    setSetupTab('role');
    setRoleSearch('');
    setCompanySearch('');
    setSessionLabel('');
    setCompanyName(undefined);
    setTrack('swe');
    setLevel('mid');
    setCustomStep(1);
    setCustomRole('');
    setCustomRound(MOCK_INTERVIEW_ROUNDS[0].id);
    setCustomCompanyOpt('');
    setJdJobTitle('');
    setJdInterviewType('swe');
    setJdText('');
    setSelectedInterviewerId(MOCK_INTERVIEWERS[0].id);
    setSelectedRoundId(MOCK_INTERVIEW_ROUNDS[0].id);
    setUseAudio(true);
    setUseVideo(true);
    setTermsOk(false);
    setPrereqStatuses(initialPrereqStatuses());
    setPrereqError(null);
    setPrereqChecksBegun(false);
    setWarmProgress(0);
    setElapsedSec(0);
    setSegmentIndex(0);
    setRevealCount(1);
    setFinishedFullSession(false);
    setAiState('speaking');
  }, [stopLocalMedia]);

  const beginPrereqChecks = useCallback(async () => {
    setPrereqError(null);
    setPrereqChecksBegun(true);
    const setS = (idx: number, s: PrereqItemStatus) => {
      setPrereqStatuses((prev) => {
        const next = [...prev];
        next[idx] = s;
        return next;
      });
    };

    let stream: MediaStream | null = null;

    setS(0, 'running');
    const browser = checkBrowserMediaSupport();
    if (!browser.ok) {
      setS(0, 'fail');
      setPrereqError(browser.reason ?? 'Browser check failed.');
      return;
    }
    setS(0, 'pass');

    if (useAudio || useVideo) {
      if (useAudio) setS(1, 'running');
      else setS(1, 'skip');
      if (useVideo) setS(2, 'running');
      else setS(2, 'skip');
      try {
        stream = await acquireLocalMedia({ audio: useAudio, video: useVideo });
        setLocalMediaStream(stream);
        setS(1, useAudio ? 'pass' : 'skip');
        setS(2, useVideo ? 'pass' : 'skip');
      } catch (e) {
        setS(1, useAudio ? 'fail' : 'skip');
        setS(2, useVideo ? 'fail' : 'skip');
        setPrereqError(
          e instanceof Error
            ? e.message
            : 'Could not access camera or microphone. Check browser permissions.'
        );
        return;
      }
    } else {
      setS(1, 'skip');
      setS(2, 'skip');
    }

    setS(3, 'running');
    if (!useAudio || !stream) {
      setS(3, 'skip');
    } else {
      const heard = await measureMicInput(stream);
      if (heard) {
        setS(3, 'pass');
      } else {
        setS(3, 'fail');
        setPrereqError(
          'We could not detect speech on the microphone. Speak clearly when the voice step runs, check your input device, or turn off “Use microphone” if you only want the camera.'
        );
        return;
      }
    }

    setS(4, 'running');
    const net = await checkNetworkLatency();
    if (!net.ok || net.ms > 12000) {
      setS(4, 'fail');
      setPrereqError(
        net.ms > 12000
          ? `This site responded slowly (${Math.round(net.ms)} ms). Check your connection.`
          : 'Could not verify network connectivity to this site.'
      );
      return;
    }
    setS(4, 'pass');

    setS(5, 'awaiting_tone');
  }, [useAudio, useVideo]);

  const handlePlayTestTone = useCallback(async () => {
    setPrereqStatuses((prev) => {
      const next = [...prev];
      if (next[5] === 'awaiting_tone') next[5] = 'running';
      return next;
    });
    try {
      await playSpeakerTestTone();
      setPrereqStatuses((prev) => {
        const next = [...prev];
        next[5] = 'pass';
        return next;
      });
    } catch {
      setPrereqStatuses((prev) => {
        const next = [...prev];
        next[5] = 'fail';
        return next;
      });
      setPrereqError('Could not play the test tone. Check that audio is not blocked for this tab.');
    }
  }, []);

  const retryPrereqChecks = useCallback(() => {
    stopLocalMedia();
    setPrereqStatuses(initialPrereqStatuses());
    setPrereqError(null);
    setPrereqChecksBegun(false);
  }, [stopLocalMedia]);

  const prereqReadyForLive =
    prereqChecksBegun &&
    prereqStatuses.every((s) => s === 'pass' || s === 'skip') &&
    !prereqError;

  const goToBriefing = useCallback(() => {
    setPhase('briefing');
    setTermsOk(false);
  }, []);

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

  const handleEndEarly = () => {
    goToResults(false);
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
    'text-gray-900 dark:text-gray-100 ' +
    (embedded ? `min-h-0 w-full min-w-0 ${PAGE_BG}` : `min-h-screen w-full ${PAGE_BG}`);

  const mainInner =
    (embedded ? 'pb-10 pt-2' : 'pb-16 pt-6') + ' px-4 sm:px-6 lg:px-8 xl:px-10 w-full min-w-0';

  const cardWhite =
    'rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm';

  const pillTabActive = 'bg-[#f97316] text-white shadow-md shadow-orange-500/25';
  const pillTabIdle =
    'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500/40';

  const renderRoleCompanyHeadline = () => {
    const isRole = setupTab === 'role';
    const isCompany = setupTab === 'company';
    if (!isRole && !isCompany) return null;
    return (
      <div className="mb-8 text-center max-w-3xl mx-auto space-y-5 px-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-500/35 bg-white dark:bg-gray-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#ea580c] dark:text-orange-400">
          <Zap className="w-4 h-4 text-[#f97316]" aria-hidden />
          {isRole ? '3000+ roles available' : 'Practice by company'}
        </span>
        <h1 className="font-bold tracking-tight text-gray-900 dark:text-white">
          {isRole ? (
            <>
              <span className="block text-2xl sm:text-3xl md:text-4xl">Role-Specific</span>
              <span className="block text-3xl sm:text-4xl md:text-5xl mt-1 text-[#f97316] dark:text-orange-400">
                AI Mock Interviews
              </span>
            </>
          ) : (
            <>
              <span className="block text-2xl sm:text-3xl md:text-4xl">Company-Specific</span>
              <span className="block text-3xl sm:text-4xl md:text-5xl mt-1 text-[#f97316] dark:text-orange-400">
                AI Mock Interviews
              </span>
            </>
          )}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
          {isRole
            ? `Practice role-specific interviews with real-world questions. Improve domain knowledge, articulation and communication with an instant feedback-style report (demo). Typical walkthrough about ${ESTIMATED_DURATION_MIN} minutes.`
            : 'Practice company-targeted scenarios and talking points. Build confidence for recruiter screens and onsite loops — tailored demo script per company.'}
        </p>
      </div>
    );
  };

  const renderRoleCompanySearch = () => {
    const isRole = setupTab === 'role';
    const isCompany = setupTab === 'company';
    if (!isRole && !isCompany) return null;
    return (
      <div className="w-full max-w-3xl mx-auto mb-10 px-1">
        <div className="flex rounded-full border border-orange-100 dark:border-orange-900/40 bg-white dark:bg-gray-900 shadow-md shadow-orange-900/[0.06] dark:shadow-black/30 overflow-hidden transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#f97316]/25 pl-5 pr-1.5 py-1.5">
          <label className="flex flex-1 items-center gap-3 min-w-0 cursor-text">
            <Search className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
            <input
              type="search"
              value={isRole ? roleSearch : companySearch}
              onChange={(e) => (isRole ? setRoleSearch(e.target.value) : setCompanySearch(e.target.value))}
              placeholder={
                isRole
                  ? 'Search for roles (e.g. Software Engineer, Data Analyst)'
                  : 'Search companies (e.g. Google, Amazon)'
              }
              className="flex-1 min-w-0 py-3 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
            />
          </label>
          <button
            type="button"
            className="shrink-0 rounded-full px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-white bg-[#f97316] hover:opacity-95 transition-opacity shadow-sm shadow-orange-500/20"
          >
            Search
          </button>
        </div>
      </div>
    );
  };

  const renderRoleCompanyGrid = () => {
    const tileOrange =
      'rounded-3xl border border-orange-100/90 dark:border-orange-900/40 bg-white dark:bg-gray-900 shadow-md shadow-orange-900/[0.05] dark:shadow-black/30 flex items-center justify-center min-h-[100px] px-4 py-6 text-center transition-all hover:shadow-lg hover:ring-2 ' +
      `${ACCENT_RING} ring-offset-2 ${RING_OFFSET_PICKER}`;

    if (setupTab === 'role') {
      return (
        <div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <User className="w-5 h-5 text-[#f97316] shrink-0" aria-hidden />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Roles</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredRoles.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => {
                  setSessionLabel(title);
                  setCompanyName(undefined);
                  setTrack(inferTrackFromText(title));
                  goToBriefing();
                }}
                className={tileOrange}
              >
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                  {title}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (setupTab === 'company') {
      return (
        <div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <User className="w-5 h-5 text-[#f97316] shrink-0" aria-hidden />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Companies</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredCompanies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => {
                  setSessionLabel(`Company: ${company.name}`);
                  setCompanyName(company.name);
                  setTrack('swe');
                  goToBriefing();
                }}
                className={tileOrange}
              >
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                  {company.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderPickerSetupTabs = () => (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {SETUP_TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            setSetupTab(t.id);
            if (t.id === 'custom') setCustomStep(1);
          }}
          className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
            setupTab === t.id ? pillTabActive : pillTabIdle
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const jdValid = jdJobTitle.trim().length > 0;

  const renderSetupBody = () => {
    switch (setupTab) {
      case 'role':
      case 'company':
        return renderRoleCompanyGrid();
      case 'jd':
        return (
          <div className={`${cardWhite} max-w-2xl mx-auto p-6 sm:p-8 space-y-6`}>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                Job title <span className="text-red-500">*</span>
              </label>
              <input
                value={jdJobTitle}
                onChange={(e) => setJdJobTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                Interview type <span className="text-red-500">*</span>
              </label>
              <select
                value={jdInterviewType}
                onChange={(e) => setJdInterviewType(e.target.value as InterviewTrackId)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
              >
                {TRACK_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                Job description
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-3 text-sm"
                placeholder="Paste key requirements…"
              />
            </div>
            <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <UploadCloud className="w-8 h-8 mx-auto mb-2 text-[#f97316] opacity-80" aria-hidden />
              Drag & drop a JD file (mock — no upload)
            </div>
            <button
              type="button"
              disabled={!jdValid}
              onClick={() => {
                const combined = `${jdJobTitle} ${jdText}`;
                const inferred = inferTrackFromText(combined);
                setSessionLabel(`JD: ${jdJobTitle.trim()}`);
                setCompanyName(undefined);
                setTrack(inferred !== 'swe' ? inferred : jdInterviewType);
                goToBriefing();
              }}
              className="w-full sm:w-auto rounded-full px-8 py-3 text-sm font-bold uppercase tracking-wide text-white bg-[#f97316] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
            >
              Submit
            </button>
          </div>
        );
      case 'custom':
        if (customStep === 1) {
          return (
            <div className={`${cardWhite} max-w-xl mx-auto p-6 sm:p-8 space-y-6`}>
              <p className="text-xs font-bold uppercase tracking-wider text-[#f97316]">Step 1 of 2</p>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Role name</label>
                <input
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
                  placeholder="Target role"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Interview round</label>
                <select
                  value={customRound}
                  onChange={(e) => setCustomRound(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
                >
                  {MOCK_INTERVIEW_ROUNDS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Company (optional)</label>
                <input
                  value={customCompanyOpt}
                  onChange={(e) => setCustomCompanyOpt(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
                  placeholder="e.g. Acme Inc."
                />
              </div>
              <button
                type="button"
                disabled={!customRole.trim()}
                onClick={() => setCustomStep(2)}
                className="rounded-full px-8 py-3 text-sm font-bold text-white bg-[#f97316] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          );
        }
        return (
          <div className={`${cardWhite} max-w-xl mx-auto p-6 sm:p-8 space-y-6`}>
            <p className="text-xs font-bold uppercase tracking-wider text-[#f97316]">Step 2 of 2</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose your experience level for sample scoring.</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {LEVEL_OPTIONS.map((l) => {
                const selected = level === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevel(l.id)}
                    className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                      selected
                        ? 'border-[#f97316] bg-orange-50/90 dark:bg-orange-500/10 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                    }`}
                  >
                    <span className="font-semibold text-gray-900 dark:text-white block">{l.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{l.hint}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setCustomStep(1)}
                className="rounded-full px-6 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const companyPart = customCompanyOpt.trim() ? ` · ${customCompanyOpt.trim()}` : '';
                  setSessionLabel(`Custom: ${customRole.trim()}${companyPart}`);
                  setCompanyName(customCompanyOpt.trim() || undefined);
                  setTrack(inferTrackFromText(customRole));
                  setSelectedRoundId(customRound);
                  goToBriefing();
                }}
                className="rounded-full px-8 py-3 text-sm font-bold text-white bg-[#f97316] shadow-md"
              >
                Continue
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const briefingCanStart = termsOk;

  const content = (
    <>
      {embedded && toggleSidebar && (
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Menu</span>
        </div>
      )}

      <div className={`px-0 sm:px-0 ${mainInner}`}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#f97316] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            {embedded
              ? dashboardMode === 'preparation'
                ? 'Back to prep hub'
                : 'Back to dashboard'
              : isLoggedIn
                ? 'Dashboard'
                : 'Home'}
          </button>
          <button
            type="button"
            onClick={goMockAssessments}
            className="text-sm font-medium text-[#f97316] hover:underline"
          >
            Mock assessments
          </button>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="w-full min-w-0"
            >
              {['role', 'company'].includes(setupTab) ? (
                <div
                  className={`${PICKER_SURFACE} -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 rounded-2xl sm:rounded-3xl border ${PICKER_BORDER}`}
                >
                  {renderPickerSetupTabs()}
                  {renderRoleCompanyHeadline()}
                  {renderRoleCompanySearch()}
                  {renderRoleCompanyGrid()}
                </div>
              ) : (
                <>
                  <div className="mb-8 text-center sm:text-left space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-500/40 bg-white dark:bg-gray-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#ea580c] dark:text-orange-400">
                      <User className="w-3.5 h-3.5" aria-hidden />
                      Live mock interview
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                      <span className="text-[#f97316]">Practice</span>
                      <span className="text-gray-400 dark:text-gray-500 font-light mx-2">|</span>
                      <span className={LV_TITLE}>on your terms</span>
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
                      Pick a path below. All flows use the same demo transcript engine — no real recording.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    {SETUP_TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSetupTab(t.id);
                          if (t.id === 'custom') setCustomStep(1);
                        }}
                        className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                          setupTab === t.id ? pillTabActive : pillTabIdle
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {renderSetupBody()}
                </>
              )}
            </motion.div>
          )}

          {phase === 'briefing' && (
            <motion.div
              key="briefing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="w-full min-w-0 flex justify-center"
            >
              <div className={`w-full max-w-3xl ${cardWhite} overflow-hidden`}>
                <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Interview details</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="rounded-xl bg-orange-50/80 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/30 px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-900 dark:text-white">{sessionLabel || 'Session'}</p>
                    {companyName && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">Company focus: {companyName}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Track: {TRACK_OPTIONS.find((x) => x.id === track)?.label} · Level:{' '}
                      {LEVEL_OPTIONS.find((x) => x.id === level)?.label}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Round
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_INTERVIEW_ROUNDS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRoundId(r.id)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            selectedRoundId === r.id
                              ? pillTabActive
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                      Interviewer
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {MOCK_INTERVIEWERS.map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => setSelectedInterviewerId(inv.id)}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                            selectedInterviewerId === inv.id
                              ? 'border-[#f97316] bg-orange-50/50 dark:bg-orange-500/10'
                              : 'border-gray-200 dark:border-gray-600 hover:border-orange-200'
                          }`}
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f97316] to-amber-500 text-lg font-bold text-white">
                            {inv.initial}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{inv.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{inv.locale}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-700">
                    <label className="flex items-center gap-3 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAudio}
                        onChange={(e) => setUseAudio(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#f97316] focus:ring-[#f97316]"
                      />
                      <Mic className="w-4 h-4 text-[#f97316] shrink-0" aria-hidden />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Use microphone / audio</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useVideo}
                        onChange={(e) => setUseVideo(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#f97316] focus:ring-[#f97316]"
                      />
                      <Video className="w-4 h-4 text-[#f97316] shrink-0" aria-hidden />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Use camera / video</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsOk}
                        onChange={(e) => setTermsOk(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#f97316] focus:ring-[#f97316]"
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        I agree to the demo terms (no recording stored in this build)
                      </span>
                    </label>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Attempts remaining: <strong className="text-gray-900 dark:text-white">3</strong> (mock)
                  </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/80 dark:bg-gray-950/40">
                  <button
                    type="button"
                    onClick={() => setPhase('setup')}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600"
                  >
                    <X className="w-4 h-4" aria-hidden />
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!briefingCanStart}
                    onClick={() => setPhase('prereq')}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-bold text-white bg-[#f97316] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/25"
                  >
                    Start practice
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'prereq' && (
            <motion.div
              key="prereq"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="w-full min-w-0"
            >
              <div className={`${cardWhite} p-6 sm:p-8 grid lg:grid-cols-2 gap-8 lg:gap-10`}>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Practice instructions</h3>
                  <ol className="space-y-3 list-decimal list-inside text-sm text-gray-600 dark:text-gray-400">
                    {PRACTICE_INSTRUCTION_STEPS.map((step, i) => (
                      <li key={i} className="pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-950 aspect-video relative">
                    {useVideo && localMediaStream?.getVideoTracks().length ? (
                      <video
                        ref={prereqVideoRef}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Video className="w-10 h-10 text-gray-500" aria-hidden />
                        <span className="text-xs text-gray-400">
                          {useVideo
                            ? 'Camera preview appears after the device check starts.'
                            : 'Video is off — enable “Use camera” in the previous step to preview yourself.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="border-l-4 border-[#f97316] pl-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compatibility test</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Real checks in your browser — grant permissions when asked. On the voice step, speak a short sentence
                    out loud.
                  </p>
                  {!prereqChecksBegun && (
                    <button
                      type="button"
                      onClick={() => void beginPrereqChecks()}
                      className="mb-6 w-full sm:w-auto rounded-full px-8 py-3 text-sm font-bold text-white bg-[#f97316] shadow-md shadow-orange-500/25"
                    >
                      Begin device &amp; network check
                    </button>
                  )}
                  {prereqError && (
                    <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                      {prereqError}
                      <button
                        type="button"
                        onClick={retryPrereqChecks}
                        className="mt-2 block text-sm font-semibold underline hover:no-underline"
                      >
                        Reset and try again
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Progress: {prereqStatuses.filter((s) => s === 'pass' || s === 'skip').length}/
                    {PREREQUISITE_CHECK_LABELS.length} steps complete
                  </p>
                  <ul className="space-y-3">
                    {PREREQUISITE_CHECK_LABELS.map((label, idx) => {
                      const st = prereqStatuses[idx] ?? 'pending';
                      const done = st === 'pass' || st === 'skip';
                      const loading = st === 'running';
                      const failed = st === 'fail';
                      const awaitTone = st === 'awaiting_tone';
                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 px-4 py-3"
                        >
                          <span className="shrink-0 mt-0.5">
                            {done ? (
                              <Check className="w-5 h-5 text-emerald-600" aria-hidden />
                            ) : loading ? (
                              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" aria-hidden />
                            ) : failed ? (
                              <X className="w-5 h-5 text-red-500" aria-hidden />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" aria-hidden />
                            )}
                          </span>
                          <div className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-300">
                            <span className={st === 'skip' ? 'opacity-80' : ''}>
                              {label}
                              {st === 'skip' && (
                                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(skipped)</span>
                              )}
                            </span>
                            {awaitTone && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => void handlePlayTestTone()}
                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2"
                                >
                                  <Volume2 className="w-3.5 h-3.5" aria-hidden />
                                  Play test tone
                                </button>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  You should hear a brief beep — unmute your device if needed.
                                </p>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    disabled={!prereqReadyForLive}
                    onClick={() => setPhase('warming')}
                    className="mt-8 w-full sm:w-auto rounded-full px-8 py-3 text-sm font-bold text-white bg-[#f97316] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    Start practice
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'warming' && (
            <motion.div
              key="warming"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full min-w-0 flex justify-center"
            >
              <div className={`w-full max-w-md ${cardWhite} p-10 text-center space-y-6`}>
                <Loader2 className="w-10 h-10 mx-auto text-[#f97316] animate-spin" aria-hidden />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Warming up…</h2>
                <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f97316] transition-[width] duration-75 ease-out"
                    style={{ width: `${warmProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Preparing your session with {interviewerDisplay}</p>
              </div>
            </motion.div>
          )}

          {phase === 'live' && currentSegment && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 w-full min-w-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    Live
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Interview in progress</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">·</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {MOCK_INTERVIEW_ROUNDS.find((r) => r.id === selectedRoundId)?.label ?? 'Round'} · Topic{' '}
                    {segmentIndex + 1} of {script.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono tabular-nums text-gray-700 dark:text-gray-300">
                  <Timer className="w-4 h-4 text-[#f97316]" aria-hidden />
                  <span>{formatMmSs(elapsedSec)}</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                    <div className="aspect-video bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center relative border-b border-gray-100 dark:border-gray-800">
                      <div
                        className={`absolute inset-0 pointer-events-none ${aiState === 'speaking' ? 'animate-pulse bg-orange-50/80 dark:bg-orange-500/10' : ''}`}
                        aria-hidden
                      />
                      <div
                        className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center pointer-events-none"
                        aria-hidden
                      >
                        <Lottie
                          animationData={interviewerFlowAnimation}
                          loop
                          className="h-full w-full max-h-[11rem] max-w-[11rem] sm:max-h-[13rem] sm:max-w-[13rem] object-contain"
                        />
                      </div>
                      <span className="sr-only">AI interviewer {interviewerDisplay}</span>
                      <p className="relative z-10 mt-4 font-semibold text-gray-900 dark:text-white">{interviewerDisplay}</p>
                      <p className="relative z-10 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap items-center justify-center gap-2 mt-1">
                        {!useVideo && (
                          <span className="text-amber-700 dark:text-amber-300 text-xs">Video off</span>
                        )}
                        {aiState === 'speaking' ? (
                          <>
                            <Volume2 className="w-4 h-4 text-[#f97316]" aria-hidden />
                            Speaking
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 text-[#f97316]" aria-hidden />
                            Listening
                          </>
                        )}
                      </p>
                    </div>
                    <div className="p-4 flex items-center justify-between text-sm border-t border-gray-200 dark:border-gray-600">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" aria-hidden />
                        Connected
                        {!useAudio && <span className="text-amber-600 text-xs">· Audio off</span>}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Part {segmentIndex + 1}/{script.length}
                      </span>
                    </div>
                  </div>
                  {useVideo && localMediaStream?.getVideoTracks().length ? (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Your camera
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
                      </div>
                      <div className="relative aspect-video w-full min-h-0 overflow-hidden bg-gray-950">
                        <video
                          ref={setLiveUserVideoRef}
                          key={localMediaStream.id}
                          className="absolute inset-0 h-full w-full object-cover"
                          autoPlay
                          playsInline
                          muted
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-950/30 px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                      {useVideo
                        ? 'Camera preview will appear here when video is enabled and permission is granted.'
                        : 'Camera is off for this session (enable under interview details next time).'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleEndEarly}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Square className="w-3.5 h-3.5" aria-hidden />
                    End session early
                  </button>
                </div>

                <div className="lg:col-span-3 flex flex-col min-h-[380px] lg:min-h-[420px]">
                  <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 flex flex-col overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Current section
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">{currentSegment.topic}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-200 font-medium">
                        {TRACK_OPTIONS.find((t) => t.id === track)?.label}
                      </span>
                    </div>
                    <div
                      className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[min(52vh,520px)]"
                      aria-live="polite"
                    >
                      {visibleTurns.map((turn, idx) => (
                        <motion.div
                          key={`${currentSegment.id}-${idx}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${turn.speaker === 'you' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              turn.speaker === 'ai'
                                ? 'bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                                : 'bg-[#f97316] text-white rounded-tr-sm'
                            }`}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mb-1">
                              {turn.speaker === 'ai' ? interviewerDisplay : 'You (demo reply)'}
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
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f97316] to-orange-600 text-white text-sm font-semibold shadow-md shadow-orange-500/20 hover:opacity-95"
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
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 w-full min-w-0 flex flex-col items-center"
            >
              <div className={`w-full max-w-3xl ${cardWhite} overflow-hidden`}>
                <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/80 dark:bg-gray-950/40 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Session complete
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">Interview results</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-lg mx-auto">
                    with {interviewerDisplay}.{' '}
                    {finishedFullSession
                      ? 'Sample rubric applied using your track and level.'
                      : 'You ended the session early — scores below are illustrative.'}
                  </p>
                </div>
                <div className="p-6 sm:p-8 space-y-8">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-600 p-6 bg-gradient-to-b from-orange-50/90 to-white dark:from-orange-500/10 dark:to-gray-900/50 text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall demo score</p>
                    <p className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-amber-600 mt-2 tabular-nums">
                      {results.overall}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-mono tabular-nums">
                      Duration {formatMmSs(elapsedSec)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Score breakdown
                    </h2>
                    <ul className="space-y-3">
                      {results.dimensions.map((d) => (
                        <li key={d.label}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-gray-700 dark:text-gray-300">{d.label}</span>
                            <span className="font-semibold tabular-nums">
                              {d.score}/{d.max}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-amber-500 transition-all"
                              style={{ width: `${(d.score / d.max) * 100}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20 p-5">
                      <h3 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2 mb-3 text-sm">
                        <Check className="w-4 h-4" aria-hidden />
                        Strengths
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                        {results.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-5">
                      <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-3 text-sm">Growth areas</h3>
                      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                        {results.improvements.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-5 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Coach note (demo)</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{results.coachNote}</p>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-3 justify-center pt-2">
                    <button
                      type="button"
                      onClick={resetSession}
                      className="px-6 py-3 rounded-xl border-2 border-[#f97316] text-orange-700 dark:text-orange-300 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-500/10"
                    >
                      Run another session
                    </button>
                    <button
                      type="button"
                      onClick={goMockAssessments}
                      className="px-6 py-3 rounded-xl bg-[#f97316] hover:bg-orange-600 text-white text-sm font-semibold shadow-sm"
                    >
                      Mock assessments
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  if (embedded) {
    return <div className={shell}>{content}</div>;
  }

  return (
    <div className={shell}>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-base font-bold tracking-tight text-gray-900 dark:text-white hover:text-[#f97316] transition-colors"
          >
            Project<span className="text-[#f97316]">Bazaar</span>
          </button>
          <nav className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => navigateTo(isLoggedIn ? 'dashboard' : 'home')}
              className="font-medium text-gray-600 dark:text-gray-300 hover:text-[#f97316]"
            >
              {isLoggedIn ? 'Dashboard' : 'Home'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('mockAssessment')}
              className="font-medium text-[#f97316] hover:underline"
            >
              Mock assessments
            </button>
          </nav>
        </div>
      </header>
      <main className="w-full min-w-0">{content}</main>
    </div>
  );
};

export default LiveMockInterviewPage;
