import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, Loader2, Printer, Sparkles, Upload, X } from 'lucide-react';
import { useAuth } from '../../App';
import type { JobPortal } from '../../data/preparationMockData';
import {
  getLlmKeysStatus,
  type AtsProvider,
  type FixResumeResult,
} from '../../services/atsService';
import { tailorResumeForPortal, type TailorPhase } from '../../services/tailorResume';
import { ResumePreviewTemplateView, type ResumePreviewData } from '../fix-resume/ResumePreviewTemplateView';

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

const PHASE_LABELS: Record<TailorPhase, string> = {
  analyze: 'Analyzing your resume…',
  matching: 'Matching with job requirements…',
  optimizing: 'Optimizing your profile…',
};

type CompareTab = 'original' | 'tailored';

type TailorResumeModalProps = {
  portal: JobPortal | null;
  onClose: () => void;
};

const TailorResumeModal: React.FC<TailorResumeModalProps> = ({ portal, onClose }) => {
  const { userId } = useAuth();
  const [provider, setProvider] = useState<AtsProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [useSavedKey, setUseSavedKey] = useState(false);
  const [savedKeysByProvider, setSavedKeysByProvider] = useState<Record<AtsProvider, boolean>>({
    gemini: false,
    openai: false,
    openrouter: false,
    anthropic: false,
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'result'>('form');
  const [phase, setPhase] = useState<TailorPhase>('analyze');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fixOutcome, setFixOutcome] = useState<FixResumeResult | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [usedFallbackKeywords, setUsedFallbackKeywords] = useState(false);
  const [compareTab, setCompareTab] = useState<CompareTab>('tailored');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tailorPreviewRef = useRef<HTMLDivElement>(null);

  const hasSavedProviderKey = savedKeysByProvider[provider];
  const keyReady =
    Boolean(apiKey.trim()) || Boolean(useSavedKey && hasSavedProviderKey && userId);

  useEffect(() => {
    try {
      const storedProvider = localStorage.getItem(SELECTED_PROVIDER_STORAGE) as AtsProvider | null;
      const activeProvider =
        storedProvider && PROVIDERS.some((p) => p.id === storedProvider) ? storedProvider : 'gemini';
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
      .catch(() => {});
  }, [userId]);

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

  const originalPdfUrl = useMemo(() => {
    if (!resumeFile || resumeFile.type !== 'application/pdf') return null;
    return URL.createObjectURL(resumeFile);
  }, [resumeFile]);

  useEffect(() => {
    return () => {
      if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
    };
  }, [originalPdfUrl]);

  const resetForm = useCallback(() => {
    setStep('form');
    setFixOutcome(null);
    setMatchScore(null);
    setUsedFallbackKeywords(false);
    setErrorMessage(null);
    setCompareTab('tailored');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    setResumeFile(null);
    onClose();
  }, [onClose, resetForm]);

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setErrorMessage(null);
      setResumeFile(file);
    } else {
      setErrorMessage('Please upload a PDF file.');
    }
  };

  const handleTailor = async () => {
    if (!portal || !resumeFile || !keyReady) return;
    setErrorMessage(null);
    setStep('processing');
    setPhase('analyze');
    try {
      const out = await tailorResumeForPortal({
        portal,
        resumeFile,
        ...(userId ? { userId } : {}),
        provider,
        apiKey,
        useSavedKey,
        hasSavedProviderKey,
        onPhase: setPhase,
      });
      if (!out.success) {
        setErrorMessage(out.message || 'Something went wrong.');
        setStep('form');
        return;
      }
      setMatchScore(out.atsResult.overallScore ?? null);
      setUsedFallbackKeywords(out.usedFallbackKeywords);
      setFixOutcome(out.fix);
      setStep('result');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Network error.');
      setStep('form');
    }
  };

  const downloadTailoredPdf = () => {
    if (!fixOutcome) return;
    const name = fixOutcome.pdfFileName || 'tailored-resume.pdf';
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
        setErrorMessage('Could not download PDF.');
      }
      return;
    }
    if (fixOutcome.pdfUrl) {
      window.open(fixOutcome.pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const printTailored = () => {
    const root = tailorPreviewRef.current;
    if (!root) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const clone = root.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('mark.garamond-injected-kw').forEach((m) => {
      const t = w.document.createTextNode(m.textContent ?? '');
      m.replaceWith(t);
    });
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Tailored resume</title></head><body>${clone.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 450);
  };

  const canSubmit = Boolean(resumeFile && keyReady);

  useEffect(() => {
    if (!portal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [portal, handleClose]);

  if (!portal) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tailor-modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[min(92vh,900px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 id="tailor-modal-title" className="text-lg font-bold text-gray-900 truncate">
              Tailor My Resume
            </h2>
            <p className="text-sm text-gray-600 mt-0.5 truncate">{portal.name}</p>
            <p className="text-[11px] text-gray-500 mt-2 leading-snug">
              Tailoring uses this portal&apos;s profile as context (not a specific job post). Paste a real job
              description in ATS Scorer for posting-level alignment.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'form' && (
            <>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700">LLM for analysis &amp; generation</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 text-xs text-gray-600">
                    Provider
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as AtsProvider)}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex-[2] text-xs text-gray-600">
                    API key {!userId ? <span className="text-amber-700">(required when not signed in)</span> : null}
                    <input
                      type="password"
                      autoComplete="off"
                      value={apiKey}
                      onChange={(e) => persistApiKey(e.target.value)}
                      placeholder={PROVIDERS.find((p) => p.id === provider)?.keyPlaceholder}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
                    />
                  </label>
                </div>
                {userId ? (
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSavedKey}
                      onChange={(e) => setUseSavedKey(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Use saved key for {PROVIDERS.find((p) => p.id === provider)?.label}{' '}
                    {hasSavedProviderKey ? (
                      <span className="text-green-700 font-medium">(available)</span>
                    ) : (
                      <span className="text-gray-500">(not saved)</span>
                    )}
                  </label>
                ) : null}
              </div>

              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  acceptFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-10 px-4 text-center transition-colors ${
                  isDragging ? 'border-[#FF6B00] bg-orange-50/70' : 'border-gray-200 bg-white hover:border-orange-200'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                />
                {resumeFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden />
                    <p className="text-sm font-semibold text-gray-900">{resumeFile.name}</p>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setResumeFile(null);
                      }}
                      className="text-xs text-[#FF6B00] font-medium hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mb-2" aria-hidden />
                    <p className="text-sm font-medium text-gray-800">Upload your resume (PDF)</p>
                    <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse</p>
                  </>
                )}
              </div>

              {errorMessage ? (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p>
              ) : null}

              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleTailor}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-white font-semibold py-3 text-sm hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Tailor resume
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#FF6B00] mb-4" aria-hidden />
              <p className="text-sm font-medium text-gray-900">{PHASE_LABELS[phase]}</p>
              <p className="text-xs text-gray-500 mt-2 max-w-xs">This may take a minute. Please keep this tab open.</p>
            </div>
          )}

          {step === 'result' && fixOutcome?.success && (!fixOutcome.resumeData || typeof fixOutcome.resumeData !== 'object') && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your resume was processed, but no preview template was returned. Try again or use ATS Scorer → Fix My
              Resume.
              {fixOutcome.previewText ? (
                <pre className="mt-3 whitespace-pre-wrap text-xs text-gray-800 bg-white border border-amber-100 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {fixOutcome.previewText}
                </pre>
              ) : null}
              <div className="mt-3 flex gap-3">
                <button type="button" onClick={resetForm} className="text-sm font-medium text-[#FF6B00] hover:underline">
                  Try again
                </button>
                <button type="button" onClick={handleClose} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Close
                </button>
              </div>
            </div>
          )}

          {step === 'result' && fixOutcome?.success && fixOutcome.resumeData && typeof fixOutcome.resumeData === 'object' && (
            <div className="space-y-4">
              {matchScore != null ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-gray-100 p-4">
                  <div className="relative h-24 w-24 shrink-0 mx-auto sm:mx-0">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 120 120" aria-hidden>
                      <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="#f3f4f6" strokeWidth="10" />
                      <circle
                        cx="60"
                        cy="60"
                        r={RING_RADIUS}
                        fill="none"
                        stroke={PRIMARY}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={RING_CIRC}
                        strokeDashoffset={RING_CIRC * (1 - Math.min(100, Math.max(0, matchScore)) / 100)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">{matchScore}</span>
                      <span className="text-[10px] font-medium text-gray-500 uppercase">vs portal context</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 flex-1">
                    {usedFallbackKeywords ? (
                      <p className="text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
                        No ATS gaps detected; keywords were inferred from this portal&apos;s category and name to still
                        generate a tailored layout.
                      </p>
                    ) : null}
                    {(fixOutcome.addedKeywords?.length ?? 0) > 0 ? (
                      <p>
                        <span className="text-gray-400">Terms woven in · </span>
                        <span className="font-medium text-gray-800">{(fixOutcome.addedKeywords ?? []).join(', ')}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
                <button
                  type="button"
                  onClick={() => setCompareTab('tailored')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    compareTab === 'tailored'
                      ? 'bg-orange-50 text-[#FF6B00] border border-orange-200'
                      : 'text-gray-600 border border-transparent hover:bg-gray-50'
                  }`}
                >
                  Tailored preview
                </button>
                <button
                  type="button"
                  onClick={() => setCompareTab('original')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    compareTab === 'original'
                      ? 'bg-orange-50 text-[#FF6B00] border border-orange-200'
                      : 'text-gray-600 border border-transparent hover:bg-gray-50'
                  }`}
                >
                  Original PDF
                </button>
              </div>

              {compareTab === 'original' && originalPdfUrl ? (
                <iframe
                  title="Original resume"
                  src={originalPdfUrl}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 min-h-[420px]"
                  style={{ height: 'min(560px, 55vh)' }}
                />
              ) : null}
              {compareTab === 'original' && !originalPdfUrl ? (
                <p className="text-xs text-gray-500">Original file is not available.</p>
              ) : null}

              {compareTab === 'tailored' ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {(fixOutcome.pdfUrl || fixOutcome.pdfBase64) ? (
                      <button
                        type="button"
                        onClick={downloadTailoredPdf}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Download PDF
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={printTailored}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      <Printer className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Print / PDF
                    </button>
                  </div>
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
                    ref={tailorPreviewRef}
                    className="rounded-lg border border-gray-200 bg-white overflow-auto max-h-[min(560px,70vh)]"
                  >
                    <ResumePreviewTemplateView
                      data={fixOutcome.resumeData as unknown as ResumePreviewData}
                      highlightTerms={fixOutcome.addedKeywords ?? []}
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm font-medium text-[#FF6B00] hover:underline"
                >
                  Tailor another file
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 ml-auto"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TailorResumeModal;
