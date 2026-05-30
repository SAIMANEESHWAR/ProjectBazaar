import React from 'react';
import { LOREM_LONG, LOREM_MEDIUM } from './lorem';

const STEPS = ['Personal', 'Summary', 'Experience', 'Education', 'Skills', 'Projects'];

const ResumeBuilderPreview: React.FC = () => (
  <div className="bg-white min-h-[720px] rounded-xl border border-gray-100 overflow-hidden">
    {/* Page header */}
    <header className="border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">Create your professional resume</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-orange-600 border border-orange-200 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            ATS Score
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg">
            <span className="text-sm">👔</span>
            Classic
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg">
            <span className="w-3.5 h-3.5 rounded-full bg-violet-600" />
            Theme
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            My Resumes (0)
          </span>
        </div>
      </div>
    </header>

    <div className="px-4 sm:px-6 py-6">
      {/* Hero */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-3">
          <span className="w-2 h-2 bg-orange-500 rounded-full" />
          <span className="text-xs text-orange-600 font-medium">AI-Powered Resume Builder</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Build Your{' '}
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Professional Resume
          </span>
        </h2>
        <p className="text-sm text-gray-500">
          Create a stunning resume with AI-powered suggestions in minutes
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center justify-center gap-1.5 mb-6 overflow-x-auto pb-1">
        {STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                index === 0
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-500 border border-transparent'
              }`}
            >
              <span className="text-sm">{index === 0 ? '👤' : index === 1 ? '📝' : index === 2 ? '💼' : index === 3 ? '🎓' : index === 4 ? '⚡' : '🚀'}</span>
              {step}
            </span>
            {index < STEPS.length - 1 && (
              <span className="w-4 h-px bg-gray-200 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal details */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-orange-500 text-lg">👤</span>
            <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Get started with the basic information</p>

          <p className="text-xs font-medium text-gray-600 mb-2">Profile Photo (Optional)</p>
          <div className="flex gap-3 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[64px]">
              <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-[10px] text-gray-400">Tap to upload or drag and drop</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'First Name', value: 'James' },
              { label: 'Last Name', value: 'Carter' },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="text-[11px] font-medium text-gray-600">{label}</label>
                <div className="mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Live Preview</h3>
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-orange-500 text-orange-600 text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </span>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="p-5">
              <h4 className="text-xl font-bold text-violet-700">James Carter</h4>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">Full Stack Developer</p>
              <p className="text-xs text-violet-600 mt-1">
                123 Lorem Street, City · +91 90000 00000 · james@example.com
              </p>
              <div className="mt-4 pt-3 border-t border-violet-200">
                <p className="text-[10px] font-bold text-violet-700 tracking-wider mb-1.5">
                  PROFESSIONAL SUMMARY
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">{LOREM_MEDIUM}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-violet-200">
                <p className="text-[10px] font-bold text-violet-700 tracking-wider mb-1.5">
                  PROFESSIONAL EXPERIENCE
                </p>
                <p className="text-xs font-semibold text-gray-900">Developer — Lorem Corp</p>
                <p className="text-[10px] text-gray-500 mb-1">Jan 2021 – Present</p>
                <p className="text-xs text-gray-600 leading-relaxed">{LOREM_LONG.slice(0, 180)}…</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ResumeBuilderPreview;
