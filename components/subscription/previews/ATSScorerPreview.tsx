import React from 'react';
import { LOREM_MEDIUM } from './lorem';

const ATSScorerPreview: React.FC = () => (
  <div className="bg-white min-h-[640px] rounded-xl p-6 md:p-8 max-w-4xl">
    <button type="button" className="text-sm text-[#ff7a00] font-medium mb-4">
      ← Back
    </button>

    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-semibold text-[#ff7a00] mb-3">
      ★ CAREER TOOLS
    </div>
    <h1 className="text-3xl font-bold text-gray-900 mb-2">ATS Resume Scorer</h1>
    <p className="text-gray-500 text-sm mb-6 max-w-2xl">{LOREM_MEDIUM}</p>

    <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 mb-6 text-sm text-gray-400 w-fit">
      <span className="text-[#ff7a00] font-medium">① Resume</span>
      <span>›</span>
      <span>② Job description</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <p className="text-sm font-bold text-[#ff7a00] mb-2">1 Resume</p>
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center min-h-[220px] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-[#ff7a00] mb-3">
            ↑
          </div>
          <p className="font-semibold text-gray-900">Drag & drop your resume here</p>
          <p className="text-xs text-gray-400 mt-1">PDF or DOCX · max typical ATS-friendly size</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-bold text-[#ff7a00]">2 Job description</p>
          <span className="text-xs text-gray-400">0 chars</span>
        </div>
        <div className="border border-gray-200 rounded-2xl p-4 min-h-[220px] text-sm text-gray-400">
          {LOREM_MEDIUM}
        </div>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-xs text-gray-400">Scoring with provider from Settings.</p>
      <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff7a00] text-white font-semibold text-sm">
        ★ Analyze compatibility
      </span>
    </div>
  </div>
);

export default ATSScorerPreview;
