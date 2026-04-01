import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
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
const PROVIDERS: Array<{ id: AtsProvider; label: string; keyPlaceholder: string }> = [
  { id: 'gemini', label: 'Google Gemini', keyPlaceholder: 'AIza...' },
  { id: 'openai', label: 'OpenAI', keyPlaceholder: 'sk-...' },
  { id: 'openrouter', label: 'OpenRouter', keyPlaceholder: 'sk-or-v1-...' },
  { id: 'anthropic', label: 'Anthropic', keyPlaceholder: 'sk-ant-...' },
];

export interface ATSScorerProps {
  onBack?: () => void;
}

interface AnalysisResult {
  score: number;
  keywordsFound: string[];
  missingKeywords: string[];
  criticalFixes: string[];
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();
  const providerLabel = PROVIDERS.find((p) => p.id === provider)?.label || provider;
  const hasSavedProviderKey = savedKeysByProvider[provider];

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
    if (ok) setResumeFile(file);
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
        ...(usingSavedKey ? { userId } : { apiKey: apiKey.trim() }),
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
      if (userId) refreshHistory();
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

  return (
    <div className="min-h-full bg-gray-50/80 rounded-2xl border border-gray-200/80 p-6 md:p-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-medium text-[#FF6B00] hover:opacity-90 transition-opacity"
        >
          ← Back
        </button>
      )}

      <header className="mb-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#FF6B00] mb-3">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Career tools
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          ATS Resume Scorer
        </h1>
        <p className="mt-2 text-gray-600 text-base leading-relaxed">
          Upload your resume, paste a job description, choose your LLM provider, and analyze ATS compatibility.
          You can use an instant API key entry or a key saved in your account settings (DynamoDB-backed).
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
        {/* Resume upload */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-800 mb-2">
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
            className={`flex-1 min-h-[220px] rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center
              ${
                isDragging
                  ? 'border-[#FF6B00] bg-orange-50/60'
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
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
        </div>

        {/* Job description */}
        <div className="flex flex-col min-h-0">
          <label
            htmlFor="ats-job-description"
            className="text-sm font-semibold text-gray-800 mb-2"
          >
            Job description
          </label>
          <textarea
            id="ats-job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here. Include responsibilities, required skills, and qualifications for the best match preview."
            rows={10}
            className="flex-1 min-h-[220px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] resize-y transition-shadow"
          />
        </div>
      </div>

      {/* Provider and API key */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 mb-8 flex flex-col gap-4">
        {userId && (
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]/30"
              checked={useSavedKey}
              onChange={(e) => setUseSavedKey(e.target.checked)}
              disabled={!hasSavedProviderKey}
            />
            Use saved {providerLabel} key from account
            {!hasSavedProviderKey && <span className="text-xs text-gray-500">(no saved key for this provider)</span>}
          </label>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="sm:w-52">
          <label htmlFor="ats-provider" className="text-sm font-semibold text-gray-800 mb-2 block">
            LLM provider
          </label>
          <select
            id="ats-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AtsProvider)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] bg-white"
          >
            {PROVIDERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
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
                aria-label="About API key storage"
              >
                <Info className="h-4 w-4" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-20 pointer-events-none">
                Saved in this browser (localStorage) for convenience. Each analysis sends it over HTTPS
                to the ATS Lambda only for the selected provider; we do not write it to our database.
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
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] font-mono"
          />
        </div>
        {userId && (
          <button
            type="button"
            onClick={handleSaveKey}
            disabled={!apiKey.trim() || isSavingKey}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border border-gray-200 text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {isSavingKey ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            Save key
          </button>
        )}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:brightness-105 active:scale-[0.98]"
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

      {saveKeyMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {saveKeyMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      {/* Loading skeleton */}
      {isAnalyzing && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 mb-8 animate-pulse">
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
      )}

      {/* Results */}
      {hasAnalyzed && result && !isAnalyzing && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Match overview</h2>
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
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Match
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
              Scored with <strong className="text-gray-800">{providerLabel}</strong> using
              your resume text and the job description you provided. Treat this as guidance,
              not a guarantee of employer ATS behavior.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Keywords found
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.keywordsFound.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center rounded-full bg-green-50 text-green-800 border border-green-200 px-2.5 py-1 text-xs font-medium"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Missing keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center rounded-full bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 text-xs font-medium"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 md:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF6B00]" />
                Critical fixes
              </h3>
              <ul className="space-y-2">
                {result.criticalFixes.map((fix) => (
                  <li key={fix}>
                    <span className="inline-block rounded-lg bg-orange-50 text-orange-900 border border-orange-200 px-2.5 py-1.5 text-xs font-medium leading-snug">
                      {fix}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {userId && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your ATS history</h2>
            <button
              type="button"
              onClick={refreshHistory}
              disabled={historyLoading}
              className="text-sm font-medium text-[#FF6B00] hover:opacity-90 disabled:opacity-50"
            >
              {historyLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Recent scores are saved when you&apos;re signed in (server-side). Compare match scores over time.
          </p>
          {historyItems.length === 0 && !historyLoading ? (
            <p className="text-sm text-gray-500">No saved runs yet. Run an analysis while logged in.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border border-gray-100 rounded-lg">
                <thead className="bg-gray-50 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Provider</th>
                    <th className="px-3 py-2">Missing keywords</th>
                    <th className="px-3 py-2">Resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyItems.map((row) => (
                    <tr key={row.reportId} className="bg-white">
                      <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{row.overallScore ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700 capitalize">{row.provider ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-xs">
                        {(row.missingKeywords ?? []).slice(0, 5).join(', ')}
                        {(row.missingKeywords?.length ?? 0) > 5 ? '…' : ''}
                      </td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[140px]" title={row.resumeFileName}>
                        {row.resumeFileName ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ATSScorer;
