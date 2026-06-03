import React from 'react';
import { LOREM_MEDIUM } from './lorem';

const PreparationPreview: React.FC = () => (
  <div className="bg-white min-h-[520px] rounded-xl border border-gray-100 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">Preparation Hub</h2>
    <div className="flex gap-2 mb-6">
      {['Brute', 'Better', 'Optimal'].map((t, i) => (
        <span
          key={t}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            i === 0 ? 'bg-gray-900 text-white' : 'border text-gray-600'
          }`}
        >
          {t}
        </span>
      ))}
    </div>
    <p className="text-sm font-bold text-gray-700 mb-2">Intuition:</p>
    <p className="text-sm text-gray-600 leading-relaxed">{LOREM_MEDIUM}</p>
    <div className="grid grid-cols-2 gap-3 mt-6">
      {['DSA', 'System Design', 'Quizzes', 'Notes'].map((c) => (
        <div key={c} className="border border-gray-200 rounded-lg p-4 text-center font-medium text-gray-800">
          {c}
        </div>
      ))}
    </div>
  </div>
);

export default PreparationPreview;
