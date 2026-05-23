import { useState } from 'react';

export type ViewMode = 'table' | 'grid';

export function useViewMode(initial: ViewMode = 'table') {
  return useState<ViewMode>(initial);
}

export default function PrepViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="prep-view-toggle" role="group" aria-label="View mode">
      <button
        type="button"
        onClick={() => onChange('table')}
        className={view === 'table' ? 'prep-view-toggle--active' : ''}
        title="Table view"
        aria-pressed={view === 'table'}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={view === 'grid' ? 'prep-view-toggle--active' : ''}
        title="Grid view"
        aria-pressed={view === 'grid'}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
      </button>
    </div>
  );
}
