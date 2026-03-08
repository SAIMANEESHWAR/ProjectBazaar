import { useState, useEffect, useCallback } from 'react';
import { prepUserApi } from '../../services/preparationApi';
import PrepFilterDropdown from './PrepFilterDropdown';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';
import { RefreshCw } from 'lucide-react';
import { invalidateCache } from '../../lib/apiCache';
import SDDiagramRenderer, { DiagramData } from './SDDiagramRenderer';

type DesignTab = 'hld' | 'lld';

interface SDQuestion {
  id: string;
  title: string;
  description: string;
  section: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  designType: string;
  isSolved?: boolean;
  isBookmarked?: boolean;
  content?: string;
  diagramUrl?: string;
  diagramData?: DiagramData; // Added
  topics?: string[];
}

export interface PrepSystemDesignPageProps { toggleSidebar?: () => void; designTab?: DesignTab; }
type FilterTab = 'all' | 'solved' | 'revision';
const ITEMS_PER_PAGE = 15;

const HLD_SECTIONS = ['System Design', 'Distributed Systems'];
const LLD_SECTIONS = ['Object-Oriented Design', 'System Design', 'Game Design', 'Data Structures', 'Design Patterns'];

const difficultyClass = (d: string) => {
  if (d === 'Easy') return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
  if (d === 'Medium') return 'bg-yellow-100 text-yellow-700 dark:bg-amber-900/50 dark:text-amber-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
};

type SortKey = 'title' | 'section' | 'difficulty' | null;
type SortDir = 'asc' | 'desc';

const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
  <span className={`inline-flex flex-col ml-1.5 -space-y-0.5 ${active ? '' : 'opacity-30'}`}>
    <svg className={`w-3 h-3 ${active && dir === 'asc' ? 'text-orange-500' : ''}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0l5 6H0z" /></svg>
    <svg className={`w-3 h-3 ${active && dir === 'desc' ? 'text-orange-500' : ''}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z" /></svg>
  </span>
);

export default function PrepSystemDesignPage({ designTab: designTabProp = 'hld' }: PrepSystemDesignPageProps) {
  const designTab = designTabProp;
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [questions, setQuestions] = useState<SDQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useViewMode();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sections = designTab === 'hld' ? HLD_SECTIONS : LLD_SECTIONS;

  const fetchQuestions = useCallback(async (cancelled = { current: false }) => {
    setLoading(true);
    try {
      const filters: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        designType: designTab,
      };
      if (sectionFilter !== 'all') filters.section = sectionFilter;
      if (difficultyFilter !== 'all') filters.difficulty = difficultyFilter;
      if (search.trim()) filters.search = search.trim();
      if (filterTab === 'solved') filters.solvedOnly = true;
      if (sortKey) {
        filters.sortBy = sortKey;
        filters.sortOrder = sortDir;
      }
      const resp = await prepUserApi.listContentWithProgress<SDQuestion>('system_design', filters);
      if (!cancelled.current && resp.success) {
        setQuestions(resp.items || []);
        setTotalCount(resp.total ?? 0);
        setTotalPages(resp.totalPages ?? 1);
      }
    } catch { /* API only */ }
    if (!cancelled.current) setLoading(false);
  }, [designTab, currentPage, sectionFilter, difficultyFilter, search, filterTab, sortKey, sortDir]);

  useEffect(() => {
    const cancelled = { current: false };
    fetchQuestions(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchQuestions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:system_design');
    await fetchQuestions();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => { setCurrentPage(1); }, [designTab, filterTab, sectionFilter, difficultyFilter, search]);
  useEffect(() => { setFilterTab('all'); setSectionFilter('all'); setDifficultyFilter('all'); setSearch(''); setCurrentPage(1); setExpandedId(null); }, [designTab]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const label = designTab === 'hld' ? 'High Level Design' : 'Low Level Design';
  const shortLabel = designTab === 'hld' ? 'HLD' : 'LLD';

  const solvedOnPage = questions.filter(q => q.isSolved).length;

  const toggleSolved = useCallback((id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isSolved: !q.isSolved } : q));
    prepUserApi.toggleSolved('system_design', id).catch(() => { });
  }, []);

  const toggleRevision = useCallback((id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isBookmarked: !q.isBookmarked } : q));
    prepUserApi.toggleBookmarked('system_design', id).catch(() => { });
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{label} Questions</h1>
          <p className="text-gray-500 mt-1">Practice {shortLabel} concepts and prepare for system design interviews</p>
        </div>
        <div className="flex items-center gap-3">
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
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            My progress
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {([['all', 'All questions'], ['solved', 'Solved questions'], ['revision', 'Revision questions']] as [FilterTab, string][]).map(([key, lbl]) => (
          <button key={key} onClick={() => setFilterTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${filterTab === key ? 'text-orange-600 border-orange-500' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Total Questions</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Current Page</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{currentPage}<span className="text-base font-normal text-gray-400"> / {totalPages}</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Solved on this page</p>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{solvedOnPage}<span className="text-base font-normal text-gray-400"> / {questions.length}</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Page size</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{ITEMS_PER_PAGE}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input type="text" placeholder={`Search ${shortLabel} questions...`} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <PrepFilterDropdown
          value={sectionFilter}
          onChange={setSectionFilter}
          options={[{ value: 'all', label: 'All Sections' }, ...sections.map(s => ({ value: s, label: s }))]}
          key={designTab}
        />
        <PrepFilterDropdown
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[{ value: 'all', label: 'All Difficulties' }, { value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }]}
        />
        <PrepViewToggle view={viewMode} onChange={setViewMode} />
        {(sectionFilter !== 'all' || difficultyFilter !== 'all' || search.trim()) && (
          <button onClick={() => { setSectionFilter('all'); setDifficultyFilter('all'); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Clear
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Loading questions...</p>
        </div>
      )}

      {/* Table */}
      {!loading && questions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-medium">No questions match your filters.</p>
        </div>
      ) : !loading && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">#</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors" onClick={() => handleSort('title')}>
                      <span className="inline-flex items-center">Question <SortIcon active={sortKey === 'title'} dir={sortDir} /></span>
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors" onClick={() => handleSort('section')}>
                      <span className="inline-flex items-center">Section <SortIcon active={sortKey === 'section'} dir={sortDir} /></span>
                    </th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors" onClick={() => handleSort('difficulty')}>
                      <span className="inline-flex items-center justify-center">Difficulty <SortIcon active={sortKey === 'difficulty'} dir={sortDir} /></span>
                    </th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Solved</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Revision</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => {
                    const isSolved = q.isSolved ?? false;
                    const isRevision = q.isBookmarked ?? false;
                    const gi = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                    const isExpanded = expandedId === q.id;
                    return (
                      <>
                        <tr key={q.id} onClick={() => setExpandedId(isExpanded ? null : q.id)} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer">
                          <td className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 font-medium">{gi + 1}</td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{q.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{q.description}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{q.section}</td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${difficultyClass(q.difficulty)}`}>{q.difficulty}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); toggleSolved(q.id); }} className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${isSolved ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}>
                              {isSolved ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); toggleRevision(q.id); }} className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${isRevision ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-gray-400'}`}>
                              {isRevision ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                              )}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${q.id}-detail`} className="bg-black/80 dark:bg-black/80">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Description</p>
                                  <p className="text-gray-600 dark:text-gray-300">{q.description}</p>
                                </div>
                                {(() => {
                                  const rawContent = q.content ?? '';
                                  const regex = /__DIAGRAM_DATA_START__([\s\S]*?)__DIAGRAM_DATA_END__/;
                                  const match = rawContent.match(regex);

                                  let displayContent = rawContent;
                                  let embeddedData: DiagramData | null = null;

                                  if (match) {
                                    displayContent = rawContent.replace(regex, '').trim();
                                    try {
                                      embeddedData = JSON.parse(match[1]);
                                    } catch (e) {
                                      console.error('Failed to parse embedded diagram data', e);
                                    }
                                  }

                                  const finalDiagramData = q.diagramData || embeddedData;

                                  return (
                                    <>
                                      {displayContent && (
                                        <div>
                                          <p className="font-semibold text-gray-900 dark:text-white mb-1">Solution</p>
                                          {(() => {
                                            const text = displayContent.startsWith('Solution:')
                                              ? displayContent.substring(9).trim()
                                              : displayContent;

                                            // Check if it's pointwise (starts with (1) or contains (2))
                                            const pointRegex = /\(\d+\)/;
                                            if (pointRegex.test(text)) {
                                              const points = text.split(/\s*(?=\(\d+\))/).filter(p => p.trim());
                                              return (
                                                <ul className="list-none space-y-1.5 mt-1">
                                                  {points.map((point, idx) => (
                                                    <li key={idx} className="flex gap-2 text-gray-600 dark:text-gray-300 text-sm">
                                                      <span className="shrink-0 text-orange-500 font-bold">•</span>
                                                      <span>{point.replace(/^\(\d+\)\s*/, '')}</span>
                                                    </li>
                                                  ))}
                                                </ul>
                                              );
                                            }

                                            return (
                                              <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                                                {text}
                                              </p>
                                            );
                                          })()}
                                        </div>
                                      )}
                                      {finalDiagramData ? (
                                        <div className="mt-4">
                                          <p className="font-semibold text-gray-900 dark:text-white mb-3">System Architecture Diagram</p>
                                          <SDDiagramRenderer data={finalDiagramData} />
                                        </div>
                                      ) : q.diagramUrl ? (
                                        <div className="mt-4">
                                          <p className="font-semibold text-gray-900 dark:text-white mb-1">Diagram</p>
                                          {/\.(jpg|jpeg|png|gif|webp)$/i.test(q.diagramUrl) ? (
                                            <img src={q.diagramUrl} alt="Architecture diagram" className="max-w-full rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm max-h-80 object-contain" />
                                          ) : (
                                            <a href={q.diagramUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline">View diagram ↗</a>
                                          )}
                                        </div>
                                      ) : null}
                                    </>
                                  );
                                })()}
                                {q.topics && q.topics.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {q.topics.map(t => (
                                      <span key={t} className="px-2.5 py-0.5 text-[10px] font-bold bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-sm border border-gray-700 dark:border-gray-600 transition-transform hover:scale-105">
                                        {t}
                                      </span>
                                    ))}
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {questions.map((q) => {
                const isSolved = q.isSolved ?? false;
                const isRevision = q.isBookmarked ?? false;
                const isExpanded = expandedId === q.id;
                return (
                  <div key={q.id} onClick={() => setExpandedId(isExpanded ? null : q.id)} className="group border border-gray-200 dark:border-gray-600 rounded-xl p-5 bg-white dark:bg-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${difficultyClass(q.difficulty)}`}>{q.difficulty}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); toggleSolved(q.id); }} className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${isSolved ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}>
                          {isSolved ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleRevision(q.id); }} className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${isRevision ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-gray-400'}`}>
                          {isRevision ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{q.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{q.description}</p>
                    <span className="mt-3 inline-block text-xs px-2.5 py-0.5 bg-cyan-50 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-300 rounded-full ring-1 ring-cyan-100 dark:ring-cyan-800">{q.section}</span>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">Description</p>
                          <p className="text-gray-600 dark:text-gray-300">{q.description}</p>
                        </div>
                        {(() => {
                          const rawContent = q.content ?? '';
                          const regex = /__DIAGRAM_DATA_START__([\s\S]*?)__DIAGRAM_DATA_END__/;
                          const match = rawContent.match(regex);

                          let displayContent = rawContent;
                          let embeddedData: DiagramData | null = null;

                          if (match) {
                            displayContent = rawContent.replace(regex, '').trim();
                            try {
                              embeddedData = JSON.parse(match[1]);
                            } catch (e) {
                              console.error('Failed to parse embedded diagram data', e);
                            }
                          }

                          const finalDiagramData = q.diagramData || embeddedData;

                          return (
                            <>
                              {displayContent && (
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Solution</p>
                                  {(() => {
                                    const text = displayContent.startsWith('Solution:')
                                      ? displayContent.substring(9).trim()
                                      : displayContent;

                                    const pointRegex = /\(\d+\)/;
                                    if (pointRegex.test(text)) {
                                      const points = text.split(/\s*(?=\(\d+\))/).filter(p => p.trim());
                                      return (
                                        <ul className="list-none space-y-1 mt-1">
                                          {points.map((point, idx) => (
                                            <li key={idx} className="flex gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                              <span className="shrink-0 text-orange-500 font-bold">•</span>
                                              <span>{point.replace(/^\(\d+\)\s*/, '')}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      );
                                    }

                                    return (
                                      <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                                        {text}
                                      </p>
                                    );
                                  })()}
                                </div>
                              )}
                              {finalDiagramData ? (
                                <div className="mt-3">
                                  <p className="font-semibold text-gray-900 dark:text-white mb-2">Architecture</p>
                                  <SDDiagramRenderer data={finalDiagramData} />
                                </div>
                              ) : q.diagramUrl ? (
                                <div className="mt-3">
                                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Diagram</p>
                                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(q.diagramUrl) ? (
                                    <img src={q.diagramUrl} alt="Diagram" className="max-w-full rounded border border-gray-200 dark:border-gray-600 max-h-48 object-contain" />
                                  ) : (
                                    <a href={q.diagramUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline">View diagram ↗</a>
                                  )}
                                </div>
                              ) : null}
                            </>
                          );
                        })()}
                        {q.topics && q.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {q.topics.map(t => (
                              <span key={t} className="px-2.5 py-0.5 text-[10px] font-bold bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-sm border border-gray-700 dark:border-gray-600 transition-transform hover:scale-105">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalCount}</span> questions
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    return <button key={page} onClick={() => setCurrentPage(page)} className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${page === currentPage ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>;
                  if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2))
                    return <span key={page} className="px-1 text-gray-400 text-sm select-none">...</span>;
                  return null;
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
