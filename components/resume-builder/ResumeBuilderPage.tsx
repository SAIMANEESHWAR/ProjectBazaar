import React, { useState, useRef, useEffect } from 'react';
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

const STEPS = [
  { id: 1, name: 'Personal', shortName: 'Info', icon: '👤' },
  { id: 2, name: 'Summary', shortName: 'Sum', icon: '📝' },
  { id: 3, name: 'Experience', shortName: 'Exp', icon: '💼' },
  { id: 4, name: 'Education', shortName: 'Edu', icon: '🎓' },
  { id: 5, name: 'Skills', shortName: 'Skills', icon: '⚡' },
  { id: 6, name: 'Projects', shortName: 'Proj', icon: '🚀' },
];

interface ResumeBuilderContentProps {
  embedded?: boolean;
  onBack?: () => void;
  toggleSidebar?: () => void;
}

// Helper function to convert hex color to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ResumeBuilderContent: React.FC<ResumeBuilderContentProps> = ({ embedded = false, onBack, toggleSidebar }) => {
  const { navigateTo } = useNavigation();
  useAuth();
  const { resumeInfo, saveResume, savedResumes, loadResume, resetResume, deleteResume } = useResumeInfo();
  
  const [activeStep, setActiveStep] = useState(1);
  const [enableNext, setEnableNext] = useState(true);
  const [showSavedResumes, setShowSavedResumes] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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

    const previewContent = previewRef.current?.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeInfo.firstName} ${resumeInfo.lastName} - Resume</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: white;
              color: #1f2937;
              line-height: 1.5;
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
            .space-y-2 > * + * { margin-top: 0.5rem; }
            
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
            
            /* Print styles */
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { 
                margin: 0.4in; 
                size: letter;
              }
              .rounded-full, .rounded-lg, .rounded {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          ${previewContent}
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
    alert('Resume saved successfully!');
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
                <h1 className="text-base font-bold text-gray-900">AI Resume Builder</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Create your professional resume</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
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
                    <span className="text-[10px]">{step.id < activeStep ? '✓' : step.icon}</span>
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
                    <span>{step.id < activeStep ? '✓' : step.icon}</span>
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
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    </div>
  );
};

interface ResumeBuilderPageProps {
  embedded?: boolean;
  onBack?: () => void;
  toggleSidebar?: () => void;
}

const ResumeBuilderPage: React.FC<ResumeBuilderPageProps> = ({ embedded = false, onBack, toggleSidebar }) => {
  return (
    <ResumeInfoProvider>
      <ResumeBuilderContent embedded={embedded} onBack={onBack} toggleSidebar={toggleSidebar} />
    </ResumeInfoProvider>
  );
};

export default ResumeBuilderPage;
