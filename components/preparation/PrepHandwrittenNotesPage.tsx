import { useState, useMemo } from 'react';
import { handwrittenNotes } from '../../data/preparationMockData';

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

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
      </div>

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

      {filteredNotes.length === 0 && (
        <div className="text-center py-12 text-gray-500">No notes found.</div>
      )}
    </div>
  );
};

export default PrepHandwrittenNotesPage;
