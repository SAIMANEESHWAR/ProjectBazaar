import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  History,
  Info,
  Loader2,
  Printer,
  Save,
  Sparkles,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { useAuth } from '../App';
import {
  analyzeAtsWithProvider,
  coerceMissingKeywordDetails,
  fixResumeWithProvider,
  getAtsScoreHistory,
  getLlmKeysStatus,
  saveLlmApiKeyForProvider,
  type AtsHistoryItem,
  type AtsProvider,
  type FixResumeResult,
  type MissingKeywordItem,
} from '../services/atsService';
import { mapImprovedResumeToResumeInfo } from '../services/improvedResumeMapper';
import { highlightAddedKeywords } from '../utils/highlightAddedKeywords';
import FixResumeTemplatePreview from './fix-resume/FixResumeTemplatePreview';
import { ResumePreviewTemplateView, type ResumePreviewData } from './fix-resume/ResumePreviewTemplateView';

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
  missingKeywordDetails: MissingKeywordItem[];
  criticalFixes: string[];
}

function providerLabelForId(id?: string): string {
  if (!id) return 'Unknown provider';
  return PROVIDERS.find((p) => p.id === id)?.label ?? id;
}

function historyItemToResult(row: AtsHistoryItem): AnalysisResult {
  const fixes = row.feedback?.length ? row.feedback : row.criticalFixes ?? [];
  const missingKeywordDetails = coerceMissingKeywordDetails({
    missingKeywords: row.missingKeywords,
    missingKeywordDetails: row.missingKeywordDetails,
  });
  return {
    score: row.overallScore ?? 0,
    keywordsFound: row.matchedKeywords ?? [],
    missingKeywords: missingKeywordDetails.map((m) => m.keyword),
    missingKeywordDetails,
    criticalFixes: fixes,
  };
}

/** Plain-text preview with added ATS keywords highlighted (case-insensitive). */
function FixResumePreview({
  text,
  addedKeywords,
}: {
  text: string;
  addedKeywords: string[];
}) {
  const nodes = useMemo(() => {
    if (!text) return null;
    return (
      <span className="inline">
        {highlightAddedKeywords(text, addedKeywords, 'bg-amber-100 text-amber-950 rounded px-0.5')}
      </span>
    );
  }, [text, addedKeywords]);

  return (
    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed bg-gray-50/80 border border-gray-100 rounded-xl p-4 max-h-[min(420px,55vh)] overflow-y-auto">
      {nodes}
    </pre>
  );
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
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8 mb-8">
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
        <div className="text-xs sm:text-sm text-gray-600 leading-snug max-w-md">{metaParagraph}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-50">
          <h3 className="text-xs font-bold text-gray-900 mb-2.5 flex items-center gap-2 uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Matched
          </h3>
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {result.keywordsFound.length === 0 ? (
              <p className="text-xs text-gray-500">Add more JD detail.</p>
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
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-50">
          <h3 className="text-xs font-bold text-gray-900 mb-2.5 flex items-center gap-2 uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Gaps
          </h3>
          <div className="flex flex-col gap-2 min-h-[2rem]">
            {result.missingKeywordDetails.length === 0 ? (
              <p className="text-xs text-gray-500">None.</p>
            ) : (
              result.missingKeywordDetails.map((m) => (
                <div
                  key={m.keyword}
                  className="rounded-lg border border-red-200 bg-red-50/90 px-2.5 py-1.5 text-xs text-red-900"
                >
                  <span className="font-semibold">{m.keyword}</span>
                  {m.suggestedSection.length > 0 ? (
                    <p className="mt-0.5 text-[10px] font-medium text-red-800/85">
                      {m.suggestedSection.join(' · ')}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-50 md:col-span-1">
          <h3 className="text-xs font-bold text-gray-900 mb-2.5 flex items-center gap-2 uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-[#FF6B00]" />
            Tips
          </h3>
          <ul className="space-y-2 min-h-[2rem]">
            {result.criticalFixes.length === 0 ? (
              <li className="text-xs text-gray-500">—</li>
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
  /** Fix My Resume: loading, errors, and Lambda response (preview + PDF). */
  const [fixLoading, setFixLoading] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const [fixOutcome, setFixOutcome] = useState<FixResumeResult | null>(null);
  const [fixUseLlmPolish, setFixUseLlmPolish] = useState(false);
  const [fixUseAiMapFields, setFixUseAiMapFields] = useState(true);
  const [fixRenderApiKey, setFixRenderApiKey] = useState('');
  const fixHtmlFrameRef = useRef<HTMLIFrameElement>(null);
  const fixResumeTemplateRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const historyPreviewRef = useRef<HTMLElement>(null);
  const { userId } = useAuth();
  const providerLabel = PROVIDERS.find((p) => p.id === provider)?.label || provider;
  const hasSavedProviderKey = savedKeysByProvider[provider];

  const keyReady =
    Boolean(apiKey.trim()) || Boolean(useSavedKey && hasSavedProviderKey && userId);
  const usingSavedKeyForAts = Boolean(useSavedKey && hasSavedProviderKey && userId);
  const fixLlmPolishAllowed = Boolean(apiKey.trim()) && !usingSavedKeyForAts;
  const fixAiMapAllowed = Boolean((userId && hasSavedProviderKey) || fixRenderApiKey.trim());

  const fixedResumeInfoForPreview = useMemo(() => {
    if (!fixOutcome?.success || !fixOutcome.improvedResume || typeof fixOutcome.improvedResume !== 'object') {
      return null;
    }
    try {
      return mapImprovedResumeToResumeInfo(fixOutcome.improvedResume as Record<string, unknown>);
    } catch {
      return null;
    }
  }, [fixOutcome]);

  const steps = useMemo(
    () => [
      { id: 'resume', label: 'Resume', done: Boolean(resumeFile) },
      { id: 'jd', label: 'Job', done: jobDescription.trim().length > 0 },
      { id: 'key', label: 'Key', done: keyReady },
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
    setFixError(null);
    setFixOutcome(null);
    setFixUseLlmPolish(false);
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
      const missingKeywordDetails = coerceMissingKeywordDetails(ar);
      setResult({
        score: ar.overallScore,
        keywordsFound: ar.matchedKeywords ?? [],
        missingKeywords: missingKeywordDetails.map((m) => m.keyword),
        missingKeywordDetails,
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
      setSaveKeyMessage(`${providerLabel} key saved.`);
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

  const handleFixResume = async () => {
    if (!resumeFile || !result?.missingKeywords?.length) return;
    setFixError(null);
    setFixLoading(true);
    // Fix server loads saved keys from DynamoDB only when it has AWS access (works on deployed Lambda).
    // Locally, merge the main BYOK field so a key still in the input works without DynamoDB on Python.
    const fixApiKeyForRequest = fixRenderApiKey.trim() || apiKey.trim();
    try {
      const out = await fixResumeWithProvider({
        resumeFile,
        missingKeywords: result.missingKeywords,
        ...(userId ? { userId } : {}),
        useLlmRenderResumeJson: fixAiMapAllowed && fixUseAiMapFields,
        useLlmRenderHtml: false,
        useLlmMapFields: fixAiMapAllowed && fixUseAiMapFields,
        provider,
        ...(fixApiKeyForRequest ? { apiKey: fixApiKeyForRequest } : {}),
        useLlmEnhance: fixLlmPolishAllowed && fixUseLlmPolish,
        ...(fixLlmPolishAllowed && fixUseLlmPolish && apiKey.trim()
          ? { provider, apiKey: apiKey.trim() }
          : {}),
      });
      if (!out.success) {
        setFixError(out.message || 'Could not improve resume.');
        return;
      }
      setFixOutcome(out);
    } catch (e) {
      setFixError(e instanceof Error ? e.message : 'Network error. Try again.');
    } finally {
      setFixLoading(false);
    }
  };

  const printRenderedHtml = () => {
    const html = fixOutcome?.renderedHtml;
    if (!html) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Strip preview highlights for print output.
    try {
      w.document.querySelectorAll('mark.garamond-injected-kw').forEach((m) => {
        const t = w.document.createTextNode(m.textContent ?? '');
        m.replaceWith(t);
      });
    } catch {
      /* ignore */
    }
    setTimeout(() => w.print(), 450);
  };

  const printResumeTemplate = () => {
    const root = fixResumeTemplateRef.current;
    if (!root) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const clone = root.cloneNode(true) as HTMLElement;
    // Remove highlights for print output.
    clone.querySelectorAll('mark.garamond-injected-kw').forEach((m) => {
      const t = w.document.createTextNode(m.textContent ?? '');
      m.replaceWith(t);
    });
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Fixed resume</title></head><body>${clone.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 450);
  };

  const downloadFixedPdf = () => {
    if (!fixOutcome) return;
    const name = fixOutcome.pdfFileName || 'fixed-resume.pdf';
    if (fixOutcome.pdfBase64) {
      try {
        const bin = atob(fixOutcome.pdfBase64);
        const len = bin.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
        const blob = new Blob([u8], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.rel = 'noopener';
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        setFixError('Could not build PDF download in the browser.');
      }
      return;
    }
    if (fixOutcome.pdfUrl) {
      window.open(fixOutcome.pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const scrollToForm = useCallback(() => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="min-h-full bg-white rounded-xl border border-gray-100 p-4 sm:p-6 md:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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

      <header className="mb-5 sm:mb-7 max-w-2xl border-l-[3px] border-[#FF6B00] pl-3 sm:pl-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#FF6B00] mb-2">
          <Sparkles className="h-3 w-3" aria-hidden />
          Tools
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Resume match
        </h1>
        <p className="mt-1.5 text-gray-500 text-xs sm:text-sm leading-snug">
          Résumé + job posting → fit score and keyword gaps.
        </p>
      </header>

      <nav
        aria-label="Analysis steps"
        className="mb-5 sm:mb-7 flex flex-wrap items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/50 px-2.5 py-2 text-[11px] font-medium text-gray-600"
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
          className="mb-5 rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-xs text-sky-950 flex gap-2.5 items-start"
          role="status"
        >
          <Info className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" aria-hidden />
          <p className="text-sky-900 leading-snug">
            <span className="font-semibold">Sign in</span> to save runs. BYOK still works here.
          </p>
        </div>
      )}

      <div ref={formTopRef} className="scroll-mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 mb-5 sm:mb-7">
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
                <p className="text-[11px] text-gray-400 mt-1">PDF or DOCX</p>
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
              Job posting
            </label>
            <span className="text-xs text-gray-400 tabular-nums">
              {jobDescription.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            id="ats-job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description (role, skills, requirements)."
            rows={10}
            className="flex-1 min-h-[220px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] resize-y transition-shadow shadow-sm"
          />
        </div>
      </div>

      {/* Provider and API key */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-5 sm:mb-7">
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-gray-100 bg-orange-50/40">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-orange-100/80 text-[11px] font-bold text-[#FF6B00]">
              3
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Model &amp; key</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Saved key or paste below</p>
            </div>
          </div>
        </div>
        <div className="p-3.5 md:p-4 flex flex-col gap-3.5">
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
                <span className="font-medium">Saved {providerLabel} key</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">
                  {hasSavedProviderKey ? 'Uncheck to paste another.' : 'Save below or in Settings.'}
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
                <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                  On file
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
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[min(240px,calc(100vw-2rem))] px-2 py-1 rounded-md bg-gray-900 text-white text-[10px] leading-snug font-medium shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-20 pointer-events-none text-center">
                  Stays in this browser until saved.
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
                Working…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden />
                Analyze
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
            OK
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
          className="rounded-xl border border-gray-100 bg-white p-5 md:p-6 mb-6 shadow-sm overflow-hidden"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-xs font-medium text-gray-700 mb-5 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#FF6B00] shrink-0" aria-hidden />
            Scoring… usually a few seconds.
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
          className="rounded-xl border border-gray-100 bg-white shadow-sm scroll-mt-6 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/25 focus-visible:ring-offset-2 overflow-hidden"
          aria-labelledby="ats-match-overview-heading"
        >
          <div className="h-1 bg-gradient-to-r from-[#FF6B00] via-orange-400 to-amber-300" aria-hidden />
          <div className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <h2 id="ats-match-overview-heading" className="text-base font-bold text-gray-900">
                Results
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
                <span className="text-gray-600">
                  Via <strong className="text-gray-800">{providerLabel}</strong>. Indicative only—not employer-specific.
                </span>
              }
            />

            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-orange-100 text-[#FF6B00] shadow-sm">
                    <Wand2 className="h-4 w-4 shrink-0" aria-hidden />
                  </span>
                  <h3 className="text-sm font-bold tracking-tight">Fix ur resume</h3>
                </div>

                <div className="flex flex-col gap-2.5">
                  {fixLlmPolishAllowed && (
                    <label
                      className="inline-flex items-center gap-2 cursor-pointer select-none"
                      title="One short LLM pass to smooth wording. OpenAI or OpenRouter only; off means no extra call."
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]/30"
                        checked={fixUseLlmPolish}
                        onChange={(e) => setFixUseLlmPolish(e.target.checked)}
                      />
                      <span className="text-xs font-medium text-gray-800">Polish</span>
                    </label>
                  )}

                  {fixAiMapAllowed && (
                    <>
                      <label
                        className="inline-flex items-center gap-2 cursor-pointer select-none"
                        title={`Uses your saved ${providerLabel} key, or the optional field below, to build the preview layout.`}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]/30"
                          checked={fixUseAiMapFields}
                          onChange={(e) => setFixUseAiMapFields(e.target.checked)}
                        />
                        <span className="text-xs font-medium text-gray-800">AI layout</span>
                      </label>
                      <input
                        value={fixRenderApiKey}
                        onChange={(e) => setFixRenderApiKey(e.target.value)}
                        aria-label={`Optional ${providerLabel} key for Fix only (e.g. local dev)`}
                        placeholder={provider === 'openrouter' ? 'Key (optional, Fix only)' : 'API key (optional)'}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full rounded-lg border border-gray-200/90 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/15 focus:border-gray-300"
                      />
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleFixResume}
                    disabled={
                      fixLoading ||
                      !resumeFile ||
                      !result.missingKeywords?.length
                    }
                    aria-label="Fix My Resume: apply gaps and show preview"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900/35"
                  >
                    {fixLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                        <span>Fixing…</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 shrink-0" aria-hidden />
                        Fix My Resume
                      </>
                    )}
                  </button>
                  {!result.missingKeywords?.length ? (
                    <span className="text-[11px] text-gray-400">No gaps.</span>
                  ) : null}
                </div>
              </div>

              {fixError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                >
                  {fixError}
                </div>
              )}

              {fixLoading && (
                <div
                  className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-500 flex items-center gap-2"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF6B00] shrink-0" aria-hidden />
                  Working…
                </div>
              )}

              {fixOutcome?.success &&
              !fixLoading &&
              fixOutcome.resumeData &&
              typeof fixOutcome.resumeData === 'object' ? (
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Preview</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Prefer <span className="font-medium text-gray-700">Download PDF</span> for ATS—the server PDF has
                        selectable text. Browser Print → Save as PDF can flatten the page to an image.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {(fixOutcome.pdfUrl || fixOutcome.pdfBase64) ? (
                        <button
                          type="button"
                          onClick={downloadFixedPdf}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Download PDF
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={printResumeTemplate}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        <Printer className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Print / PDF
                      </button>
                    </div>
                  </div>
                  {(fixOutcome.addedKeywords?.length ?? 0) > 0 ? (
                    <p className="text-[10px] text-gray-500">
                      <span className="text-gray-400">Terms · </span>
                      <span className="text-gray-700 font-medium">{(fixOutcome.addedKeywords ?? []).join(', ')}</span>
                    </p>
                  ) : null}
                  {fixOutcome.pdfNote && fixOutcome.pdfAvailable ? (
                    <p className="text-[11px] text-sky-900 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                      {fixOutcome.pdfNote}
                    </p>
                  ) : null}
                  {fixOutcome.pdfAvailable === false && fixOutcome.pdfError ? (
                    <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      PDF was not generated on the server ({fixOutcome.pdfError}).
                    </p>
                  ) : null}
                  <div
                    ref={fixResumeTemplateRef}
                    className="rounded-lg border border-gray-200 bg-white overflow-auto max-h-[min(560px,70vh)]"
                  >
                    <ResumePreviewTemplateView
                      data={fixOutcome.resumeData as unknown as ResumePreviewData}
                      highlightTerms={fixOutcome.addedKeywords ?? []}
                    />
                  </div>
                </div>
              ) : null}

              {fixOutcome?.success && !fixLoading && typeof fixOutcome.renderedHtml === 'string' && fixOutcome.renderedHtml.trim() ? (
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">Preview (HTML)</h4>
                    <button
                      type="button"
                      onClick={printRenderedHtml}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      <Printer className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Print / PDF
                    </button>
                  </div>
                  {(fixOutcome.addedKeywords?.length ?? 0) > 0 ? (
                    <p className="text-[10px] text-gray-500">
                      <span className="text-gray-400">Terms · </span>
                      <span className="text-gray-700 font-medium">{(fixOutcome.addedKeywords ?? []).join(', ')}</span>
                    </p>
                  ) : null}
                  <iframe
                    ref={fixHtmlFrameRef}
                    title="Fixed resume preview"
                    sandbox=""
                    className="w-full rounded-lg border border-gray-200 bg-white"
                    style={{ height: 560 }}
                    srcDoc={fixOutcome.renderedHtml}
                  />
                  <p className="text-[10px] text-gray-400">Print removes highlights.</p>
                </div>
              ) : null}

              {fixOutcome?.success &&
              !fixLoading &&
              !(typeof fixOutcome.renderedHtml === 'string' && fixOutcome.renderedHtml.trim()) &&
              fixedResumeInfoForPreview ? (
                <FixResumeTemplatePreview
                  key={(fixOutcome.addedKeywords ?? []).join('|')}
                  resumeInfo={fixedResumeInfoForPreview}
                  addedKeywords={fixOutcome.addedKeywords ?? []}
                  onDownloadServerPdf={
                    fixOutcome.pdfUrl || fixOutcome.pdfBase64 ? downloadFixedPdf : undefined
                  }
                  serverPdfAvailable={Boolean(fixOutcome.pdfUrl || fixOutcome.pdfBase64)}
                  pdfNote={fixOutcome.pdfNote ?? null}
                />
              ) : null}

              {fixOutcome?.success &&
              !fixLoading &&
              !(typeof fixOutcome.renderedHtml === 'string' && fixOutcome.renderedHtml.trim()) &&
              !fixedResumeInfoForPreview &&
              fixOutcome.previewText != null ? (
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">Plain text</h4>
                    {(fixOutcome.pdfUrl || fixOutcome.pdfBase64) && (
                      <button
                        type="button"
                        onClick={downloadFixedPdf}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Download PDF
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-900 bg-amber-50/90 border border-amber-100 rounded-md px-2.5 py-1.5">
                    Legacy response—text only. Update Fix service for full preview.
                  </p>
                  {(fixOutcome.addedKeywords?.length ?? 0) > 0 ? (
                    <p className="text-[10px] text-gray-500">
                      <span className="text-gray-400">Terms · </span>
                      <span className="text-gray-700 font-medium">
                        {(fixOutcome.addedKeywords ?? []).join(', ')}
                      </span>
                    </p>
                  ) : null}
                  <FixResumePreview
                    text={fixOutcome.previewText || ''}
                    addedKeywords={fixOutcome.addedKeywords ?? []}
                  />
                  {fixOutcome.pdfNote && fixOutcome.pdfAvailable ? (
                    <p className="text-[11px] text-sky-900 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                      {fixOutcome.pdfNote}
                    </p>
                  ) : null}
                  {fixOutcome.pdfAvailable === false && fixOutcome.pdfError ? (
                    <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      PDF was not generated on the server ({fixOutcome.pdfError}).
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-[11px] text-gray-400">Change inputs above to re-run.</p>
              <button
                type="button"
                onClick={scrollToForm}
                className="text-xs font-semibold text-[#FF6B00] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/30 rounded"
              >
                Back to form
              </button>
            </div>
          </div>
        </section>
      )}

      {userId && (
        <section className="rounded-xl border border-gray-100 bg-white shadow-sm mt-6 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-gray-100 via-orange-100 to-[#FF6B00]/35" aria-hidden />
          <div className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#FF6B00]">
                <History className="h-4 w-4 shrink-0" aria-hidden />
              </span>
              History
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
          <p className="text-[11px] text-gray-500 mb-4 max-w-xl leading-snug">
            <strong className="font-medium text-gray-700">Open a row</strong> for details. Resume column = download.
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
              <p className="text-sm font-semibold text-gray-800">Nothing here yet</p>
              <p className="text-[11px] text-gray-500 mt-1.5 max-w-xs mx-auto leading-snug">
                Analyze while signed in—runs show up here.
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
                      <span className="font-semibold text-gray-700">Job (preview)</span>
                      <p className="mt-1 leading-relaxed whitespace-pre-wrap">
                        {selectedHistoryItem.jobDescriptionPreview}
                      </p>
                    </div>
                  ) : null}
                  <AtsResultDetailView
                    result={historyItemToResult(selectedHistoryItem)}
                    metaParagraph={
                      <span className="text-gray-600">
                        Snapshot ·{' '}
                        <strong className="text-gray-800">{providerLabelForId(selectedHistoryItem.provider)}</strong>
                        . May differ from a new run.
                      </span>
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
