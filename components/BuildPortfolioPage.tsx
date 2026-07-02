import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Upload,
  FileText,
  X,
  ExternalLink,
  Copy,
  Loader2,
  Rocket,
  Eye,
} from 'lucide-react';
import { useAuth } from '../App';
import { useSubscription } from '../context/SubscriptionContext';
import { useLlmKeysGate } from '../context/LlmKeysGateContext';
import PortfolioHistory from './PortfolioHistory';
import PortfolioDataForm from './portfolio/PortfolioDataForm';
import AIExtractionAnimation from './ui/AIExtractionAnimation';
import {
  type PortfolioData,
  type PortfolioTemplate,
  getPortfolioTemplates,
  generateFromResume,
  previewPortfolio,
  deployPortfolio,
} from '../services/portfolioBuilderService';

type StepId = 'style' | 'resume' | 'edit' | 'preview' | 'live';

interface BuildPortfolioPageProps {
  embedded?: boolean;
  toggleSidebar?: () => void;
}

const STEPS: { id: StepId; label: string }[] = [
  { id: 'style', label: 'Style' },
  { id: 'resume', label: 'Resume' },
  { id: 'edit', label: 'Edit' },
  { id: 'preview', label: 'Preview' },
  { id: 'live', label: 'Live' },
];

const SAMPLE_PORTFOLIO: PortfolioData = {
  personal: {
    name: 'Jordan Rivera',
    title: 'Full Stack Engineer',
    tagline: 'Building fast, reliable web products',
    email: 'jordan@example.com',
    phone: '+1 555 0142',
    location: 'San Francisco, CA',
    bio: 'Full stack engineer with 6 years of experience shipping scalable web apps.',
  },
  about: {
    headline: 'About Me',
    description: 'Engineer focused on clean architecture and great UX.',
    highlights: ['6+ years experience', 'Led 3 product launches'],
  },
  skills: {
    frontend: ['React', 'TypeScript', 'Tailwind CSS'],
    backend: ['Node.js', 'Python', 'FastAPI'],
    database: ['PostgreSQL', 'DynamoDB'],
    devops: ['AWS', 'Docker', 'Vercel'],
  },
  experience: [
    {
      company: 'Acme Cloud',
      title: 'Senior Software Engineer',
      period: '2022 — Present',
      highlights: ['Migrated to serverless, cut cost 35%', 'Reduced API latency 72%'],
    },
  ],
  education: [{ institution: 'UC Berkeley', degree: 'B.S. Computer Science', year: '2019' }],
  projects: [
    {
      name: 'DevPortal',
      description: 'Developer portal with docs and API analytics.',
      technologies: ['React', 'Node.js'],
      github: 'https://github.com/example',
    },
  ],
  links: {
    github: 'https://github.com/example',
    linkedin: 'https://linkedin.com/in/example',
    website: 'https://example.com',
  },
};

function PreviewFrame({
  html,
  title,
  loading,
}: {
  html: string;
  title: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 relative min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
        </div>
      )}
      {html ? (
        <iframe
          title={title}
          srcDoc={html}
          className="w-full h-[min(560px,72vh)] bg-white border-0"
          sandbox="allow-same-origin allow-popups"
        />
      ) : (
        !loading && (
          <div className="flex items-center justify-center h-[400px] text-sm text-gray-400">
            Preview will appear here
          </div>
        )
      )}
    </div>
  );
}

const BuildPortfolioPage: React.FC<BuildPortfolioPageProps> = () => {
  const { isLoggedIn, userId, userEmail } = useAuth();
  const { refreshEntitlements } = useSubscription();
  const { ensureAtsKeys } = useLlmKeysGate();

  const [currentStep, setCurrentStep] = useState<StepId>('style');
  const [templates, setTemplates] = useState<PortfolioTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('editorial');

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [demoTemplate, setDemoTemplate] = useState<string | null>(null);
  const [demoHtml, setDemoHtml] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getPortfolioTemplates();
        if (!cancelled) {
          setTemplates(list);
          if (list.length > 0) setSelectedTemplate(list[0].id);
        }
      } catch {
        if (!cancelled) {
          setTemplates([
            {
              id: 'editorial',
              name: 'Editorial',
              description: 'Bold typography, marquee, featured work (award-style)',
              accentColor: '#e8ff59',
              previewColor: '#0c0c0c',
              thumbnail: '🅴',
              previewHtml:
                '<div style="background:#0c0c0c;height:100%;padding:12px;color:#f5f3ee;border-radius:8px"><div style="font-size:7px;color:#8a8a85">PORTFOLIO</div><div style="font-family:Impact;font-size:20px;text-transform:uppercase;line-height:.85">FRONT<br><span style="-webkit-text-stroke:1px #f5f3ee;color:transparent">END</span></div></div>',
            },
            { id: 'alexa', name: 'Alexa', description: 'Creative portfolio with skill bars & project images', accentColor: '#6c63ff', previewColor: '#f8f7ff', thumbnail: '💜', previewHtml: '<div style="background:#f8f7ff;height:100%;padding:10px;border-radius:8px"><div style="font-size:7px;color:#6e6e8a">Hi, I\'m</div><div style="font-size:11px;font-weight:700;color:#6c63ff">Alexa Dev</div><div style="margin-top:6px;width:70%;height:4px;background:#6c63ff33;border-radius:99px"><div style="width:88%;height:100%;background:#6c63ff;border-radius:99px"></div></div></div>' },
          ]);
        }
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stepDone = useMemo(
    () => ({
      style: Boolean(selectedTemplate),
      resume: Boolean(file),
      edit: Boolean(portfolioData),
      preview: Boolean(previewHtml),
      live: Boolean(liveUrl),
    }),
    [selectedTemplate, file, portfolioData, previewHtml, liveUrl]
  );

  const acceptFile = useCallback((f: File | null | undefined) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    const ok =
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.pdf') ||
      name.endsWith('.docx');
    if (!ok) {
      setFileHint('Please upload a PDF or DOCX file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileHint('File must be under 10 MB.');
      return;
    }
    setFileHint(null);
    setFile(f);
  }, []);

  const handleExtractAndFill = async () => {
    if (!file || !userId) return;
    const keysOk = await ensureAtsKeys();
    if (!keysOk) return;

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateFromResume({
        userId,
        userEmail: userEmail || '',
        templateId: selectedTemplate,
        file,
      });
      setPortfolioData(result.portfolioData);
      setAiProvider(result.provider);
      setCurrentStep('edit');
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Failed to extract resume data');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadPreview = useCallback(async () => {
    if (!portfolioData) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const html = await previewPortfolio(selectedTemplate, portfolioData);
      setPreviewHtml(html);
    } catch (e) {
      setPreviewHtml('');
      setPreviewError(e instanceof Error ? e.message : 'Could not load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [portfolioData, selectedTemplate]);

  useEffect(() => {
    if (currentStep === 'preview' && portfolioData) {
      void loadPreview();
    }
  }, [currentStep, portfolioData, selectedTemplate, loadPreview]);

  const openDemo = async (templateId: string) => {
    setDemoTemplate(templateId);
    setDemoHtml('');
    setDemoLoading(true);
    try {
      const html = await previewPortfolio(templateId, SAMPLE_PORTFOLIO);
      setDemoHtml(html);
    } catch {
      setDemoHtml(
        '<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#666"><p>Could not load preview.</p><p style="font-size:12px">Check API Gateway / Lambda logs.</p></body></html>'
      );
    } finally {
      setDemoLoading(false);
    }
  };

  const handleContinueToPreview = () => {
    setPreviewHtml('');
    setCurrentStep('preview');
  };

  const handleDeploy = async () => {
    if (!portfolioData || !userId) return;
    setShowDeployConfirm(false);
    setIsDeploying(true);
    setDeployError(null);
    try {
      const result = await deployPortfolio({
        userId,
        userEmail: userEmail || '',
        templateId: selectedTemplate,
        portfolioData,
        fileName: file?.name,
      });
      setLiveUrl(result.liveUrl);
      setCurrentStep('live');
      setHistoryKey((k) => k + 1);
      void refreshEntitlements();
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : 'Deploy failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const copyUrl = () => {
    if (!liveUrl) return;
    void navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetFlow = () => {
    setCurrentStep('style');
    setFile(null);
    setPortfolioData(null);
    setPreviewHtml('');
    setLiveUrl(null);
    setGenerateError(null);
    setDeployError(null);
    setPreviewError(null);
    setAiProvider(null);
  };

  const goToStep = (id: StepId) => {
    if (id === 'style') setCurrentStep('style');
    if (id === 'resume' && selectedTemplate) setCurrentStep('resume');
    if (id === 'edit' && portfolioData) setCurrentStep('edit');
    if (id === 'preview' && portfolioData) setCurrentStep('preview');
    if (id === 'live' && liveUrl) setCurrentStep('live');
  };

  const selectedTemplateName = templates.find((t) => t.id === selectedTemplate)?.name || selectedTemplate;

  return (
    <div className="min-h-full bg-white rounded-xl border border-gray-100 p-4 sm:p-6 md:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-5 sm:mb-7 max-w-2xl border-l-[3px] border-[#FF6B00] pl-3 sm:pl-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#FF6B00] mb-2">
            <Sparkles className="h-3 w-3" aria-hidden />
            Portfolio
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Build your portfolio</h1>
          <p className="mt-1.5 text-gray-500 text-xs sm:text-sm leading-snug">
            Pick a style → upload resume → edit AI-filled content → preview → deploy live.
          </p>
        </header>

        <nav
          aria-label="Portfolio steps"
          className="mb-5 sm:mb-7 flex flex-wrap items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/50 px-2.5 py-2 text-[11px] font-medium text-gray-600"
        >
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />}
              <button
                type="button"
                onClick={() => goToStep(s.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors ${
                  currentStep === s.id ? 'text-gray-900 bg-orange-50/80' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {stepDone[s.id] ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden />
                ) : (
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-400">
                    {i + 1}
                  </span>
                )}
                {s.label}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {currentStep === 'style' && (
          <section>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Choose a portfolio style</h2>
            {templatesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                {templates.map((t) => {
                  const selected = selectedTemplate === t.id;
                  return (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTemplate(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedTemplate(t.id);
                      }}
                      className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/40 ${
                        selected ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/20' : 'border-gray-200'
                      }`}
                    >
                      <div className="h-36 p-3 relative" style={{ background: t.previewColor || '#f8fafc' }}>
                        {t.previewHtml ? (
                          <div className="h-full rounded-lg overflow-hidden shadow-sm" dangerouslySetInnerHTML={{ __html: t.previewHtml }} />
                        ) : (
                          <div className="h-full flex items-center justify-center text-4xl">{t.thumbnail}</div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void openDemo(t.id); }}
                          className="absolute inset-x-0 bottom-0 m-2 flex items-center justify-center gap-1.5 rounded-lg bg-black/70 text-white text-xs font-medium py-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity backdrop-blur-sm"
                        >
                          <Eye className="h-3.5 w-3.5" /> Preview demo
                        </button>
                      </div>
                      <div className="p-4 bg-white">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{t.thumbnail}</span>
                          <span className="font-bold text-gray-900">{t.name}</span>
                          {selected && <CheckCircle2 className="h-4 w-4 text-[#FF6B00] ml-auto" />}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{t.description}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void openDemo(t.id); }}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#FF6B00] hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={!selectedTemplate}
                onClick={() => setCurrentStep('resume')}
                className="px-6 py-2.5 rounded-xl bg-[#FF6B00] text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-50"
              >
                Continue with {selectedTemplateName}
              </button>
            </div>
          </section>
        )}

        {currentStep === 'resume' && (
          <section className="max-w-xl mx-auto">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Upload your resume</h2>
            <p className="text-xs text-gray-500 mb-4">
              Style: <strong className="text-gray-700">{selectedTemplateName}</strong>. AI uses your Settings API key to fill missing fields.
            </p>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); acceptFile(e.dataTransfer.files?.[0]); }}
              onClick={() => fileInputRef.current?.click()}
              className={`min-h-[220px] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center ${
                isDragging ? 'border-[#FF6B00] bg-orange-50/70' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/25'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                  <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border w-full justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="p-1 rounded text-gray-500 hover:bg-gray-200">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                    <Upload className="h-7 w-7 text-[#FF6B00]" />
                  </div>
                  <p className="text-sm font-medium text-gray-800">Drag & drop your resume</p>
                  <p className="text-[11px] text-gray-400 mt-1">PDF or DOCX · max 10 MB</p>
                </>
              )}
            </div>
            {fileHint && <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{fileHint}</p>}
            {generateError && <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{generateError}</p>}
            {!isLoggedIn && (
              <p className="mt-3 text-xs text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">Sign in to extract and deploy your portfolio.</p>
            )}
            {isGenerating && (
              <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/30 p-4">
                <AIExtractionAnimation />
                <p className="text-center text-sm text-gray-600 mt-2">Reading resume and filling your form with AI…</p>
              </div>
            )}
            <div className="mt-6 flex gap-3 justify-between">
              <button type="button" onClick={() => setCurrentStep('style')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button
                type="button"
                disabled={!file || !userId || isGenerating}
                onClick={() => void handleExtractAndFill()}
                className="px-6 py-2.5 rounded-xl bg-[#FF6B00] text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>) : 'Extract & fill form'}
              </button>
            </div>
          </section>
        )}

        {currentStep === 'edit' && portfolioData && (
          <section>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Edit your portfolio content</h2>
              <p className="text-xs text-gray-500 mt-1">
                Pre-filled from your resume{aiProvider ? ` via ${aiProvider}` : ''}. Edit any field, then continue to preview.
              </p>
            </div>
            <PortfolioDataForm data={portfolioData} onChange={setPortfolioData} />
            <div className="mt-6 flex flex-wrap gap-3 justify-between sticky bottom-0 bg-white/95 backdrop-blur py-3 border-t border-gray-100 -mx-1 px-1">
              <button type="button" onClick={() => setCurrentStep('resume')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">Back</button>
              <button
                type="button"
                onClick={handleContinueToPreview}
                className="px-6 py-2.5 rounded-xl bg-[#FF6B00] text-white font-semibold text-sm hover:bg-orange-600"
              >
                Continue to preview
              </button>
            </div>
          </section>
        )}

        {currentStep === 'preview' && portfolioData && (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Portfolio preview</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{selectedTemplateName} template</p>
              </div>
              <button
                type="button"
                onClick={() => void loadPreview()}
                disabled={isLoadingPreview}
                className="text-xs font-medium text-[#FF6B00] hover:underline disabled:opacity-50"
              >
                Refresh preview
              </button>
            </div>
            {previewError && (
              <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{previewError}</p>
            )}
            <PreviewFrame html={previewHtml} title="Portfolio preview" loading={isLoadingPreview} />
            {deployError && (
              <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{deployError}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3 justify-between">
              <button type="button" onClick={() => setCurrentStep('edit')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">Back to edit</button>
              <button
                type="button"
                disabled={isDeploying || !previewHtml}
                onClick={() => setShowDeployConfirm(true)}
                className="px-6 py-2.5 rounded-xl bg-[#FF6B00] text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeploying ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deploying…</>) : (<><Rocket className="h-4 w-4" /> Deploy to Vercel</>)}
              </button>
            </div>
          </section>
        )}

        {currentStep === 'live' && liveUrl && (
          <section className="max-w-lg mx-auto text-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Portfolio is live!</h2>
            <p className="text-sm text-gray-500 mb-6">Deployed with the {selectedTemplateName} template.</p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border mb-6">
              <span className="text-sm text-gray-700 truncate flex-1">{liveUrl}</span>
              <button type="button" onClick={copyUrl} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600" aria-label="Copy URL">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-green-600 mb-4">Copied!</p>}
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B00] text-white font-semibold text-sm">
                View site <ExternalLink className="h-4 w-4" />
              </a>
              <button type="button" onClick={resetFlow} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">Build another</button>
            </div>
          </section>
        )}

        {demoTemplate && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-3 text-white gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {templates.find((t) => t.id === demoTemplate)?.name} — demo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedTemplate(demoTemplate); setDemoTemplate(null); setCurrentStep('resume'); }}
                  className="px-3 py-1.5 rounded-lg bg-[#FF6B00] text-white text-xs font-semibold hover:bg-orange-600"
                >
                  Use & upload resume
                </button>
                <button type="button" onClick={() => setDemoTemplate(null)} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-white relative">
              <PreviewFrame html={demoHtml} title="Template demo" loading={demoLoading} />
            </div>
          </div>
        )}

        {showDeployConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Deploy portfolio?</h3>
              <p className="text-sm text-gray-500 mb-6">Publishes to Vercel and uses one portfolio trial credit.</p>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowDeployConfirm(false)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
                <button type="button" onClick={() => void handleDeploy()} className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-semibold">Deploy</button>
              </div>
            </div>
          </div>
        )}

        {isLoggedIn && userId && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <PortfolioHistory key={historyKey} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildPortfolioPage;
