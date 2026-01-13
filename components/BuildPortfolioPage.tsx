import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigation, useAuth } from '../App';
import PortfolioHistory from './PortfolioHistory';

// API Endpoint for portfolio generation (AWS Lambda)
const PORTFOLIO_API_ENDPOINT = 'https://tya60ig1pc.execute-api.ap-south-2.amazonaws.com/default/portfolio-generator';

// Demo mode - set to false to use real AWS Lambda backend
const DEMO_MODE = false;

// Template definitions (mirrored from backend)
const TEMPLATES = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple with plenty of whitespace', thumbnail: '📄', accent: '#000000', bg: '#ffffff' },
  { id: 'modern', name: 'Modern Dark', description: 'Dark theme with purple gradients', thumbnail: '🌙', accent: '#a78bfa', bg: '#0a0a0f' },
  { id: 'professional', name: 'Professional', description: 'Corporate blue theme, perfect for business', thumbnail: '💼', accent: '#2563eb', bg: '#f8fafc' },
  { id: 'creative', name: 'Creative', description: 'Bold colors and unique asymmetric layout', thumbnail: '🎨', accent: '#f59e0b', bg: '#fffbeb' },
  { id: 'developer', name: 'Developer', description: 'Terminal-inspired theme for tech professionals', thumbnail: '💻', accent: '#00ff88', bg: '#1a1a2e' },
  { id: 'elegant', name: 'Elegant', description: 'Sophisticated design with serif typography', thumbnail: '✨', accent: '#d4af37', bg: '#1c1917' },
];

interface PortfolioStatus {
  stage: 'idle' | 'uploading' | 'parsing' | 'extracting' | 'selecting' | 'previewing' | 'deploying' | 'complete' | 'error';
  message: string;
  progress: number;
}

interface DeploymentResult {
  success: boolean;
  liveUrl?: string;
  previewUrl?: string;
  error?: string;
}

interface PortfolioData {
  personal?: { name?: string; title?: string; tagline?: string; email?: string; bio?: string };
  about?: { headline?: string; description?: string; highlights?: string[] };
  skills?: Record<string, Array<{ name: string; level?: number } | string>>;
  experience?: Array<{ company?: string; title?: string; period?: string; description?: string }>;
  education?: Array<{ institution?: string; degree?: string; year?: string }>;
  projects?: Array<{ name?: string; description?: string; technologies?: string[] }>;
  links?: { github?: string; linkedin?: string };
}

interface BuildPortfolioPageProps {
  embedded?: boolean;
}

const BuildPortfolioPage: React.FC<BuildPortfolioPageProps> = ({ embedded = false }) => {
  const { navigateTo } = useNavigation();
  const { isLoggedIn, userId, userEmail } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<PortfolioStatus>({
    stage: 'idle',
    message: 'Upload your resume to get started',
    progress: 0
  });
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showExtractedText, setShowExtractedText] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
        setDeploymentResult(null);
        setPortfolioData(null);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
        setDeploymentResult(null);
        setPortfolioData(null);
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const maxSize = 10 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document (.pdf, .docx, .doc)');
      return false;
    }
    
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return false;
    }
    
    return true;
  };

  const updateStatus = (stage: PortfolioStatus['stage'], message: string, progress: number) => {
    setStatus({ stage, message, progress });
  };

  // Parse resume and extract portfolio data
  const parseResume = async () => {
    if (!file) return;

    try {
      updateStatus('uploading', 'Uploading your resume...', 10);
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      await simulateDelay(500);

      updateStatus('parsing', 'Parsing your resume document...', 30);
      await simulateDelay(500);

      updateStatus('extracting', 'Extracting your professional data...', 50);

      if (DEMO_MODE) {
        // Demo portfolio data
        await simulateDelay(1500);
        const demoData: PortfolioData = {
          personal: { name: 'John Developer', title: 'Full Stack Engineer', tagline: 'Building amazing web experiences', email: 'john@example.com', bio: 'Passionate developer with 5+ years of experience building scalable web applications.' },
          skills: { frontend: [{ name: 'React', level: 90 }, { name: 'TypeScript', level: 85 }], backend: [{ name: 'Node.js', level: 85 }] },
          experience: [{ company: 'Tech Corp', title: 'Senior Developer', period: '2020 - Present', description: 'Led development of core platform features.' }],
          projects: [{ name: 'Portfolio Builder', description: 'AI-powered portfolio generator', technologies: ['React', 'Python', 'AWS'] }],
        };
        setPortfolioData(demoData);
        updateStatus('selecting', 'Choose your portfolio template', 60);
        return;
      }

      // Call Lambda to parse resume
      const response = await fetch(PORTFOLIO_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parseResume',
          userEmail: userEmail || '',
          fileName: file.name,
          fileType: file.type,
          fileContent: base64,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to parse resume');
      }

      setPortfolioData(result.portfolioData);
      // Store the extracted text to show to user
      if (result.extractedText) {
        setExtractedText(result.extractedText);
      }
      updateStatus('selecting', 'Choose your portfolio template', 60);

    } catch (error) {
      console.error('Parse error:', error);
      updateStatus('error', error instanceof Error ? error.message : 'Failed to parse resume', 0);
      setDeploymentResult({ success: false, error: error instanceof Error ? error.message : 'Parse failed' });
    }
  };

  // Fetch preview HTML for selected template
  const fetchPreview = async (templateId: string) => {
    if (!portfolioData) return;
    
    setIsLoadingPreview(true);
    
    try {
      if (DEMO_MODE) {
        await simulateDelay(500);
        // Generate simple demo preview
        const name = portfolioData.personal?.name || 'Your Name';
        setPreviewHtml(`<!DOCTYPE html><html><head><style>body{font-family:system-ui;background:#0a0a0f;color:#fff;padding:40px;text-align:center;}h1{color:#a78bfa;}</style></head><body><h1>${name}</h1><p>Template: ${templateId}</p><p>This is a preview of your portfolio.</p></body></html>`);
        setIsLoadingPreview(false);
        return;
      }

      const response = await fetch(PORTFOLIO_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'previewPortfolio',
          portfolioData,
          templateId,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.html) {
        setPreviewHtml(result.html);
      }
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Update preview when template changes
  useEffect(() => {
    if (portfolioData && status.stage === 'selecting') {
      fetchPreview(selectedTemplate);
    }
  }, [selectedTemplate, portfolioData, status.stage]);

  // Update iframe content when preview HTML changes
  useEffect(() => {
    if (previewRef.current && previewHtml) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewHtml]);

  // Deploy portfolio with selected template
  const deployPortfolio = async () => {
    if (!portfolioData) return;

    try {
      updateStatus('deploying', 'Deploying your portfolio to the cloud...', 80);

      if (DEMO_MODE) {
        await simulateDelay(2000);
        updateStatus('complete', 'Your portfolio is live!', 100);
        setDeploymentResult({
          success: true,
          liveUrl: 'https://demo-portfolio.vercel.app',
          previewUrl: 'https://demo-portfolio.vercel.app',
        });
        return;
      }

      const response = await fetch(PORTFOLIO_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generatePortfolio',
          userId: userId || `guest_${Date.now()}`,
          userEmail: userEmail || '',
          portfolioData,
          templateId: selectedTemplate,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Deployment failed');
      }

      updateStatus('complete', 'Your portfolio is live!', 100);
      setDeploymentResult({
        success: true,
        liveUrl: result.liveUrl,
        previewUrl: result.previewUrl,
      });

    } catch (error) {
      console.error('Deploy error:', error);
      updateStatus('error', error instanceof Error ? error.message : 'Deployment failed', 0);
      setDeploymentResult({ success: false, error: error instanceof Error ? error.message : 'Deployment failed' });
    }
  };

  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const resetForm = () => {
    setFile(null);
    setPortfolioData(null);
    setPreviewHtml('');
    setSelectedTemplate('modern');
    setExtractedText('');
    setShowExtractedText(false);
    setStatus({ stage: 'idle', message: 'Upload your resume to get started', progress: 0 });
    setDeploymentResult(null);
  };

  const goBackToTemplates = () => {
    updateStatus('selecting', 'Choose your portfolio template', 60);
    setDeploymentResult(null);
  };

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white ${embedded ? 'rounded-2xl' : ''}`}>
      {/* Header */}
      {!embedded && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => navigateTo('home')} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-bold">PB</span>
              </div>
              <span className="text-xl font-bold group-hover:text-violet-400 transition-colors">ProjectBazaar</span>
            </button>
            <nav className="flex items-center gap-4">
              {isLoggedIn ? (
                <button onClick={() => navigateTo('dashboard')} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Dashboard</button>
              ) : (
                <button onClick={() => navigateTo('auth')} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition-colors">Sign In</button>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className={`${embedded ? 'py-8' : 'pt-24 pb-16'} px-6`}>
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              <span className="text-sm text-violet-400">Smart Portfolio Builder</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">
              Build Your <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Portfolio</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Upload your resume, choose a template, preview it live, and deploy instantly.
            </p>
          </div>

          {/* Progress Steps */}
          {status.stage !== 'idle' && status.stage !== 'error' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {['Upload', 'Extract', 'Template', 'Deploy'].map((step, i) => {
                const stepStages = [['uploading', 'parsing'], ['extracting'], ['selecting', 'previewing'], ['deploying', 'complete']];
                const isActive = stepStages[i].includes(status.stage);
                const isComplete = i < stepStages.findIndex(s => s.includes(status.stage));
                return (
                  <React.Fragment key={step}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isComplete ? 'bg-green-500/20 text-green-400' : isActive ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {isComplete ? '✓' : i + 1}. {step}
                    </div>
                    {i < 3 && <div className={`w-8 h-0.5 ${isComplete ? 'bg-green-500/50' : 'bg-gray-700'}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* STAGE: Upload */}
          {status.stage === 'idle' && !deploymentResult && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#16161f] rounded-3xl border border-white/5 p-8">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    dragActive ? 'border-violet-500 bg-violet-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {file ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Remove file</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-violet-500/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">Drag & drop your resume here</p>
                        <p className="text-sm text-gray-500 mt-1">or click to browse • PDF, DOC, DOCX (max 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={parseResume}
                  disabled={!file}
                  className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    file ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {file ? '🚀 Continue to Templates' : 'Upload Resume to Continue'}
                </button>
              </div>
            </div>
          )}

          {/* STAGE: Processing (Uploading, Parsing, Extracting) */}
          {['uploading', 'parsing', 'extracting'].includes(status.stage) && (
            <div className="max-w-lg mx-auto">
              <div className="bg-[#16161f] rounded-3xl border border-white/5 p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{status.message}</h2>
                <p className="text-gray-500 mb-6">Please wait while we analyze your resume...</p>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${status.progress}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* STAGE: Template Selection with Live Preview */}
          {status.stage === 'selecting' && portfolioData && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Template Selection */}
              <div>
                <h2 className="text-xl font-bold mb-4">Choose Your Template</h2>
                <div className="grid grid-cols-2 gap-4">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                        selectedTemplate === template.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/10 bg-[#16161f] hover:border-white/20'
                      }`}
                    >
                      {selectedTemplate === template.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ background: template.bg, border: `1px solid ${template.accent}30` }}>
                          {template.thumbnail}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{template.name}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{template.description}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="w-4 h-4 rounded-full" style={{ background: template.bg, border: '1px solid rgba(255,255,255,0.2)' }} />
                        <span className="w-4 h-4 rounded-full" style={{ background: template.accent }} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Extracted Data Summary */}
                <div className="mt-6 p-4 bg-[#16161f] rounded-2xl border border-white/5">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-green-400">✓</span> Extracted from your resume
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> <span className="text-white">{portfolioData.personal?.name || 'Not found'}</span></p>
                    <p><span className="text-gray-500">Title:</span> <span className="text-white">{portfolioData.personal?.title || 'Not found'}</span></p>
                    <p><span className="text-gray-500">Experience:</span> <span className="text-white">{portfolioData.experience?.length || 0} positions</span></p>
                    <p><span className="text-gray-500">Skills:</span> <span className="text-white">{Object.values(portfolioData.skills || {}).flat().length} skills</span></p>
                  </div>
                  
                  {/* Show Extracted Text Toggle */}
                  {extractedText && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => setShowExtractedText(!showExtractedText)}
                        className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform ${showExtractedText ? 'rotate-90' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {showExtractedText ? 'Hide' : 'Show'} extracted text
                      </button>
                      
                      {showExtractedText && (
                        <div className="mt-3">
                          <div className="bg-[#0a0a0f] rounded-xl p-4 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                              {extractedText}
                            </pre>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            This is the raw text extracted from your resume. The parser uses this to identify your information.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Deploy Button */}
                <button
                  onClick={deployPortfolio}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-violet-500/25"
                >
                  🚀 Deploy Portfolio
                </button>
              </div>

              {/* Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Live Preview</h2>
                  <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                    {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                  </span>
                </div>
                <div className="relative bg-[#16161f] rounded-2xl border border-white/5 overflow-hidden" style={{ height: '600px' }}>
                  {isLoadingPreview && (
                    <div className="absolute inset-0 bg-[#16161f] flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Loading preview...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    ref={previewRef}
                    title="Portfolio Preview"
                    className="w-full h-full bg-white"
                    sandbox="allow-same-origin"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Click on different templates to see how your portfolio looks
                </p>
              </div>
            </div>
          )}

          {/* STAGE: Deploying */}
          {status.stage === 'deploying' && (
            <div className="max-w-lg mx-auto">
              <div className="bg-[#16161f] rounded-3xl border border-white/5 p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                    <span className="text-3xl">🚀</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Deploying to Vercel</h2>
                <p className="text-gray-500 mb-6">Your portfolio is being deployed to the cloud...</p>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-500 animate-pulse" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          )}

          {/* STAGE: Complete */}
          {status.stage === 'complete' && deploymentResult?.success && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#16161f] rounded-3xl border border-white/5 p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2">Your Portfolio is Live! 🎉</h2>
                <p className="text-gray-400 mb-8">Share your new professional portfolio with the world</p>

                <div className="bg-[#0a0a0f] rounded-2xl p-6 mb-6">
                  <p className="text-sm text-gray-500 mb-2">Your Portfolio URL</p>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-gray-800/50 px-4 py-3 rounded-xl text-violet-400 font-mono text-sm overflow-hidden text-ellipsis">
                      {deploymentResult.liveUrl}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(deploymentResult.liveUrl || '')}
                      className="p-3 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
                      title="Copy URL"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <a
                    href={deploymentResult.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Portfolio
                  </a>
                  <button onClick={goBackToTemplates} className="px-6 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors">
                    Change Template
                  </button>
                  <button onClick={resetForm} className="px-6 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors">
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE: Error */}
          {status.stage === 'error' && (
            <div className="max-w-lg mx-auto">
              <div className="bg-[#16161f] rounded-3xl border border-white/5 p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-3xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-gray-400 mb-6">{deploymentResult?.error || status.message}</p>
                <button onClick={resetForm} className="px-8 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors">
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Portfolio History Section - Show when idle or after completion */}
          {(status.stage === 'idle' || status.stage === 'complete' || status.stage === 'error') && isLoggedIn && (
            <div className="mt-12">
              <PortfolioHistory />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BuildPortfolioPage;
