import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DSAProblem } from '../../data/preparationMockData';
import { prepUserApi } from '../../services/preparationApi';
import PrepFilterDropdown from './PrepFilterDropdown';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';
import { RefreshCw } from 'lucide-react';
import { invalidateCache } from '../../lib/apiCache';

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
  const [problems, setProblems] = useState<DSAProblem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [stats, setStats] = useState<{ totalDSA: number; dsaEasy: number; dsaMedium: number; dsaHard: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useViewMode();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Server-side pagination: fetch only the current page with filters
  const fetchProblems = useCallback(async (cancelled = { current: false }) => {
    setLoading(true);
    try {
      const filters: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      if (topicFilter !== 'all') filters.topic = topicFilter;
      if (difficultyFilter !== 'all') filters.difficulty = difficultyFilter;
      if (search.trim()) filters.search = search.trim();
      if (activeTab === 'Solved') filters.solvedOnly = true;

      const [resp, dashboard] = await Promise.all([
        prepUserApi.listContentWithProgress<DSAProblem>('dsa_problems', filters),
        prepUserApi.getDashboard(),
      ]);
      if (!cancelled.current && resp.success) {
        setProblems(resp.items ?? []);
        setTotalCount(resp.total ?? 0);
        setApiTotalPages(resp.totalPages ?? 1);
      }
      if (!cancelled.current && dashboard?.contentCounts) {
        const cc = dashboard.contentCounts;
        const total = (cc.dsa_problems as number) ?? 0;
        setStats({
          totalDSA: total,
          dsaEasy: Math.floor(total * 0.35),
          dsaMedium: Math.floor(total * 0.5),
          dsaHard: Math.floor(total * 0.15),
        });
      }
    } catch { /* API only */ }
    if (!cancelled.current) setLoading(false);
  }, [currentPage, topicFilter, difficultyFilter, search, activeTab]);

  useEffect(() => {
    const cancelled = { current: false };
    fetchProblems(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchProblems]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:dsa_problems');
    await fetchProblems();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => { setCurrentPage(1); }, [search, topicFilter, difficultyFilter, activeTab]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Server returns current page; only sort client-side on this page
  const displayedProblems = useMemo(() => {
    if (!sortKey) return problems;
    return [...problems].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'topic') cmp = a.topic.localeCompare(b.topic);
      else if (sortKey === 'difficulty') cmp = diffOrder[a.difficulty] - diffOrder[b.difficulty];
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [problems, sortKey, sortDir]);

  const toggleSolved = useCallback((id: string) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSolved: !p.isSolved } : p))
    );
    prepUserApi.toggleSolved('dsa_problems', id).catch(() => { });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );
    prepUserApi.toggleBookmarked('dsa_problems', id).catch(() => { });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Structures & Algorithms</h1>
        <p className="text-gray-600 mt-1">Practice DSA problems with company tags and acceptance rates</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalDSA ?? problems.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Easy</p>
          <p className="text-2xl font-bold text-green-700">{stats?.dsaEasy ?? problems.filter((p) => p.difficulty === 'Easy').length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Medium</p>
          <p className="text-2xl font-bold text-yellow-700">{stats?.dsaMedium ?? problems.filter((p) => p.difficulty === 'Medium').length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Hard</p>
          <p className="text-2xl font-bold text-red-700">{stats?.dsaHard ?? problems.filter((p) => p.difficulty === 'Hard').length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab
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

        <div className="flex items-center gap-2">
          <div className="relative flex items-center group/refresh">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none ${isRefreshing ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
                }`}
              aria-label="Refresh problems"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/refresh:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Refresh problems
            </div>
          </div>
          <PrepViewToggle view={viewMode} onChange={setViewMode} />
        </div>
        {(topicFilter !== 'all' || difficultyFilter !== 'all' || search.trim()) && (
          <button onClick={() => { setTopicFilter('all'); setDifficultyFilter('all'); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Clear
          </button>
        )}
      </div>

      {!loading && problems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-medium">No problems match your filters.</p>
        </div>
      ) : (
        <>
          {viewMode === 'table' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('title')}>
                        <span className="inline-flex items-center">Problem <SortIcon active={sortKey === 'title'} dir={sortDir} /></span>
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('topic')}>
                        <span className="inline-flex items-center">Topic <SortIcon active={sortKey === 'topic'} dir={sortDir} /></span>
                      </th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('difficulty')}>
                        <span className="inline-flex items-center justify-center">Difficulty <SortIcon active={sortKey === 'difficulty'} dir={sortDir} /></span>
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Companies</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Solved</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Revision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProblems.map((problem, idx) => {
                      const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                      const isExpanded = expandedId === problem.id;
                      const solutionLink = (problem as any).solutionLink as string | undefined;
                      return (
                        <>
                          <tr key={problem.id} onClick={() => setExpandedId(isExpanded ? null : problem.id)} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                            <td className="px-5 py-4 text-sm text-gray-400 font-medium">{globalIdx + 1}</td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold text-gray-900">{problem.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{problem.description}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Acceptance: {problem.acceptance}%</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="prep-topic-chip px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{problem.topic}</span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <DifficultyBadge difficulty={problem.difficulty} />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1">
                                {problem.company.slice(0, 3).map((c) => (
                                  <span key={c} className="px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700">{c}</span>
                                ))}
                                {problem.company.length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">+{problem.company.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button onClick={(e) => { e.stopPropagation(); toggleSolved(problem.id); }} className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${problem.isSolved ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}>
                                {problem.isSolved ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                              </button>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button onClick={(e) => { e.stopPropagation(); toggleBookmark(problem.id); }} className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${problem.isBookmarked ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-gray-400'}`}>
                                {problem.isBookmarked ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                )}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${problem.id}-solution`} className="bg-black/80 dark:bg-black/80 border-b border-gray-100 dark:border-gray-800">
                              <td colSpan={7} className="px-5 py-4">
                                <div className="pl-4 border-l-3 border-orange-400">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Solution</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{problem.description}</p>
                                  {solutionLink ? (
                                    <a href={solutionLink} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                      View Full Solution
                                    </a>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">No solution link available yet.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {viewMode === 'grid' && displayedProblems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedProblems.map((problem) => {
                const isExpanded = expandedId === problem.id;
                const solutionLink = (problem as any).solutionLink as string | undefined;
                return (
                  <div key={problem.id} onClick={() => setExpandedId(isExpanded ? null : problem.id)} className="group border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <DifficultyBadge difficulty={problem.difficulty} />
                      <button onClick={(e) => { e.stopPropagation(); toggleBookmark(problem.id); }} className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${problem.isBookmarked ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-gray-400'}`}>
                        {problem.isBookmarked ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        )}
                      </button>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{problem.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{problem.description}</p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="prep-topic-chip text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">{problem.topic}</span>
                      {problem.company.slice(0, 2).map((c) => (
                        <span key={c} className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded">{c}</span>
                      ))}
                      {problem.company.length > 2 && (
                        <span className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded">+{problem.company.length - 2}</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Acceptance: {problem.acceptance}%</span>
                      <button onClick={(e) => { e.stopPropagation(); toggleSolved(problem.id); }} className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${problem.isSolved ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}>
                        {problem.isSolved ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-900 mb-1">Solution</p>
                        {solutionLink ? (
                          <a href={solutionLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            View Full Solution
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No solution link available yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {apiTotalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-semibold text-gray-900">
              {totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
            </span>{' '}
            of <span className="font-semibold text-gray-900">{totalCount}</span> problems
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
            {Array.from({ length: apiTotalPages }, (_, i) => i + 1).map((page) => {
              if (apiTotalPages <= 7 || page === 1 || page === apiTotalPages || Math.abs(page - currentPage) <= 1) {
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${page === currentPage ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
                );
              }
              if ((page === 2 && currentPage > 3) || (page === apiTotalPages - 1 && currentPage < apiTotalPages - 2)) {
                return <span key={page} className="px-1 text-gray-400 text-sm select-none">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(apiTotalPages, p + 1))}
              disabled={currentPage === apiTotalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              onClick={() => setCurrentPage(apiTotalPages)}
              disabled={currentPage === apiTotalPages}
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
