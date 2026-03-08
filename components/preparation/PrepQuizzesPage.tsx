import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Quiz } from '../../data/preparationMockData';
import { prepUserApi } from '../../services/preparationApi';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';
import { RefreshCw, Lock } from 'lucide-react';
import { invalidateCache } from '../../lib/apiCache';

interface PrepQuizzesPageProps {
  toggleSidebar?: () => void;
}

const TABS = ['Dashboard', 'History', 'Bookmarked'] as const;

function DifficultyBadge({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) {
  const styles = {
    Easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[difficulty]}`}>
      {difficulty}
    </span>
  );
}

function formatDuration(minutes: number) {
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function PrepQuizzesPage(_props: PrepQuizzesPageProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Dashboard');
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useViewMode('grid');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuizzes = useCallback(async (cancelled = { current: false }) => {
    try {
      const resp = await prepUserApi.listContent('quizzes', { limit: 200 });
      if (!cancelled.current && resp.success && resp.items.length > 0) {
        setQuizzes((resp.items || []) as unknown as Quiz[]);
      }
    } catch { /* API only */ }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    fetchQuizzes(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchQuizzes]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:quizzes');
    await fetchQuizzes();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
      const matchesRole = roleFilter === 'all' || q.role === roleFilter;
      const matchesTab =
        activeTab === 'Dashboard' ||
        (activeTab === 'History' && q.completedAt) ||
        (activeTab === 'Bookmarked' && q.isBookmarked);
      return matchesSearch && matchesDifficulty && matchesRole && matchesTab;
    });
  }, [quizzes, search, difficultyFilter, roleFilter, activeTab]);

  const roles = useMemo(() => [...new Set(quizzes.map((q) => q.role))], [quizzes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
        <p className="text-gray-600 mt-1">Test your knowledge with timed quizzes</p>
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
            placeholder="Search quizzes..."
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
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All roles</option>
          <option value="Students">Students</option>
          <option value="Freshers">Freshers</option>
          <option value="Professionals">Professionals</option>
          {roles.filter(r => !['Students', 'Freshers', 'Professionals'].includes(r)).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center group/refresh">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none ${isRefreshing ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
                }`}
              aria-label="Refresh quizzes"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/refresh:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Refresh quizzes
            </div>
          </div>
          <PrepViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:border-orange-500/30 transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-orange-500/10 transition-colors" />
              <div className="flex items-start gap-2 flex-wrap mb-3">
                <DifficultyBadge difficulty={quiz.difficulty} />
                <span className="prep-topic-chip px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {quiz.category}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700">
                  {quiz.role}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{quiz.title}</h3>
              <p className="text-sm text-gray-600 flex-1 line-clamp-2 mb-4">{quiz.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>{quiz.questionCount} questions</span>
                <span>{formatDuration(quiz.duration)}</span>
              </div>
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(249,115,22,0.2)] hover:shadow-[0_4px_15px_rgba(249,115,22,0.3)] opacity-90 backdrop-blur-sm relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <Lock className="w-4 h-4" />
                <span className="tracking-wide">Coming Soon</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Category</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Role</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Difficulty</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Questions</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Duration</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.map((quiz, idx) => (
                  <tr key={quiz.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-5 py-4 text-sm text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{quiz.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{quiz.description}</p>
                    </td>
                    <td className="px-5 py-4"><span className="prep-topic-chip px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{quiz.category}</span></td>
                    <td className="px-5 py-4"><span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700">{quiz.role}</span></td>
                    <td className="px-5 py-4 text-center"><DifficultyBadge difficulty={quiz.difficulty} /></td>
                    <td className="px-5 py-4 text-center text-sm text-gray-600">{quiz.questionCount}</td>
                    <td className="px-5 py-4 text-center text-sm text-gray-600">{formatDuration(quiz.duration)}</td>
                    <td className="px-5 py-4 text-center">
                      <button
                        disabled
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5 mx-auto shadow-sm opacity-90 hover:opacity-100 transition-all duration-300 border border-white/10"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-wider">Coming Soon</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredQuizzes.length === 0 && (
            <div className="py-12 text-center text-gray-500">No quizzes match your filters.</div>
          )}
        </div>
      )}
    </div>
  );
}
