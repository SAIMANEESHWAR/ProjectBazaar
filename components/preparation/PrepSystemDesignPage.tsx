import { useState, useMemo, useEffect } from 'react';
import { hldQuestions, lldQuestions, hldSections, lldSections, type SDQuestion } from '../../data/systemDesignData';
import PrepFilterDropdown from './PrepFilterDropdown';

type DesignTab = 'hld' | 'lld';

export interface PrepSystemDesignPageProps { toggleSidebar?: () => void; designTab?: DesignTab; }
type FilterTab = 'all' | 'solved' | 'revision';
const ITEMS_PER_PAGE = 15;

const difficultyClass = (d: string) => {
  if (d === 'Easy') return 'bg-green-100 text-green-700';
  if (d === 'Medium') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

const diffOrder: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

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
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});
  const [revisionMap, setRevisionMap] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const allQuestions = designTab === 'hld' ? hldQuestions : lldQuestions;
  const sections = designTab === 'hld' ? hldSections : lldSections;
  const label = designTab === 'hld' ? 'High Level Design' : 'Low Level Design';
  const shortLabel = designTab === 'hld' ? 'HLD' : 'LLD';

  const questions = useMemo(() => {
    const filtered = allQuestions.filter((q) => {
      const isSolved = solvedMap[q.id] ?? q.isSolved;
      const isRevision = revisionMap[q.id] ?? q.isRevision;
      if (filterTab === 'solved' && !isSolved) return false;
      if (filterTab === 'revision' && !isRevision) return false;
      if (sectionFilter !== 'all' && q.section !== sectionFilter) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        return q.title.toLowerCase().includes(s) || q.description.toLowerCase().includes(s);
      }
      return true;
    });
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'section') cmp = a.section.localeCompare(b.section);
      else if (sortKey === 'difficulty') cmp = diffOrder[a.difficulty] - diffOrder[b.difficulty];
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [allQuestions, filterTab, sectionFilter, difficultyFilter, search, solvedMap, revisionMap, sortKey, sortDir]);

  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return questions.slice(s, s + ITEMS_PER_PAGE);
  }, [questions, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [designTab, filterTab, sectionFilter, difficultyFilter, search]);
  useEffect(() => { setFilterTab('all'); setSectionFilter('all'); setDifficultyFilter('all'); setSearch(''); setCurrentPage(1); }, [designTab]);

  const stats = useMemo(() => {
    const total = allQuestions.length;
    const easy = allQuestions.filter(q => q.difficulty === 'Easy').length;
    const medium = allQuestions.filter(q => q.difficulty === 'Medium').length;
    const hard = allQuestions.filter(q => q.difficulty === 'Hard').length;
    const solved = allQuestions.filter(q => solvedMap[q.id] ?? q.isSolved).length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, easy, medium, hard, solved, pct };
  }, [allQuestions, solvedMap]);

  const toggleSolved = (id: string) => setSolvedMap(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleRevision = (id: string) => setRevisionMap(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{label} Questions</h1>
          <p className="text-gray-500 mt-1">Practice {shortLabel} concepts and prepare for system design interviews</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search
          </button>
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
            <p className="text-sm text-gray-500">Total Progress</p>
            <span className="text-xs font-semibold text-orange-500">{stats.pct}%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.solved}<span className="text-base font-normal text-gray-400">/ {stats.total}</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Easy Questions</p>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0<span className="text-base font-normal text-gray-400">/ {stats.easy}</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Medium Questions</p>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0<span className="text-base font-normal text-gray-400">/ {stats.medium}</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Hard Questions</p>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0<span className="text-base font-normal text-gray-400">/ {stats.hard}</span></p>
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
        />
        <PrepFilterDropdown
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[{ value: 'all', label: 'All Difficulties' }, { value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }]}
        />
        {(sectionFilter !== 'all' || difficultyFilter !== 'all' || search.trim()) && (
          <button onClick={() => { setSectionFilter('all'); setDifficultyFilter('all'); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {questions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-medium">No questions match your filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('title')}>
                    <span className="inline-flex items-center">Question <SortIcon active={sortKey === 'title'} dir={sortDir} /></span>
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('section')}>
                    <span className="inline-flex items-center">Section <SortIcon active={sortKey === 'section'} dir={sortDir} /></span>
                  </th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('difficulty')}>
                    <span className="inline-flex items-center justify-center">Difficulty <SortIcon active={sortKey === 'difficulty'} dir={sortDir} /></span>
                  </th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Solved</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Revision</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((q, idx) => {
                  const isSolved = solvedMap[q.id] ?? q.isSolved;
                  const isRevision = revisionMap[q.id] ?? q.isRevision;
                  const gi = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                  return (
                    <tr key={q.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-5 py-4 text-sm text-gray-400 font-medium">{gi + 1}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">{q.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{q.description}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{q.section}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${difficultyClass(q.difficulty)}`}>{q.difficulty}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => toggleSolved(q.id)} className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${isSolved ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}>
                          {isSolved ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => toggleRevision(q.id)} className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${isRevision ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-gray-400'}`}>
                          {isRevision ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, questions.length)}</span> of{' '}
                <span className="font-semibold text-gray-900">{questions.length}</span> questions
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
