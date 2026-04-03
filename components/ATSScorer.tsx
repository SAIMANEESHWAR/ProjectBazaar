import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  History,
  Info,
  Loader2,
  Save,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../App';
import {
  analyzeAtsWithProvider,
  getAtsScoreHistory,
  getLlmKeysStatus,
  saveLlmApiKeyForProvider,
  type AtsHistoryItem,
  type AtsProvider,
} from '../services/atsService';

const SELECTED_PROVIDER_STORAGE = 'pb_ats_llm_provider';
const API_KEY_STORAGE_PREFIX = 'pb_ats_api_key_';
const API_KEY_STORAGE = 'pb_ats_gemini_api_key';
const LEGACY_API_KEY_STORAGE = 'pb_ats_llm_api_key';
const PRIMARY = '#FF6B00';
const RING_RADIUS = 52;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

function scoreBand(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Strong match', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (score >= 60) return { label: 'Good fit', className: 'text-amber-800 bg-amber-50 border-amber-200' };
  if (score >= 40) return { label: 'Room to improve', className: 'text-orange-800 bg-orange-50 border-orange-200' };
  return { label: 'Needs work', className: 'text-red-800 bg-red-50 border-red-200' };
}
const PROVIDERS: Array<{ id: AtsProvider; label: string; keyPlaceholder: string }> = [
  { id: 'gemini', label: 'Google Gemini', keyPlaceholder: 'AIza...' },
  { id: 'openai', label: 'OpenAI', keyPlaceholder: 'sk-...' },
  { id: 'openrouter', label: 'OpenRouter', keyPlaceholder: 'sk-or-v1-...' },
  { id: 'anthropic', label: 'Anthropic', keyPlaceholder: 'sk-ant-...' },
];

interface AnalysisResult {
  score: number;
  keywordsFound: string[];
  missingKeywords: string[];
  criticalFixes: string[];
}

function providerLabelForId(id?: string): string {
  if (!id) return 'Unknown provider';
  return PROVIDERS.find((p) => p.id === id)?.label ?? id;
}

function historyItemToResult(row: AtsHistoryItem): AnalysisResult {
  const fixes = row.feedback?.length ? row.feedback : row.criticalFixes ?? [];
  return {
    score: row.overallScore ?? 0,
    keywordsFound: row.matchedKeywords ?? [],
    missingKeywords: row.missingKeywords ?? [],
    criticalFixes: fixes,
  };
}

/** Score ring + meta line + three keyword/fixes columns (shared by live run and history preview). */
function AtsResultDetailView({
  result,
  metaParagraph,
}: {
  result: AnalysisResult;
  metaParagraph: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center gap-10 mb-10">
        <div className="flex justify-center lg:justify-start">
          <div className="relative h-36 w-36">
            <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120" aria-hidden>
              <circle
                cx="60"
                cy="60"
                r={RING_RADIUS}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={RING_RADIUS}
                fill="none"
                stroke={PRIMARY}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={RING_CIRC * (1 - result.score / 100)}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{result.score}</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Match</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600 leading-relaxed max-w-xl">{metaParagraph}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/80">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Keywords found
          </h3>
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {result.keywordsFound.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No matches listed — try a longer job description.</p>
            ) : (
              result.keywordsFound.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center rounded-full bg-green-50 text-green-800 border border-green-200 px-2.5 py-1 text-xs font-medium"
                >
                  {k}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/80">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Missing keywords
          </h3>
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {result.missingKeywords.length === 0 ? (
              <p className="text-xs text-gray-500 italic">None flagged — nice alignment with the JD.</p>
            ) : (
              result.missingKeywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center rounded-full bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 text-xs font-medium"
                >
                  {k}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/80 md:col-span-1">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF6B00]" />
            Critical fixes
          </h3>
          <ul className="space-y-2 min-h-[2rem]">
            {result.criticalFixes.length === 0 ? (
              <li className="text-xs text-gray-500 italic">No extra suggestions from this run.</li>
            ) : (
              result.criticalFixes.map((fix) => (
                <li key={fix}>
                  <span className="inline-block rounded-lg bg-orange-50 text-orange-900 border border-orange-200 px-2.5 py-1.5 text-xs font-medium leading-snug">
                    {fix}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export interface ATSScorerProps {
  onBack?: () => void;
}

const ATSScorer: React.FC<ATSScorerProps> = ({ onBack }) => {
  const [provider, setProvider] = useState<AtsProvider>('gemini');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useSavedKey, setUseSavedKey] = useState(false);
  const [savedKeysByProvider, setSavedKeysByProvider] = useState<Record<AtsProvider, boolean>>({
    gemini: false,
    openai: false,
    openrouter: false,
    anthropic: false,
  });
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveKeyMessage, setSaveKeyMessage] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<AtsHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AtsHistoryItem | null>(null);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const historyPreviewRef = useRef<HTMLElement>(null);
  const { userId } = useAuth();
  const providerLabel = PROVIDERS.find((p) => p.id === provider)?.label || provider;
  const hasSavedProviderKey = savedKeysByProvider[provider];

  const keyReady =
    Boolean(apiKey.trim()) || Boolean(useSavedKey && hasSavedProviderKey && userId);
  const steps = useMemo(
    () => [
      { id: 'resume', label: 'Resume', done: Boolean(resumeFile) },
      { id: 'jd', label: 'Job description', done: jobDescription.trim().length > 0 },
      { id: 'key', label: 'API key', done: keyReady },
    ],
    [resumeFile, jobDescription, keyReady]
  );

  useEffect(() => {
    try {
      const storedProvider = localStorage.getItem(SELECTED_PROVIDER_STORAGE) as AtsProvider | null;
      const activeProvider = storedProvider && PROVIDERS.some((p) => p.id === storedProvider) ? storedProvider : 'gemini';
      setProvider(activeProvider);
      const stored =
        localStorage.getItem(`${API_KEY_STORAGE_PREFIX}${activeProvider}`) ||
        (activeProvider === 'gemini'
          ? localStorage.getItem(API_KEY_STORAGE) || localStorage.getItem(LEGACY_API_KEY_STORAGE)
          : null);
      if (stored) setApiKey(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    getLlmKeysStatus(userId)
      .then((status) => {
        setSavedKeysByProvider({
          openai: !!status.hasOpenAiKey,
          openrouter: !!status.hasOpenrouterKey,
          gemini: !!status.hasGeminiKey,
          anthropic: !!status.hasClaudeKey,
        });
      })
      .catch(() => {
        /* ignore */
      });
  }, [userId]);

  const refreshHistory = useCallback(() => {
    if (!userId) return;
    setHistoryLoading(true);
    getAtsScoreHistory(userId, 20)
      .then((h) => {
        if (h.success && h.items?.length) setHistoryItems(h.items);
        else if (h.success) setHistoryItems([]);
      })
      .catch(() => setHistoryItems([]))
      .finally(() => setHistoryLoading(false));
  }, [userId]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    if (!selectedHistoryItem) return;
    requestAnimationFrame(() => {
      historyPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [selectedHistoryItem]);

  useEffect(() => {
    setSelectedHistoryItem((prev) =>
      prev && !historyItems.some((h) => h.reportId === prev.reportId) ? null : prev
    );
  }, [historyItems]);

  useEffect(() => {
    try {
      localStorage.setItem(SELECTED_PROVIDER_STORAGE, provider);
      const stored = localStorage.getItem(`${API_KEY_STORAGE_PREFIX}${provider}`);
      if (stored) {
        setApiKey(stored);
        return;
      }
      if (provider === 'gemini') {
        const legacy = localStorage.getItem(API_KEY_STORAGE) || localStorage.getItem(LEGACY_API_KEY_STORAGE);
        setApiKey(legacy || '');
        return;
      }
      setApiKey('');
    } catch {
      setApiKey('');
    }
  }, [provider]);

  const persistApiKey = useCallback((value: string) => {
    setApiKey(value);
    try {
      const scopedKey = `${API_KEY_STORAGE_PREFIX}${provider}`;
      if (value.trim()) localStorage.setItem(scopedKey, value);
      else localStorage.removeItem(scopedKey);
      if (provider === 'gemini') {
        if (value.trim()) localStorage.setItem(API_KEY_STORAGE, value);
        else localStorage.removeItem(API_KEY_STORAGE);
      }
    } catch {
      /* ignore */
    }
  }, [provider]);

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    const ok =
      file.type === 'application/pdf' ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx');
    if (ok) {
      setFileHint(null);
      setResumeFile(file);
    } else {
      setFileHint('Please upload a PDF or DOCX file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    acceptFile(f);
  };

  const handleAnalyze = async () => {
    const usingSavedKey = useSavedKey && hasSavedProviderKey && !!userId;
    if (!resumeFile || !jobDescription.trim() || (!usingSavedKey && !apiKey.trim())) return;
    setErrorMessage(null);
    setSaveKeyMessage(null);
    setIsAnalyzing(true);
    setHasAnalyzed(false);
    setResult(null);
    try {
      const out = await analyzeAtsWithProvider({
        provider,
        ...(userId ? { userId } : {}),
        ...(!usingSavedKey ? { apiKey: apiKey.trim() } : {}),
        jobDescription: jobDescription.trim(),
        resumeFile,
      });
      if (!out.success || !out.atsResult) {
        setErrorMessage(out.message || 'Could not analyze resume. Check your API key and try again.');
        return;
      }
      const ar = out.atsResult;
      setResult({
        score: ar.overallScore,
        keywordsFound: ar.matchedKeywords ?? [],
        missingKeywords: ar.missingKeywords ?? [],
        criticalFixes: ar.feedback ?? [],
      });
      setHasAnalyzed(true);
      setSelectedHistoryItem(null);
      if (userId) refreshHistory();
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Network error. Try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveKey = async () => {
    if (!userId || !apiKey.trim()) return;
    setErrorMessage(null);
    setSaveKeyMessage(null);
    setIsSavingKey(true);
    try {
      const out = await saveLlmApiKeyForProvider({
        userId,
        provider,
        apiKey: apiKey.trim(),
      });
      if (!out.success) {
        setErrorMessage(out.message || 'Could not save API key.');
        return;
      }
      setSavedKeysByProvider((prev) => ({ ...prev, [provider]: true }));
      setSaveKeyMessage(`${providerLabel} API key saved to your account.`);
    } catch {
      setErrorMessage('Failed to save API key. Please try again.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const canAnalyze = Boolean(
    resumeFile &&
      jobDescription.trim() &&
      ((useSavedKey && hasSavedProviderKey && userId) || apiKey.trim())
  );

  const scrollToForm = useCallback(() => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="min-h-full bg-gray-50/80 rounded-2xl border border-gray-200/80 p-5 sm:p-6 md:p-8 shadow-sm">
      <div className="max-w-6xl mx-auto">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-5 sm:mb-6 text-sm font-medium text-[#FF6B00] hover:opacity-90 transition-opacity rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/35 focus-visible:ring-offset-2"
        >
          ← Back
        </button>
      )}

      <header className="mb-6 sm:mb-8 max-w-3xl border-l-4 border-[#FF6B00] pl-4 sm:pl-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#FF6B00] mb-3">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Career tools
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          ATS Resume Scorer
        </h1>
        <p className="mt-2 text-gray-600 text-sm sm:text-base leading-relaxed">
          Upload your resume, paste a job description, pick an LLM, and get a keyword and fit preview.
        </p>
      </header>

      <nav
        aria-label="Analysis steps"
        className="mb-6 sm:mb-8 flex flex-wrap items-center gap-1 rounded-2xl border border-gray-200/90 bg-white px-3 py-3 text-xs font-medium text-gray-600 shadow-sm"
      >
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 ${
                s.done ? 'text-gray-900 bg-orange-50/80' : 'text-gray-500'
              }`}
            >
              {s.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden />
              ) : (
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-400">
                  {i + 1}
                </span>
              )}
              {s.label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {!userId && (
        <div
          className="mb-6 rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 flex gap-3 items-start"
          role="status"
        >
          <Info className="h-5 w-5 shrink-0 text-sky-600 mt-0.5" aria-hidden />
          <div>
            <p className="font-medium text-sky-900">Sign in to save history</p>
            <p className="text-xs text-sky-800/90 mt-1 leading-relaxed">
              You can still run a score with your own API key. When logged in, we store past runs so you can reopen
              them anytime.
            </p>
          </div>
        </div>
      )}

      <div ref={formTopRef} className="scroll-mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 sm:mb-8">
        {/* Resume upload */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-[11px] font-bold text-[#FF6B00]">
              1
            </span>
            Resume
          </label>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 min-h-[220px] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-6 sm:p-8 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/35 focus-visible:ring-offset-2
              ${
                isDragging
                  ? 'border-[#FF6B00] bg-orange-50/70 scale-[1.01]'
                  : 'border-gray-200 bg-white hover:border-orange-300/90 hover:bg-orange-50/25'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            {resumeFile ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-gray-900">File uploaded</p>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 w-full justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {resumeFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setResumeFile(null);
                    }}
                    className="p-1 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                  <Upload className="h-7 w-7 text-[#FF6B00]" aria-hidden />
                </div>
                <p className="text-sm font-medium text-gray-800">
                  Drag & drop your resume here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF or DOCX · max typical ATS-friendly size
                </p>
              </>
            )}
          </div>
          {fileHint && (
            <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="status">
              {fileHint}
            </p>
          )}
        </div>

        {/* Job description */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor="ats-job-description"
              className="text-sm font-semibold text-gray-800 flex items-center gap-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-[11px] font-bold text-[#FF6B00]">
                2
              </span>
              Job description
            </label>
            <span className="text-xs text-gray-400 tabular-nums">
              {jobDescription.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            id="ats-job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here. Include responsibilities, required skills, and qualifications for the best match preview."
            rows={10}
            className="flex-1 min-h-[220px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] resize-y transition-shadow shadow-sm"
          />
        </div>
      </div>

      {/* Provider and API key */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6 sm:mb-8">
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 bg-gradient-to-r from-orange-50/60 via-white to-white">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-orange-100 text-[11px] font-bold text-[#FF6B00] shadow-sm">
              3
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Model &amp; API key</h2>
              <p className="text-xs text-gray-500 mt-0.5">Choose provider, then paste a key or use one saved on your account</p>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-5 flex flex-col gap-4">
        {userId && (
          <div className="rounded-lg bg-gray-50/80 border border-gray-100 px-3 py-2.5">
            <label className="inline-flex items-start gap-2.5 text-sm text-gray-800 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]/30"
                checked={useSavedKey}
                onChange={(e) => setUseSavedKey(e.target.checked)}
                disabled={!hasSavedProviderKey}
              />
              <span>
                <span className="font-medium">Use saved {providerLabel} key</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {hasSavedProviderKey
                    ? 'Key is stored on your account. Uncheck to paste a different key for this session.'
                    : 'Save a key below or in Settings to enable this.'}
                </span>
              </span>
            </label>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="sm:w-48 lg:w-52 shrink-0">
            <label htmlFor="ats-provider" className="text-sm font-semibold text-gray-800 mb-2 block">
              LLM provider
            </label>
            <div className="flex flex-col gap-1.5">
              <select
                id="ats-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as AtsProvider)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] bg-white shadow-sm"
              >
                {PROVIDERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {hasSavedProviderKey && (
                <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                  Saved key on file for this provider
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="ats-api-key" className="text-sm font-semibold text-gray-800">
                API key
              </label>
              <div className="relative group inline-flex">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/40 rounded"
                  aria-label="API keys stay in this browser unless you save"
                >
                  <Info className="h-4 w-4" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[min(280px,calc(100vw-2rem))] px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-[11px] leading-snug font-medium shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-20 pointer-events-none text-center">
                  Typed keys stay in this browser unless you save.
                  <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-8 border-transparent border-t-gray-900" />
                </div>
              </div>
            </div>
            <input
              id="ats-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => persistApiKey(e.target.value)}
              placeholder={PROVIDERS.find((p) => p.id === provider)?.keyPlaceholder || ''}
              disabled={Boolean(useSavedKey && hasSavedProviderKey && userId)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] font-mono shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-3 pt-4 border-t border-gray-100">
          {userId && (
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!apiKey.trim() || isSavingKey}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border border-gray-200 text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {isSavingKey ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              Save key
            </button>
          )}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            className="w-full sm:w-auto sm:min-w-[220px] inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:brightness-105 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6B00]/50"
            style={{ backgroundColor: PRIMARY }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden />
                Analyze compatibility
              </>
            )}
          </button>
        </div>
        </div>
      </div>

      {saveKeyMessage && (
        <div
          className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start justify-between gap-3"
          role="status"
        >
          <span>{saveKeyMessage}</span>
          <button
            type="button"
            onClick={() => setSaveKeyMessage(null)}
            className="shrink-0 text-green-700/80 hover:text-green-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div
          className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-8 shadow-sm overflow-hidden"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-sm font-medium text-gray-800 mb-6 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#FF6B00] shrink-0" aria-hidden />
            Comparing your resume to the job description… This usually takes a few seconds.
          </p>
          <div className="animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="h-36 w-36 rounded-full bg-gray-200 mx-auto md:mx-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {hasAnalyzed && result && !isAnalyzing && (
        <section
          ref={resultsRef}
          tabIndex={-1}
          className="rounded-2xl border border-gray-200 bg-white shadow-md scroll-mt-6 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/25 focus-visible:ring-offset-2 overflow-hidden"
          aria-labelledby="ats-match-overview-heading"
        >
          <div className="h-1 bg-gradient-to-r from-[#FF6B00] via-orange-400 to-amber-300" aria-hidden />
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 id="ats-match-overview-heading" className="text-lg font-bold text-gray-900">
                Match overview
              </h2>
              {(() => {
                const band = scoreBand(result.score);
                return (
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${band.className}`}
                  >
                    {band.label}
                  </span>
                );
              })()}
            </div>
            <AtsResultDetailView
              result={result}
              metaParagraph={
                <>
                  Scored with <strong className="text-gray-800">{providerLabel}</strong> using your resume text and
                  the job description you provided. Treat this as guidance, not a guarantee of employer ATS behavior.
                </>
              }
            />
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-gray-500">Want to try another job or resume? Update the fields above and run again.</p>
              <button
                type="button"
                onClick={scrollToForm}
                className="text-sm font-semibold text-[#FF6B00] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/30 rounded"
              >
                Jump to inputs
              </button>
            </div>
          </div>
        </section>
      )}

      {userId && (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm mt-8 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-gray-200 via-orange-100 to-[#FF6B00]/40" aria-hidden />
          <div className="p-5 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
                <History className="h-5 w-5 shrink-0" aria-hidden />
              </span>
              Your ATS history
            </h2>
            <button
              type="button"
              onClick={refreshHistory}
              disabled={historyLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#FF6B00] hover:bg-orange-50/50 disabled:opacity-50 transition-colors"
            >
              {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {historyLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-5 max-w-2xl">
            Each run is saved automatically. <strong className="font-medium text-gray-800">Click a row</strong> to
            expand the same match view you see after analyzing. Use the resume column to download the file.
          </p>
          {historyLoading && historyItems.length === 0 ? (
            <div className="rounded-xl border border-gray-100 overflow-hidden" aria-busy="true" aria-label="Loading history">
              <div className="h-11 bg-gray-50 border-b border-gray-100 animate-pulse" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 border-b border-gray-100 bg-white flex items-center px-4 gap-4 animate-pulse">
                  <div className="h-4 w-4 rounded bg-gray-200 shrink-0" />
                  <div className="h-3 flex-1 max-w-[140px] bg-gray-100 rounded" />
                  <div className="h-3 w-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : historyItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gradient-to-b from-gray-50/80 to-white px-4 py-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00] mb-3">
                <History className="h-6 w-6 opacity-80" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-gray-800">No saved runs yet</p>
              <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Run compatibility above while logged in. Your scores, keywords, and resume links will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm max-h-[min(420px,55vh)] overflow-y-auto">
                <table className="min-w-full text-sm text-left">
                  <caption className="sr-only">Saved ATS analyses; select a row to view details</caption>
                  <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm text-gray-700 font-semibold border-b border-gray-200 shadow-sm">
                    <tr>
                      <th className="pl-3 pr-1 py-3 w-10" scope="col">
                        <span className="sr-only">View</span>
                      </th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Score</th>
                      <th className="px-3 py-3">Provider</th>
                      <th className="px-3 py-3">Missing keywords</th>
                      <th className="px-3 py-3">Resume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyItems.map((row, idx) => {
                      const selected = selectedHistoryItem?.reportId === row.reportId;
                      const stripe = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';
                      return (
                        <tr
                          key={row.reportId}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setSelectedHistoryItem((prev) => (prev?.reportId === row.reportId ? null : row))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedHistoryItem((prev) => (prev?.reportId === row.reportId ? null : row));
                            }
                          }}
                          className={`cursor-pointer transition-colors duration-150 ${stripe} ${
                            selected ? 'bg-orange-50/60 ring-1 ring-inset ring-orange-200/70' : 'hover:bg-orange-50/25'
                          }`}
                          title="Show full saved result"
                        >
                          <td className="pl-3 pr-1 py-2.5 w-10 text-center" aria-hidden>
                            <Eye
                              className={`h-4 w-4 mx-auto ${selected ? 'text-[#FF6B00]' : 'text-gray-300'}`}
                              strokeWidth={2}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-gray-800 whitespace-nowrap text-xs sm:text-sm">
                            {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.overallScore != null ? (
                              <span className="inline-flex min-w-[2.25rem] justify-center rounded-md bg-orange-50 text-[#FF6B00] border border-orange-200 px-2 py-0.5 text-xs font-bold tabular-nums">
                                {row.overallScore}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 capitalize text-xs sm:text-sm">
                            {row.provider ?? '—'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600 max-w-xs text-xs">
                            {(row.missingKeywords ?? []).slice(0, 5).join(', ')}
                            {(row.missingKeywords?.length ?? 0) > 5 ? '…' : ''}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600 max-w-[200px] text-xs">
                            {row.resumeDownloadUrl ? (
                              <a
                                href={row.resumeDownloadUrl}
                                rel="noopener noreferrer"
                                download={row.resumeFileName || 'resume'}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium text-[#FF6B00] hover:underline truncate inline-block max-w-full"
                                title="Download resume (link expires after a while — refresh history if it stops working)"
                              >
                                {row.resumeFileName || 'Download'}
                              </a>
                            ) : row.resume || row.resumeFileUrl || row.resumeS3Key ? (
                              <span
                                className="text-gray-500 truncate block max-w-full"
                                title="File is in S3 but no download link yet. Click Refresh, or ensure Settings Lambda has s3:GetObject on this bucket."
                              >
                                {row.resumeFileName ?? 'Saved'}
                                <span className="block text-[10px] text-gray-400 mt-0.5">Refresh for link</span>
                              </span>
                            ) : (
                              <span className="truncate block max-w-full" title={row.resumeFileName}>
                                {row.resumeFileName ?? '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedHistoryItem && (
                <section
                  ref={historyPreviewRef}
                  tabIndex={-1}
                  className="rounded-2xl border border-gray-200 bg-white shadow-md mt-6 scroll-mt-6 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/25 focus-visible:ring-offset-2 overflow-hidden"
                  aria-labelledby="ats-history-preview-heading"
                >
                  <div className="h-1 bg-gradient-to-r from-[#FF6B00]/70 via-orange-300 to-amber-200" aria-hidden />
                  <div className="p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                      <h2 id="ats-history-preview-heading" className="text-lg font-bold text-gray-900">
                        Saved run
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedHistoryItem.createdAt
                          ? new Date(selectedHistoryItem.createdAt).toLocaleString()
                          : ''}
                        {selectedHistoryItem.resumeFileName ? (
                          <>
                            {' · '}
                            <span className="text-gray-600">{selectedHistoryItem.resumeFileName}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {(() => {
                        const band = scoreBand(historyItemToResult(selectedHistoryItem).score);
                        return (
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${band.className}`}
                          >
                            {band.label}
                          </span>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryItem(null)}
                        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  {selectedHistoryItem.jobDescriptionPreview?.trim() ? (
                    <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Job description (preview)</span>
                      <p className="mt-1 leading-relaxed whitespace-pre-wrap">
                        {selectedHistoryItem.jobDescriptionPreview}
                      </p>
                    </div>
                  ) : null}
                  <AtsResultDetailView
                    result={historyItemToResult(selectedHistoryItem)}
                    metaParagraph={
                      <>
                        Saved result from <strong className="text-gray-800">
                          {providerLabelForId(selectedHistoryItem.provider)}
                        </strong>
                        . Only the data stored with this run is shown (scores and lists may differ slightly from a
                        fresh analysis).
                      </>
                    }
                  />
                  </div>
                </section>
              )}
            </>
          )}
          </div>
        </section>
      )}
      </div>
    </div>
  );
};

export default ATSScorer;
