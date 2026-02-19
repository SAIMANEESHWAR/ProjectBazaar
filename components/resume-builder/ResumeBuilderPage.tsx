import React, { useState, useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import { useNavigation, useAuth } from '../../App';
import { ResumeInfoProvider, useResumeInfo } from '../../context/ResumeInfoContext';
import PersonalDetailForm from './PersonalDetailForm';
import SummaryForm from './SummaryForm';
import ExperienceForm from './ExperienceForm';
import EducationForm from './EducationForm';
import SkillsForm from './SkillsForm';
import ProjectsForm from './ProjectsForm';
import ResumePreview from './ResumePreview';
import ThemeColorPicker from './ThemeColorPicker';
import TemplatePicker from './TemplatePicker';
import { getLlmKeysStatus, getAtsScore, buildResumeTextFromInfo, type AtsResult } from '../../services/atsService';
import personalAvatarAnimation from '../../lottiefiles/personal_avatar.json';
import educationSuitcaseAnimation from '../../lottiefiles/education_suitcase.json';
import summaryDocumentAnimation from '../../lottiefiles/summary_document.json';
import experienceComputerAnimation from '../../lottiefiles/experience_computer.json';
import skillsEditAnimation from '../../lottiefiles/edit_pencil.json';
import projectsBarchartAnimation from '../../lottiefiles/projects_barchart.json';

const STEPS = [
  { id: 1, name: 'Personal', shortName: 'Info', icon: '👤', lottieAnimation: personalAvatarAnimation },
  { id: 2, name: 'Summary', shortName: 'Sum', icon: '📝', lottieAnimation: summaryDocumentAnimation },
  { id: 3, name: 'Experience', shortName: 'Exp', icon: '💼', lottieAnimation: experienceComputerAnimation },
  { id: 4, name: 'Education', shortName: 'Edu', icon: '🎓', lottieAnimation: educationSuitcaseAnimation },
  { id: 5, name: 'Skills', shortName: 'Skills', icon: '⚡', lottieAnimation: skillsEditAnimation },
  { id: 6, name: 'Projects', shortName: 'Proj', icon: '🚀', lottieAnimation: projectsBarchartAnimation },
];

interface ResumeBuilderContentProps {
  embedded?: boolean;
  onBack?: () => void;
  toggleSidebar?: () => void;
  onNavigateToSettings?: () => void;
}

// Helper function to convert hex color to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ResumeBuilderContent: React.FC<ResumeBuilderContentProps> = ({ embedded = false, onBack, toggleSidebar, onNavigateToSettings }) => {
  const { navigateTo } = useNavigation();
  const { userId } = useAuth();
  const { resumeInfo, saveResume, savedResumes, loadResume, resetResume, deleteResume } = useResumeInfo();
  
  const [activeStep, setActiveStep] = useState(1);
  const [enableNext, setEnableNext] = useState(true);
  const [showSavedResumes, setShowSavedResumes] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // ATS Score: key status and modal
  const [hasAnyLlmKey, setHasAnyLlmKey] = useState(false);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [showAtsLockedMessage, setShowAtsLockedMessage] = useState(false);
  const [jobDescriptionForAts, setJobDescriptionForAts] = useState('');
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState<string | null>(null);

  // Map step IDs to section IDs and fallback heading text for scrolling
  const stepToSectionMap: { [key: number]: { id: string; headings: string[] } } = {
    1: { id: 'resume-section-personal', headings: ['Personal', 'Contact', 'Header'] },
    2: { id: 'resume-section-summary', headings: ['Summary', 'Professional Summary', 'About Me', 'Professional Profile', 'Objective'] },
    3: { id: 'resume-section-experience', headings: ['Experience', 'Professional Experience', 'Work Experience', 'Employment'] },
    4: { id: 'resume-section-education', headings: ['Education', 'Academic', 'Qualifications'] },
    5: { id: 'resume-section-skills', headings: ['Skills', 'Core Competencies', 'Technical Skills', 'Expertise'] },
    6: { id: 'resume-section-projects', headings: ['Projects', 'Key Projects', 'Portfolio', 'Work Samples'] },
  };

  // Scroll to corresponding section in preview when step changes
  useEffect(() => {
    const sectionInfo = stepToSectionMap[activeStep];
    if (sectionInfo && previewRef.current) {
      // Remove previous highlights
      previewRef.current.querySelectorAll('.resume-section-highlight').forEach((el) => {
        el.classList.remove('resume-section-highlight');
      });

      // Wait a bit for the DOM to update
      setTimeout(() => {
        // First try to find by ID
        let section = previewRef.current?.querySelector(`#${sectionInfo.id}`) as HTMLElement;
        
        // If not found by ID, try to find by heading text
        if (!section) {
          for (const heading of sectionInfo.headings) {
            const headings = previewRef.current?.querySelectorAll('h2, h3');
            headings?.forEach((h) => {
              if (h.textContent?.toLowerCase().includes(heading.toLowerCase())) {
                section = (h.closest('section') || h.parentElement) as HTMLElement;
              }
            });
            if (section) break;
          }
        }
        
        if (section) {
          // Add highlight class
          section.classList.add('resume-section-highlight');
          
          // Scroll to section
          section.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });

          // Remove highlight after 2 seconds
          setTimeout(() => {
            section?.classList.remove('resume-section-highlight');
          }, 2000);
        }
      }, 100);
    }
  }, [activeStep]);

  // Fetch whether user has any LLM API key (for ATS unlock)
  useEffect(() => {
    if (!userId) {
      setHasAnyLlmKey(false);
      return;
    }
    getLlmKeysStatus(userId).then((status) => {
      setHasAnyLlmKey(!!status.hasOpenAiKey || !!status.hasGeminiKey || !!status.hasClaudeKey);
    }).catch(() => setHasAnyLlmKey(false));
  }, [userId]);

  const handleAtsClick = () => {
    if (!hasAnyLlmKey) {
      setShowAtsLockedMessage(true);
      return;
    }
    setShowAtsModal(true);
    setAtsResult(null);
    setAtsError(null);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigateTo('dashboard');
    }
  };

  const handleNext = () => {
    if (activeStep < STEPS.length) {
      setActiveStep(activeStep + 1);
      setEnableNext(true);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Find the actual resume content div (skip the wrapper)
    let resumeContent = '';
    if (previewRef.current) {
      // previewRef.current is the wrapper div, we need the first child div which is the ResumePreview template
      // The template is typically the first div child that contains sections or has bg-white
      const firstChild = previewRef.current.firstElementChild as HTMLElement;
      
      if (firstChild && firstChild.tagName === 'DIV') {
        // Clone to preserve all inline styles
        const cloned = firstChild.cloneNode(true) as HTMLElement;
        // Remove any highlight classes that might be present
        cloned.querySelectorAll('.resume-section-highlight').forEach(el => {
          el.classList.remove('resume-section-highlight');
        });
        // Get the outerHTML to preserve all attributes and inline styles
        resumeContent = cloned.outerHTML;
      } else {
        // Fallback: try to find div with resume sections
        const resumeDiv = previewRef.current.querySelector('[id^="resume-section"]')?.closest('div');
        if (resumeDiv) {
          const cloned = resumeDiv.cloneNode(true) as HTMLElement;
          cloned.querySelectorAll('.resume-section-highlight').forEach(el => {
            el.classList.remove('resume-section-highlight');
          });
          resumeContent = cloned.outerHTML;
        } else {
          // Last fallback: get innerHTML
          resumeContent = previewRef.current.innerHTML;
        }
      }
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeInfo.firstName} ${resumeInfo.lastName} - Resume</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: white;
              color: #1f2937;
              line-height: 1.5;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Container styles */
            .bg-white { background-color: white; }
            .text-white { color: white; }
            .text-gray-900 { color: #111827; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-300 { color: #d1d5db; }
            .text-gray-200 { color: #e5e7eb; }
            .text-gray-100 { color: #f3f4f6; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-200 { background-color: #e5e7eb; }
            .bg-gray-800 { background-color: #1f2937; }
            .bg-gray-900 { background-color: #111827; }
            
            /* Typography */
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-base { font-size: 1rem; line-height: 1.5rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .font-normal { font-weight: 400; }
            .font-mono { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; }
            .italic { font-style: italic; }
            
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-wide { letter-spacing: 0.025em; }
            .leading-relaxed { line-height: 1.625; }
            .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            
            /* Spacing */
            .p-8 { padding: 2rem; }
            .p-6 { padding: 1.5rem; }
            .p-4 { padding: 1rem; }
            .p-3 { padding: 0.75rem; }
            .p-2 { padding: 0.5rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
            .pl-4 { padding-left: 1rem; }
            .pl-6 { padding-left: 1.5rem; }
            
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-5 { margin-bottom: 1.25rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-0\\.5 { margin-top: 0.125rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-3 { margin-top: 0.75rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            .ml-1 { margin-left: 0.25rem; }
            .ml-2 { margin-left: 0.5rem; }
            .pb-1 { padding-bottom: 0.25rem; }
            .pb-2 { padding-bottom: 0.5rem; }
            .pb-4 { padding-bottom: 1rem; }
            .max-w-2xl { max-width: 42rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            
            /* Flexbox & Grid */
            .flex { display: flex; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .flex-wrap { flex-wrap: wrap; }
            .flex-1 { flex: 1 1 0%; }
            .flex-shrink-0 { flex-shrink: 0; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .items-end { align-items: flex-end; }
            .items-baseline { align-items: baseline; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            
            .gap-0\\.5 { gap: 0.125rem; }
            .gap-1 { gap: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .gap-8 { gap: 2rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            
            .whitespace-nowrap { white-space: nowrap; }
            
            /* Border and shapes */
            .rounded-full { border-radius: 9999px; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded { border-radius: 0.25rem; }
            .overflow-hidden { overflow: hidden; }
            
            .border { border-width: 1px; border-style: solid; }
            .border-l { border-left-width: 1px; border-left-style: solid; }
            .border-l-2 { border-left-width: 2px; border-left-style: solid; }
            .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
            .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
            .border-t { border-top-width: 1px; border-top-style: solid; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            
            /* Sizing */
            .w-2 { width: 0.5rem; }
            .w-3 { width: 0.75rem; }
            .w-16 { width: 4rem; }
            .w-full { width: 100%; }
            .h-1 { height: 0.25rem; }
            .h-1\\.5 { height: 0.375rem; }
            .h-2 { height: 0.5rem; }
            .h-3 { height: 0.75rem; }
            .h-full { height: 100%; }
            .h-16 { height: 4rem; }
            
            /* Positioning */
            .relative { position: relative; }
            .absolute { position: absolute; }
            .top-1 { top: 0.25rem; }
            .left-0 { left: 0; }
            .left-1\\.5 { left: 0.375rem; }
            .top-4 { top: 1rem; }
            
            /* HR styling */
            hr {
              border: none;
              border-top-width: 1px;
              border-top-style: solid;
              margin-top: 0;
              margin-bottom: 0;
            }
            
            /* Rich text content */
            .rich-text-content ul {
              list-style-type: disc;
              padding-left: 1.25rem;
              margin: 0.375rem 0;
            }
            .rich-text-content ol {
              list-style-type: decimal;
              padding-left: 1.25rem;
              margin: 0.375rem 0;
            }
            .rich-text-content li {
              display: list-item;
              margin: 0.25rem 0;
              padding-left: 0.25rem;
            }
            .rich-text-content a {
              color: inherit;
              text-decoration: underline;
            }
            .rich-text-content p {
              margin: 0.25rem 0;
            }
            
            /* Links */
            a { text-decoration: none; color: inherit; }
            .hover\\:underline:hover { text-decoration: underline; }
            
            /* Section container */
            section { page-break-inside: avoid; }
            
            /* Ensure all inline styles and colors are preserved */
            [style] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Print styles */
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0;
                padding: 0;
              }
              @page { 
                margin: 0.4in; 
                size: letter;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Force colors to print */
              [style*="color"], [style*="background"], [style*="border"] {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          ${resumeContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleSave = () => {
    saveResume();
    setShowSaveToast(true);
    // Auto-hide toast after 4 seconds
    setTimeout(() => {
      setShowSaveToast(false);
    }, 4000);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return <PersonalDetailForm onEnableNext={setEnableNext} />;
      case 2:
        return <SummaryForm onEnableNext={setEnableNext} />;
      case 3:
        return <ExperienceForm />;
      case 4:
        return <EducationForm />;
      case 5:
        return <SkillsForm />;
      case 6:
        return <ProjectsForm />;
      default:
        return null;
    }
  };

  return (
    <div className={embedded ? "h-full bg-gray-50 overflow-auto" : "min-h-screen bg-gray-50"}>
      {/* Header - Simplified when embedded in dashboard */}
      {embedded ? (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Button */}
              {toggleSidebar && (
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 hidden sm:block">Create your professional resume</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleAtsClick}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${hasAnyLlmKey ? 'text-orange-600 border border-orange-200 hover:bg-orange-50' : 'text-gray-400 border border-gray-200 hover:bg-gray-50 cursor-pointer'}`}
                title={hasAnyLlmKey ? 'Check ATS score for your resume' : 'Add an API key in Settings to unlock ATS Score'}
              >
                {hasAnyLlmKey ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2h12z" />
                  </svg>
                )}
                <span className="hidden sm:inline">ATS Score</span>
              </button>
              <TemplatePicker />
              <ThemeColorPicker />
              <button
                onClick={() => setShowSavedResumes(!showSavedResumes)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="hidden sm:inline">My Resumes</span> ({savedResumes.length})
              </button>
            </div>
          </div>
        </header>
      ) : (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
            {/* Mobile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={handleBack} className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm sm:text-lg font-bold text-gray-900 truncate">Resume Builder</h1>
                    <p className="text-[10px] sm:text-xs text-gray-500 hidden md:block">Create your professional resume</p>
                  </div>
                </div>
              </div>
              
              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={handleAtsClick}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${hasAnyLlmKey ? 'text-orange-600 border border-orange-200 hover:bg-orange-50' : 'text-gray-400 border border-gray-200 hover:bg-gray-50'}`}
                  title={hasAnyLlmKey ? 'Check ATS score' : 'Add API key in Settings to unlock'}
                >
                  {hasAnyLlmKey ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2h12z" />
                    </svg>
                  )}
                  ATS Score
                </button>
                <TemplatePicker />
                <ThemeColorPicker />
                <button
                  onClick={() => setShowSavedResumes(!showSavedResumes)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  My Resumes ({savedResumes.length})
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {showMobileMenu && (
              <div className="md:hidden mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <TemplatePicker />
                  <ThemeColorPicker />
                </div>
                <button
                  onClick={() => { handleAtsClick(); setShowMobileMenu(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border transition-all ${hasAnyLlmKey ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                  {hasAnyLlmKey ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2h12z" />
                    </svg>
                  )}
                  ATS Score
                </button>
                <button
                  onClick={() => {
                    setShowSavedResumes(!showSavedResumes);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  My Resumes ({savedResumes.length})
                </button>
                <button
                  onClick={() => {
                    setShowMobilePreview(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Resume
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Saved Resumes Dropdown - Mobile optimized */}
      {showSavedResumes && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowSavedResumes(false)} />
          <div className="fixed inset-x-3 top-20 sm:inset-auto sm:top-20 sm:right-6 z-50 sm:w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Saved Resumes</h3>
              <button
                onClick={() => {
                  resetResume();
                  setActiveStep(1);
                  setShowSavedResumes(false);
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                + New Resume
              </button>
            </div>
            
            {savedResumes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No saved resumes yet</p>
            ) : (
              <div className="space-y-2">
                {savedResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      resumeInfo.id === resume.id
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => {
                          loadResume(resume.id!);
                          setShowSavedResumes(false);
                        }}
                        className="flex-1 text-left"
                      >
                        <p className="font-medium text-gray-900 text-sm">
                          {resume.firstName} {resume.lastName || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500">{resume.jobTitle || 'No title'}</p>
                        {resume.updatedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(resume.updatedAt).toLocaleDateString()}
                          </p>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this resume?')) {
                            deleteResume(resume.id!);
                          }
                        }}
                        className="p-1 text-red-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile Preview Modal */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobilePreview(false)} />
          <div className="fixed inset-3 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Resume Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <ResumePreview />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-4 sm:py-8 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero - Hidden on mobile for space efficiency */}
          <div className="text-center mb-4 sm:mb-8 hidden sm:block">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 mb-4">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm text-orange-600 font-medium">AI-Powered Resume Builder</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Build Your <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Professional Resume</span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Create a stunning resume with AI-powered suggestions in minutes
            </p>
          </div>

          {/* Step Progress - Mobile optimized */}
          <div className="mb-4 sm:mb-8">
            {/* Mobile: Compact step indicator */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Step {activeStep} of {STEPS.length}</span>
                <span className="text-xs font-medium text-orange-600">{STEPS[activeStep - 1].name}</span>
              </div>
              <div className="flex gap-1">
                {STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      activeStep === step.id
                        ? 'bg-orange-500'
                        : step.id < activeStep
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              {/* Mobile step navigation */}
              <div className="flex gap-1 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                {STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      activeStep === step.id
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : step.id < activeStep
                        ? 'bg-green-50 text-green-600 border border-green-100'
                        : 'bg-gray-100 text-gray-500 border border-transparent'
                    }`}
                  >
                    {step.id < activeStep ? (
                      <span className="text-[10px]">✓</span>
                    ) : step.lottieAnimation ? (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <Lottie animationData={step.lottieAnimation} loop className="w-full h-full" />
                      </div>
                    ) : (
                      <span className="text-[10px]">{step.icon}</span>
                    )}
                    <span>{step.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: Full step progress */}
            <div className="hidden sm:flex items-center justify-center gap-2 overflow-x-auto pb-2">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      activeStep === step.id
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : step.id < activeStep
                        ? 'bg-green-50 text-green-600 border border-green-100'
                        : 'bg-gray-100 text-gray-500 border border-transparent'
                    }`}
                  >
                    {step.id < activeStep ? (
                      <span>✓</span>
                    ) : step.lottieAnimation ? (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <Lottie animationData={step.lottieAnimation} loop className="w-full h-full" />
                      </div>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                    <span>{step.name}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`w-6 h-0.5 ${step.id < activeStep ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Form Section */}
            <div className="space-y-4 sm:space-y-6">
              {renderStepContent()}

              {/* Navigation Buttons - Mobile optimized */}
              <div className="space-y-3">
                {/* Row 1: Preview button (mobile/tablet only) */}
                <button
                  onClick={() => setShowMobilePreview(true)}
                  className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Resume
                </button>

                {/* Row 2: Navigation buttons */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={activeStep === 1}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </button>

                  {activeStep < STEPS.length ? (
                    <button
                      onClick={handleNext}
                      disabled={!enableNext}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25"
                    >
                      Next
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleDownload}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/25"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Section - Hidden on mobile, shown in modal */}
            <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Live Preview</h2>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-orange-600 bg-white border border-orange-500 rounded-lg hover:bg-orange-50 hover:border-orange-600 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
              <div 
                ref={previewRef}
                className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200"
                style={{ 
                  maxHeight: 'calc(100vh - 180px)',
                  overflowY: 'auto',
                }}
              >
                <style>{`
                  .resume-section-highlight {
                    animation: highlightPulse 2s ease-in-out;
                    border-radius: 8px;
                    padding: 8px;
                    margin: -8px;
                    transition: all 0.3s ease;
                    position: relative;
                  }
                  
                  .resume-section-highlight::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background-color: ${resumeInfo.themeColor || '#f97316'};
                    border-radius: 2px;
                    animation: slideIn 0.3s ease-out;
                  }
                  
                  @keyframes slideIn {
                    from {
                      transform: scaleY(0);
                    }
                    to {
                      transform: scaleY(1);
                    }
                  }
                  
                  @keyframes highlightPulse {
                    0% {
                      background-color: ${hexToRgba(resumeInfo.themeColor || '#f97316', 0.2)};
                      box-shadow: 0 0 0 0 ${hexToRgba(resumeInfo.themeColor || '#f97316', 0.4)};
                    }
                    50% {
                      background-color: ${hexToRgba(resumeInfo.themeColor || '#f97316', 0.15)};
                      box-shadow: 0 0 20px 5px ${hexToRgba(resumeInfo.themeColor || '#f97316', 0.2)};
                    }
                    100% {
                      background-color: transparent;
                      box-shadow: 0 0 0 0 ${hexToRgba(resumeInfo.themeColor || '#f97316', 0)};
                    }
                  }
                `}</style>
                <ResumePreview />
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                Your changes are saved automatically and reflected in real-time
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ATS Locked message modal */}
      {showAtsLockedMessage && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setShowAtsLockedMessage(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2h12z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">ATS Score is locked</h3>
                <p className="text-sm text-gray-500">Unlock to check how your resume matches job descriptions</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Upload an API key in <strong>Settings</strong> to unlock this feature. Add at least one key (OpenAI, Google Gemini, or Anthropic Claude), then you can get an ATS score for your resume against any job description.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAtsLockedMessage(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                Close
              </button>
              <button onClick={() => { setShowAtsLockedMessage(false); onNavigateToSettings ? onNavigateToSettings() : navigateTo('dashboard'); }} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg">
                {onNavigateToSettings ? 'Go to Settings' : 'Go to Dashboard'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ATS Score modal */}
      {showAtsModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setShowAtsModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">ATS Score</h2>
              <button onClick={() => setShowAtsModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job description</label>
                <textarea
                  value={jobDescriptionForAts}
                  onChange={(e) => setJobDescriptionForAts(e.target.value)}
                  placeholder="Paste the full job description here to see how your resume matches..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setJobDescriptionForAts('')}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    const text = buildResumeTextFromInfo(resumeInfo);
                    if (!userId) return;
                    setAtsError(null);
                    setAtsResult(null);
                    setAtsLoading(true);
                    getAtsScore(userId, text, jobDescriptionForAts)
                      .then((r) => {
                        if (r.success && r.atsResult) setAtsResult(r.atsResult);
                        else setAtsError(r.message || 'Could not get score');
                      })
                      .catch(() => setAtsError('Something went wrong. Try again.'))
                      .finally(() => setAtsLoading(false));
                  }}
                  disabled={atsLoading || !jobDescriptionForAts.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {atsLoading ? 'Analyzing...' : 'Get ATS Score'}
                </button>
              </div>
              {atsError && <p className="text-sm text-red-600">{atsError}</p>}
              {atsResult && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-20 h-20 rounded-full border-4 border-orange-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-orange-600">{atsResult.overallScore}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Overall match</p>
                      <p className="text-sm text-gray-500">0–100% fit for this job</p>
                    </div>
                  </div>
                  {atsResult.breakdown && Object.keys(atsResult.breakdown).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Breakdown</p>
                      <div className="space-y-2">
                        {Object.entries(atsResult.breakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="w-28 text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, Number(value)))}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-8">{typeof value === 'number' ? value : 0}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {atsResult.matchedKeywords?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Matched keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {atsResult.matchedKeywords.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {atsResult.missingKeywords?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Missing or weak</p>
                      <div className="flex flex-wrap gap-1">
                        {atsResult.missingKeywords.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {atsResult.feedback?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Feedback</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                        {atsResult.feedback.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Save Toast Notification */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-orange-300/80 bg-white/95 backdrop-blur-sm animate-slide-up">
          {/* Success Icon */}
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Message */}
          <span className="text-sm font-medium text-gray-800">Resume saved successfully!</span>
          
          {/* Close Button */}
          <button
            onClick={() => setShowSaveToast(false)}
            className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <style>{`
            @keyframes slide-up {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .animate-slide-up { animation: slide-up 0.3s ease-out; }
          `}</style>
        </div>
      )}
    </div>
  );
};

interface ResumeBuilderPageProps {
  embedded?: boolean;
  onBack?: () => void;
  toggleSidebar?: () => void;
  onNavigateToSettings?: () => void;
}

const ResumeBuilderPage: React.FC<ResumeBuilderPageProps> = ({ embedded = false, onBack, toggleSidebar, onNavigateToSettings }) => {
  return (
    <ResumeInfoProvider>
      <ResumeBuilderContent embedded={embedded} onBack={onBack} toggleSidebar={toggleSidebar} onNavigateToSettings={onNavigateToSettings} />
    </ResumeInfoProvider>
  );
};

export default ResumeBuilderPage;
