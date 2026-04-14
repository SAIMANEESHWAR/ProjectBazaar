import { useState, useMemo, useEffect, useCallback } from 'react';
import type { InterviewQuestion } from '../../data/preparationMockData';
import { prepUserApi } from '../../services/preparationApi';
import PrepFilterDropdown from './PrepFilterDropdown';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';
import { RefreshCw } from 'lucide-react';
import { invalidateCache } from '../../lib/apiCache';

interface PrepInterviewQuestionsPageProps {
  toggleSidebar?: () => void;
}

const TABS = ['All questions', 'Solved', 'Revision', 'Folders'] as const;
const ITEMS_PER_PAGE = 10;
const diffOrder: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

type SortKey = 'question' | 'difficulty' | 'category' | null;
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

export default function PrepInterviewQuestionsPage(_props: PrepInterviewQuestionsPageProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All questions');
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contentStats, setContentStats] = useState<{ total: number; easy: number; medium: number; hard: number }>({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useViewMode();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Server-side pagination: fetch only the current page with filters
  const fetchQuestions = useCallback(async (cancelled = { current: false }) => {
    setLoading(true);
    try {
      const filters: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      if (difficultyFilter !== 'all') filters.difficulty = difficultyFilter;
      if (roleFilter !== 'all') filters.role = roleFilter;
      if (search.trim()) filters.search = search.trim();
      if (activeTab === 'Solved') filters.solvedOnly = true;

      const resp = await prepUserApi.listContentWithProgress<InterviewQuestion>('interview_questions', filters);
      if (!cancelled.current && resp.success) {
        const items = (resp.items || []) as InterviewQuestion[];
        setQuestions(items);
        setTotalCount(resp.total ?? 0);
        setTotalPages(resp.totalPages ?? 1);
        setContentStats({
          total: resp.total ?? 0,
          easy: items.filter((q) => q.difficulty === 'Easy').length,
          medium: items.filter((q) => q.difficulty === 'Medium').length,
          hard: items.filter((q) => q.difficulty === 'Hard').length,
        });
      }
    } catch { /* API only */ }
    if (!cancelled.current) setLoading(false);
  }, [currentPage, difficultyFilter, roleFilter, search, activeTab]);

  useEffect(() => {
    const cancelled = { current: false };
    fetchQuestions(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchQuestions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:interview_questions');
    await fetchQuestions();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Reset to page 1 when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [difficultyFilter, roleFilter, search, activeTab]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Server returns current page; only sort client-side on this page
  const displayedQuestions = useMemo(() => {
    if (!sortKey) return questions;
    return [...questions].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'question') cmp = a.question.localeCompare(b.question);
      else if (sortKey === 'difficulty') cmp = diffOrder[a.difficulty] - diffOrder[b.difficulty];
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [questions, sortKey, sortDir]);

  const roles = useMemo(() => [...new Set(questions.map((q) => q.role))], [questions]);

  const toggleSolved = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isSolved: !q.isSolved } : q))
    );
    prepUserApi.toggleSolved('interview_questions', id).catch(() => { });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isBookmarked: !q.isBookmarked } : q))
    );
    prepUserApi.toggleBookmarked('interview_questions', id).catch(() => { });
  }, []);

  const totalProgress = contentStats.total || 1;
  const easyProgress = (contentStats.easy / totalProgress) * 100;
  const mediumProgress = (contentStats.medium / totalProgress) * 100;
  const hardProgress = (contentStats.hard / totalProgress) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interview Questions</h1>
        <p className="text-gray-600 mt-1">Practice technical and behavioral interview questions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{contentStats.total}</p>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Easy</p>
          <p className="text-2xl font-bold text-green-700">{contentStats.easy}</p>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${easyProgress}%` }} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Medium</p>
          <p className="text-2xl font-bold text-yellow-700">{contentStats.medium}</p>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${mediumProgress}%` }} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Hard</p>
          <p className="text-2xl font-bold text-red-700">{contentStats.hard}</p>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${hardProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
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
            placeholder="Search questions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
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
          value={difficultyFilter}
          onChange={(v) => { setDifficultyFilter(v); setCurrentPage(1); }}
          options={[{ value: 'all', label: 'All Difficulties' }, { value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }]}
        />
        <PrepFilterDropdown
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
          options={[{ value: 'all', label: 'All Roles' }, ...roles.map(r => ({ value: r, label: r }))]}
        />

        <div className="flex items-center gap-2">
          <div className="relative flex items-center group/refresh">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none ${isRefreshing ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
                }`}
              aria-label="Refresh questions"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/refresh:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Refresh questions
            </div>
          </div>
          <PrepViewToggle view={viewMode} onChange={setViewMode} />
        </div>
        {(difficultyFilter !== 'all' || roleFilter !== 'all' || search.trim()) && (
          <button onClick={() => { setDifficultyFilter('all'); setRoleFilter('all'); setSearch(''); setCurrentPage(1); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Clear
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('question')}>
                    <span className="inline-flex items-center">Question <SortIcon active={sortKey === 'question'} dir={sortDir} /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('difficulty')}>
                    <span className="inline-flex items-center">Difficulty <SortIcon active={sortKey === 'difficulty'} dir={sortDir} /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('category')}>
                    <span className="inline-flex items-center">Category <SortIcon active={sortKey === 'category'} dir={sortDir} /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Status</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">Loading…</td></tr>
                ) : displayedQuestions.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">No questions match your filters.</td></tr>
                ) : displayedQuestions.map((q, idx) => {
                  const isExpanded = expandedId === q.id;
                  const answer = (q as any).answer as string | undefined;
                  const hints = (q as any).hints as string[] | undefined;
                  return (
                    <>
                      <tr
                        key={q.id}
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{q.question}</p>
                        </td>
                        <td className="py-3 px-4">
                          <DifficultyBadge difficulty={q.difficulty} />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{q.category}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSolved(q.id); }}
                            className="flex items-center gap-2"
                          >
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${q.isSolved ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}>
                              {q.isSolved ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              )}
                            </span>
                            <span className={`text-sm ${q.isSolved ? 'text-green-600 font-medium' : 'text-gray-500'}`}>{q.isSolved ? 'Solved' : 'Unsolved'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(q.id); }}
                            className="p-1 rounded hover:bg-gray-100 transition-all duration-200"
                          >
                            <svg
                              className={`w-5 h-5 ${q.isBookmarked ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}`}
                              fill={q.isBookmarked ? 'currentColor' : 'none'}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${q.id}-answer`} className="bg-black/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-800">
                          <td colSpan={6} className="py-4 px-4">
                            <div className="pl-4 border-l-3 border-orange-400">
                              {answer ? (
                                <>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Answer</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{answer}</p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No answer available yet.</p>
                              )}
                              {hints && hints.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Hints</p>
                                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                                    {hints.map((h, i) => <li key={i}>{h}</li>)}
                                  </ul>
                                </div>
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
        )}
        {viewMode === 'grid' && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedQuestions.map((q) => {
                const isExpanded = expandedId === q.id;
                const answer = (q as any).answer as string | undefined;
                const hints = (q as any).hints as string[] | undefined;
                return (
                  <div key={q.id} onClick={() => setExpandedId(isExpanded ? null : q.id)} className="group border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <DifficultyBadge difficulty={q.difficulty} />
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(q.id); }}
                        className="p-1 rounded hover:bg-gray-100 transition-all duration-200"
                      >
                        <svg
                          className={`w-5 h-5 ${q.isBookmarked ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}`}
                          fill={q.isBookmarked ? 'currentColor' : 'none'}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm leading-snug mt-3">{q.question}</h4>
                    <span className="mt-3 inline-block text-xs px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full ring-1 ring-blue-100">{q.category}</span>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSolved(q.id); }}
                        className="flex items-center gap-2"
                      >
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${q.isSolved ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}>
                          {q.isSolved ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </span>
                        <span className="text-xs">{q.isSolved ? 'Solved' : 'Mark solved'}</span>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {answer ? (
                          <>
                            <p className="text-xs font-semibold text-gray-900 mb-1">Answer</p>
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{answer}</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No answer available yet.</p>
                        )}
                        {hints && hints.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-900 mb-0.5">Hints</p>
                            <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                              {hints.map((h, i) => <li key={i}>{h}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{totalCount}</span> questions
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
    </div>
  );
}
