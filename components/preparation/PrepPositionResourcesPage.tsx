import { useState, useMemo, useEffect } from 'react';
import { roles, subTabConfig, type SubTabKey, type PositionQuestion } from '../../data/positionResourcesData';

interface PrepPositionResourcesPageProps {
  toggleSidebar?: () => void;
}

const ITEMS_PER_PAGE = 15;
const diffOrder: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

type SortKey = 'question' | 'category' | 'difficulty' | null;
type SortDir = 'asc' | 'desc';

const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
  <span className={`inline-flex flex-col ml-1.5 -space-y-0.5 ${active ? '' : 'opacity-30'}`}>
    <svg className={`w-3 h-3 ${active && dir === 'asc' ? 'text-orange-500' : ''}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0l5 6H0z" /></svg>
    <svg className={`w-3 h-3 ${active && dir === 'desc' ? 'text-orange-500' : ''}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z" /></svg>
  </span>
);

const difficultyClass = (d: string) => {
  if (d === 'Easy') return 'bg-green-100 text-green-700';
  if (d === 'Medium') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

const PrepPositionResourcesPage = (_props: PrepPositionResourcesPageProps) => {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0].id);
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('interview');
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});
  const [revisionMap, setRevisionMap] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? roles[0], [selectedRoleId]);

  const rawQuestions: PositionQuestion[] = useMemo(() => {
    switch (activeSubTab) {
      case 'interview': return selectedRole.interviewQuestions;
      case 'dsa': return selectedRole.dsaQuestions;
      case 'aptitude': return selectedRole.aptitudeQuestions;
      case 'sql': return selectedRole.sqlQuestions;
      case 'corecs': return selectedRole.coreCSQuestions;
      default: return [];
    }
  }, [selectedRole, activeSubTab]);

  const questions = useMemo(() => {
    if (!sortKey) return rawQuestions;
    return [...rawQuestions].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'question') cmp = a.question.localeCompare(b.question);
      else if (sortKey === 'category') cmp = (a.category ?? '').localeCompare(b.category ?? '');
      else if (sortKey === 'difficulty') cmp = diffOrder[a.difficulty] - diffOrder[b.difficulty];
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [rawQuestions, sortKey, sortDir]);

  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return questions.slice(start, start + ITEMS_PER_PAGE);
  }, [questions, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [selectedRoleId, activeSubTab]);

  const showCategory = activeSubTab !== 'interview';

  const subTab = subTabConfig.find((t) => t.key === activeSubTab)!;
  const roleName = selectedRole.role.replace(/ role$/, '');
  const sectionTitle = subTab.titleTemplate.replace('{role}', roleName);
  const sectionSubtitle = subTab.subtitleTemplate.replace('{role}', roleName);

  const toggleSolved = (id: string) => setSolvedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleRevision = (id: string) => setRevisionMap((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Position Wise Resources</h1>
        <p className="text-gray-500 mt-1">Prepare for your dream job with position-specific interview preparation resources.</p>
      </div>

      {/* Role Tabs */}
      <div className="mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max border-b border-gray-200 pb-0">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => { setSelectedRoleId(role.id); setActiveSubTab('interview'); }}
              className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                selectedRoleId === role.id
                  ? 'text-orange-600 border-orange-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {role.label}
              {role.isNew && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded">New</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max border-b border-gray-200 pb-0">
          {subTabConfig.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeSubTab === tab.key
                  ? 'text-orange-600 border-orange-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Title + My Progress */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{sectionTitle}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{sectionSubtitle}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          My progress
        </button>
      </div>

      {/* Questions Table */}
      {questions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No questions available for this category yet.</p>
          <p className="text-gray-400 text-sm mt-1">Check back soon for updates.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('question')}>
                    <span className="inline-flex items-center">Question <SortIcon active={sortKey === 'question'} dir={sortDir} /></span>
                  </th>
                  {showCategory && (
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('category')}>
                      <span className="inline-flex items-center">Category <SortIcon active={sortKey === 'category'} dir={sortDir} /></span>
                    </th>
                  )}
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => handleSort('difficulty')}>
                    <span className="inline-flex items-center justify-center">Difficulty <SortIcon active={sortKey === 'difficulty'} dir={sortDir} /></span>
                  </th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Solved</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Revision</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuestions.map((q, idx) => {
                  const isSolved = solvedMap[q.id] ?? q.isSolved;
                  const isRevision = revisionMap[q.id] ?? q.isRevision;
                  const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;

                  return (
                    <tr
                      key={q.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150"
                    >
                      {/* # */}
                      <td className="px-5 py-3.5 text-sm text-gray-400 font-medium">{globalIdx + 1}</td>

                      {/* Question */}
                      <td className="px-5 py-3.5 text-sm text-gray-900">{q.question}</td>

                      {/* Category */}
                      {showCategory && (
                        <td className="px-5 py-3.5 text-sm text-gray-500">{q.category || '—'}</td>
                      )}

                      {/* Difficulty */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${difficultyClass(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      </td>

                      {/* Solved */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => toggleSolved(q.id)}
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
                            isSolved
                              ? 'text-green-600 bg-green-50'
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                        >
                          {isSolved ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </td>

                      {/* Revision / Bookmark */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => toggleRevision(q.id)}
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
                            isRevision
                              ? 'text-orange-500 bg-orange-50'
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                        >
                          {isRevision ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
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
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  title="First page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  title="Previous page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    totalPages <= 7 ||
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          page === currentPage
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={page} className="px-1 text-gray-400 text-sm select-none">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  title="Next page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  title="Last page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scrollbar hide utility */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PrepPositionResourcesPage;
