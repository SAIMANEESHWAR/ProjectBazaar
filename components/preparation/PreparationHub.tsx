import type { ReactNode } from 'react';
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
} from 'lucide-react';
import {
  prepStats,
  recentActivity,
  collections,
  massRecruitmentCompanies,
  handwrittenNotes,
  roadmaps,
  positionResources,
} from '../../data/preparationMockData';
import { ShinyButton } from '../ui/ShinyButton';

interface PreparationHubProps {
  onNavigate: (view: string) => void;
}

const iconClass = 'w-6 h-6 text-gray-600 dark:text-gray-400';

const featureCards = [
  { id: 'interview-questions', view: 'prep-interview-questions', title: 'Interview Questions', description: 'Practice technical and behavioral questions', count: prepStats.totalQuestions, Icon: HelpCircle },
  { id: 'dsa-problems', view: 'prep-dsa', title: 'DSA Problems', description: 'Data structures and algorithms practice', count: prepStats.totalDSA, Icon: Code2 },
  { id: 'quizzes', view: 'prep-quizzes', title: 'Quizzes', description: 'Test your knowledge with timed quizzes', count: prepStats.totalQuizzes, Icon: ClipboardList },
  { id: 'system-design', view: 'prep-system-design', title: 'System Design', description: 'HLD & LLD interview preparation', count: 51, Icon: Building2 },
  { id: 'fundamentals', view: 'prep-fundamentals', title: 'Fundamentals', description: 'OOPs, language concepts & design principles', count: 18, Icon: BookOpen },
  { id: 'position-resources', view: 'prep-position-resources', title: 'Position Resources', description: 'Role-specific preparation material', count: positionResources.length, Icon: Target },
  { id: 'mass-recruitment', view: 'prep-mass-recruitment', title: 'Mass Recruitment', description: 'Company-specific preparation guides', count: massRecruitmentCompanies.length, Icon: Users },
  { id: 'cold-dms', view: 'prep-cold-dms', title: 'Cold DMs / Emails', description: 'Templates for outreach and networking', count: prepStats.totalColdDMs, Icon: Mail },
  { id: 'job-portals', view: 'prep-job-portals', title: 'Job Portals', description: 'Discover job opportunities across platforms', count: prepStats.totalJobPortals, Icon: Briefcase },
  { id: 'handwritten-notes', view: 'prep-notes', title: 'Handwritten Notes', description: 'Curated study materials and notes', count: handwrittenNotes.length, Icon: PenLine },
  { id: 'roadmaps', view: 'prep-roadmaps', title: 'Roadmaps', description: 'Step-by-step learning paths for every role', count: roadmaps.length, Icon: Map },
  { id: 'collections', view: 'prep-collections', title: 'Collections', description: 'Organize and save your favorite items', count: collections.length, Icon: FileStack },
];

const totalPrepItems = prepStats.totalQuestions + prepStats.totalDSA + prepStats.totalQuizzes;
const completedItems = prepStats.solvedQuestions + prepStats.solvedDSA + prepStats.completedQuizzes;
const progressPercent = totalPrepItems > 0 ? Math.min(100, (completedItems / totalPrepItems) * 100) : 0;

const activityIconClass = 'w-4 h-4 text-gray-500 dark:text-gray-400';
const activityIcons: Record<string, ReactNode> = {
  question: <HelpCircle className={activityIconClass} />,
  dsa: <Code2 className={activityIconClass} />,
  quiz: <ClipboardList className={activityIconClass} />,
  dm: <Mail className={activityIconClass} />,
};

const statItems = [
  { label: 'Total Questions', value: prepStats.totalQuestions, Icon: HelpCircle },
  { label: 'DSA Problems', value: prepStats.totalDSA, Icon: Code2 },
  { label: 'Quizzes', value: prepStats.totalQuizzes, Icon: ClipboardList },
  { label: 'Cold DM Templates', value: prepStats.totalColdDMs, Icon: Mail },
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
          <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <stat.Icon className="w-5 h-5" />
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
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                <card.Icon className={iconClass} />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{card.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{card.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{card.count} items</span>
                <ShinyButton
                  onClick={() => onNavigate(card.view)}
                  className="!px-4 !py-1.5 !text-xs [--primary:theme(colors.orange.500)]"
                >
                  Start
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
