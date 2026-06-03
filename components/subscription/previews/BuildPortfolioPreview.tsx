import React from 'react';
import { LOREM_MEDIUM } from './lorem';

const BuildPortfolioPreview: React.FC = () => (
  <div className="bg-[#faf8f5] min-h-[640px] rounded-xl flex flex-col items-center justify-center px-6 py-12">
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-[#ff7a00] text-sm font-medium mb-4">
      <span className="w-2 h-2 rounded-full bg-[#ff7a00]" />
      Smart Portfolio Builder
    </span>

    <h1 className="text-4xl md:text-5xl font-bold text-center mb-3">
      <span className="text-gray-900">Build Your </span>
      <span className="text-[#ff7a00]">Portfolio</span>
    </h1>
    <p className="text-gray-500 text-center max-w-lg mb-10">{LOREM_MEDIUM}</p>

    <div className="w-full max-w-xl bg-white rounded-2xl border border-orange-100 shadow-sm p-8">
      <div className="border-2 border-dashed border-[#ff7a00]/40 rounded-2xl p-12 text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ff7a00] flex items-center justify-center text-white text-2xl mb-4">
          ☁
        </div>
        <p className="font-bold text-gray-900 text-lg mb-1">Drag & drop your resume here</p>
        <p className="text-sm text-gray-400">or click to browse · PDF, DOC, DOCX (max 10MB)</p>
      </div>
      <div className="w-full py-3.5 rounded-xl bg-gray-200 text-gray-500 text-center font-semibold text-sm">
        Upload Resume to Continue
      </div>
    </div>
  </div>
);

export default BuildPortfolioPreview;
