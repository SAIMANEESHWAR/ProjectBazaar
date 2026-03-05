import {
  prepStats,
  recentActivity,
  collections,
  massRecruitmentCompanies,
  handwrittenNotes,
  roadmaps,
  positionResources,
} from '../../data/preparationMockData';

interface PreparationHubProps {
  onNavigate: (view: string) => void;
}

const featureCards = [
  {
    id: 'interview-questions',
    view: 'prep-interview-questions',
    title: 'Interview Questions',
    description: 'Practice technical and behavioral questions',
    count: prepStats.totalQuestions,
    color: 'from-orange-500 to-amber-500',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'dsa-problems',
    view: 'prep-dsa',
    title: 'DSA Problems',
    description: 'Data structures and algorithms practice',
    count: prepStats.totalDSA,
    color: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    id: 'quizzes',
    view: 'prep-quizzes',
    title: 'Quizzes',
    description: 'Test your knowledge with timed quizzes',
    count: prepStats.totalQuizzes,
    color: 'from-violet-500 to-purple-500',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'system-design',
    view: 'prep-system-design',
    title: 'System Design',
    description: 'HLD & LLD interview preparation',
    count: 51,
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'fundamentals',
    view: 'prep-fundamentals',
    title: 'Fundamentals',
    description: 'OOPs, language concepts & design principles',
    count: 18,
    color: 'from-rose-500 to-pink-500',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'position-resources',
    view: 'prep-position-resources',
    title: 'Position Resources',
    description: 'Role-specific preparation material',
    count: positionResources.length,
    color: 'from-sky-500 to-blue-500',
    bgLight: 'bg-sky-50',
    textColor: 'text-sky-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    id: 'mass-recruitment',
    view: 'prep-mass-recruitment',
    title: 'Mass Recruitment',
    description: 'Company-specific preparation guides',
    count: massRecruitmentCompanies.length,
    color: 'from-amber-500 to-yellow-500',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'cold-dms',
    view: 'prep-cold-dms',
    title: 'Cold DMs / Emails',
    description: 'Templates for outreach and networking',
    count: prepStats.totalColdDMs,
    color: 'from-indigo-500 to-blue-600',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'job-portals',
    view: 'prep-job-portals',
    title: 'Job Portals',
    description: 'Discover job opportunities across platforms',
    count: prepStats.totalJobPortals,
    color: 'from-teal-500 to-green-500',
    bgLight: 'bg-teal-50',
    textColor: 'text-teal-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'handwritten-notes',
    view: 'prep-notes',
    title: 'Handwritten Notes',
    description: 'Curated study materials and notes',
    count: handwrittenNotes.length,
    color: 'from-fuchsia-500 to-pink-500',
    bgLight: 'bg-fuchsia-50',
    textColor: 'text-fuchsia-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'roadmaps',
    view: 'prep-roadmaps',
    title: 'Roadmaps',
    description: 'Step-by-step learning paths for every role',
    count: roadmaps.length,
    color: 'from-cyan-500 to-blue-500',
    bgLight: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: 'collections',
    view: 'prep-collections',
    title: 'Collections',
    description: 'Organize and save your favorite items',
    count: collections.length,
    color: 'from-gray-500 to-slate-600',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const totalPrepItems = prepStats.totalQuestions + prepStats.totalDSA + prepStats.totalQuizzes;
const completedItems = prepStats.solvedQuestions + prepStats.solvedDSA + prepStats.completedQuizzes;
const progressPercent = totalPrepItems > 0 ? Math.min(100, (completedItems / totalPrepItems) * 100) : 0;

const activityIcons: Record<string, JSX.Element> = {
  question: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  dsa: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  quiz: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  dm: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

const statItems = [
  {
    label: 'Total Questions',
    value: prepStats.totalQuestions,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    label: 'DSA Problems',
    value: prepStats.totalDSA,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    accent: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    label: 'Quizzes',
    value: prepStats.totalQuizzes,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    accent: 'text-violet-500',
    bg: 'bg-violet-50',
  },
  {
    label: 'Cold DM Templates',
    value: prepStats.totalColdDMs,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    accent: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
];

export default function PreparationHub({ onNavigate }: PreparationHubProps) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 400 200" fill="none"><circle cx="350" cy="50" r="120" fill="white" /><circle cx="50" cy="180" r="80" fill="white" /></svg>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Preparation Hub</h1>
          <p className="mt-2 text-orange-100 max-w-lg">Your one-stop career preparation platform. Practice interviews, solve DSA, master system design, and land your dream job.</p>
          <div className="mt-6 flex items-center gap-6">
            <div>
              <p className="text-sm text-orange-200">Overall Progress</p>
              <p className="text-2xl font-bold">{Math.round(progressPercent)}%</p>
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
                <span className="text-sm font-semibold">{prepStats.streak} day streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${stat.bg} ${stat.accent} flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Feature cards */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Quick Access</h2>
          <span className="text-sm text-gray-400">{featureCards.length} modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featureCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onNavigate(card.view)}
              className="group relative bg-white border border-gray-200 rounded-xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-sm`}>
                {card.icon}
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{card.title}</h3>
              <p className="mt-1 text-sm text-gray-500 leading-snug line-clamp-2">{card.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">{card.count} items</span>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
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
            {recentActivity.map((activity) => (
              <li key={activity.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                  {activityIcons[activity.type] || activityIcons.question}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                  <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400">{activity.timestamp}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Progress */}
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
                <span className="font-semibold text-gray-900">{prepStats.solvedQuestions}/{prepStats.totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">DSA Problems</span>
                <span className="font-semibold text-gray-900">{prepStats.solvedDSA}/{prepStats.totalDSA}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Quizzes</span>
                <span className="font-semibold text-gray-900">{prepStats.completedQuizzes}/{prepStats.totalQuizzes}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
