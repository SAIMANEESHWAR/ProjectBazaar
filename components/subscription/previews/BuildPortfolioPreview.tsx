import React from 'react';
import { LOREM_MEDIUM } from './lorem';

const MOCK_TEMPLATES = [
  { name: 'Editorial', thumb: '🅴', color: '#0c0c0c', accent: '#e8ff59' },
  { name: 'Alexa', thumb: '💜', color: '#f8f7ff', accent: '#6c63ff' },
];

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
    <p className="text-gray-500 text-center max-w-lg mb-8">{LOREM_MEDIUM}</p>

    <div className="w-full max-w-3xl">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-4">
        Step 1 — Pick a style
      </p>
      <div className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto">
        {MOCK_TEMPLATES.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border-2 border-orange-200 overflow-hidden bg-white shadow-sm"
          >
            <div className="h-20" style={{ background: t.color }} />
            <div className="p-3 text-center">
              <span className="text-lg">{t.thumb}</span>
              <p className="text-xs font-bold text-gray-800 mt-1">{t.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-8 max-w-xl mx-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-4">
          Step 2 — Upload resume
        </p>
        <div className="border-2 border-dashed border-[#ff7a00]/40 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ff7a00] flex items-center justify-center text-white text-2xl mb-4">
            ☁
          </div>
          <p className="font-bold text-gray-900 mb-1">Drag & drop your resume</p>
          <p className="text-sm text-gray-400">PDF or DOCX · AI polishes your copy</p>
        </div>
      </div>
    </div>
  </div>
);

export default BuildPortfolioPreview;
