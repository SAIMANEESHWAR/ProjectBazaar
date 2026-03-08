import { useState, useEffect, type ReactNode } from 'react';
import {
  HelpCircle,
  Code2,
  ClipboardList,
  Building2,
  BookOpen,
  Target,
  Users,
  Mail,
  Briefcase,
  PenLine,
  Map,
  FileStack,
  RefreshCw,
} from 'lucide-react';
import { prepUserApi, type DashboardData, type PrepActivity } from '../../services/preparationApi';
import { ShinyButton } from '../ui/ShinyButton';
import { useCallback } from 'react';
import { invalidateCache } from '../../lib/apiCache';

interface PreparationHubProps {
  onNavigate: (view: string) => void;
}

// Icon styling removed locally in favor of direct classes

function buildFeatureCards(counts: Record<string, number>, collectionsCount: number) {
  return [
    { id: 'interview-questions', view: 'prep-interview-questions', title: 'Interview Questions', description: 'Practice technical and behavioral questions', count: counts.interview_questions ?? 0, Icon: HelpCircle },
    { id: 'dsa-problems', view: 'prep-dsa', title: 'DSA Problems', description: 'Data structures and algorithms practice', count: counts.dsa_problems ?? 0, Icon: Code2 },
    { id: 'quizzes', view: 'prep-quizzes', title: 'Quizzes', description: 'Test your knowledge with timed quizzes', count: counts.quizzes ?? 0, Icon: ClipboardList },
    { id: 'system-design', view: 'prep-system-design', title: 'System Design', description: 'HLD & LLD interview preparation', count: counts.system_design ?? 0, Icon: Building2 },
    { id: 'fundamentals', view: 'prep-fundamentals', title: 'Fundamentals', description: 'OOPs, language concepts & design principles', count: counts.fundamentals ?? 0, Icon: BookOpen },
    { id: 'position-resources', view: 'prep-position-resources', title: 'Position Resources', description: 'Role-specific preparation material', count: counts.position_resources ?? 0, Icon: Target },
    { id: 'mass-recruitment', view: 'prep-mass-recruitment', title: 'Mass Recruitment', description: 'Company-specific preparation guides', count: counts.mass_recruitment ?? 0, Icon: Users },
    { id: 'cold-dms', view: 'prep-cold-dms', title: 'Cold DMs / Emails', description: 'Templates for outreach and networking', count: counts.cold_dm_templates ?? 0, Icon: Mail },
    { id: 'job-portals', view: 'prep-job-portals', title: 'Job Portals', description: 'Discover job opportunities across platforms', count: counts.job_portals ?? 0, Icon: Briefcase },
    { id: 'handwritten-notes', view: 'prep-notes', title: 'Handwritten Notes', description: 'Curated study materials and notes', count: counts.handwritten_notes ?? 0, Icon: PenLine },
    { id: 'roadmaps', view: 'prep-roadmaps', title: 'Roadmaps', description: 'Step-by-step learning paths for every role', count: counts.roadmaps ?? 0, Icon: Map },
    { id: 'collections', view: 'prep-collections', title: 'Collections', description: 'Organize and save your favorite items', count: collectionsCount, Icon: FileStack },
  ];
}

const activityIconClass = 'w-4 h-4 text-gray-500 dark:text-gray-400';
const activityIcons: Record<string, ReactNode> = {
  question: <HelpCircle className={activityIconClass} />,
  dsa: <Code2 className={activityIconClass} />,
  quiz: <ClipboardList className={activityIconClass} />,
  dm: <Mail className={activityIconClass} />,
  toggle_isSolved: <HelpCircle className={activityIconClass} />,
  toggle_isBookmarked: <Mail className={activityIconClass} />,
  submit_quiz: <ClipboardList className={activityIconClass} />,
};

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return ts;
  }
}

export default function PreparationHub({ onNavigate }: PreparationHubProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (cancelled = { current: false }) => {
    try {
      const [data, cols] = await Promise.all([
        prepUserApi.getDashboard(),
        prepUserApi.listCollections(),
      ]);
      if (!cancelled.current) {
        if (data) setDashboard(data);
        setCollectionsCount(cols?.length ?? 0);
      }
    } catch { /* API only */ }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    (async () => {
      setLoading(true);
      await fetchDashboard(cancelled);
      if (!cancelled.current) {
        await prepUserApi.updateStreak();
        setLoading(false);
      }
    })();
    return () => { cancelled.current = true; };
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:dashboard');
    invalidateCache('prep:collections');
    await fetchDashboard();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const stats = dashboard?.stats ?? {
    solvedQuestions: 0,
    solvedDSA: 0,
    completedQuizzes: 0,
    streak: 0,
  } as any;

  const contentCounts = dashboard?.contentCounts ?? {};
  const activities: (PrepActivity | { id: string; type: string; title: string; description: string; timestamp: string })[] =
    dashboard?.recentActivity?.length ? dashboard.recentActivity : [];

  const featureCards = buildFeatureCards(contentCounts, collectionsCount);

  const totalIQ = contentCounts.interview_questions ?? 0;
  const totalDSA = contentCounts.dsa_problems ?? 0;
  const totalQuiz = contentCounts.quizzes ?? 0;
  const totalPrepItems = totalIQ + totalDSA + totalQuiz;
  const completedItems = (stats.solvedQuestions ?? 0) + (stats.solvedDSA ?? 0) + (stats.completedQuizzes ?? 0);
  const progressPercent = totalPrepItems > 0 ? Math.min(100, (completedItems / totalPrepItems) * 100) : 0;

  const statItems = [
    { label: 'Total Questions', value: totalIQ, Icon: HelpCircle },
    { label: 'DSA Problems', value: totalDSA, Icon: Code2 },
    { label: 'Quizzes', value: totalQuiz, Icon: ClipboardList },
    { label: 'Cold DM Templates', value: contentCounts.cold_dm_templates ?? 0, Icon: Mail },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-8 text-white shadow-[0_8px_32px_rgba(249,115,22,0.25)] border border-white/10">
        <div className="absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 400 200" fill="none">
            <circle cx="350" cy="50" r="120" fill="white" className="blur-3xl animate-pulse" />
            <circle cx="50" cy="180" r="80" fill="white" className="blur-2xl" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Preparation Hub</h1>
            <div className="relative flex items-center group/refresh">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 border border-white/20 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none ${isRefreshing ? 'text-white' : 'text-orange-100 hover:text-white'}`}
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-[10px] text-gray-900 bg-white rounded opacity-0 group-hover/refresh:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-medium">
                Refresh dashboard
              </div>
            </div>
          </div>
          <p className="mt-2 text-orange-100 max-w-lg">Your one-stop career preparation platform. Practice interviews, solve DSA, master system design, and land your dream job.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <ShinyButton
              onClick={() => document.getElementById('quick-access')?.scrollIntoView({ behavior: 'smooth' })}
              className="!bg-white/20 !border-white/30 !text-white hover:!bg-white/30 backdrop-blur-sm [--primary:theme(colors.orange.200)]"
            >
              Explore modules
            </ShinyButton>
          </div>
          <div className="mt-6 flex items-center gap-6">
            <div>
              <p className="text-sm text-orange-200">Overall Progress</p>
              <p className="text-2xl font-bold">{loading ? '—' : `${Math.round(progressPercent)}%`}</p>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="h-2 rounded-full bg-white/20">
                <div className="h-2 rounded-full bg-white transition-all duration-700" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-1 text-xs text-orange-200">{completedItems} of {totalPrepItems.toLocaleString()} items completed</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-lg backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                <span className="text-sm font-semibold">{stats.streak ?? 0} day streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <div key={stat.label} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:border-orange-500/20">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300">
              <stat.Icon className="w-6 h-6 group-hover:text-orange-500 transition-colors" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Feature cards */}
      <section id="quick-access">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quick Access</h2>
          <span className="text-sm text-gray-400 dark:text-gray-500">{featureCards.length} modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featureCards.map((card) => (
            <div
              key={card.id}
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 text-left transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-orange-500/30 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-orange-500/15 transition-colors" />
              <div className="w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-300 mb-4">
                <card.Icon className="w-6 h-6" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{card.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{card.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{card.count} items</span>
                <ShinyButton
                  onClick={() => onNavigate(card.view)}
                  className="!px-5 !py-2 !text-xs !font-bold [--primary:theme(colors.orange.500)] shadow-orange-500/20 hover:shadow-orange-500/40"
                >
                  START
                </ShinyButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <section className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <button className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors">View all</button>
          </div>
          <ul className="divide-y divide-gray-100">
            {activities.map((activity, i) => {
              const key = 'timestamp' in activity && 'action' in activity ? `${(activity as PrepActivity).timestamp}-${i}` : (activity as any).id;
              const actType = 'action' in activity ? (activity as PrepActivity).action : (activity as any).type;
              const title = 'metadata' in activity ? ((activity as PrepActivity).metadata?.title as string || actType) : (activity as any).title;
              const desc = 'metadata' in activity ? ((activity as PrepActivity).metadata?.description as string || '') : (activity as any).description;
              const time = 'timestamp' in activity && typeof (activity as any).timestamp === 'string' && (activity as any).timestamp.includes('T')
                ? formatTimestamp((activity as PrepActivity).timestamp)
                : (activity as any).timestamp;

              return (
                <li key={key} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    {activityIcons[actType] || activityIcons.question}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                    <p className="text-xs text-gray-500 truncate">{desc}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-gray-400">{time}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Progress Overview */}
        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Progress Overview</h2>
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#progressGrad)" strokeWidth="3" strokeDasharray={`${progressPercent}, 100`} strokeLinecap="round" className="transition-all duration-700" />
                <defs><linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{Math.round(progressPercent)}%</span>
                <span className="text-xs text-gray-400 font-medium">Complete</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Questions</span>
                <span className="font-semibold text-gray-900">{stats.solvedQuestions ?? 0}/{totalIQ}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">DSA Problems</span>
                <span className="font-semibold text-gray-900">{stats.solvedDSA ?? 0}/{totalDSA}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Quizzes</span>
                <span className="font-semibold text-gray-900">{stats.completedQuizzes ?? 0}/{totalQuiz}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
