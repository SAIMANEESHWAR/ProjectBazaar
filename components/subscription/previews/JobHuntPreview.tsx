import React from 'react';
import { LOREM_SHORT } from './lorem';

const JobHuntPreview: React.FC = () => (
  <div className="bg-white min-h-[520px] rounded-xl border border-gray-100 p-6">
    <div className="flex gap-2 mb-4">
      <span className="px-3 py-1.5 rounded-lg bg-[#ff7a00] text-white text-sm font-medium">All jobs</span>
      <span className="px-3 py-1.5 rounded-lg border text-sm text-gray-600">Saved</span>
    </div>
    <div className="border border-gray-200 rounded-xl px-4 py-3 mb-4 text-sm text-gray-400">🔍 Search roles, companies…</div>
    {[1, 2, 3].map((n) => (
      <div key={n} className="border border-gray-200 rounded-xl p-4 mb-3 flex justify-between">
        <div>
          <p className="font-bold text-gray-900">Lorem Engineer {n}</p>
          <p className="text-sm text-gray-500">Lorem Technologies · Bengaluru</p>
          <p className="text-xs text-gray-400 mt-1">{LOREM_SHORT}</p>
        </div>
        <span className="text-sm font-semibold text-emerald-600">₹12 LPA</span>
      </div>
    ))}
  </div>
);

export default JobHuntPreview;
