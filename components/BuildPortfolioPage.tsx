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
  personal?: { name?: string; title?: string; tagline?: string; email?: string; phone?: string; location?: string; bio?: string };
  about?: { headline?: string; description?: string; highlights?: string[] };
  skills?: Record<string, Array<{ name: string; level?: number } | string>>;
  experience?: Array<{ company?: string; title?: string; period?: string; description?: string; highlights?: string[] }>;
  education?: Array<{ institution?: string; degree?: string; year?: string }>;
  projects?: Array<{ name?: string; description?: string; technologies?: string[]; url?: string; github?: string }>;
  links?: { github?: string; linkedin?: string; twitter?: string; website?: string };
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Handler to update portfolio data fields
  const updatePortfolioField = (section: string, field: string, value: string) => {
    if (!portfolioData) return;
    
    setPortfolioData(prev => {
      if (!prev) return prev;
      
      if (section === 'personal') {
        return {
          ...prev,
          personal: {
            ...prev.personal,
            [field]: value
          }
        };
      } else if (section === 'about') {
        return {
          ...prev,
          about: {
            ...prev.about,
            [field]: value
          }
        };
      } else if (section === 'links') {
        return {
          ...prev,
          links: {
            ...prev.links,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  // Handler to update experience entries
  const updateExperience = (index: number, field: string, value: string) => {
    if (!portfolioData?.experience) return;
    
    setPortfolioData(prev => {
      if (!prev?.experience) return prev;
      const newExperience = [...prev.experience];
      newExperience[index] = { ...newExperience[index], [field]: value };
      return { ...prev, experience: newExperience };
    });
  };

  // Handler to update project entries
  const updateProject = (index: number, field: string, value: string | string[]) => {
    if (!portfolioData?.projects) return;
    
    setPortfolioData(prev => {
      if (!prev?.projects) return prev;
      const newProjects = [...prev.projects];
      newProjects[index] = { ...newProjects[index], [field]: value };
      return { ...prev, projects: newProjects };
    });
  };

  // Handler to update education entries
  const updateEducation = (index: number, field: string, value: string) => {
    if (!portfolioData?.education) return;
    
    setPortfolioData(prev => {
      if (!prev?.education) return prev;
      const newEducation = [...prev.education];
      newEducation[index] = { ...newEducation[index], [field]: value };
      return { ...prev, education: newEducation };
    });
  };

  // Add new experience entry
  const addExperience = () => {
    setPortfolioData(prev => {
      if (!prev) return prev;
      const newExperience = prev.experience || [];
      return {
        ...prev,
        experience: [...newExperience, { company: '', title: '', period: '', description: '' }]
      };
    });
  };

  // Add new project entry
  const addProject = () => {
    setPortfolioData(prev => {
      if (!prev) return prev;
      const newProjects = prev.projects || [];
      return {
        ...prev,
        projects: [...newProjects, { name: '', description: '', technologies: [], url: '', github: '' }]
      };
    });
  };

  // Add new education entry
  const addEducation = () => {
    setPortfolioData(prev => {
      if (!prev) return prev;
      const newEducation = prev.education || [];
      return {
        ...prev,
        education: [...newEducation, { institution: '', degree: '', year: '' }]
      };
    });
  };

  // Add new skill
  const addSkill = (category: string) => {
    setPortfolioData(prev => {
      if (!prev) return prev;
      const skills = prev.skills || {};
      const categorySkills = skills[category] || [];
      return {
        ...prev,
        skills: {
          ...skills,
          [category]: [...categorySkills, { name: 'New Skill', level: 70 }]
        }
      };
    });
  };

  // Remove experience entry
  const removeExperience = (index: number) => {
    setPortfolioData(prev => {
      if (!prev?.experience) return prev;
      const newExperience = prev.experience.filter((_, i) => i !== index);
      return { ...prev, experience: newExperience };
    });
  };

  // Remove project entry
  const removeProject = (index: number) => {
    setPortfolioData(prev => {
      if (!prev?.projects) return prev;
      const newProjects = prev.projects.filter((_, i) => i !== index);
      return { ...prev, projects: newProjects };
    });
  };

  // Remove education entry
  const removeEducation = (index: number) => {
    setPortfolioData(prev => {
      if (!prev?.education) return prev;
      const newEducation = prev.education.filter((_, i) => i !== index);
      return { ...prev, education: newEducation };
    });
  };

  // Update skill
  const updateSkill = (category: string, index: number, field: string, value: string | number) => {
    setPortfolioData(prev => {
      if (!prev?.skills) return prev;
      const skills = { ...prev.skills };
      const categorySkills = [...(skills[category] || [])];
      if (typeof categorySkills[index] === 'object') {
        categorySkills[index] = { ...categorySkills[index], [field]: value };
      } else {
        categorySkills[index] = { name: value as string, level: 70 };
      }
      return { ...prev, skills: { ...skills, [category]: categorySkills } };
    });
  };

  // Remove skill
  const removeSkill = (category: string, index: number) => {
    setPortfolioData(prev => {
      if (!prev?.skills) return prev;
      const skills = { ...prev.skills };
      const categorySkills = (skills[category] || []).filter((_, i) => i !== index);
      if (categorySkills.length === 0) {
        delete skills[category];
      } else {
        skills[category] = categorySkills;
      }
      return { ...prev, skills };
    });
  };

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

    // Start animated progress while waiting for API
    let progressInterval: NodeJS.Timeout | null = null;
    let currentProgress = 5;

    const startProgressAnimation = (targetMax: number = 85) => {
      progressInterval = setInterval(() => {
        // Smoothly increment progress up to targetMax while waiting
        if (currentProgress < targetMax) {
          currentProgress += Math.random() * 2 + 0.5;
          if (currentProgress > targetMax) currentProgress = targetMax;
          setStatus(prev => ({ ...prev, progress: Math.round(currentProgress) }));
        }
      }, 200);
    };

    const stopProgressAnimation = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    };

    try {
      updateStatus('uploading', 'Reading your resume file...', 5);
      startProgressAnimation(15); // Start animation immediately for file reading
      console.log('[Portfolio] Starting file read for:', file.name, 'size:', file.size);
      
      let base64: string;
      try {
        // Use FileReader.readAsDataURL() which is native and non-blocking
        console.log('[Portfolio] Reading file as DataURL...');
        base64 = await new Promise<string>((resolve, reject) => {
          console.log('[Portfolio] Creating FileReader...');
          const reader = new FileReader();
          let hasCompleted = false;
          
          // Add timeout for file reading (30 seconds)
          const fileReadTimeout = setTimeout(() => {
            console.log('[Portfolio] FileReader TIMEOUT triggered after 30s, readyState:', reader.readyState);
            if (!hasCompleted) {
              hasCompleted = true;
              reader.abort();
              reject(new Error('File reading timed out. The file may be too large or corrupted.'));
            }
          }, 30000);
          
          reader.onloadstart = () => {
            console.log('[Portfolio] FileReader onloadstart fired');
          };
          
          reader.onload = () => {
            console.log('[Portfolio] FileReader onload fired, readyState:', reader.readyState);
            if (hasCompleted) return;
            hasCompleted = true;
            clearTimeout(fileReadTimeout);
            try {
              const result = reader.result as string;
              console.log('[Portfolio] FileReader result type:', typeof result, 'length:', result?.length);
              if (!result) {
                reject(new Error('FileReader returned empty result'));
                return;
              }
              // Extract base64 data from data URL (remove "data:application/pdf;base64," prefix)
              const base64Data = result.split(',')[1];
              if (!base64Data || base64Data.length === 0) {
                console.log('[Portfolio] Failed to extract base64, result prefix:', result.substring(0, 100));
                reject(new Error('Failed to extract base64 data from file. Please try a different file.'));
                return;
              }
              console.log('[Portfolio] FileReader complete, base64 length:', base64Data.length);
              resolve(base64Data);
            } catch (e) {
              console.error('[Portfolio] Error in onload:', e);
              reject(new Error('Failed to process file content'));
            }
          };
          
          reader.onloadend = () => {
            console.log('[Portfolio] FileReader onloadend fired, readyState:', reader.readyState, 'error:', reader.error);
          };
          
          reader.onerror = () => {
            console.error('[Portfolio] FileReader onerror fired, error:', reader.error);
            if (hasCompleted) return;
            hasCompleted = true;
            clearTimeout(fileReadTimeout);
            reject(new Error('FileReader failed: ' + (reader.error?.message || 'Unknown error')));
          };
          
          reader.onabort = () => {
            console.log('[Portfolio] FileReader onabort fired');
            if (hasCompleted) return;
            hasCompleted = true;
            clearTimeout(fileReadTimeout);
            reject(new Error('File reading was aborted'));
          };
          
          reader.onprogress = (e) => {
            console.log('[Portfolio] FileReader onprogress:', e.loaded, '/', e.total);
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 10) + 5;
              setStatus(prev => ({ ...prev, progress: Math.min(percent, 15) }));
            }
          };
          
          // Start reading
          console.log('[Portfolio] Calling reader.readAsDataURL...');
          try {
            reader.readAsDataURL(file);
            console.log('[Portfolio] readAsDataURL called, readyState:', reader.readyState);
          } catch (readError) {
            console.error('[Portfolio] readAsDataURL threw:', readError);
            hasCompleted = true;
            clearTimeout(fileReadTimeout);
            reject(new Error('Failed to start reading file'));
          }
        });
        console.log('[Portfolio] Base64 conversion complete, length:', base64.length);
      } catch (fileError) {
        console.error('[Portfolio] File reading failed:', fileError);
        stopProgressAnimation();
        throw new Error(fileError instanceof Error ? fileError.message : 'Could not read your resume file. Please try again or use a different file.');
      }

      stopProgressAnimation();
      currentProgress = 20;
      updateStatus('extracting', 'Analyzing your resume with AI...', 20);
      startProgressAnimation(85); // Resume animation for API call
      console.log('[Portfolio] Starting API call to:', PORTFOLIO_API_ENDPOINT);

      if (DEMO_MODE) {
        await simulateDelay(1500);
        stopProgressAnimation();
        const demoData: PortfolioData = {
          personal: { name: 'John Developer', title: 'Full Stack Engineer', tagline: 'Building amazing web experiences', email: 'john@example.com', bio: 'Passionate developer with 5+ years of experience building scalable web applications.' },
          skills: { frontend: [{ name: 'React', level: 90 }, { name: 'TypeScript', level: 85 }], backend: [{ name: 'Node.js', level: 85 }] },
          experience: [{ company: 'Tech Corp', title: 'Senior Developer', period: '2020 - Present', description: 'Led development of core platform features.' }],
          projects: [{ name: 'Portfolio Builder', description: 'AI-powered portfolio generator', technologies: ['React', 'Python', 'AWS'] }],
        };
        setPortfolioData(demoData);
        updateStatus('selecting', 'Choose your portfolio template', 100);
        return;
      }

      // Call Lambda to parse resume with timeout
      let response: Response;
      try {
        console.log('[Portfolio] Preparing API request...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('[Portfolio] API request timeout triggered');
          controller.abort();
        }, 120000); // 2 minute timeout
        
        const requestBody = JSON.stringify({
          action: 'parseResume',
          userEmail: userEmail || '',
          fileName: file.name,
          fileType: file.type,
          fileContent: base64,
        });
        console.log('[Portfolio] Request body size:', requestBody.length, 'bytes');
        
        response = await fetch(PORTFOLIO_API_ENDPOINT, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: requestBody,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('[Portfolio] API response status:', response.status, response.statusText);
      } catch (fetchError) {
        console.error('[Portfolio] Fetch failed:', fetchError);
        stopProgressAnimation();
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timed out. The server is taking too long to respond. Please try again.');
          }
          if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
            throw new Error('Network error: Could not connect to the server. Please check your internet connection and try again.');
          }
        }
        throw new Error('Network error: Could not connect to the server. Please check your internet connection.');
      }

      stopProgressAnimation();

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Portfolio] API error response:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText || 'Please try again later'}`);
      }

      let result;
      try {
        result = await response.json();
        console.log('[Portfolio] API result:', result.success ? 'Success' : 'Failed', result.error || '');
      } catch (jsonError) {
        console.error('[Portfolio] Failed to parse API response:', jsonError);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to parse resume');
      }

      setPortfolioData(result.portfolioData);
      updateStatus('selecting', 'Choose your portfolio template', 100);
      console.log('[Portfolio] Resume parsing complete!');

    } catch (error) {
      stopProgressAnimation();
      console.error('[Portfolio] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse resume';
      updateStatus('error', errorMessage, 0);
      setDeploymentResult({ success: false, error: errorMessage });
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

  // Update preview when template changes (debounced for edit mode)
  useEffect(() => {
    if (portfolioData && status.stage === 'selecting') {
      // Debounce preview updates when in edit mode
      if (isEditMode) {
        const timeoutId = setTimeout(() => {
          fetchPreview(selectedTemplate);
        }, 800); // Wait 800ms after user stops typing
        return () => clearTimeout(timeoutId);
      } else {
      fetchPreview(selectedTemplate);
    }
    }
  }, [selectedTemplate, portfolioData, status.stage, isEditMode]);

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

    // Animated progress for deployment
    let deployProgress = 20;
    const deployInterval = setInterval(() => {
      if (deployProgress < 90) {
        deployProgress += Math.random() * 5 + 2;
        if (deployProgress > 90) deployProgress = 90;
        setStatus(prev => ({ ...prev, progress: Math.round(deployProgress) }));
      }
    }, 400);

    try {
      updateStatus('deploying', 'Deploying your portfolio to Vercel...', 20);

      if (DEMO_MODE) {
        await simulateDelay(2000);
        clearInterval(deployInterval);
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

      clearInterval(deployInterval);
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
      clearInterval(deployInterval);
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
    setShowDeployConfirm(false);
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
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute inset-2 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <svg className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '1s' }} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{status.message}</h2>
                <p className="text-gray-500 mb-4">
                  {status.progress < 30 && 'Reading your document...'}
                  {status.progress >= 30 && status.progress < 50 && 'Extracting text content...'}
                  {status.progress >= 50 && status.progress < 70 && 'Identifying skills & experience...'}
                  {status.progress >= 70 && status.progress < 85 && 'Building your profile data...'}
                  {status.progress >= 85 && 'Almost done...'}
                </p>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${status.progress}%`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite linear'
                    }} 
                  />
                </div>
                <p className="text-xs text-gray-600">{Math.round(status.progress)}% complete</p>
                <style>{`
                  @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                  }
                `}</style>
              </div>
            </div>
          )}

          {/* STAGE: Template Selection with Live Preview */}
          {status.stage === 'selecting' && portfolioData && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Side - Template Selection OR Edit Form */}
              <div>
                {!isEditMode ? (
                  <>
                    {/* Template Selection - Show when not editing */}
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

                    {/* Summary - Show when not editing */}
                <div className="mt-6 p-4 bg-[#16161f] rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="text-green-400">✓</span> Extracted from your resume
                  </h3>
                      </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> <span className="text-white">{portfolioData.personal?.name || 'Not found'}</span></p>
                    <p><span className="text-gray-500">Title:</span> <span className="text-white">{portfolioData.personal?.title || 'Not found'}</span></p>
                    <p><span className="text-gray-500">Experience:</span> <span className="text-white">{portfolioData.experience?.length || 0} positions</span></p>
                    <p><span className="text-gray-500">Skills:</span> <span className="text-white">{Object.values(portfolioData.skills || {}).flat().length} skills</span></p>
                        <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-white/5">
                          Click "Edit" button above to customize your portfolio content
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Edit Mode - Full Edit Form */
                  <div className="p-4 bg-[#16161f] rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Your Details
                      </h3>
                      <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        Auto-saving
                      </span>
                    </div>
                    <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                      {/* Personal Info */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-violet-400 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Personal Info
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                            <input
                              type="text"
                              value={portfolioData.personal?.name || ''}
                              onChange={(e) => updatePortfolioField('personal', 'name', e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors"
                              placeholder="Your Name"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Job Title</label>
                            <input
                              type="text"
                              value={portfolioData.personal?.title || ''}
                              onChange={(e) => updatePortfolioField('personal', 'title', e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors"
                              placeholder="Software Developer"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Email</label>
                            <input
                              type="email"
                              value={portfolioData.personal?.email || ''}
                              onChange={(e) => updatePortfolioField('personal', 'email', e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors"
                              placeholder="your@email.com"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                            <input
                              type="tel"
                              value={portfolioData.personal?.phone || ''}
                              onChange={(e) => updatePortfolioField('personal', 'phone', e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors"
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Location
                          </label>
                          <input
                            type="text"
                            value={portfolioData.personal?.location || ''}
                            onChange={(e) => updatePortfolioField('personal', 'location', e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors"
                            placeholder="San Francisco, CA"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Bio / Summary</label>
                          <textarea
                            value={portfolioData.personal?.bio || ''}
                            onChange={(e) => updatePortfolioField('personal', 'bio', e.target.value)}
                            rows={3}
                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors resize-none"
                            placeholder="A brief description about yourself..."
                          />
                        </div>
                  </div>
                  
                      {/* Experience */}
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-violet-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Experience ({portfolioData.experience?.length || 0})
                          </h4>
                      <button
                            onClick={addExperience}
                            className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-xs font-medium transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                        </div>
                        {portfolioData.experience && portfolioData.experience.map((exp, index) => (
                          <div key={index} className="bg-[#0a0a0f] rounded-lg p-3 space-y-2 relative group">
                            <button
                              onClick={() => removeExperience(index)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={exp.title || ''}
                                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                className="bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                                placeholder="Job Title"
                              />
                              <input
                                type="text"
                                value={exp.company || ''}
                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                className="bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                                placeholder="Company"
                              />
                            </div>
                            <input
                              type="text"
                              value={exp.period || ''}
                              onChange={(e) => updateExperience(index, 'period', e.target.value)}
                              className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:border-violet-500 focus:outline-none"
                              placeholder="2020 - Present"
                            />
                            <textarea
                              value={exp.description || ''}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-violet-500 focus:outline-none resize-none"
                              placeholder="Description..."
                            />
                          </div>
                        ))}
                        {(!portfolioData.experience || portfolioData.experience.length === 0) && (
                          <p className="text-xs text-gray-500 text-center py-2">No experience added. Click "+ Add" to add one.</p>
                        )}
                      </div>

                      {/* Projects */}
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-violet-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Projects ({portfolioData.projects?.length || 0})
                          </h4>
                          <button
                            onClick={addProject}
                            className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-xs font-medium transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                          </div>
                        {portfolioData.projects && portfolioData.projects.map((project, index) => (
                          <div key={index} className="bg-[#0a0a0f] rounded-lg p-3 space-y-2 relative group">
                            <button
                              onClick={() => removeProject(index)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <input
                              type="text"
                              value={project.name || ''}
                              onChange={(e) => updateProject(index, 'name', e.target.value)}
                              className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-medium focus:border-violet-500 focus:outline-none"
                              placeholder="Project Name"
                            />
                            <textarea
                              value={project.description || ''}
                              onChange={(e) => updateProject(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-violet-500 focus:outline-none resize-none"
                              placeholder="Project description..."
                            />
                            {/* Tech Stack */}
                            <div className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              <input
                                type="text"
                                value={project.technologies?.join(', ') || ''}
                                onChange={(e) => {
                                  // Keep the raw input for display, but also store the array
                                  const rawValue = e.target.value;
                                  // Split by comma and trim, but keep empty strings during typing
                                  const techs = rawValue.split(',').map(t => t.trim());
                                  // Filter out completely empty strings only
                                  const filteredTechs = techs.filter(t => t.length > 0);
                                  updateProject(index, 'technologies', filteredTechs);
                                }}
                                className="flex-1 bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-emerald-400 focus:border-violet-500 focus:outline-none placeholder:text-gray-500"
                                placeholder="Tech stack (React, Node.js, PostgreSQL...)"
                              />
                        </div>
                            {/* URLs */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                                <input
                                  type="url"
                                  value={project.github || ''}
                                  onChange={(e) => updateProject(index, 'github', e.target.value)}
                                  className="flex-1 bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:border-violet-500 focus:outline-none placeholder:text-gray-500"
                                  placeholder="GitHub URL"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <input
                                  type="url"
                                  value={project.url || ''}
                                  onChange={(e) => updateProject(index, 'url', e.target.value)}
                                  className="flex-1 bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-blue-400 focus:border-violet-500 focus:outline-none placeholder:text-gray-500"
                                  placeholder="Live Demo URL"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!portfolioData.projects || portfolioData.projects.length === 0) && (
                          <p className="text-xs text-gray-500 text-center py-2">No projects added. Click "+ Add" to add one.</p>
                      )}
                    </div>

                      {/* Education */}
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-violet-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                            Education ({portfolioData.education?.length || 0})
                          </h4>
                          <button
                            onClick={addEducation}
                            className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-xs font-medium transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                        </div>
                        {portfolioData.education && portfolioData.education.map((edu, index) => (
                          <div key={index} className="bg-[#0a0a0f] rounded-lg p-3 space-y-2 relative group">
                            <button
                              onClick={() => removeEducation(index)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="grid grid-cols-[1fr_100px] gap-2">
                              <input
                                type="text"
                                value={edu.degree || ''}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                className="bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                                placeholder="Degree / Institution"
                              />
                              <input
                                type="text"
                                value={edu.year || ''}
                                onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                className="bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:border-violet-500 focus:outline-none"
                                placeholder="Year"
                              />
                            </div>
                          </div>
                        ))}
                        {(!portfolioData.education || portfolioData.education.length === 0) && (
                          <p className="text-xs text-gray-500 text-center py-2">No education added. Click "+ Add" to add one.</p>
                  )}
                </div>

                      {/* Skills */}
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-violet-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Skills ({Object.values(portfolioData.skills || {}).flat().length})
                          </h4>
                          <button
                            onClick={() => addSkill('other')}
                            className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-xs font-medium transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                        </div>
                        {portfolioData.skills && Object.entries(portfolioData.skills).map(([category, skills]) => (
                          <div key={category} className="space-y-2">
                            <p className="text-xs text-gray-500 capitalize">{category}</p>
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill, index) => {
                                const skillName = typeof skill === 'string' ? skill : skill.name;
                                return (
                                  <div key={index} className="group relative flex items-center gap-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-1">
                                    <input
                                      type="text"
                                      value={skillName}
                                      onChange={(e) => updateSkill(category, index, 'name', e.target.value)}
                                      className="bg-transparent text-xs text-white focus:outline-none w-20"
                                      placeholder="Skill"
                                    />
                                    <button
                                      onClick={() => removeSkill(category, index)}
                                      className="w-4 h-4 bg-red-500/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        {(!portfolioData.skills || Object.keys(portfolioData.skills).length === 0) && (
                          <p className="text-xs text-gray-500 text-center py-2">No skills added. Click "+ Add" to add one.</p>
                        )}
                      </div>

                      {/* Links */}
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <h4 className="text-sm font-medium text-violet-400 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Links
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">GitHub</label>
                            <input
                              type="url"
                              value={portfolioData.links?.github || ''}
                              onChange={(e) => updatePortfolioField('links', 'github', e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                              placeholder="https://github.com/username"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">LinkedIn</label>
                            <input
                              type="url"
                              value={portfolioData.links?.linkedin || ''}
                              onChange={(e) => updatePortfolioField('links', 'linkedin', e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                              placeholder="https://linkedin.com/in/username"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Twitter / X</label>
                            <input
                              type="url"
                              value={portfolioData.links?.twitter || ''}
                              onChange={(e) => updatePortfolioField('links', 'twitter', e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                              placeholder="https://twitter.com/username"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Website</label>
                            <input
                              type="url"
                              value={portfolioData.links?.website || ''}
                              onChange={(e) => updatePortfolioField('links', 'website', e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deploy Button */}
                <button
                  onClick={() => setShowDeployConfirm(true)}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-violet-500/25"
                >
                  🚀 Deploy Portfolio
                </button>

                {/* Deploy Confirmation Modal */}
                {showDeployConfirm && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#16161f] rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Ready to Deploy?</h3>
                        <p className="text-gray-400 text-sm">
                          Your portfolio will be live on the web in seconds. Make sure you've reviewed all the details!
                        </p>
                      </div>
                      
                      {/* Quick Summary */}
                      <div className="bg-[#0a0a0f] rounded-xl p-4 mb-6 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Template:</span>
                          <span className="text-white font-medium">{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Name:</span>
                          <span className="text-white">{portfolioData?.personal?.name || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Projects:</span>
                          <span className="text-white">{portfolioData?.projects?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Experience:</span>
                          <span className="text-white">{portfolioData?.experience?.length || 0} positions</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeployConfirm(false)}
                          className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setShowDeployConfirm(false);
                            deployPortfolio();
                          }}
                          className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Deploy Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Live Preview</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isEditMode 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                      }`}
                    >
                      {isEditMode ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Done
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </>
                      )}
                    </button>
                    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
                    {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                  </span>
                  </div>
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
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute inset-2 rounded-full bg-purple-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <span className="text-3xl animate-bounce" style={{ animationDuration: '1s' }}>🚀</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Deploying to Vercel</h2>
                <p className="text-gray-500 mb-4">
                  {status.progress < 40 && 'Generating your portfolio...'}
                  {status.progress >= 40 && status.progress < 60 && 'Uploading to Vercel cloud...'}
                  {status.progress >= 60 && status.progress < 80 && 'Configuring your domain...'}
                  {status.progress >= 80 && 'Finalizing deployment...'}
                </p>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${status.progress}%`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite linear'
                    }} 
                  />
                </div>
                <p className="text-xs text-gray-600">{Math.round(status.progress)}% complete</p>
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
