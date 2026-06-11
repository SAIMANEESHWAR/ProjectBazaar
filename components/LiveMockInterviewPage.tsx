import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
  Briefcase,
  Building2,
  Code2,
  FileText,
  Layers,
  Lightbulb,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  MoreHorizontal,
  Phone,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Target,
  Timer,
  UploadCloud,
  User,
  Users,
  Video,
  VideoOff,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { useNavigation, useAuth } from '../App';
import { useSubscription } from '../context/SubscriptionContext';
import { LIVE_INTERVIEW_SETUP_TABS, useDashboard } from '../context/DashboardContext';
import { consumeLiveInterviewJobPrefill } from '../lib/liveInterviewJobPrefill';
import { useLlmKeysGate } from '../context/LlmKeysGateContext';
import {
  AI_INTERVIEWER_NAME,
  ESTIMATED_DURATION_MIN,
  getInterviewScript,
  getMockResults,
  inferTrackFromText,
  LEVEL_OPTIONS,
  MOCK_COMPANIES,
  companyInitials,
  MOCK_INTERVIEW_ROUNDS,
  MOCK_INTERVIEWERS,
  MOCK_ROLE_PICKER_CARDS,
  PRACTICE_INSTRUCTION_STEPS,
  PREREQUISITE_CHECK_LABELS,
  TRACK_OPTIONS,
  type InterviewSegment,
  type InterviewLevelId,
  type InterviewTrackId,
  type MockInterviewer,
} from '../data/liveMockInterviewMockData';
import {
  acquireLocalMedia,
  checkBrowserMediaSupport,
  checkNetworkLatency,
  measureMicInput,
  playSpeakerTestTone,
} from '../utils/liveInterviewMediaCheck';
import interviewerFlowAnimation from '../lottiefiles/ai-animation-interviewer-Flow.json';
import PeerInterviewSection from './PeerInterviewSection';
import PremiumUpsellModal from './PremiumUpsellModal';
import FeatureUsageBanner from './subscription/FeatureUsageBanner';
import { recordFeatureTrialUse } from '../lib/featureTrialConsume';
import { ShimmerButton } from './ui/shimmer-button';
import { getLlmKeysStatus } from '../services/atsService';
import {
  evaluateInterviewWithProvider,
  generateInterviewQuestionsWithProvider,
  saveLiveInterviewResult,
  type LiveInterviewEvaluation,
  type LlmProvider,
} from '../services/liveMockInterviewApi';

type FlowPhase = 'setup' | 'briefing' | 'prereq' | 'warming' | 'live' | 'results';
type LiveInterviewMode = 'ai' | 'peer';

type PrereqItemStatus =
  | 'pending'
  | 'running'
  | 'pass'
  | 'skip'
  | 'fail'
  | 'awaiting_mic_test'
  | 'awaiting_confirm_mic'
  | 'awaiting_mic_retry'
  | 'awaiting_tone'
  | 'awaiting_confirm_heard';

const initialPrereqStatuses = (): PrereqItemStatus[] =>
  PREREQUISITE_CHECK_LABELS.map(() => 'pending' as PrereqItemStatus);

const LIVE_INTERVIEW_PAGE_BG = 'bg-transparent';
const PAGE_BG = 'bg-transparent';
const PICKER_SURFACE = 'bg-transparent';
const BRIEFING_SURFACE = 'bg-transparent';
const BRIEFING_CARD =
  'rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm';
const JD_TEXT_MAX = 2000;

const HEADLINE_STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const HEADLINE_FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const HEADLINE_WORD = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const HEADLINE_WORD_EMPHASIS = {
  hidden: { opacity: 0, y: 28, scale: 0.94, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function AnimatedHeadlineLine({
  text,
  className,
  delay = 0.12,
  emphasis = false,
  reducedMotion = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  emphasis?: boolean;
  reducedMotion?: boolean;
}) {
  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const words = text.split(' ');
  const wordVariant = emphasis ? HEADLINE_WORD_EMPHASIS : HEADLINE_WORD;

  return (
    <motion.span
      className={className}
      aria-label={text}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.09, delayChildren: delay } },
      }}
    >
      <span className="inline-flex flex-wrap justify-center gap-x-[0.32em]" aria-hidden>
        {words.map((word, i) => (
          <motion.span key={`${word}-${i}`} className="inline-block" variants={wordVariant}>
            {word}
          </motion.span>
        ))}
      </span>
    </motion.span>
  );
}

const LITE_ORANGE_BG =
  'bg-gradient-to-b from-orange-50/95 via-[#FFF7EE] to-[#FFEDD5] dark:from-[#1a1714] dark:via-[#15121a] dark:to-[#12111a]';

const ROUND_TAB_META: Record<string, { icon: typeof Briefcase; label: string }> = {
  'role-related': { icon: Briefcase, label: 'Role Related' },
  behavioral: { icon: MessageCircle, label: 'Behavioral' },
  technical: { icon: Code2, label: 'Technical' },
  'system-design': { icon: Layers, label: 'System Design' },
};

const INTERVIEWER_AVATAR_GRADIENT: Record<string, string> = {
  ava: 'from-rose-400 to-orange-500',
  kai: 'from-blue-500 to-indigo-600',
  mia: 'from-violet-500 to-purple-600',
  leo: 'from-amber-500 to-orange-600',
};

const formatMmSs = (totalSec: number) => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

let cachedSpeechVoices: SpeechSynthesisVoice[] = [];

function refreshSpeechVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return cachedSpeechVoices;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedSpeechVoices = voices;
  return cachedSpeechVoices;
}

const FEMALE_VOICE_PATTERN =
  /female|woman|samantha|victoria|karen|fiona|moira|tessa|veena|zira|susan|kate|serena|paulina/i;
const MALE_VOICE_PATTERN =
  /male|man|daniel|alex|fred|aaron|rishi|david|james|tom|lee|oliver|arthur|gordon/i;

function pickSpeechVoiceForInterviewer(locale: string, interviewerId?: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  const voices = refreshSpeechVoices();
  if (!voices.length) return undefined;

  const baseLang = locale.split('-')[0] ?? 'en';
  const localePool = voices.filter(
    (v) => v.lang === locale || v.lang.startsWith(`${baseLang}-`) || v.lang === baseLang,
  );
  const pool = localePool.length ? localePool : voices;
  const byPattern = (pattern: RegExp) => pool.find((v) => pattern.test(v.name));

  if (interviewerId === 'ava' || interviewerId === 'mia') {
    return byPattern(FEMALE_VOICE_PATTERN) || pool.find((v) => v.lang === locale) || pool[0];
  }
  if (interviewerId === 'kai' || interviewerId === 'leo') {
    return byPattern(MALE_VOICE_PATTERN) || pool.find((v) => v.lang === locale) || pool[0];
  }

  return pool.find((v) => v.lang === locale) || pool.find((v) => v.default) || pool[0];
}

/** Unlock speech output during a user gesture (Chrome/Safari can block later speaks otherwise). */
function primeSpeechSynthesis(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  refreshSpeechVoices();
  window.speechSynthesis.resume();
}

type SpeakUtteranceOptions = {
  interviewerId?: string;
  onDone?: () => void;
  /** Must be true when called from a click/tap so Chrome allows audio in the same turn. */
  immediate?: boolean;
};

/** Speak with Chrome/Safari workarounds; retries when the voice list is still loading. */
function speakUtterance(utter: SpeechSynthesisUtterance, options?: SpeakUtteranceOptions): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {};

  let cancelled = false;
  let finished = false;
  let hasStarted = false;
  let retryCount = 0;
  let speakDelayId = 0;
  let voiceRetryId = 0;
  let resumeIntervalId = 0;
  let watchdogId = 0;
  let voicesListener: (() => void) | null = null;

  const cleanupTimers = () => {
    if (speakDelayId) window.clearTimeout(speakDelayId);
    if (voiceRetryId) window.clearTimeout(voiceRetryId);
    if (resumeIntervalId) window.clearInterval(resumeIntervalId);
    if (watchdogId) window.clearTimeout(watchdogId);
    speakDelayId = 0;
    voiceRetryId = 0;
    resumeIntervalId = 0;
    watchdogId = 0;
    if (voicesListener) {
      window.speechSynthesis.removeEventListener('voiceschanged', voicesListener);
      voicesListener = null;
    }
  };

  const finish = () => {
    if (cancelled || finished) return;
    finished = true;
    cleanupTimers();
    options?.onDone?.();
  };

  const beginSpeak = (useDefaultVoice = false) => {
    if (cancelled || finished) return;

    if (useDefaultVoice) {
      utter.voice = null;
    } else {
      const match = pickSpeechVoiceForInterviewer(utter.lang, options?.interviewerId);
      utter.voice = match ?? null;
    }

    utter.onstart = () => {
      hasStarted = true;
    };
    utter.onend = finish;
    utter.onerror = (event) => {
      const code = (event as SpeechSynthesisErrorEvent).error;
      if (code === 'canceled' || code === 'interrupted') return;
      finish();
    };

    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utter);

    if (!resumeIntervalId) {
      resumeIntervalId = window.setInterval(() => {
        if (cancelled || finished) return;
        if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (hasStarted && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          finish();
        }
      }, 200);
    }
  };

  const armWatchdog = (ms: number) => {
    if (watchdogId) window.clearTimeout(watchdogId);
    watchdogId = window.setTimeout(() => {
      if (cancelled || finished) return;
      if (hasStarted && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        finish();
        return;
      }
      if (!hasStarted && retryCount < 2) {
        retryCount += 1;
        window.speechSynthesis.cancel();
        beginSpeak(retryCount > 1);
        armWatchdog(ms);
        return;
      }
      finish();
    }, ms);
  };

  const startSpeaking = (deferMs = 0) => {
    if (cancelled || finished) return;
    if (!options?.immediate || deferMs > 0) {
      window.speechSynthesis.cancel();
    }
    if (deferMs > 0) {
      speakDelayId = window.setTimeout(beginSpeak, deferMs);
    } else {
      beginSpeak();
    }
    armWatchdog(options?.immediate ? 7000 : 15000);
  };

  refreshSpeechVoices();
  window.speechSynthesis.resume();

  if (refreshSpeechVoices().length === 0) {
    voicesListener = () => {
      if (refreshSpeechVoices().length > 0) startSpeaking(options?.immediate ? 0 : 30);
    };
    window.speechSynthesis.addEventListener('voiceschanged', voicesListener);
    window.speechSynthesis.getVoices();
    voiceRetryId = window.setTimeout(
      () => startSpeaking(options?.immediate ? 0 : 30),
      options?.immediate ? 120 : 400,
    );
  } else {
    startSpeaking(options?.immediate ? 0 : 30);
  }

  return () => {
    cancelled = true;
    cleanupTimers();
    window.speechSynthesis.cancel();
  };
}

function InterviewerAvatar({
  interviewer,
  size = 'md',
  className = '',
}: {
  interviewer: MockInterviewer;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const box = size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-12 w-12' : 'h-11 w-11';
  const textSize = size === 'lg' ? 'text-base' : 'text-sm';
  const gradient = INTERVIEWER_AVATAR_GRADIENT[interviewer.id] ?? 'from-orange-400 to-amber-500';

  if (!failed && interviewer.avatarUrl) {
    return (
      <img
        src={interviewer.avatarUrl}
        alt=""
        className={`${box} shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5 ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`${box} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} ${textSize} font-bold text-white shadow-sm ${className}`}
      aria-hidden
    >
      {interviewer.initial}
    </span>
  );
}

interface LiveMockInterviewPageProps {
  embedded?: boolean;
  toggleSidebar?: () => void;
  mode?: LiveInterviewMode;
}

function CompanyPickerLogo({
  name,
  logoUrl,
  size = 'md',
}: {
  name: string;
  logoUrl?: string;
  size?: 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);
  const box = size === 'lg' ? 'h-14 w-14 text-sm' : 'h-10 w-10 text-[11px]';
  const imgBox = size === 'lg' ? 'h-14 w-14 p-1.5' : 'h-10 w-10 p-1';
  const imgClass = size === 'lg' ? 'h-11 w-11' : 'h-8 w-8';
  if (!logoUrl || failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl border border-orange-200/90 bg-orange-50 dark:border-orange-800/60 dark:bg-orange-950/50 font-bold leading-tight text-orange-800 dark:text-orange-200 ${box}`}
        aria-hidden
      >
        {companyInitials(name)}
      </span>
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border border-orange-200/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-orange-900/50 dark:bg-gray-900 ${imgBox}`}
    >
      <img
        src={logoUrl}
        alt=""
        width={size === 'lg' ? 44 : 32}
        height={size === 'lg' ? 44 : 32}
        className={`${imgClass} object-contain`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

const LiveMockInterviewPage: React.FC<LiveMockInterviewPageProps> = ({
  embedded = false,
  toggleSidebar,
  mode = 'ai',
}) => {
  const { navigateTo } = useNavigation();
  const { isLoggedIn, userId, userEmail } = useAuth();
  const { hasFeature, canUseFeature, refreshEntitlements } = useSubscription();
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);
  const interviewTrialSessionIdRef = useRef<string | null>(null);
  const peerViewerDisplayName = userEmail ? userEmail.split('@')[0] || 'You' : 'You';
  const {
    dashboardMode,
    setActiveView,
    liveInterviewSetupTab: setupTab,
    setLiveInterviewSetupTab,
  } = useDashboard();
  const {
    llmKeysStatus,
    hasLiveInterviewKeys: hasGateLiveInterviewKeys,
    promptForApiKeys,
    ensureLiveInterviewKeys,
  } = useLlmKeysGate();
  const apiKeyPromptShownRef = useRef(false);

  const liveInterviewMode = mode;
  const [phase, setPhase] = useState<FlowPhase>('setup');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const [roleSearch, setRoleSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [sessionLabel, setSessionLabel] = useState('');
  const [companyName, setCompanyName] = useState<string | undefined>(undefined);
  const [track, setTrack] = useState<InterviewTrackId>('swe');
  const [level, setLevel] = useState<InterviewLevelId>('mid');

  const [jdJobTitle, setJdJobTitle] = useState('');
  const [jdInterviewType, setJdInterviewType] = useState<InterviewTrackId>('swe');
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [questionCount, setQuestionCount] = useState(8);
  const [timeMinutes, setTimeMinutes] = useState(20);
  const [selectedRoleTitle, setSelectedRoleTitle] = useState<string>('');
  const [selectedCompanyTitle, setSelectedCompanyTitle] = useState<string>('');
  const [generatedScript, setGeneratedScript] = useState<InterviewSegment[] | null>(null);
  const [questionGenLoading, setQuestionGenLoading] = useState(false);
  const [questionGenError, setQuestionGenError] = useState<string | null>(null);

  const [selectedInterviewerId, setSelectedInterviewerId] = useState(MOCK_INTERVIEWERS[0].id);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string>(MOCK_INTERVIEW_ROUNDS[0].id);
  const [useAudio, setUseAudio] = useState(true);
  const [useVideo, setUseVideo] = useState(true);

  const [prereqStatuses, setPrereqStatuses] = useState<PrereqItemStatus[]>(initialPrereqStatuses);
  const [prereqError, setPrereqError] = useState<string | null>(null);
  const [prereqChecksBegun, setPrereqChecksBegun] = useState(false);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const prereqVideoRef = useRef<HTMLVideoElement>(null);
  const companySearchInputRef = useRef<HTMLInputElement>(null);
  const companyGridSectionRef = useRef<HTMLDivElement>(null);
  const roleSearchInputRef = useRef<HTMLInputElement>(null);
  const roleGridSectionRef = useRef<HTMLDivElement>(null);
  const prereqNetworkPhaseStartedRef = useRef(false);
  const micTestGenerationRef = useRef(0);
  const liveVideoBindCleanupRef = useRef<(() => void) | null>(null);

  const [warmProgress, setWarmProgress] = useState(0);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [revealCount, setRevealCount] = useState(1);
  const [aiState, setAiState] = useState<'idle' | 'speaking' | 'listening'>('speaking');
  const [finishedFullSession, setFinishedFullSession] = useState(false);
  const [transcriptForResult, setTranscriptForResult] = useState('');
  const [llmProvider, setLlmProvider] = useState<LlmProvider>('openrouter');
  const [hasOpenrouterKey, setHasOpenrouterKey] = useState(false);
  const [hasGroqKey, setHasGroqKey] = useState(false);
  const [llmSavedModels, setLlmSavedModels] = useState<Record<string, string>>({});
  const hasLiveInterviewKey =
    llmProvider === 'openrouter' ? hasOpenrouterKey : hasGroqKey;
  const liveInterviewModel =
    llmSavedModels[llmProvider] ||
    (llmProvider === 'groq' ? 'llama-3.1-8b-instant' : 'openai/gpt-4o-mini');
  const [aiEvaluation, setAiEvaluation] = useState<LiveInterviewEvaluation | null>(null);
  const [aiEvalLoading, setAiEvalLoading] = useState(false);
  const [aiEvalError, setAiEvalError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const resultPersistedRef = useRef(false);
  const [liveSidebarTab, setLiveSidebarTab] = useState<'questions' | 'timeline'>('questions');
  /** Live-stage toggles: map to MediaStreamTrack.enabled (setup useAudio/useVideo must have acquired tracks). */
  const [liveMicEnabled, setLiveMicEnabled] = useState(true);
  const [liveCameraEnabled, setLiveCameraEnabled] = useState(true);
  const [liveTranscriptDraft, setLiveTranscriptDraft] = useState('');
  const [transcribedAnswersBySegment, setTranscribedAnswersBySegment] = useState<Record<string, string>>({});
  const transcriptDraftRef = useRef('');
  const finalizeVoiceAnswerAndAdvanceRef = useRef<(answerText: string) => void>(() => {});

  const interviewerDisplay = useMemo(
    () => MOCK_INTERVIEWERS.find((i) => i.id === selectedInterviewerId)?.name ?? AI_INTERVIEWER_NAME,
    [selectedInterviewerId]
  );

  const baseScript = useMemo(
    () => generatedScript ?? getInterviewScript(track),
    [generatedScript, track]
  );
  const script = useMemo(
    () => baseScript.slice(0, Math.max(1, questionCount)),
    [baseScript, questionCount]
  );
  const currentSegment = script[segmentIndex];
  const visibleTurns = currentSegment ? currentSegment.turns.slice(0, revealCount) : [];
  const atEndOfSegment = currentSegment ? revealCount >= currentSegment.turns.length : false;
  const atEndOfInterview = atEndOfSegment && segmentIndex >= script.length - 1;

  const liveSessionTitle = useMemo(() => {
    const t = sessionLabel.trim();
    if (t) return t;
    const tl = TRACK_OPTIONS.find((x) => x.id === track)?.label ?? 'Interview';
    return `${tl} — mock session`;
  }, [sessionLabel, track]);

  const liveSessionSubtitle = useMemo(() => {
    const bits: string[] = [];
    if (companyName) bits.push(companyName);
    const round = MOCK_INTERVIEW_ROUNDS.find((r) => r.id === selectedRoundId)?.label;
    if (round) bits.push(round);
    bits.push('Practice transcript · demo (no recording stored)');
    return bits.join(' · ');
  }, [companyName, selectedRoundId]);

  const interviewerInitials = useMemo(() => {
    const parts = interviewerDisplay.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return interviewerDisplay.slice(0, 2).toUpperCase() || 'AI';
  }, [interviewerDisplay]);

  const liveQuestionCards = useMemo(() => {
    return script.map((seg, i) => {
      const firstAi = seg.turns.find((t) => t.speaker === 'ai');
      const question = firstAi?.text ?? seg.topic;
      let answer = '';
      let done = i < segmentIndex;
      const saved = transcribedAnswersBySegment[seg.id];
      if (saved) {
        answer = saved;
      } else if (i === segmentIndex && liveTranscriptDraft.trim()) {
        answer = liveTranscriptDraft.trim();
      } else if (i === segmentIndex) {
        answer = visibleTurns.filter((t) => t.speaker === 'you').map((t) => t.text).join(' ');
      }
      return {
        id: seg.id,
        topic: seg.topic,
        question,
        answer,
        done,
        current: i === segmentIndex,
      };
    });
  }, [script, segmentIndex, visibleTurns, transcribedAnswersBySegment, liveTranscriptDraft]);

  const liveAiSummaryText = useMemo(() => {
    if (!currentSegment) return '';
    const lastAi = [...visibleTurns].reverse().find((t) => t.speaker === 'ai');
    if (lastAi) return lastAi.text;
    return `Current focus: ${currentSegment.topic}. Follow the question list and use Continue to advance the demo transcript.`;
  }, [currentSegment, visibleTurns]);

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
    return inv?.ttsLocale ?? 'en-US';
  }, [selectedInterviewerId]);

  const previewStopRef = useRef<(() => void) | null>(null);

  const previewInterviewerVoice = useCallback((inv: MockInterviewer) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    previewStopRef.current?.();
    window.speechSynthesis.cancel();
    primeSpeechSynthesis();
    setPreviewingVoiceId(inv.id);
    const utter = new SpeechSynthesisUtterance(`Hi, I'm ${inv.name}. I'll be your interviewer today.`);
    utter.lang = inv.ttsLocale;
    utter.rate = 1.05;
    utter.volume = 1;
    previewStopRef.current = speakUtterance(utter, {
      interviewerId: inv.id,
      immediate: true,
      onDone: () => setPreviewingVoiceId(null),
    });
  }, []);

  const selectAndPreviewInterviewer = useCallback((inv: MockInterviewer) => {
    setSelectedInterviewerId(inv.id);
    previewInterviewerVoice(inv);
  }, [previewInterviewerVoice]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return MOCK_ROLE_PICKER_CARDS;
    return MOCK_ROLE_PICKER_CARDS.filter((r) => r.title.toLowerCase().includes(q));
  }, [roleSearch]);

  const runRoleSearch = useCallback(() => {
    roleGridSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => roleSearchInputRef.current?.focus(), 350);
  }, []);

  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return MOCK_COMPANIES;
    return MOCK_COMPANIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [companySearch]);

  const runCompanySearch = useCallback(() => {
    companyGridSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => companySearchInputRef.current?.focus(), 350);
  }, []);

  useEffect(() => {
    transcriptDraftRef.current = liveTranscriptDraft;
  }, [liveTranscriptDraft]);

  useEffect(() => {
    if (phase === 'live') setLiveTranscriptDraft('');
  }, [phase, currentSegment?.id]);

  useEffect(() => {
    if (!userId) {
      setHasOpenrouterKey(false);
      setHasGroqKey(false);
      setLlmSavedModels({});
      return;
    }
    getLlmKeysStatus(userId)
      .then((status) => {
        if (!status.success) return;
        setHasOpenrouterKey(!!status.hasOpenrouterKey);
        setHasGroqKey(!!status.hasGroqKey);
        if (status.savedModels) setLlmSavedModels(status.savedModels);
        if (status.hasOpenrouterKey) setLlmProvider('openrouter');
        else if (status.hasGroqKey) setLlmProvider('groq');
      })
      .catch(() => {
        /* ignore */
      });
  }, [userId]);

  useEffect(() => {
    if (liveInterviewMode !== 'ai') return;
    setPhase('setup');
    setQuestionGenError(null);
    setQuestionGenLoading(false);
  }, [setupTab, liveInterviewMode]);

  useEffect(() => {
    if (liveInterviewMode !== 'ai' || phase !== 'setup') return;
    const prefill = consumeLiveInterviewJobPrefill();
    if (!prefill) return;
    setLiveInterviewSetupTab('jd');
    setJdJobTitle(prefill.jobTitle);
    setJdText(prefill.jdText);
    setResumeText(prefill.resumeText);
    const inferred = inferTrackFromText(`${prefill.jobTitle} ${prefill.jdText}`);
    setJdInterviewType(inferred);
    setSessionLabel(
      prefill.company
        ? `JD: ${prefill.jobTitle} · ${prefill.company}`
        : `JD: ${prefill.jobTitle}`,
    );
  }, [liveInterviewMode, phase, setLiveInterviewSetupTab]);

  useEffect(() => {
    if (liveInterviewMode !== 'ai' || apiKeyPromptShownRef.current) return;
    if (userId && llmKeysStatus === null) return;

    const needsApiKey = !userId || !hasGateLiveInterviewKeys;
    if (needsApiKey) {
      apiKeyPromptShownRef.current = true;
      promptForApiKeys('liveInterview');
    }
  }, [
    liveInterviewMode,
    userId,
    llmKeysStatus,
    hasGateLiveInterviewKeys,
    promptForApiKeys,
  ]);

  const toGeneratedScript = useCallback((questions: string[]): InterviewSegment[] => {
    return questions.map((question, idx) => ({
      id: `gen-${idx + 1}`,
      topic: `Question ${idx + 1}`,
      turns: [
        { speaker: 'ai', text: question },
        { speaker: 'you', text: 'Share your answer aloud. Then click Continue to see the next question.' },
      ],
    }));
  }, []);

  const generateQuestionsForSetup = useCallback(
    async (
      mode: 'role' | 'company' | 'jd',
      values: {
        role?: string;
        company?: string;
        jobTitle?: string;
        jdText?: string;
        resumeText?: string;
        trackOverride?: InterviewTrackId;
        sessionLabelText: string;
      }
    ): Promise<boolean> => {
      setQuestionGenLoading(true);
      setQuestionGenError(null);
      try {
        let questions: string[];
        let sessionLabelText = values.sessionLabelText;

        if (userId && hasLiveInterviewKey) {
          const generated = await generateInterviewQuestionsWithProvider({
            userId,
            provider: llmProvider,
            model: liveInterviewModel,
            mode,
            role: values.role,
            company: values.company,
            jobTitle: values.jobTitle,
            jdText: values.jdText,
            resumeText: values.resumeText,
            questionCount,
            timeMinutes,
          });
          questions = generated.questions.slice(0, questionCount);
          if (generated.sessionLabel?.trim()) sessionLabelText = generated.sessionLabel.trim();
        } else {
          const base = values.role || values.company || values.jobTitle || 'interview';
          questions = Array.from({ length: questionCount }, (_, i) => {
            const n = i + 1;
            if (n % 3 === 0) {
              return `Describe a challenge you faced as a ${base} candidate and how you handled it.`;
            }
            if (n % 2 === 0) {
              return `What trade-offs would you consider for ${base} in this role?`;
            }
            return `Walk me through your approach to a key ${base} problem relevant to this position.`;
          });
        }

        setGeneratedScript(toGeneratedScript(questions));
        setElapsedSec(0);
        setSegmentIndex(0);
        setRevealCount(1);
        setSessionLabel(sessionLabelText);
        setTrack(values.trackOverride ?? inferTrackFromText(values.role || values.jobTitle || values.company || 'swe'));
        setCompanyName(values.company || undefined);
        return true;
      } catch (err) {
        setQuestionGenError(err instanceof Error ? err.message : 'Could not generate interview questions');
        return false;
      } finally {
        setQuestionGenLoading(false);
      }
    },
    [
      userId,
      hasLiveInterviewKey,
      llmProvider,
      liveInterviewModel,
      questionCount,
      timeMinutes,
      toGeneratedScript,
    ]
  );

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
    if (phase !== 'live') return;

    if (!liveAiUtterance) {
      window.speechSynthesis.cancel();
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(liveAiUtterance.text);
    utter.lang = ttsLang;
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.volume = 1;

    const stopPending = speakUtterance(utter, {
      interviewerId: selectedInterviewerId,
      onDone: () => setAiState('listening'),
    });

    return () => {
      stopPending();
      window.speechSynthesis.cancel();
    };
  }, [phase, liveAiUtterance?.key, liveAiUtterance?.text, ttsLang, selectedInterviewerId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    primeSpeechSynthesis();
    const onVoicesChanged = () => refreshSpeechVoices();
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
  }, []);

  useEffect(() => {
    if (phase === 'briefing') primeSpeechSynthesis();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'live') return;
    if (aiState !== 'listening') return;
    if (!useAudio || !liveMicEnabled || !currentSegment) return;
    const Ctor =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = ttsLang;
    recognition.continuous = true;
    recognition.interimResults = true;

    let stopped = false;
    let finalText = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = String(result?.[0]?.transcript || '');
        if (!text) continue;
        if (result.isFinal) finalText += `${text} `;
        else interim += text;
      }
      const merged = `${finalText} ${interim}`.trim();
      setLiveTranscriptDraft(merged);
    };

    recognition.onend = () => {
      if (stopped) return;
      const merged = `${finalText} ${transcriptDraftRef.current}`.trim();
      if (merged) {
        finalizeVoiceAnswerAndAdvanceRef.current(merged);
      } else {
        try {
          recognition.start();
        } catch {
          // no-op: browser can throw if restarted too quickly
        }
      }
    };

    recognition.onerror = () => {
      // keep graceful fallback to manual continue button
    };

    try {
      recognition.start();
    } catch {
      return;
    }

    return () => {
      stopped = true;
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        // no-op
      }
    };
  }, [phase, aiState, useAudio, liveMicEnabled, currentSegment?.id, ttsLang]);

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
    if (phase !== 'live' || !localMediaStream) return;
    const vt = localMediaStream.getVideoTracks()[0];
    const at = localMediaStream.getAudioTracks()[0];
    setLiveCameraEnabled(vt?.enabled ?? false);
    setLiveMicEnabled(at?.enabled ?? false);
  }, [phase, localMediaStream]);

  const toggleLiveMic = useCallback(() => {
    if (!localMediaStream || !useAudio) return;
    const tracks = localMediaStream.getAudioTracks();
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => {
      t.enabled = next;
    });
    setLiveMicEnabled(next);
  }, [localMediaStream, useAudio]);

  const toggleLiveCamera = useCallback(() => {
    if (!localMediaStream || !useVideo) return;
    const tracks = localMediaStream.getVideoTracks();
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => {
      t.enabled = next;
    });
    setLiveCameraEnabled(next);
  }, [localMediaStream, useVideo]);

  const liveHasAudioTrack = !!localMediaStream?.getAudioTracks().length;
  const liveHasVideoTrack = !!localMediaStream?.getVideoTracks().length;
  const micLiveMuted = phase === 'live' ? !useAudio || !liveMicEnabled : !useAudio;

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

  const goResultsDashboard = useCallback(() => {
    if (embedded) {
      setActiveView('live-mock-interview-dashboard');
      return;
    }
    setActiveView('live-mock-interview-dashboard');
    navigateTo('dashboard');
  }, [embedded, setActiveView, navigateTo]);

  const resetJdForm = useCallback(() => {
    setJdJobTitle('');
    setJdInterviewType('swe');
    setJdText('');
    setResumeText('');
    setQuestionCount(8);
    setTimeMinutes(20);
    setQuestionGenError(null);
  }, []);

  const resetSession = useCallback(() => {
    stopLocalMedia();
    setPhase('setup');
    setLiveInterviewSetupTab('role');
    setRoleSearch('');
    setCompanySearch('');
    setSessionLabel('');
    setCompanyName(undefined);
    setTrack('swe');
    setLevel('mid');
    setJdJobTitle('');
    setJdInterviewType('swe');
    setJdText('');
    setResumeText('');
    setQuestionCount(8);
    setTimeMinutes(20);
    setSelectedRoleTitle('');
    setSelectedCompanyTitle('');
    setGeneratedScript(null);
    setQuestionGenLoading(false);
    setQuestionGenError(null);
    setSelectedInterviewerId(MOCK_INTERVIEWERS[0].id);
    setSelectedRoundId(MOCK_INTERVIEW_ROUNDS[0].id);
    setUseAudio(true);
    setUseVideo(true);
    setPrereqStatuses(initialPrereqStatuses());
    setPrereqError(null);
    setPrereqChecksBegun(false);
    prereqNetworkPhaseStartedRef.current = false;
    micTestGenerationRef.current += 1;
    setWarmProgress(0);
    setElapsedSec(0);
    setSegmentIndex(0);
    setRevealCount(1);
    setFinishedFullSession(false);
    setAiState('speaking');
    setLiveTranscriptDraft('');
    setTranscribedAnswersBySegment({});
    setTranscriptForResult('');
    setAiEvaluation(null);
    setAiEvalLoading(false);
    setAiEvalError(null);
    setSaveStatus('idle');
    resultPersistedRef.current = false;
  }, [stopLocalMedia, setLiveInterviewSetupTab]);

  const continueAfterMicResolved = useCallback(async () => {
    if (prereqNetworkPhaseStartedRef.current) return;
    prereqNetworkPhaseStartedRef.current = true;

    const setS = (idx: number, s: PrereqItemStatus) => {
      setPrereqStatuses((prev) => {
        const next = [...prev];
        next[idx] = s;
        return next;
      });
    };

    setPrereqError(null);
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
  }, []);

  const beginPrereqChecks = useCallback(async () => {
    setPrereqError(null);
    setPrereqChecksBegun(true);
    prereqNetworkPhaseStartedRef.current = false;

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

    if (!useAudio || !stream) {
      setS(3, 'skip');
      await continueAfterMicResolved();
      return;
    }

    setS(3, 'awaiting_mic_test');
  }, [useAudio, useVideo, continueAfterMicResolved]);

  const handleRunMicTest = useCallback(async () => {
    setPrereqError(null);
    const stream = localMediaStream;
    if (!stream?.getAudioTracks()[0]) return;

    const gen = ++micTestGenerationRef.current;
    setPrereqStatuses((prev) => {
      const next = [...prev];
      if (
        next[3] === 'awaiting_mic_test' ||
        next[3] === 'awaiting_confirm_mic' ||
        next[3] === 'awaiting_mic_retry'
      ) {
        next[3] = 'running';
      }
      return next;
    });

    try {
      const heard = await measureMicInput(stream);
      if (gen !== micTestGenerationRef.current) return;
      setPrereqStatuses((prev) => {
        if (prev[3] !== 'running') return prev;
        const next = [...prev];
        next[3] = heard ? 'awaiting_confirm_mic' : 'awaiting_mic_retry';
        return next;
      });
    } catch {
      if (gen !== micTestGenerationRef.current) return;
      setPrereqStatuses((prev) => {
        if (prev[3] !== 'running') return prev;
        const next = [...prev];
        next[3] = 'awaiting_mic_retry';
        return next;
      });
    }
  }, [localMediaStream]);

  const confirmMicHeard = useCallback(() => {
    setPrereqStatuses((prev) => {
      const next = [...prev];
      if (next[3] === 'awaiting_confirm_mic') next[3] = 'pass';
      return next;
    });
    void continueAfterMicResolved();
  }, [continueAfterMicResolved]);

  const skipMicCheck = useCallback(() => {
    micTestGenerationRef.current += 1;
    setPrereqError(null);
    setPrereqStatuses((prev) => {
      const next = [...prev];
      if (
        next[3] === 'awaiting_mic_test' ||
        next[3] === 'awaiting_confirm_mic' ||
        next[3] === 'awaiting_mic_retry' ||
        next[3] === 'running'
      ) {
        next[3] = 'skip';
      }
      return next;
    });
    void continueAfterMicResolved();
  }, [continueAfterMicResolved]);

  const handlePlayTestTone = useCallback(async () => {
    setPrereqError(null);
    setPrereqStatuses((prev) => {
      const next = [...prev];
      if (next[5] === 'awaiting_tone' || next[5] === 'awaiting_confirm_heard') next[5] = 'running';
      return next;
    });
    try {
      await playSpeakerTestTone();
      setPrereqStatuses((prev) => {
        const next = [...prev];
        next[5] = 'awaiting_confirm_heard';
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

  const confirmSpeakerHeard = useCallback(() => {
    setPrereqStatuses((prev) => {
      const next = [...prev];
      if (next[5] === 'awaiting_confirm_heard') next[5] = 'pass';
      return next;
    });
  }, []);

  const skipSpeakerCheck = useCallback(() => {
    setPrereqError(null);
    setPrereqStatuses((prev) => {
      const next = [...prev];
      if (
        next[5] === 'awaiting_tone' ||
        next[5] === 'awaiting_confirm_heard' ||
        next[5] === 'running'
      ) {
        next[5] = 'skip';
      }
      return next;
    });
  }, []);

  const retryPrereqChecks = useCallback(() => {
    stopLocalMedia();
    micTestGenerationRef.current += 1;
    prereqNetworkPhaseStartedRef.current = false;
    setPrereqStatuses(initialPrereqStatuses());
    setPrereqError(null);
    setPrereqChecksBegun(false);
  }, [stopLocalMedia]);

  const prereqReadyForLive =
    prereqChecksBegun &&
    prereqStatuses.every((s) => s === 'pass' || s === 'skip') &&
    !prereqError;

  const goToBriefing = useCallback(async () => {
    if (liveInterviewMode === 'ai') {
      const ok = await ensureLiveInterviewKeys();
      if (!ok) return;
    }
    setPhase('briefing');
  }, [liveInterviewMode, ensureLiveInterviewKeys]);

  const goBackToSetup = useCallback(() => {
    setPhase('setup');
    setQuestionGenError(null);
  }, []);

  const goBackToBriefing = useCallback(() => {
    setPhase('briefing');
  }, []);

  const setupTabLabel = useMemo(
    () => LIVE_INTERVIEW_SETUP_TABS.find((t) => t.id === setupTab)?.label ?? 'Role Based',
    [setupTab],
  );

  const selectionLabel = useMemo(() => {
    if (setupTab === 'role') {
      return selectedRoleTitle || sessionLabel.replace(/^Role:\s*/i, '').trim() || null;
    }
    if (setupTab === 'company') {
      return companyName || selectedCompanyTitle || null;
    }
    if (setupTab === 'jd') {
      return jdJobTitle.trim() || null;
    }
    return null;
  }, [setupTab, selectedRoleTitle, sessionLabel, companyName, selectedCompanyTitle, jdJobTitle]);

  const startRoleInterview = useCallback(
    async (roleTitle: string) => {
      setSelectedRoleTitle(roleTitle);
      setSessionLabel(`Role: ${roleTitle}`);
      setCompanyName(undefined);
      setTrack(inferTrackFromText(roleTitle));
      setGeneratedScript(null);
      setQuestionGenError(null);
      setQuestionGenLoading(false);
      await goToBriefing();
    },
    [goToBriefing],
  );

  const handleStartPracticeFromBriefing = useCallback(async () => {
    if (questionGenLoading) return;
    primeSpeechSynthesis();

    if (liveInterviewMode === 'ai') {
      const ok = await ensureLiveInterviewKeys();
      if (!ok) return;
    }

    if (!hasFeature('live-ai') && !canUseFeature('live-ai')) {
      setShowPremiumUpsell(true);
      return;
    }
    if (!hasFeature('live-ai') && userId) {
      const sessionId = `live-ai-start-${Date.now()}`;
      const ok = await recordFeatureTrialUse(userId, 'live-ai', sessionId, refreshEntitlements);
      if (!ok) {
        setShowPremiumUpsell(true);
        return;
      }
      interviewTrialSessionIdRef.current = sessionId;
    } else {
      interviewTrialSessionIdRef.current = null;
    }

    let ready = true;
    if (setupTab === 'role') {
      const roleName = selectedRoleTitle || sessionLabel.replace(/^Role:\s*/i, '').trim();
      if (!roleName) {
        setQuestionGenError('Select a role first.');
        return;
      }
      ready = await generateQuestionsForSetup('role', {
        role: roleName,
        trackOverride: inferTrackFromText(roleName),
        sessionLabelText: `Role: ${roleName}`,
      });
    } else if (setupTab === 'company') {
      const company = companyName || selectedCompanyTitle;
      if (!company) {
        setQuestionGenError('Select a company first.');
        return;
      }
      ready = await generateQuestionsForSetup('company', {
        company,
        trackOverride: 'swe',
        sessionLabelText: `Company: ${company}`,
      });
    } else if (setupTab === 'jd') {
      if (!jdJobTitle.trim()) {
        setQuestionGenError('Job title is required.');
        return;
      }
      const inferred = inferTrackFromText(`${jdJobTitle} ${jdText}`);
      ready = await generateQuestionsForSetup('jd', {
        jobTitle: jdJobTitle.trim(),
        jdText,
        resumeText,
        trackOverride: inferred !== 'swe' ? inferred : jdInterviewType,
        sessionLabelText: `JD: ${jdJobTitle.trim()}`,
      });
    }

    if (!ready) return;
    setQuestionGenError(null);
    setPhase('prereq');
  }, [
    questionGenLoading,
    liveInterviewMode,
    ensureLiveInterviewKeys,
    hasFeature,
    canUseFeature,
    userId,
    refreshEntitlements,
    setupTab,
    selectedRoleTitle,
    sessionLabel,
    companyName,
    selectedCompanyTitle,
    jdJobTitle,
    jdText,
    resumeText,
    jdInterviewType,
    generateQuestionsForSetup,
  ]);

  const goToResults = useCallback((full: boolean) => {
    const transcript = script
      .slice(0, full ? script.length : segmentIndex + 1)
      .flatMap((seg, idx) => {
        const turns = idx < segmentIndex ? seg.turns : seg.turns.slice(0, revealCount);
        return turns.map((turn) => {
          if (turn.speaker !== 'you') return `${turn.speaker.toUpperCase()}: ${turn.text}`;
          const spoken = transcribedAnswersBySegment[seg.id];
          return `YOU: ${spoken || turn.text}`;
        });
      })
      .join('\n');
    setTranscriptForResult(transcript);
    setAiEvaluation(null);
    setAiEvalError(null);
    setSaveStatus('idle');
    resultPersistedRef.current = false;
    setFinishedFullSession(full);
    setPhase('results');
  }, [script, segmentIndex, revealCount, transcribedAnswersBySegment]);

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

  const finalizeVoiceAnswerAndAdvance = useCallback(
    (answerText: string) => {
      if (!currentSegment) return;
      const cleaned = answerText.trim();
      if (!cleaned) return;
      setTranscribedAnswersBySegment((prev) => ({ ...prev, [currentSegment.id]: cleaned }));
      setLiveTranscriptDraft('');
      setRevealCount((prev) => Math.max(prev, currentSegment.turns.length));
      const shouldAutoAskNext = Boolean(generatedScript) || currentSegment.turns.length <= 2;
      if (!shouldAutoAskNext) return;
      window.setTimeout(() => {
        if (segmentIndex < script.length - 1) {
          setSegmentIndex((i) => i + 1);
          setRevealCount(1);
        } else {
          goToResults(true);
        }
      }, 350);
    },
    [currentSegment, generatedScript, segmentIndex, script.length, goToResults]
  );

  useEffect(() => {
    finalizeVoiceAnswerAndAdvanceRef.current = finalizeVoiceAnswerAndAdvance;
  }, [finalizeVoiceAnswerAndAdvance]);

  const handleEndEarly = () => {
    goToResults(false);
  };

  useEffect(() => {
    if (phase !== 'live') return;
    const limitSec = Math.max(1, timeMinutes) * 60;
    if (elapsedSec >= limitSec) {
      goToResults(false);
    }
  }, [phase, elapsedSec, timeMinutes, goToResults]);

  const results = useMemo(
    () => getMockResults(track, level, elapsedSec),
    [track, level, elapsedSec, phase]
  );
  const displayedResults = aiEvaluation ?? results;
  const mockEvaluationPayload = useMemo<LiveInterviewEvaluation>(
    () => ({
      overall: `${results.overall}/100`,
      dimensions: results.dimensions.map((d) => ({
        label: d.label,
        score: d.score,
        max: d.max,
      })),
      strengths: results.strengths,
      improvements: results.improvements,
      coachNote: results.coachNote,
    }),
    [results]
  );

  useEffect(() => {
    if (phase !== 'results') return;
    if (!isLoggedIn || !userId) return;
    if (resultPersistedRef.current) return;
    resultPersistedRef.current = true;

    const persistResult = async () => {
      let evaluationPayload: LiveInterviewEvaluation = mockEvaluationPayload;
      if (userId && hasLiveInterviewKey) {
        setAiEvalLoading(true);
        setAiEvalError(null);
        try {
          const aiScored = await evaluateInterviewWithProvider({
            userId,
            provider: llmProvider,
            model: liveInterviewModel,
            track,
            level,
            sessionLabel: liveSessionTitle,
            transcript:
              transcriptForResult ||
              'No transcript captured. Use fallback mock rubric from track and level.',
            durationSec: elapsedSec,
          });
          setAiEvaluation(aiScored);
          evaluationPayload = aiScored;
        } catch (err) {
          setAiEvalError(err instanceof Error ? err.message : 'AI scoring failed');
          setSaveStatus('error');
          setAiEvalLoading(false);
          return;
        } finally {
          setAiEvalLoading(false);
        }
      }

      setSaveStatus('saving');
      try {
        const generatedQuestions = script.map(
          (seg) => seg.turns.find((t) => t.speaker === 'ai')?.text ?? seg.topic
        );
        const answersByQuestion = script.reduce<Record<string, string>>((acc, seg, idx) => {
          const question = generatedQuestions[idx] || seg.topic;
          const answer = transcribedAnswersBySegment[seg.id] || '';
          if (question && answer.trim()) acc[question] = answer.trim();
          return acc;
        }, {});
        await saveLiveInterviewResult({
          userId,
          provider: hasLiveInterviewKey ? llmProvider : undefined,
          model: hasLiveInterviewKey ? liveInterviewModel : undefined,
          track,
          level,
          sessionLabel: liveSessionTitle,
          durationSec: elapsedSec,
          finishedFullSession,
          questionCount,
          timeMinutes,
          generatedQuestions,
          answersByQuestion,
          transcript: transcriptForResult,
          evaluation: evaluationPayload,
          trialSessionId: interviewTrialSessionIdRef.current ?? undefined,
        });
        setSaveStatus('saved');
        await refreshEntitlements();
      } catch {
        setSaveStatus('error');
      }
    };

    void persistResult();
  }, [
    phase,
    isLoggedIn,
    userId,
    mockEvaluationPayload,
    hasLiveInterviewKey,
    llmProvider,
    liveInterviewModel,
    track,
    level,
    liveSessionTitle,
    transcriptForResult,
    elapsedSec,
    finishedFullSession,
    questionCount,
    timeMinutes,
    script,
    transcribedAnswersBySegment,
    refreshEntitlements,
  ]);

  const continueLabel = atEndOfSegment
    ? atEndOfInterview
      ? 'Finish & view results'
      : 'Next topic'
    : aiState === 'listening'
      ? 'Next question'
      : 'Continue';

  const shell =
    'relative text-gray-900 dark:text-gray-100 ' +
    (embedded
      ? `min-h-0 w-full min-w-0 ${mode === 'ai' ? LIVE_INTERVIEW_PAGE_BG : PAGE_BG}`
      : `min-h-screen w-full ${mode === 'ai' ? LIVE_INTERVIEW_PAGE_BG : PAGE_BG}`);

  const showInterviewBackground = liveInterviewMode === 'ai' && phase !== 'live';

  const renderAiInterviewBackground = () => (
    <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${LITE_ORANGE_BG}`} aria-hidden />
  );

  const mainInner =
    (embedded ? 'pb-10 pt-2 sm:pt-4' : 'pb-16 pt-6') +
    ' px-4 sm:px-6 lg:px-8 xl:px-10 w-full min-w-0 mx-auto max-w-[1320px]';

  const cardWhite =
    'rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm';

  const briefingRoleTitle = useMemo(() => {
    if (selectionLabel) return selectionLabel;
    const stripped = sessionLabel.replace(/^(Role|Company|JD):\s*/i, '').trim();
    return stripped || 'Your interview';
  }, [selectionLabel, sessionLabel]);

  const briefingLogo = useMemo(() => {
    if (setupTab === 'company') {
      const name = companyName || selectedCompanyTitle || briefingRoleTitle;
      const company = MOCK_COMPANIES.find((c) => c.name === name);
      return { name, logoUrl: company?.logo };
    }
    if (setupTab === 'role') {
      const name = selectedRoleTitle || briefingRoleTitle;
      const card = MOCK_ROLE_PICKER_CARDS.find((c) => c.title === name);
      return { name, logoUrl: card?.logo };
    }
    return { name: briefingRoleTitle, logoUrl: undefined as string | undefined };
  }, [setupTab, companyName, selectedCompanyTitle, selectedRoleTitle, briefingRoleTitle]);

  const selectedRound = useMemo(
    () => MOCK_INTERVIEW_ROUNDS.find((r) => r.id === selectedRoundId) ?? MOCK_INTERVIEW_ROUNDS[0],
    [selectedRoundId],
  );

  const selectedInterviewer = useMemo(
    () => MOCK_INTERVIEWERS.find((i) => i.id === selectedInterviewerId) ?? MOCK_INTERVIEWERS[0],
    [selectedInterviewerId],
  );

  const briefingTrackLabel = TRACK_OPTIONS.find((x) => x.id === track)?.label ?? 'Software Engineering';
  const briefingLevelLabel = LEVEL_OPTIONS.find((x) => x.id === level)?.label ?? 'Mid';

  const renderRoleCompanyHeadline = () => {
    const isRole = setupTab === 'role';
    const isCompany = setupTab === 'company';
    if (!isRole && !isCompany) return null;
    const chipLabel = isRole ? '3000+ roles available' : 'Practice by company';
    const chipClass =
      'h-auto min-h-0 border-orange-200 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#ea580c] shadow-lg shadow-orange-500/10';
    const titleLine1 = isRole ? 'Role-Specific' : 'Company-Specific';
    const description = isRole
      ? `Practice role-specific interviews with real-world questions. Improve domain knowledge, articulation and communication with an instant feedback-style report (demo). Typical walkthrough about ${ESTIMATED_DURATION_MIN} minutes.`
      : 'Practice company-targeted scenarios and talking points. Build confidence for recruiter screens and onsite loops — tailored demo script per company.';

    const HeadlineRoot = prefersReducedMotion ? 'div' : motion.div;
    const HeadlineItem = prefersReducedMotion ? 'div' : motion.div;

    return (
      <HeadlineRoot
        key={setupTab}
        className="mb-8 max-w-3xl mx-auto space-y-5 px-2 text-center"
        {...(!prefersReducedMotion
          ? { initial: 'hidden', animate: 'show', variants: HEADLINE_STAGGER }
          : {})}
      >
        <HeadlineItem
          className="flex justify-center"
          {...(!prefersReducedMotion ? { variants: HEADLINE_FADE_UP } : {})}
        >
          <ShimmerButton
            type="button"
            tabIndex={-1}
            aria-label={chipLabel}
            className={`${chipClass} dark:hidden`}
            background="#ffffff"
            shimmerColor="rgba(249, 115, 22, 0.4)"
            shimmerDuration="3.5s"
            borderRadius="100px"
          >
            <Zap className="h-4 w-4 shrink-0 text-[#f97316]" aria-hidden />
            <span>{chipLabel}</span>
          </ShimmerButton>
          <ShimmerButton
            type="button"
            tabIndex={-1}
            aria-label={chipLabel}
            className={`${chipClass} hidden border-orange-500/35 text-orange-400 shadow-orange-500/5 dark:inline-flex`}
            background="rgb(17, 24, 39)"
            shimmerColor="rgba(251, 146, 60, 0.35)"
            shimmerDuration="3.5s"
            borderRadius="100px"
          >
            <Zap className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
            <span>{chipLabel}</span>
          </ShimmerButton>
        </HeadlineItem>
        <h1 className="font-bold tracking-tight text-gray-900 dark:text-white">
          <AnimatedHeadlineLine
            text={titleLine1}
            className="block text-2xl sm:text-3xl md:text-4xl"
            delay={0.14}
            reducedMotion={prefersReducedMotion}
          />
          <AnimatedHeadlineLine
            text="AI Mock Interviews"
            className="mt-1 block text-3xl text-[#f97316] sm:text-4xl md:text-5xl dark:text-orange-400"
            delay={0.38}
            emphasis
            reducedMotion={prefersReducedMotion}
          />
        </h1>
        <HeadlineItem {...(!prefersReducedMotion ? { variants: HEADLINE_FADE_UP } : {})}>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">
            {description}
          </p>
        </HeadlineItem>
      </HeadlineRoot>
    );
  };

  const renderRoleCompanySearch = () => {
    const isRole = setupTab === 'role';
    const isCompany = setupTab === 'company';
    if (!isRole && !isCompany) return null;
    const SearchWrap = prefersReducedMotion ? 'div' : motion.div;
    const searchMotionProps = prefersReducedMotion
      ? {}
      : {
          key: `search-${setupTab}`,
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] as const },
        };
    if (isCompany) {
      return (
        <SearchWrap
          className="w-full max-w-4xl mx-auto mb-8 px-1"
          {...searchMotionProps}
        >
          <form
            className="flex rounded-full border-2 border-orange-600/90 dark:border-orange-500/55 bg-white dark:bg-gray-900 shadow-md shadow-orange-900/[0.08] dark:shadow-black/40 overflow-hidden outline-none ring-0 focus-within:ring-0 focus-within:border-[#f97316] pl-5 pr-1.5 py-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              runCompanySearch();
            }}
            role="search"
            aria-label="Search companies"
          >
            <label className="flex flex-1 items-center gap-3 min-w-0 cursor-text">
              <Search className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0" aria-hidden />
            <input
                ref={companySearchInputRef}
              type="search"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Select or search any company"
                className="flex-1 min-w-0 py-3 bg-transparent text-sm outline-none ring-0 focus:ring-0 focus-visible:ring-0 placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                enterKeyHint="search"
              />
            </label>
            <button
              type="submit"
              className="shrink-0 rounded-full px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-white bg-[#f97316] hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/30 outline-none focus-visible:outline-none focus-visible:ring-0"
            >
              Search
            </button>
          </form>
        </SearchWrap>
      );
    }
    return (
      <SearchWrap
        className="w-full max-w-3xl mx-auto mb-10 px-1"
        {...searchMotionProps}
      >
        <form
          className="flex rounded-full border-2 border-orange-500/70 dark:border-orange-500/45 bg-white dark:bg-gray-900 shadow-md shadow-orange-900/[0.08] dark:shadow-black/30 overflow-hidden outline-none ring-0 focus-within:ring-0 focus-within:border-[#f97316] pl-5 pr-1.5 py-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            runRoleSearch();
          }}
          role="search"
          aria-label="Search roles"
        >
          <label className="flex flex-1 items-center gap-3 min-w-0 cursor-text">
            <Search className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0" aria-hidden />
            <input
              ref={roleSearchInputRef}
              type="search"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              placeholder="Search for roles (e.g. Software Engineer, Data Analyst)"
              className="flex-1 min-w-0 py-3 bg-transparent text-sm outline-none ring-0 focus:ring-0 focus-visible:ring-0 placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
              enterKeyHint="search"
            />
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-full px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-white bg-[#f97316] hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/30 outline-none focus-visible:outline-none focus-visible:ring-0"
          >
            Search
          </button>
        </form>
      </SearchWrap>
    );
  };

  const renderInterviewBreadcrumb = () => {
    if (phase === 'setup' || phase === 'live') return null;

    const phaseLabels: Partial<Record<FlowPhase, string>> = {
      briefing: 'Interview details',
      prereq: 'Device check',
      warming: 'Preparing session',
      results: 'Results',
    };

    const crumbs: { label: string; onClick?: () => void }[] = [
      { label: 'Interview with AI' },
      { label: setupTabLabel, onClick: goBackToSetup },
    ];

    if (selectionLabel) {
      crumbs.push({
        label: selectionLabel,
        onClick: phase !== 'briefing' ? goBackToBriefing : undefined,
      });
    }

    const terminalLabel = phaseLabels[phase];
    if (terminalLabel) {
      crumbs.push({ label: terminalLabel });
    }

    return (
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-base">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" aria-hidden />
              ) : null}
              {crumb.onClick && !isLast ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="font-medium text-gray-500 transition-colors hover:text-[#f97316] dark:text-gray-400 dark:hover:text-orange-400"
                >
                  {crumb.label}
                </button>
              ) : (
                <span
                  className={
                    isLast
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'font-medium text-gray-500 dark:text-gray-400'
                  }
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  };

  const renderRoleCompanyGrid = () => {
    if (setupTab === 'role') {
      return (
        <div ref={roleGridSectionRef} id="live-mock-role-grid" className="w-full max-w-5xl mx-auto scroll-mt-24">
          <div className="flex flex-col items-center gap-1 mb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <User className="w-5 h-5 text-[#f97316] dark:text-orange-400 shrink-0" aria-hidden />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Roles</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              Each card shows a sample employer logo from our library — pick a role to start your mock interview.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredRoles.map((card) => (
            <button
                key={card.title}
              type="button"
                title={card.title}
              onClick={() => void startRoleInterview(card.title)}
                className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 px-4 py-6 sm:py-7 text-center shadow-sm shadow-orange-900/[0.05] transition-all duration-200 hover:border-[#f97316] hover:bg-gradient-to-b hover:from-orange-50/95 hover:to-white dark:hover:from-orange-950/35 dark:hover:to-gray-900 hover:shadow-lg hover:shadow-orange-500/12 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 active:translate-y-0 active:scale-[0.99] ${
                  selectedRoleTitle === card.title
                    ? 'border-[#f97316] bg-orange-50/70 dark:bg-orange-500/10'
                    : 'border-orange-200/95 dark:border-orange-800/55 bg-white dark:bg-gray-900'
                }`}
              >
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-orange-400/0 transition-colors group-hover:bg-orange-400/80" aria-hidden />
                <CompanyPickerLogo size="lg" name={card.title} logoUrl={card.logo} />
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white leading-snug px-1 group-hover:text-orange-950 dark:group-hover:text-orange-50">
                  {card.title}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-orange-600/70 dark:text-orange-400/80">
                  Spotlight employer
                </span>
            </button>
          ))}
          </div>
          {questionGenError ? (
            <p className="mt-4 text-center text-xs text-red-600 dark:text-red-400">{questionGenError}</p>
          ) : null}
          {filteredRoles.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">No roles match your search.</p>
          ) : null}
        </div>
      );
    }
    if (setupTab === 'company') {
      return (
        <div ref={companyGridSectionRef} id="live-mock-company-grid" className="w-full max-w-5xl mx-auto scroll-mt-24">
          <div className="flex flex-col items-center gap-1 mb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="w-5 h-5 text-[#f97316] dark:text-orange-400 shrink-0" aria-hidden />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Companies</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              Each company includes a logo from our library. Search to filter the list.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-3 justify-center sm:justify-start">
          {filteredCompanies.map((company) => (
            <button
              key={company.id}
              type="button"
                title={company.name}
              onClick={() => {
                setSessionLabel(`Company: ${company.name}`);
                setCompanyName(company.name);
                setSelectedCompanyTitle(company.name);
                setTrack('swe');
                setGeneratedScript(null);
                setQuestionGenError(null);
                setQuestionGenLoading(false);
                void goToBriefing();
              }}
                className="group inline-flex min-w-0 max-w-[min(100%,17rem)] items-center gap-3 rounded-2xl border-2 border-orange-600/85 dark:border-orange-500/50 bg-white dark:bg-gray-900 pl-2 pr-4 py-2 text-left shadow-sm shadow-orange-900/[0.04] transition-all duration-200 hover:border-[#f97316] hover:bg-gradient-to-r hover:from-orange-50/90 hover:to-white dark:hover:from-orange-950/40 dark:hover:to-gray-900 hover:shadow-md hover:shadow-orange-500/15 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                <CompanyPickerLogo name={company.name} logoUrl={company.logo} />
                <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-950 dark:group-hover:text-orange-50">
                {company.name}
              </span>
            </button>
          ))}
          </div>
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Question generation happens after you choose question count and time in Interview details.
          </p>
          {filteredCompanies.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">No companies match your search.</p>
          ) : null}
        </div>
      );
    }
    return null;
  };

  const jdValid = jdJobTitle.trim().length > 0 && questionCount > 0 && timeMinutes > 0;

  const renderBriefingPhase = () => (
    <motion.div
      key="briefing"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className={`w-full min-w-0 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 ${BRIEFING_SURFACE}`}
    >
      <div className="mx-auto w-full max-w-3xl pb-20 sm:pb-24">
        <div className="space-y-4 sm:space-y-5">
          {/* Premium role summary header */}
          <section className={`${BRIEFING_CARD} p-4 sm:p-5`} aria-labelledby="briefing-role-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <CompanyPickerLogo name={briefingLogo.name} logoUrl={briefingLogo.logoUrl} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-gray-400">
                    Interview setup
                  </p>
                  <h1
                    id="briefing-role-title"
                    className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937] dark:text-white"
                  >
                    {briefingRoleTitle}
                  </h1>
                  {companyName ? (
                    <p className="mt-1 text-sm text-[#6B7280] dark:text-gray-400">
                      Company focus: <span className="font-medium text-[#1F2937] dark:text-gray-200">{companyName}</span>
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full border border-[#E5E7EB] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-[#1F2937] dark:text-gray-200">
                      {briefingTrackLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 text-xs font-semibold text-[#FF7A00]">
                      {briefingLevelLabel} Level
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={goBackToSetup}
                className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-2.5 py-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:border-orange-200 hover:text-[#FF7A00] dark:text-gray-400 dark:hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00]/40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Change selection
              </button>
            </div>
          </section>

          {/* Dashboard stat cards */}
          <section className="grid grid-cols-2 gap-3 sm:max-w-xs" aria-label="Interview statistics">
            <div className={`${BRIEFING_CARD} p-3.5 sm:p-4`}>
              <p className="text-2xl font-bold tracking-tight text-[#1F2937] dark:text-white">
                {questionCount}
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#6B7280] dark:text-gray-400">Questions</p>
            </div>
            <div className={`${BRIEFING_CARD} p-3.5 sm:p-4`}>
              <p className="text-2xl font-bold tracking-tight text-[#1F2937] dark:text-white">
                {timeMinutes}
                <span className="ml-0.5 text-base font-semibold text-[#6B7280] dark:text-gray-400">min</span>
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#6B7280] dark:text-gray-400">Duration</p>
            </div>
          </section>
          <p className="-mt-2 text-sm text-[#6B7280] dark:text-gray-500">
            Session auto-ends when the time limit is reached if questions remain.
          </p>

          {/* Round selection */}
          <section aria-labelledby="briefing-round-label">
            <h2 id="briefing-round-label" className="mb-2 text-sm font-semibold text-[#1F2937] dark:text-white">
              Interview round
            </h2>
            <div
              className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1"
              role="tablist"
              aria-label="Interview round"
            >
              {MOCK_INTERVIEW_ROUNDS.map((round) => {
                const meta = ROUND_TAB_META[round.id] ?? { icon: Briefcase, label: round.label };
                const Icon = meta.icon;
                const active = selectedRoundId === round.id;
                return (
                  <button
                    key={round.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00]/40 ${
                      active
                        ? 'border-[#FF7A00] bg-[#FF7A00] text-white shadow-md shadow-orange-500/25'
                        : 'border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-gray-900 text-[#6B7280] dark:text-gray-300 hover:border-orange-200 hover:text-[#FF7A00] dark:hover:border-orange-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Interviewer selection */}
          <section aria-labelledby="briefing-interviewer-label">
            <h2 id="briefing-interviewer-label" className="mb-2 text-sm font-semibold text-[#1F2937] dark:text-white">
              Choose your interviewer
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {MOCK_INTERVIEWERS.map((inv) => {
                const active = selectedInterviewerId === inv.id;
                const isPreviewing = previewingVoiceId === inv.id;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={`Select ${inv.name}, ${inv.voiceLabel}. Tap to hear voice sample.`}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      selectAndPreviewInterviewer(inv);
                    }}
                    className={`group relative flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00]/40 disabled:cursor-wait ${
                      active
                        ? 'border-[#FF7A00] bg-orange-50/80 dark:bg-orange-950/25 shadow-md shadow-orange-500/10 ring-1 ring-orange-200/80 dark:ring-orange-800/50'
                        : 'border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-orange-200 hover:shadow-sm dark:hover:border-orange-800/60'
                    }`}
                  >
                    {active ? (
                      <span className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7A00] text-white shadow-sm">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                      </span>
                    ) : null}
                    <InterviewerAvatar interviewer={inv} size="sm" />
                    <p className="min-w-0 flex-1 truncate pr-5 text-base text-[#1F2937] dark:text-white">
                      <span className="font-bold">{inv.name}</span>
                      <span className="text-[#6B7280] dark:text-gray-400"> · </span>
                      <span className="inline-flex items-center gap-1 font-medium text-[#6B7280] dark:text-gray-400">
                        {isPreviewing ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#FF7A00]" aria-hidden />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#FF7A00]" aria-hidden />
                        )}
                        {isPreviewing ? 'Playing…' : inv.voiceLabel}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Media preferences */}
          <section className={`${BRIEFING_CARD} divide-y divide-[#E5E7EB] dark:divide-gray-700`} aria-label="Media preferences">
            <p className="px-3 pt-3 text-sm text-[#6B7280] dark:text-gray-400">
              Interviewer voice plays through your speakers. Tap an interviewer card to preview.
            </p>
            <label className="flex cursor-pointer items-center gap-2.5 p-3">
              <input
                type="checkbox"
                checked={useAudio}
                onChange={(e) => setUseAudio(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#FF7A00] focus:ring-[#FF7A00]"
              />
              <Mic className="h-4 w-4 shrink-0 text-[#FF7A00]" aria-hidden />
              <span className="text-sm font-medium text-[#1F2937] dark:text-gray-200">Use microphone</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 p-3">
              <input
                type="checkbox"
                checked={useVideo}
                onChange={(e) => setUseVideo(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#FF7A00] focus:ring-[#FF7A00]"
              />
              <Video className="h-4 w-4 shrink-0 text-[#FF7A00]" aria-hidden />
              <span className="text-sm font-medium text-[#1F2937] dark:text-gray-200">Use camera / video</span>
            </label>
          </section>

          {/* Interview summary */}
          <section className={`${BRIEFING_CARD} p-4 sm:p-5`} aria-labelledby="briefing-summary-title">
            <h2 id="briefing-summary-title" className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-gray-400">
              Interview summary
            </h2>
            <dl className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2">
              {[
                { term: 'Role', value: briefingRoleTitle },
                { term: 'Round', value: ROUND_TAB_META[selectedRound.id]?.label ?? selectedRound.label },
                { term: 'Questions', value: String(questionCount) },
                { term: 'Duration', value: `${timeMinutes} minutes` },
                { term: 'Interviewer', value: `${selectedInterviewer.name} · ${selectedInterviewer.voiceLabel}` },
                { term: 'Track', value: briefingTrackLabel },
              ].map((row) => (
                <div key={row.term} className="flex items-baseline justify-between gap-3 border-b border-[#E5E7EB]/80 dark:border-gray-700/80 pb-2 last:border-0 sm:last:border-b">
                  <dt className="text-sm text-[#6B7280] dark:text-gray-400">{row.term}</dt>
                  <dd className="text-sm font-semibold text-[#1F2937] dark:text-white text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
            {liveInterviewMode === 'ai' && hasLiveInterviewKey ? (
              <p className="mt-3 rounded-lg bg-orange-50/80 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 px-3 py-2 text-sm text-[#6B7280] dark:text-gray-400">
                AI scoring via your saved <strong className="text-[#1F2937] dark:text-gray-200">{llmProvider}</strong> key ({liveInterviewModel}).
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[#6B7280] dark:text-gray-500">
              Attempts remaining: <strong className="text-[#1F2937] dark:text-white">3</strong> (mock)
            </p>
          </section>
        </div>
      </div>

      {/* Sticky primary CTA */}
      <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 border-t border-orange-100/80 dark:border-gray-700 bg-[#FFF7EE]/95 dark:bg-[#12111a]/95 px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBackToSetup}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-white dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00]/40"
          >
            <X className="h-4 w-4" aria-hidden />
            Cancel
          </button>
          <button
            type="button"
            disabled={!briefingCanStart || questionGenLoading}
            onClick={() => void handleStartPracticeFromBriefing()}
            aria-busy={questionGenLoading}
            className="inline-flex w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-1.5 rounded-lg bg-[#FF7A00] px-6 py-3 text-base font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            {questionGenLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Generating questions…
              </>
            ) : (
              <>
                Start Interview
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderSetupBody = () => {
    switch (setupTab) {
      case 'role':
      case 'company':
        return renderRoleCompanyGrid();
      case 'jd':
        return (
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
            <div className={`${cardWhite} p-6 sm:p-8`}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Create AI Mock Interview
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Tailor your mock interview to the role and company for the most relevant practice.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-3 sm:gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                    <Briefcase className="h-4 w-4 text-[#f97316]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Job title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={jdJobTitle}
                      onChange={(e) => setJdJobTitle(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                      placeholder="e.g. Senior Software Engineer"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      Enter the job title you&apos;re interviewing for.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                    <Building2 className="h-4 w-4 text-[#f97316]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Interview type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={jdInterviewType}
                      onChange={(e) => setJdInterviewType(e.target.value as InterviewTrackId)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                    >
                      {TRACK_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Select the type of interview.</p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                    <FileText className="h-4 w-4 text-[#f97316]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Job description
                    </label>
                    <div className="relative">
                      <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value.slice(0, JD_TEXT_MAX))}
                        rows={5}
                        maxLength={JD_TEXT_MAX}
                        className="w-full resize-y rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-3 pb-8 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        placeholder="Paste key requirements, responsibilities, and expectations..."
                      />
                      <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-gray-400 dark:text-gray-500">
                        {jdText.length} / {JD_TEXT_MAX}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      Add the job description or key details about the role.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                    <User className="h-4 w-4 text-[#f97316]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Resume details
                    </label>
                    <div className="relative">
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value.slice(0, JD_TEXT_MAX))}
                        rows={4}
                        maxLength={JD_TEXT_MAX}
                        className="w-full resize-y rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-3 pb-8 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        placeholder="Paste resume summary / key experience / skills..."
                      />
                      <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-gray-400 dark:text-gray-500">
                        {resumeText.length} / {JD_TEXT_MAX}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      Share your background to get more relevant questions.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Number of questions
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={20}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.max(3, Math.min(20, Number(e.target.value) || 8)))}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Recommended: 6 – 12</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Total time (minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(Math.max(5, Math.min(90, Number(e.target.value) || 20)))}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Recommended: 15 – 30</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={resetJdForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </button>
                <button
                  type="button"
                  disabled={!jdValid}
                  onClick={() => {
                    const inferred = inferTrackFromText(`${jdJobTitle} ${jdText}`);
                    setSessionLabel(`JD: ${jdJobTitle.trim()}`);
                    setCompanyName(undefined);
                    setTrack(inferred !== 'swe' ? inferred : jdInterviewType);
                    setGeneratedScript(null);
                    setQuestionGenError(null);
                    void goToBriefing();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[200px]"
                >
                  Create Interview
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {questionGenError ? (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">{questionGenError}</p>
              ) : null}
            </div>

            <aside className="space-y-4 lg:space-y-5">
              <div className={`${cardWhite} flex items-start gap-3 p-4 sm:p-5`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                  <Target className="h-4 w-4 text-[#f97316]" aria-hidden />
                </span>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">Personalized. Relevant. Effective.</span>{' '}
                  Better practice leads to better performance.
                </p>
              </div>

              <div className={`${cardWhite} p-4 sm:p-5`}>
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[#f97316]" aria-hidden />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tips for best results</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                      <Sparkles className="h-3.5 w-3.5 text-[#f97316]" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Be specific</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        Add details about the role and your experience for tailored questions.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                      <FileText className="h-3.5 w-3.5 text-[#f97316]" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Paste key requirements</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        Include must-have skills, responsibilities, and expectations.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                      <BadgeCheck className="h-3.5 w-3.5 text-[#f97316]" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Keep it honest</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        Accurate info helps generate realistic and relevant interviews.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className={`${cardWhite} p-4 sm:p-5`}>
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-500" aria-hidden />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add resume (optional)</h3>
                </div>
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 text-center dark:border-gray-600 dark:bg-gray-950/40">
                  <UploadCloud className="mx-auto mb-3 h-9 w-9 text-violet-500 opacity-90" aria-hidden />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag &amp; drop your resume here
                    <span className="block text-gray-400 dark:text-gray-500">or</span>
                  </p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Choose file
                  </button>
                  <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">PDF, DOCX (Max 5MB)</p>
                  <p className="mt-2 text-[11px] italic text-gray-400 dark:text-gray-500">Upload coming soon — paste details in the form for now.</p>
                </div>
              </div>
            </aside>
          </div>
        );
      default:
        return null;
    }
  };

  const briefingCanStart = true;

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
        {!embedded && liveInterviewMode === 'ai' ? (
          <FeatureUsageBanner featureId="live-ai" compact />
        ) : null}
        {!embedded && liveInterviewMode === 'ai' && phase !== 'live' && (
          <div className="flex items-center justify-end gap-4 mb-3">
            <button
              type="button"
              onClick={goResultsDashboard}
              className="text-sm font-medium text-[#f97316] hover:underline"
            >
              Results dashboard
            </button>
          </div>
        )}

        {liveInterviewMode === 'peer' ? (
          <PeerInterviewSection
            viewerDisplayName={peerViewerDisplayName}
            viewerUserId={userId}
            embedded={embedded}
          />
        ) : (
        <>
        {renderInterviewBreadcrumb()}
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
              <div
                className={`${PICKER_SURFACE} -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 scroll-mt-28 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8`}
              >
                {setupTab !== 'jd' && (
                  <>
                    {renderRoleCompanyHeadline()}
                    {renderRoleCompanySearch()}
                  </>
                )}
                {renderSetupBody()}
              </div>
            </motion.div>
          )}

          {phase === 'briefing' && renderBriefingPhase()}

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
                    Real checks in your browser — grant permissions when asked. When you reach the microphone step, click{' '}
                    <strong className="text-gray-800 dark:text-gray-200">Test microphone</strong> and speak clearly for a couple
                    of seconds.
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
                      const awaitMicTest = idx === 3 && st === 'awaiting_mic_test';
                      const awaitConfirmMic = idx === 3 && st === 'awaiting_confirm_mic';
                      const awaitMicRetry = idx === 3 && st === 'awaiting_mic_retry';
                      const awaitTone = st === 'awaiting_tone';
                      const awaitConfirmHeard = st === 'awaiting_confirm_heard';
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
                            {awaitMicTest && (
                              <div className="mt-2 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => void handleRunMicTest()}
                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2"
                                >
                                  <Mic className="w-3.5 h-3.5" aria-hidden />
                                  Test microphone
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Speak a short sentence while this runs (~2s). We listen for input level, not your words.
                                </p>
                                <button
                                  type="button"
                                  onClick={skipMicCheck}
                                  className="text-xs font-medium text-[#ea580c] dark:text-orange-400 underline hover:no-underline"
                                >
                                  Skip microphone check — I’ll fix the mic later
                                </button>
                              </div>
                            )}
                            {awaitConfirmMic && (
                              <div className="mt-2 space-y-3">
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                  We detected audio on your microphone. Did that work on your side?
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={confirmMicHeard}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2"
                                  >
                                    <Check className="w-3.5 h-3.5" aria-hidden />
                                    Yes, that worked
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleRunMicTest()}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs font-semibold px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  >
                                    <Mic className="w-3.5 h-3.5" aria-hidden />
                                    Test again
                                  </button>
                                </div>
                                <details className="text-xs text-gray-500 dark:text-gray-400">
                                  <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-300 hover:text-[#ea580c] dark:hover:text-orange-400">
                                    Wrong mic or too quiet?
                                  </summary>
                                  <ul className="mt-2 list-disc list-inside space-y-1 pl-0.5">
                                    <li>Choose the correct input in your system sound settings (Bluetooth vs built-in).</li>
                                    <li>Move closer and speak a bit louder during the test.</li>
                                    <li>Allow microphone access for this site if the browser prompted you.</li>
                                  </ul>
                                </details>
                                <button
                                  type="button"
                                  onClick={skipMicCheck}
                                  className="text-xs font-medium text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  Skip anyway — continue without confirming
                                </button>
                              </div>
                            )}
                            {awaitMicRetry && (
                              <div className="mt-2 space-y-3">
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                  We didn’t pick up much from the microphone. Try again, or skip if you’ll use a different
                                  device later.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleRunMicTest()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2"
                                  >
                                    <Mic className="w-3.5 h-3.5" aria-hidden />
                                    Test microphone again
                                  </button>
                                </div>
                                <details className="text-xs text-gray-500 dark:text-gray-400">
                                  <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-300 hover:text-[#ea580c] dark:hover:text-orange-400">
                                    Still not working?
                                  </summary>
                                  <ul className="mt-2 list-disc list-inside space-y-1 pl-0.5">
                                    <li>Check the mic isn’t muted in system settings or on the headset cable.</li>
                                    <li>Close other apps that might be using the microphone exclusively.</li>
                                    <li>Turn off “Use microphone” in the previous step if you only need the camera.</li>
                                  </ul>
                                </details>
                                <button
                                  type="button"
                                  onClick={skipMicCheck}
                                  className="text-xs font-medium text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  Skip microphone check
                                </button>
                              </div>
                            )}
                            {awaitTone && (
                              <div className="mt-2 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => void handlePlayTestTone()}
                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2"
                                >
                                  <Volume2 className="w-3.5 h-3.5" aria-hidden />
                                  Play test tone
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  You should hear a brief beep — unmute your device and tab if needed.
                                </p>
                                <button
                                  type="button"
                                  onClick={skipSpeakerCheck}
                                  className="text-xs font-medium text-[#ea580c] dark:text-orange-400 underline hover:no-underline"
                                >
                                  Skip speaker check — I’ll fix audio later
                                </button>
                              </div>
                            )}
                            {awaitConfirmHeard && (
                              <div className="mt-2 space-y-3">
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                  Did you hear the beep?
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={confirmSpeakerHeard}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2"
                                  >
                                    <Check className="w-3.5 h-3.5" aria-hidden />
                                    Yes, I heard it
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handlePlayTestTone()}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs font-semibold px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" aria-hidden />
                                    Play again
                                  </button>
                                </div>
                                <details className="text-xs text-gray-500 dark:text-gray-400">
                                  <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-300 hover:text-[#ea580c] dark:hover:text-orange-400">
                                    No sound? Quick checks
                                  </summary>
                                  <ul className="mt-2 list-disc list-inside space-y-1 pl-0.5">
                                    <li>Turn up system volume and unplug muted headphones.</li>
                                    <li>macOS/Windows: pick the correct output device (Bluetooth vs speakers).</li>
                                    <li>Browser tab: ensure the tab isn’t muted (icon on the tab).</li>
                                    <li>Try “Play again” after changing volume — the tone is short.</li>
                                  </ul>
                                </details>
                                <button
                                  type="button"
                                  onClick={skipSpeakerCheck}
                                  className="text-xs font-medium text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  Skip anyway — continue without confirming
                                </button>
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
                    onClick={() => {
                      primeSpeechSynthesis();
                      setPhase('warming');
                    }}
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
              className="w-full min-w-0 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 rounded-2xl bg-[#f9fafb] dark:bg-[#0a0a0c] border border-gray-200/80 dark:border-gray-800"
            >
              {/* Meeting-style header */}
              <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6 lg:mb-8">
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={goBack}
                    className="mt-1 p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0"
                    aria-label="Back"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden />
                  </button>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white truncate">
                      {liveSessionTitle}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed max-w-2xl">
                      {liveSessionSubtitle}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleEndEarly}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-100 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Square className="w-4 h-4" aria-hidden />
                    Stop session
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/25">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    <Video className="w-4 h-4" aria-hidden />
                    Live
                </div>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm font-mono tabular-nums text-gray-700 dark:text-gray-300">
                    <Timer className="w-4 h-4 text-gray-400" aria-hidden />
                    {formatMmSs(elapsedSec)}
                </div>
              </div>
              </header>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Left ~65% */}
                <div className="xl:col-span-8 space-y-6">
                  <div className="relative rounded-[1.25rem] sm:rounded-3xl overflow-hidden bg-white dark:bg-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-200/90 dark:border-gray-800">
                    <div className="aspect-video bg-white dark:bg-gray-950 relative flex flex-col items-center justify-center p-6 sm:p-10">
                      <div
                        className={`absolute inset-0 pointer-events-none ${aiState === 'speaking' ? 'bg-gradient-to-b from-blue-50/40 to-transparent dark:from-blue-500/5' : ''}`}
                        aria-hidden
                      />
                      {/* Top overlays */}
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 rounded-full bg-black/45 dark:bg-black/55 backdrop-blur-md pl-1.5 pr-3 py-1.5 text-white text-xs font-medium max-w-[min(100%,20rem)]">
                        {selectedInterviewer ? (
                          <InterviewerAvatar interviewer={selectedInterviewer} size="sm" className="!h-8 !w-8 !rounded-full" />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold">
                            {interviewerInitials}
                          </span>
                        )}
                        <span className="min-w-0 truncate font-semibold">
                          {selectedInterviewer
                            ? `${interviewerDisplay} · ${selectedInterviewer.voiceLabel}`
                            : interviewerDisplay}
                        </span>
                      </div>
                      {useVideo && localMediaStream?.getVideoTracks().length ? (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-[28%] max-w-[200px] min-w-[120px] rounded-xl overflow-hidden border-2 border-white dark:border-gray-700 shadow-lg ring-1 ring-black/10">
                          <div className="relative aspect-video bg-gray-900">
                            <video
                              ref={setLiveUserVideoRef}
                              key={localMediaStream.id}
                              className="absolute inset-0 h-full w-full object-cover"
                              autoPlay
                              playsInline
                              muted
                            />
                            {!liveCameraEnabled ? (
                              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-gray-950/85 text-white px-2">
                                <VideoOff className="w-6 h-6 opacity-90" aria-hidden />
                                <span className="text-[10px] font-medium text-center leading-tight">Camera off</span>
                              </div>
                            ) : null}
                            <div className="absolute bottom-1.5 right-1.5 z-20 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                              {liveMicEnabled ? (
                                <Mic className="w-3 h-3" aria-hidden />
                              ) : (
                                <MicOff className="w-3 h-3 text-amber-300" aria-hidden />
                              )}
                            </div>
                          </div>
                          <p className="bg-black/80 text-[10px] text-white/90 px-2 py-1 truncate">You</p>
                        </div>
                      ) : null}
                      <div
                        className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center pointer-events-none"
                        aria-hidden
                      >
                        <Lottie
                          animationData={interviewerFlowAnimation}
                          loop
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="sr-only">AI interviewer {interviewerDisplay}</span>
                      <p className="relative z-10 mt-2 text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        {aiState === 'speaking' ? (
                          <>
                            <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden />
                            Speaking
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden />
                            Listening
                          </>
                        )}
                        {micLiveMuted && (
                          <span className="text-amber-600 dark:text-amber-400 text-xs">· Mic off</span>
                        )}
                      </p>
                    </div>
                    {/* Floating control bar */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200/90 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-2 sm:px-3 py-2 shadow-lg">
                      <button
                        type="button"
                        onClick={toggleLiveMic}
                        disabled={!useAudio || !liveHasAudioTrack}
                        aria-pressed={liveMicEnabled}
                        title={
                          !useAudio || !liveHasAudioTrack
                            ? 'Microphone was disabled for this session'
                            : liveMicEnabled
                              ? 'Turn microphone off'
                              : 'Turn microphone on'
                        }
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${
                          useAudio && liveHasAudioTrack && liveMicEnabled
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {useAudio && liveHasAudioTrack && !liveMicEnabled ? (
                          <MicOff className="w-5 h-5" aria-hidden />
                        ) : (
                          <Mic className="w-5 h-5" aria-hidden />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={toggleLiveCamera}
                        disabled={!useVideo || !liveHasVideoTrack}
                        aria-pressed={liveCameraEnabled}
                        title={
                          !useVideo || !liveHasVideoTrack
                            ? 'Camera was disabled for this session'
                            : liveCameraEnabled
                              ? 'Turn camera off'
                              : 'Turn camera on'
                        }
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${
                          useVideo && liveHasVideoTrack && liveCameraEnabled
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {useVideo && liveHasVideoTrack && !liveCameraEnabled ? (
                          <VideoOff className="w-5 h-5" aria-hidden />
                        ) : (
                          <Video className="w-5 h-5" aria-hidden />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 cursor-not-allowed"
                        title="Chat not available in demo"
                      >
                        <MessageCircle className="w-5 h-5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 cursor-not-allowed"
                        title="More (demo)"
                      >
                        <MoreHorizontal className="w-5 h-5" aria-hidden />
                      </button>
                  <button
                    type="button"
                    onClick={handleEndEarly}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 ml-1"
                        aria-label="End call"
                  >
                        <Phone className="w-5 h-5 rotate-[135deg]" aria-hidden />
                  </button>
                    </div>
                </div>

                  {/* Key meeting notes */}
                  <div className="rounded-[1.25rem] sm:rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none overflow-hidden">
                    <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
                        Key session notes — {liveSessionTitle}
                      </h2>
                      <button
                        type="button"
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Menu"
                      >
                        <MoreHorizontal className="w-5 h-5" aria-hidden />
                      </button>
                      </div>
                    <div className="px-5 py-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                        {formatMmSs(elapsedSec)} elapsed
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <Search className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                        Topic {segmentIndex + 1}/{script.length}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <Users className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                        You, {interviewerDisplay}
                      </span>
                    </div>
                    <div className="px-5 pb-5">
                      <div className="rounded-2xl bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100 dark:from-sky-950/50 dark:via-indigo-950/40 dark:to-violet-950/40 border border-sky-200/60 dark:border-indigo-500/20 p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden />
                          AI summary (live snippet)
                        </div>
                        <p className="text-sm text-indigo-950/90 dark:text-indigo-100/90 leading-relaxed">
                          {liveAiSummaryText}
                        </p>
                      </div>
                      <div className="mt-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                          <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
                          Live answer transcription
                        </div>
                        <p className="text-sm text-emerald-950/90 dark:text-emerald-100/90 leading-relaxed whitespace-pre-wrap min-h-8">
                          {liveTranscriptDraft ||
                            transcribedAnswersBySegment[currentSegment.id] ||
                            (aiState === 'listening'
                              ? 'Listening... start speaking to see your answer transcribed live.'
                              : 'The transcript appears here when you answer the question.')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right ~35% */}
                <div className="xl:col-span-4 flex flex-col min-h-0 xl:sticky xl:top-4">
                  <div className="rounded-[1.25rem] sm:rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col overflow-hidden max-h-[min(88vh,900px)]">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800/80 p-1">
                        {(
                          [
                            ['questions', 'Question list'],
                            ['timeline', 'Timeline'],
                          ] as const
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setLiveSidebarTab(id)}
                            className={`flex-1 rounded-lg px-2 py-2 text-[11px] sm:text-xs font-semibold transition-colors ${
                              liveSidebarTab === id
                                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {liveSidebarTab === 'questions' && (
                      <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                          {liveQuestionCards.map((card, i) => (
                            <div
                              key={card.id}
                              className={`rounded-2xl border p-4 transition-shadow ${
                                card.current
                                  ? 'border-blue-200 dark:border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-200/50 dark:ring-blue-500/20'
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                {card.done ? (
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                                    <Check className="w-4 h-4" aria-hidden />
                                  </span>
                                ) : (
                                  <span className="h-7 w-7 shrink-0" aria-hidden />
                                )}
                              </div>
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                {card.topic}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-2">
                                {card.question}
                              </p>
                              {card.answer ? (
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-6">
                                  {card.answer}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                  {card.current ? 'Your demo reply will appear as you continue.' : 'Not reached yet.'}
                                </p>
                              )}
                          </div>
                      ))}
                    </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/50">
                      <button
                        type="button"
                        onClick={handleContinueConversation}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-blue-600/20 hover:opacity-95"
                      >
                        {continueLabel}
                      </button>
                    </div>
                      </>
                    )}

                    {liveSidebarTab === 'timeline' && (
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Simple timeline from your demo progress (no server recording).
                        </p>
                        <ul className="space-y-3">
                          {script.map((seg, i) => (
                            <li
                              key={seg.id}
                              className="flex gap-3 text-sm border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-1"
                            >
                              <span
                                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                                  i < segmentIndex
                                    ? 'bg-emerald-500'
                                    : i === segmentIndex
                                      ? 'bg-blue-500 animate-pulse'
                                      : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                              />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{seg.topic}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {i < segmentIndex ? 'Completed' : i === segmentIndex ? 'In progress' : 'Upcoming'}
                                </p>
                  </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Overall {hasLiveInterviewKey ? 'AI' : 'demo'} score
                    </p>
                    <p className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-amber-600 mt-2 tabular-nums">
                      {displayedResults.overall}
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
                      {displayedResults.dimensions.map((d) => (
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
                        {displayedResults.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-5">
                      <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-3 text-sm">Growth areas</h3>
                      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                        {displayedResults.improvements.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-5 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Coach note {hasLiveInterviewKey ? '(AI)' : '(demo)'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{displayedResults.coachNote}</p>
                  </div>
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 space-y-1">
                    {aiEvalLoading && <p>Generating AI score...</p>}
                    {aiEvalError && (
                      <p className="text-amber-600 dark:text-amber-400">AI scoring fallback used: {aiEvalError}</p>
                    )}
                    {saveStatus === 'saving' && <p>Saving to dashboard...</p>}
                    {saveStatus === 'saved' && <p>Saved to Interview Reports dashboard.</p>}
                    {saveStatus === 'error' && (
                      <p className="text-red-600 dark:text-red-400">Could not save result to dashboard.</p>
                    )}
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
                    {embedded && (
                      <button
                        type="button"
                        onClick={() => setActiveView('live-mock-interview-dashboard')}
                        className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Interview reports dashboard
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </div>
      <PremiumUpsellModal
        isOpen={showPremiumUpsell}
        onClose={() => setShowPremiumUpsell(false)}
      />
    </>
  );

  const pageShell = (
    <>
      {showInterviewBackground ? renderAiInterviewBackground() : null}
      <div className="relative z-10">{content}</div>
    </>
  );

  if (embedded) {
    return <div className={shell}>{pageShell}</div>;
  }

  return (
    <div className={shell}>
      {showInterviewBackground ? renderAiInterviewBackground() : null}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/80 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-base font-bold tracking-tight text-gray-900 dark:text-white hover:text-[#f97316] transition-colors"
          >
            CodeX<span className="text-[#f97316]">Career</span>
          </button>
          <nav className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => navigateTo(isLoggedIn ? 'dashboard' : 'home')}
              className="font-medium text-gray-600 dark:text-gray-300 hover:text-[#f97316]"
            >
              {isLoggedIn ? 'Dashboard' : 'Home'}
            </button>
            {liveInterviewMode === 'ai' && (
              <button
                type="button"
                onClick={goResultsDashboard}
                className="font-medium text-[#f97316] hover:underline"
              >
                Results dashboard
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="relative z-10 w-full min-w-0">{content}</main>
    </div>
  );
};

export default LiveMockInterviewPage;
