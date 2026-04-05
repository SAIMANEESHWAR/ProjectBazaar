import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  Circle,
  Loader2,
  Building2,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  MoreHorizontal,
  Phone,
  Search,
  Sparkles,
  Square,
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
import { useDashboard } from '../context/DashboardContext';
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
import { ShimmerButton } from './ui/shimmer-button';
import {
  evaluateInterviewWithProvider,
  generateInterviewQuestionsWithProvider,
  saveLiveInterviewResult,
  type LiveInterviewEvaluation,
  type LlmProvider,
} from '../services/liveMockInterviewApi';

type FlowPhase = 'setup' | 'briefing' | 'prereq' | 'warming' | 'live' | 'results';
type SetupTabId = 'role' | 'company' | 'jd' | 'custom';
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

const PAGE_BG = 'bg-white dark:bg-[#12111a]';
const LV_TITLE = 'text-[#1a1c2e] dark:text-white';
const LIVE_INTERVIEW_API_KEY_SESSION_KEY = 'liveMockInterviewApiKey';

/** Role / company picker — orange + white */
const PICKER_SURFACE =
  'bg-gradient-to-b from-orange-50/90 via-white to-white dark:from-orange-950/25 dark:via-[#12111a] dark:to-[#12111a]';
const PICKER_BORDER = 'border-orange-100/90 dark:border-orange-900/40';

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
}) => {
  const { navigateTo } = useNavigation();
  const { isLoggedIn, userId, userEmail } = useAuth();
  const peerViewerDisplayName = userEmail ? userEmail.split('@')[0] || 'You' : 'You';
  const { dashboardMode, setActiveView } = useDashboard();

  const [liveInterviewMode, setLiveInterviewMode] = useState<LiveInterviewMode>('ai');
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
  const [resumeText, setResumeText] = useState('');
  const [questionCount, setQuestionCount] = useState(8);
  const [timeMinutes, setTimeMinutes] = useState(20);
  const [selectedRoleTitle, setSelectedRoleTitle] = useState<string>('');
  const [selectedCompanyTitle, setSelectedCompanyTitle] = useState<string>('');
  const [generatedScript, setGeneratedScript] = useState<InterviewSegment[] | null>(null);
  const [questionGenLoading, setQuestionGenLoading] = useState(false);
  const [questionGenError, setQuestionGenError] = useState<string | null>(null);

  const [selectedInterviewerId, setSelectedInterviewerId] = useState(MOCK_INTERVIEWERS[0].id);
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
  const [llmApiKey, setLlmApiKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.sessionStorage.getItem(LIVE_INTERVIEW_API_KEY_SESSION_KEY) ?? '';
  });
  const [llmModel, setLlmModel] = useState('');
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
    const loc = inv?.locale ?? '';
    if (loc.includes('UK')) return 'en-GB';
    if (loc.includes('IN')) return 'en-IN';
    return 'en-US';
  }, [selectedInterviewerId]);

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
    if (typeof window === 'undefined') return;
    const value = llmApiKey.trim();
    if (value) {
      window.sessionStorage.setItem(LIVE_INTERVIEW_API_KEY_SESSION_KEY, value);
    } else {
      window.sessionStorage.removeItem(LIVE_INTERVIEW_API_KEY_SESSION_KEY);
    }
  }, [llmApiKey]);

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

        if (llmApiKey.trim()) {
          const generated = await generateInterviewQuestionsWithProvider({
            provider: llmProvider,
            apiKey: llmApiKey.trim(),
            model: llmModel.trim() || undefined,
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
      llmApiKey,
      llmProvider,
      llmModel,
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
    if (phase !== 'live' || !useAudio || !liveAiUtterance) {
      window.speechSynthesis.cancel();
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(liveAiUtterance.text);
    utter.lang = ttsLang;
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.onend = () => {
      setAiState('listening');
    };
    utter.onerror = () => {
      setAiState('listening');
    };

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
  }, [stopLocalMedia]);

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

  const goToBriefing = useCallback(() => {
    setPhase('briefing');
  }, []);

  const handleStartPracticeFromBriefing = useCallback(async () => {
    if (questionGenLoading) return;

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
      if (llmApiKey.trim()) {
        setAiEvalLoading(true);
        setAiEvalError(null);
        try {
          const aiScored = await evaluateInterviewWithProvider({
            provider: llmProvider,
            apiKey: llmApiKey.trim(),
            model: llmModel.trim() || undefined,
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
          provider: llmApiKey.trim() ? llmProvider : undefined,
          model: llmApiKey.trim() ? llmModel.trim() || undefined : undefined,
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
        });
        setSaveStatus('saved');
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
    llmApiKey,
    llmProvider,
    llmModel,
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
  ]);

  const continueLabel = atEndOfSegment
    ? atEndOfInterview
      ? 'Finish & view results'
      : 'Next topic'
    : aiState === 'listening'
      ? 'Next question'
      : 'Continue';

  const shell =
    'text-gray-900 dark:text-gray-100 ' +
    (embedded ? `min-h-0 w-full min-w-0 ${PAGE_BG}` : `min-h-screen w-full ${PAGE_BG}`);

  const mainInner =
    (embedded ? 'pb-10 pt-2' : 'pb-16 pt-6') +
    ' px-4 sm:px-6 lg:px-8 xl:px-10 w-full min-w-0 mx-auto max-w-[1320px]';

  const cardWhite =
    'rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm';

  const pillTabActive = 'bg-[#f97316] text-white shadow-md shadow-orange-500/25';
  const pillTabIdle =
    'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500/40';

  const renderRoleCompanyHeadline = () => {
    const isRole = setupTab === 'role';
    const isCompany = setupTab === 'company';
    if (!isRole && !isCompany) return null;
    const chipLabel = isRole ? '3000+ roles available' : 'Practice by company';
    const chipClass =
      'h-auto min-h-0 border-orange-200 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#ea580c] shadow-lg shadow-orange-500/10';
    return (
      <div className="mb-8 text-center max-w-3xl mx-auto space-y-5 px-2">
        <div className="flex justify-center">
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
        </div>
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
    if (isCompany) {
      return (
        <div className="w-full max-w-4xl mx-auto mb-8 px-1">
          <form
            className="flex rounded-full border-2 border-orange-600/90 dark:border-orange-500/55 bg-white dark:bg-gray-900 shadow-md shadow-orange-900/[0.08] dark:shadow-black/40 overflow-hidden transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#f97316]/35 pl-5 pr-1.5 py-1.5"
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
                className="flex-1 min-w-0 py-3 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                enterKeyHint="search"
              />
            </label>
            <button
              type="submit"
              className="shrink-0 rounded-full px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-white bg-[#f97316] hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/30"
            >
              Search
            </button>
          </form>
          </div>
      );
    }
    return (
      <div className="w-full max-w-3xl mx-auto mb-10 px-1">
        <form
          className="flex rounded-full border-2 border-orange-500/70 dark:border-orange-500/45 bg-white dark:bg-gray-900 shadow-md shadow-orange-900/[0.08] dark:shadow-black/30 overflow-hidden transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#f97316]/35 pl-5 pr-1.5 py-1.5"
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
              className="flex-1 min-w-0 py-3 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
              enterKeyHint="search"
            />
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-full px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-white bg-[#f97316] hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/30"
          >
            Search
          </button>
        </form>
      </div>
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
              onClick={() => {
                  setSelectedRoleTitle(card.title);
                  setQuestionGenError(null);
              }}
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
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={!selectedRoleTitle}
              onClick={() => {
                setSessionLabel(`Role: ${selectedRoleTitle}`);
                setCompanyName(undefined);
                setTrack(inferTrackFromText(selectedRoleTitle));
                setGeneratedScript(null);
                setQuestionGenError(null);
                goToBriefing();
              }}
              className="rounded-full px-8 py-3 text-sm font-bold uppercase tracking-wide text-white bg-[#f97316] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
            >
              Continue
            </button>
            {questionGenError ? (
              <p className="text-xs text-red-600 dark:text-red-400">{questionGenError}</p>
            ) : null}
          </div>
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
                goToBriefing();
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

  const renderPickerSetupTabs = () => (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {SETUP_TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            setSetupTab(t.id);
            if (t.id === 'custom') setCustomStep(1);
            setQuestionGenError(null);
            setQuestionGenLoading(false);
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

  const renderQuestionGenerationApiPanel = () => (
    <div className="max-w-2xl mx-auto mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Question generation API (optional)
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setLlmProvider('openrouter')}
          className={`rounded-lg px-3 py-2 text-sm font-medium border ${llmProvider === 'openrouter'
            ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-500/10'
            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
        >
          OpenRouter
        </button>
        <button
          type="button"
          onClick={() => setLlmProvider('groq')}
          className={`rounded-lg px-3 py-2 text-sm font-medium border ${llmProvider === 'groq'
            ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-500/10'
            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
        >
          Groq
        </button>
      </div>
      <input
        type="password"
        value={llmApiKey}
        onChange={(e) => setLlmApiKey(e.target.value)}
        placeholder={`Paste your ${llmProvider === 'groq' ? 'Groq' : 'OpenRouter'} API key`}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900"
      />
      <input
        type="text"
        value={llmModel}
        onChange={(e) => setLlmModel(e.target.value)}
        placeholder="Model override (optional)"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900"
      />
    </div>
  );

  const jdValid = jdJobTitle.trim().length > 0 && questionCount > 0 && timeMinutes > 0;

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
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                Resume details
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-3 text-sm"
                placeholder="Paste resume summary / key experience…"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Number of questions
                </label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(3, Math.min(20, Number(e.target.value) || 8)))}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Total time (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(Math.max(5, Math.min(90, Number(e.target.value) || 20)))}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
                />
              </div>
            </div>
            <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <UploadCloud className="w-8 h-8 mx-auto mb-2 text-[#f97316] opacity-80" aria-hidden />
              Drag & drop a JD file (mock — no upload)
            </div>
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
                goToBriefing();
              }}
              className="w-full sm:w-auto rounded-full px-8 py-3 text-sm font-bold uppercase tracking-wide text-white bg-[#f97316] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
            >
              Continue
            </button>
            {questionGenError ? (
              <p className="text-xs text-red-600 dark:text-red-400">{questionGenError}</p>
            ) : null}
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
                  setGeneratedScript(null);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div
            className="inline-flex rounded-full border border-gray-200 dark:border-gray-600 p-1 bg-gray-100/90 dark:bg-gray-900/90 shadow-inner"
            role="tablist"
            aria-label="Interview mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={liveInterviewMode === 'ai'}
              onClick={() => setLiveInterviewMode('ai')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                liveInterviewMode === 'ai'
                  ? 'bg-white dark:bg-gray-800 text-[#f97316] shadow-sm ring-1 ring-orange-200/80 dark:ring-orange-900/50'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Interview with AI
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={liveInterviewMode === 'peer'}
              onClick={() => setLiveInterviewMode('peer')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                liveInterviewMode === 'peer'
                  ? 'bg-white dark:bg-gray-800 text-[#f97316] shadow-sm ring-1 ring-orange-200/80 dark:ring-orange-900/50'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Interview with peer
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 sm:max-w-xs sm:text-right">
            {liveInterviewMode === 'ai'
              ? 'Full mock session with AI voice & scoring.'
              : 'Match with peers, share slots, and open a Meet link when you accept.'}
          </p>
        </div>

        <div
          className={`flex items-center justify-end gap-4 mb-6 ${
            liveInterviewMode !== 'ai' || (phase === 'live' && liveInterviewMode === 'ai') ? 'hidden' : ''
          }`}
        >
          <button
            type="button"
            onClick={goResultsDashboard}
            className="text-sm font-medium text-[#f97316] hover:underline"
          >
            Results dashboard
          </button>
        </div>

        {liveInterviewMode === 'peer' ? (
          <PeerInterviewSection
            viewerDisplayName={peerViewerDisplayName}
            viewerUserId={userId}
            embedded={embedded}
          />
        ) : (
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
                  {renderQuestionGenerationApiPanel()}
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
                      setQuestionGenError(null);
                      setQuestionGenLoading(false);
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
              {renderQuestionGenerationApiPanel()}
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
              className="w-full min-w-0 flex justify-center pt-1"
            >
              <div className={`w-full max-w-4xl ${cardWhite} overflow-hidden ring-1 ring-orange-100/70 dark:ring-orange-900/30`}>
                <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-5 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-500/10 dark:to-transparent">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Interview details</h2>
                </div>
                <div className="p-6 sm:p-7 space-y-6">
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

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Number of questions
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={questionCount}
                        onChange={(e) =>
                          setQuestionCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Time limit (minutes)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={timeMinutes}
                        onChange={(e) =>
                          setTimeMinutes(Math.max(1, Math.min(120, Number(e.target.value) || 1)))
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                    Session auto-ends when the time limit is reached if questions are still remaining.
                  </p>

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
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Optional AI scoring provider
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLlmProvider('openrouter')}
                        className={`rounded-lg px-3 py-2 text-sm font-medium border ${llmProvider === 'openrouter'
                          ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-500/10'
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        OpenRouter
                      </button>
                      <button
                        type="button"
                        onClick={() => setLlmProvider('groq')}
                        className={`rounded-lg px-3 py-2 text-sm font-medium border ${llmProvider === 'groq'
                          ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-500/10'
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        Groq
                      </button>
                    </div>
                    <input
                      type="password"
                      value={llmApiKey}
                      onChange={(e) => setLlmApiKey(e.target.value)}
                      placeholder={`Paste your ${llmProvider === 'groq' ? 'Groq' : 'OpenRouter'} API key (optional)`}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900"
                    />
                    <input
                      type="text"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      placeholder="Model override (optional)"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Leave API key empty to use existing mock rubric.
                    </p>
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
                      disabled={!briefingCanStart || questionGenLoading}
                      onClick={() => void handleStartPracticeFromBriefing()}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-bold text-white bg-[#f97316] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/25"
                  >
                      {questionGenLoading ? 'Generating questions...' : 'Start practice'}
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
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 rounded-full bg-black/45 dark:bg-black/55 backdrop-blur-md pl-1.5 pr-3 py-1.5 text-white text-xs font-medium max-w-[min(100%,18rem)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold">
                          {interviewerInitials}
                        </span>
                        <span className="truncate">{interviewerDisplay}</span>
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
                      Overall {llmApiKey.trim() ? 'AI' : 'demo'} score
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
                      Coach note {llmApiKey.trim() ? '(AI)' : '(demo)'}
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
        )}
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
      <main className="w-full min-w-0">{content}</main>
    </div>
  );
};

export default LiveMockInterviewPage;
