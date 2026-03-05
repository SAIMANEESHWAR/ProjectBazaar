import { useState, useMemo } from 'react';
import { handwrittenNotes } from '../../data/preparationMockData';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';

interface PrepHandwrittenNotesPageProps {
  toggleSidebar?: () => void;
}

const topicEmojis: Record<string, string> = {
  DSA: '📊',
  'C++': '⚙️',
  JavaScript: '📜',
  Python: '🐍',
  Aptitude: '🧮',
  'System Design': '🏗️',
  OS: '💻',
  DBMS: '🗄️',
  CN: '🌐',
};

const PrepHandwrittenNotesPage = (_props: PrepHandwrittenNotesPageProps) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useViewMode('grid');

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return handwrittenNotes;
    const q = search.toLowerCase();
    return handwrittenNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Handwritten Notes</h1>
        <p className="text-gray-600 mt-1">
          Access high-quality handwritten notes and study materials
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
        <PrepViewToggle view={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === 'grid' && (
        <>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No notes found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-orange-200"
                >
                  <div
                    className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-6xl"
                  >
                    {topicEmojis[note.topic] || '📄'}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{note.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{note.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                        {note.topic}
                      </span>
                      <span className="text-sm text-gray-500">{note.pageCount} pages</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-all duration-200">
                        Download
                      </button>
                      <button className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-orange-50 hover:border-orange-200 transition-all duration-200">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === 'table' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-14">Icon</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Topic</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Pages</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.map((note, idx) => (
                  <tr key={note.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-5 py-4 text-sm text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-4 text-center text-xl">{topicEmojis[note.topic] || '📄'}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{note.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{note.description}</p>
                    </td>
                    <td className="px-5 py-4"><span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">{note.topic}</span></td>
                    <td className="px-5 py-4 text-center text-sm text-gray-600">{note.pageCount}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors">Download</button>
                        <button className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredNotes.length === 0 && (
            <div className="py-12 text-center text-gray-500">No notes found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrepHandwrittenNotesPage;
