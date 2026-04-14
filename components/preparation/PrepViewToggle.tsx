import { useState } from 'react';

export type ViewMode = 'table' | 'grid';

export function useViewMode(initial: ViewMode = 'table') {
  return useState<ViewMode>(initial);
}

export default function PrepViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      <button onClick={() => onChange('table')} className={`p-2 transition-all ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`} title="Table view">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
      </button>
      <button onClick={() => onChange('grid')} className={`p-2 transition-all ${view === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`} title="Grid view">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
      </button>
    </div>
  );
}
