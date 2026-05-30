import React from 'react';
import { LOREM_MEDIUM } from './lorem';

const CodingQuestionsPreview: React.FC = () => (
  <div className="bg-[#1e1e1e] min-h-[520px] rounded-xl p-4 text-gray-200">
    <div className="flex gap-4 mb-4 text-sm">
      <span className="text-white font-medium border-b-2 border-green-500 pb-1">Description</span>
      <span className="text-gray-500">Solution</span>
      <span className="text-gray-500">Submissions</span>
    </div>
    <h3 className="text-lg font-bold text-white mb-2">Lorem ipsum two sum</h3>
    <p className="text-sm text-gray-400 mb-4">{LOREM_MEDIUM}</p>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#2d2d2d] rounded-lg p-3 font-mono text-xs text-gray-400 min-h-[120px]">
        // Lorem ipsum code editor
      </div>
      <div className="bg-[#2d2d2d] rounded-lg p-3 text-xs text-gray-500">Output panel</div>
    </div>
  </div>
);

export default CodingQuestionsPreview;
