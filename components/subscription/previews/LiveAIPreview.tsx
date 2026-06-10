import React from 'react';
import { LOREM_MEDIUM } from './lorem';

const LiveAIPreview: React.FC = () => (
  <div className="bg-white min-h-[640px] rounded-2xl border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
      <div className="flex rounded-full border border-gray-200 p-0.5 bg-gray-50">
        <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-white border border-[#ff7a00] text-[#ff7a00] shadow-sm">
          Interview with AI
        </span>
        <span className="px-4 py-1.5 text-sm text-gray-500">Interview with peer</span>
      </div>
      <div className="text-right text-xs text-gray-500">
        <p>{LOREM_MEDIUM.slice(0, 48)}…</p>
        <p className="text-[#ff7a00] font-medium">Results dashboard</p>
      </div>
    </div>

    <div className="mx-4 mt-4 rounded-3xl bg-[#fff8f3] border border-orange-100 p-8 md:p-12">
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {['Role Based', 'Company Based', 'JD Based'].map((tab, i) => (
          <span
            key={tab}
            className={`px-5 py-2 rounded-full text-sm font-medium border ${
              i === 0
                ? 'bg-[#ff7a00] text-white border-[#ff7a00]'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs font-semibold text-[#ff7a00]">
          ⚡ 3000+ ROLES AVAILABLE
        </span>
      </div>

      <h2 className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-3">
        Role-Specific <span className="text-[#ff7a00]">AI Mock Interviews</span>
      </h2>
      <p className="text-center text-gray-500 max-w-xl mx-auto mb-8 text-sm md:text-base">
        {LOREM_MEDIUM}
      </p>

      <div className="max-w-2xl mx-auto flex rounded-full border-2 border-[#ff7a00] bg-white overflow-hidden shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-5 py-3.5 text-gray-400 text-sm">
          <span>🔍</span>
          <span>Search for roles…</span>
        </div>
        <span className="px-8 py-3.5 bg-[#ff7a00] text-white font-bold text-sm tracking-wide">
          SEARCH
        </span>
      </div>

      <p className="text-center mt-6 text-sm text-gray-500 flex items-center justify-center gap-1">
        <span>👤</span> Roles
      </p>
    </div>
  </div>
);

export default LiveAIPreview;
