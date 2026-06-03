import { useState } from 'react';

export type ViewMode = 'table' | 'grid' | 'folder';

const ALL_MODES: ViewMode[] = ['table', 'grid', 'folder'];

export function useViewMode(initial: ViewMode = 'table') {
  return useState<ViewMode>(initial);
}

interface PrepViewToggleProps {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
  modes?: ViewMode[];
}

export default function PrepViewToggle({
  view,
  onChange,
  modes = ALL_MODES,
}: PrepViewToggleProps) {
  const showTable = modes.includes('table');
  const showGrid = modes.includes('grid');
  const showFolder = modes.includes('folder');

  return (
    <div className="prep-view-toggle" role="group" aria-label="View mode">
      {showTable && (
        <button
          type="button"
          onClick={() => onChange('table')}
          className={view === 'table' ? 'prep-view-toggle--active' : ''}
          title="Table view"
          aria-pressed={view === 'table'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
        </button>
      )}
      {showGrid && (
        <button
          type="button"
          onClick={() => onChange('grid')}
          className={view === 'grid' ? 'prep-view-toggle--active' : ''}
          title="Grid view"
          aria-pressed={view === 'grid'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
        </button>
      )}
      {showFolder && (
        <button
          type="button"
          onClick={() => onChange('folder')}
          className={view === 'folder' ? 'prep-view-toggle--active' : ''}
          title="Folder tree view"
          aria-pressed={view === 'folder'}
          aria-label="Folder tree view"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h8M8 15h5" />
          </svg>
        </button>
      )}
    </div>
  );
}
