import React, { useState, useRef } from 'react';
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

const STEPS = [
  { id: 1, name: 'Personal', icon: '👤' },
  { id: 2, name: 'Summary', icon: '📝' },
  { id: 3, name: 'Experience', icon: '💼' },
  { id: 4, name: 'Education', icon: '🎓' },
  { id: 5, name: 'Skills', icon: '⚡' },
  { id: 6, name: 'Projects', icon: '🚀' },
];

const ResumeBuilderContent: React.FC = () => {
  const { navigateTo } = useNavigation();
  useAuth();
  const { resumeInfo, saveResume, savedResumes, loadResume, resetResume, deleteResume } = useResumeInfo();
  
  const [activeStep, setActiveStep] = useState(1);
  const [enableNext, setEnableNext] = useState(true);
  const [showSavedResumes, setShowSavedResumes] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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
    const themeColor = resumeInfo.themeColor || '#f97316';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeInfo.firstName} ${resumeInfo.lastName} - Resume</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
            .text-gray-900 { color: #111827; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            
            /* Typography */
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
            
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .leading-relaxed { line-height: 1.625; }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            
            /* Spacing */
            .p-8 { padding: 2rem; }
            .p-6 { padding: 1.5rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
            
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-5 { margin-bottom: 1.25rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .ml-2 { margin-left: 0.5rem; }
            
            /* Flexbox */
            .flex { display: flex; }
            .flex-wrap { flex-wrap: wrap; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            
            .gap-0\\.5 { gap: 0.125rem; }
            .gap-1 { gap: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            
            .whitespace-nowrap { white-space: nowrap; }
            
            /* Border and shapes */
            .rounded-full { border-radius: 9999px; }
            
            /* Skill rating dots */
            .w-2 { width: 0.5rem; }
            .h-2 { height: 0.5rem; }
            
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
                margin: 0.5in; 
                size: letter;
              }
              .rounded-full {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Resume Builder</h1>
                <p className="text-xs text-gray-500">Create your professional resume</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Saved Resumes Dropdown */}
      {showSavedResumes && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSavedResumes(false)} />
          <div className="fixed top-20 right-6 z-50 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-h-96 overflow-y-auto">
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

      {/* Main Content */}
      <main className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 mb-4">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm text-orange-600 font-medium">AI-Powered Resume Builder</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Build Your <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Professional Resume</span>
            </h2>
            <p className="text-gray-500">
              Create a stunning resume with AI-powered suggestions in minutes
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
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
                  <span className="hidden sm:inline">{step.name}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 ${step.id < activeStep ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={activeStep === 1}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </button>

                  {activeStep < STEPS.length ? (
                    <button
                      onClick={handleNext}
                      disabled={!enableNext}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25"
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/25"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="lg:sticky lg:top-24 lg:self-start">
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

const ResumeBuilderPage: React.FC = () => {
  return (
    <ResumeInfoProvider>
      <ResumeBuilderContent />
    </ResumeInfoProvider>
  );
};

export default ResumeBuilderPage;
