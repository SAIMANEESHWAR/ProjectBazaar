import { useState, useMemo, useEffect } from 'react';
import { dsaProblems, prepStats } from '../../data/preparationMockData';
import type { DSAProblem } from '../../data/preparationMockData';
import PrepFilterDropdown from './PrepFilterDropdown';

interface PrepDSAProblemsPageProps {
  toggleSidebar?: () => void;
}

const TABS = ['All problems', 'Real World Scenarios', 'Problem Sets', 'Solved', 'Revision', 'Folders'] as const;
const TOPICS = ['Arrays', 'Dynamic Programming', 'Trees', 'Stack', 'Linked List', 'Graph', 'Design', 'Binary Search'];
const ITEMS_PER_PAGE = 10;
const diffOrder: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

type SortKey = 'title' | 'topic' | 'difficulty' | null;
type SortDir = 'asc' | 'desc';

const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
  <span className={`inline-flex flex-col ml-1.5 -space-y-0.5 ${active ? '' : 'opacity-30'}`}>
    <svg className={`w-3 h-3 ${active && dir === 'asc' ? 'text-orange-500' : ''}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0l5 6H0z" /></svg>
    <svg className={`w-3 h-3 ${active && dir === 'desc' ? 'text-orange-500' : ''}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z" /></svg>
  </span>
);

function DifficultyBadge({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) {
  const styles = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[difficulty]}`}>
      {difficulty}
    </span>
  );
}

export default function PrepDSAProblemsPage(_props: PrepDSAProblemsPageProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All problems');
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [problems, setProblems] = useState<DSAProblem[]>(dsaProblems);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filteredProblems = useMemo(() => {
    const filtered = problems.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesTopic = topicFilter === 'all' || p.topic === topicFilter;
      const matchesDifficulty = difficultyFilter === 'all' || p.difficulty === difficultyFilter;
      const matchesTab =
        activeTab === 'All problems' ||
        (activeTab === 'Solved' && p.isSolved) ||
        (activeTab === 'Revision' && p.isSolved) ||
        activeTab === 'Real World Scenarios' ||
        activeTab === 'Problem Sets' ||
        activeTab === 'Folders';
      return matchesSearch && matchesTopic && matchesDifficulty && matchesTab;
    });
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'topic') cmp = a.topic.localeCompare(b.topic);
      else if (sortKey === 'difficulty') cmp = diffOrder[a.difficulty] - diffOrder[b.difficulty];
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [problems, search, topicFilter, difficultyFilter, activeTab, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProblems, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, topicFilter, difficultyFilter, activeTab]);

  const toggleSolved = (id: string) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSolved: !p.isSolved } : p))
    );
  };

  const toggleBookmark = (id: string) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Structures & Algorithms</h1>
        <p className="text-gray-600 mt-1">Practice DSA problems with company tags and acceptance rates</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{prepStats.totalDSA}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Easy</p>
          <p className="text-2xl font-bold text-green-700">{prepStats.dsaEasy}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Medium</p>
          <p className="text-2xl font-bold text-yellow-700">{prepStats.dsaMedium}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Hard</p>
          <p className="text-2xl font-bold text-red-700">{prepStats.dsaHard}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <PrepFilterDropdown
          value={topicFilter}
          onChange={setTopicFilter}
          options={[{ value: 'all', label: 'All Topics' }, ...TOPICS.map(t => ({ value: t, label: t }))]}
        />
        <PrepFilterDropdown
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[{ value: 'all', label: 'All Difficulties' }, { value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }]}
        />
        {(topicFilter !== 'all' || difficultyFilter !== 'all' || search.trim()) && (
          <button onClick={() => { setTopicFilter('all'); setDifficultyFilter('all'); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Clear
          </button>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-400 mr-1">Sort:</span>
          {([['title', 'Name'], ['topic', 'Topic'], ['difficulty', 'Difficulty']] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                sortKey === key
                  ? 'border-orange-300 bg-orange-50 text-orange-600'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {label}
              <SortIcon active={sortKey === key} dir={sortDir} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {paginatedProblems.map((problem) => (
          <div
            key={problem.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{problem.title}</h3>
                  <DifficultyBadge difficulty={problem.difficulty} />
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {problem.topic}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{problem.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {problem.company.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded text-xs bg-orange-50 text-orange-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Acceptance: {problem.acceptance}%
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleSolved(problem.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-all duration-200"
                >
                  <input
                    type="checkbox"
                    checked={problem.isSolved}
                    onChange={() => toggleSolved(problem.id)}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>{problem.isSolved ? 'Solved' : 'Solve'}</span>
                </button>
                <button
                  onClick={() => toggleBookmark(problem.id)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  <svg
                    className={`w-5 h-5 ${problem.isBookmarked ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}`}
                    fill={problem.isBookmarked ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
            <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProblems.length)}</span> of{' '}
            <span className="font-semibold text-gray-900">{filteredProblems.length}</span> problems
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${page === currentPage ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
                );
              }
              if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) {
                return <span key={page} className="px-1 text-gray-400 text-sm select-none">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
