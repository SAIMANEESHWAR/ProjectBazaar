import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  HelpCircle,
  Code2,
  ClipboardList,
  Flame,
  RefreshCw,
  Activity,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { prepUserApi, type PrepStats, type PrepActivity } from '../../services/preparationApi';
import { invalidateCache } from '../../lib/apiCache';
import { useDashboard } from '../../context/DashboardContext';
import type { DashboardView } from '../../context/DashboardContext';

interface PrepActivityPageProps {
  toggleSidebar?: () => void;
}

const HEATMAP_WEEKS = 12;
const HEATMAP_DAYS = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildActivityHeatmap(activities: PrepActivity[]): number[][] {
  const data: number[][] = Array.from({ length: HEATMAP_WEEKS }, () =>
    Array(HEATMAP_DAYS).fill(0),
  );
  const now = Date.now();
  const dayMs = 86_400_000;

  for (const activity of activities) {
    try {
      const ts = new Date(activity.timestamp).getTime();
      if (Number.isNaN(ts)) continue;
      const daysAgo = Math.floor((now - ts) / dayMs);
      if (daysAgo < 0 || daysAgo >= HEATMAP_WEEKS * HEATMAP_DAYS) continue;
      const col = Math.floor(daysAgo / HEATMAP_DAYS);
      const row = daysAgo % HEATMAP_DAYS;
      data[col][row] += 1;
    } catch {
      /* ignore invalid timestamps */
    }
  }

  return data;
}

function heatmapLevel(value: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 4;
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return ts;
  }
}

function formatHeatmapDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const activityIconClass = 'w-4 h-4';
const activityIcons: Record<string, ReactNode> = {
  question: <HelpCircle className={activityIconClass} />,
  dsa: <Code2 className={activityIconClass} />,
  quiz: <ClipboardList className={activityIconClass} />,
  dm: <HelpCircle className={activityIconClass} />,
  toggle_isSolved: <HelpCircle className={activityIconClass} />,
  toggle_isBookmarked: <HelpCircle className={activityIconClass} />,
  submit_quiz: <ClipboardList className={activityIconClass} />,
};

const QUICK_START: { view: DashboardView; label: string; description: string; Icon: typeof HelpCircle }[] = [
  {
    view: 'prep-interview-questions',
    label: 'Interview Questions',
    description: 'Practice technical & behavioral Q&A',
    Icon: HelpCircle,
  },
  {
    view: 'prep-dsa',
    label: 'DSA Problems',
    description: 'Sharpen coding skills',
    Icon: Code2,
  },
  {
    view: 'prep-quizzes',
    label: 'Quizzes',
    description: 'Test your knowledge',
    Icon: ClipboardList,
  },
];

function EmptyState({
  onNavigate,
}: {
  onNavigate: (view: DashboardView) => void;
}) {
  return (
    <div className="prep-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
        <Activity className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--prep-text-primary)] mb-2">
        Your activity log is empty
      </h3>
      <p className="text-sm text-[var(--prep-text-tertiary)] max-w-md mx-auto mb-6">
        Start practicing to track solved questions, build your streak, and see your weekly
        progress here.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {QUICK_START.map(({ view, label, description, Icon }) => (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(view)}
            className="prep-card p-4 text-left hover:border-orange-500/40 transition-all group"
          >
            <Icon className="h-5 w-5 text-orange-500 mb-2" />
            <p className="text-sm font-semibold text-[var(--prep-text-primary)] group-hover:text-orange-500 transition-colors">
              {label}
            </p>
            <p className="text-xs text-[var(--prep-text-tertiary)] mt-0.5">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

const PrepActivityPage = (_props: PrepActivityPageProps) => {
  const { setActiveView } = useDashboard();
  const [stats, setStats] = useState<PrepStats | null>(null);
  const [activities, setActivities] = useState<PrepActivity[]>([]);
  const [totals, setTotals] = useState({ questions: 0, dsa: 0, quizzes: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (cancelled = { current: false }) => {
    try {
      const [s, a, dashboard] = await Promise.all([
        prepUserApi.getStats(),
        prepUserApi.getActivity(30),
        prepUserApi.getDashboard(),
      ]);
      if (!cancelled.current) {
        setStats(s ?? null);
        setActivities(a ?? []);
        if (dashboard?.contentCounts) {
          const cc = dashboard.contentCounts as Record<string, number>;
          setTotals({
            questions: cc.interview_questions ?? 0,
            dsa: cc.dsa_problems ?? 0,
            quizzes: cc.quizzes ?? 0,
          });
        }
      }
    } catch {
      if (!cancelled.current) {
        setStats(null);
        setActivities([]);
      }
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    fetchData(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:stats');
    invalidateCache('prep:activity');
    invalidateCache('prep:dashboard');
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const solvedQuestions = stats?.solvedQuestions ?? 0;
  const solvedDSA = stats?.solvedDSA ?? 0;
  const completedQuizzes = stats?.completedQuizzes ?? 0;
  const streak = stats?.streak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;

  const interviewProgress =
    totals.questions > 0 ? (solvedQuestions / totals.questions) * 100 : 0;
  const dsaProgress = totals.dsa > 0 ? (solvedDSA / totals.dsa) * 100 : 0;
  const quizProgress = totals.quizzes > 0 ? (completedQuizzes / totals.quizzes) * 100 : 0;

  const heatmapData = useMemo(() => buildActivityHeatmap(activities), [activities]);
  const heatmapTotal = useMemo(
    () => heatmapData.reduce((sum, col) => sum + col.reduce((a, b) => a + b, 0), 0),
    [heatmapData],
  );

  const hasUserProgress =
    solvedQuestions + solvedDSA + completedQuizzes > 0 || streak > 0 || activities.length > 0;

  const overviewCards = [
    {
      label: 'Questions Solved',
      value: solvedQuestions,
      total: totals.questions,
      Icon: HelpCircle,
      accent: 'text-orange-500',
    },
    {
      label: 'DSA Solved',
      value: solvedDSA,
      total: totals.dsa,
      Icon: Code2,
      accent: 'text-sky-400',
    },
    {
      label: 'Quizzes Completed',
      value: completedQuizzes,
      total: totals.quizzes,
      Icon: ClipboardList,
      accent: 'text-emerald-400',
    },
    {
      label: 'Day Streak',
      value: streak,
      total: null as number | null,
      sub: longestStreak > streak ? `Best: ${longestStreak} days` : undefined,
      Icon: Flame,
      accent: 'text-amber-400',
    },
  ];

  const categoryBars = [
    { label: 'Interview Questions', progress: interviewProgress, total: totals.questions, solved: solvedQuestions },
    { label: 'DSA', progress: dsaProgress, total: totals.dsa, solved: solvedDSA },
    { label: 'Quizzes', progress: quizProgress, total: totals.quizzes, solved: completedQuizzes },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-[var(--prep-surface-muted)] rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="prep-stat-card h-24" />
          ))}
        </div>
        <div className="prep-card h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="prep-title-page text-2xl font-bold text-orange-500">My Activity</h1>
          <p className="prep-subtitle mt-1">
            {hasUserProgress
              ? 'Your preparation journey at a glance'
              : 'Start practicing to unlock your progress dashboard'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="prep-btn prep-btn--ghost prep-btn--icon shrink-0"
          aria-label="Refresh activity"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <div key={card.label} className="prep-stat-card group">
            <div className="flex items-center justify-between mb-3">
              <p className="prep-label">{card.label}</p>
              <card.Icon className={`w-5 h-5 ${card.accent} opacity-80 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="prep-activity-stat-value">
              {card.value}
              {card.total !== null && (
                <span className="text-base font-normal text-[var(--prep-text-tertiary)]">
                  {' '}
                  / {card.total}
                </span>
              )}
            </p>
            {card.sub && (
              <p className="text-xs text-[var(--prep-text-tertiary)] mt-1">{card.sub}</p>
            )}
            {card.total === 0 && card.label !== 'Day Streak' && (
              <p className="text-xs text-[var(--prep-text-tertiary)] mt-1">No content available yet</p>
            )}
          </div>
        ))}
      </div>

      {!hasUserProgress ? (
        <EmptyState onNavigate={setActiveView} />
      ) : (
        <>
          {/* Heatmap */}
          <div className="prep-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-[var(--prep-text-primary)]">Last 12 weeks</h3>
              </div>
              <span className="prep-chip prep-chip--accent">
                {heatmapTotal} {heatmapTotal === 1 ? 'action' : 'actions'}
              </span>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex gap-1 min-w-max">
                {/* Day labels */}
                <div className="flex flex-col gap-1 pr-1 pt-0.5">
                  <div className="h-3" />
                  {DAY_LABELS.map((day, i) => (
                    <div
                      key={day}
                      className="h-3 flex items-center text-[10px] text-[var(--prep-text-tertiary)] leading-none"
                      style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {heatmapData.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1">
                    {col.map((val, rowIdx) => {
                      const daysAgo = colIdx * HEATMAP_DAYS + rowIdx;
                      const level = heatmapLevel(val);
                      return (
                        <div
                          key={rowIdx}
                          className={`prep-heatmap-cell prep-heatmap-cell--${level}`}
                          title={`${formatHeatmapDate(daysAgo)}: ${val} ${val === 1 ? 'activity' : 'activities'}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-[var(--prep-text-tertiary)]">
              <span>Less</span>
              <div className="flex gap-1">
                {([0, 1, 2, 3, 4] as const).map((level) => (
                  <div key={level} className={`prep-heatmap-cell prep-heatmap-cell--${level}`} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category progress */}
            <div className="prep-card p-6">
              <h3 className="font-semibold text-[var(--prep-text-primary)] mb-5">Category Progress</h3>
              <div className="space-y-5">
                {categoryBars.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--prep-text-secondary)]">{cat.label}</span>
                      <span className="font-medium text-[var(--prep-text-primary)]">
                        {cat.total > 0 ? (
                          <>
                            {cat.solved}/{cat.total} · {Math.round(cat.progress)}%
                          </>
                        ) : (
                          <span className="text-[var(--prep-text-tertiary)]">—</span>
                        )}
                      </span>
                    </div>
                    <div className="prep-progress-track">
                      <div
                        className="prep-progress-fill"
                        style={{ width: `${cat.total > 0 ? cat.progress : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="prep-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--prep-text-primary)]">Recent Activity</h3>
                {activities.length > 0 && (
                  <span className="text-xs text-[var(--prep-text-tertiary)]">
                    Last {activities.length} actions
                  </span>
                )}
              </div>

              {activities.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--prep-text-tertiary)] mb-4">
                    No recent actions recorded yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveView('prep-interview-questions')}
                    className="prep-btn prep-btn--primary text-sm inline-flex items-center gap-2"
                  >
                    Start practicing
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <ul className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {activities.map((item, i) => {
                    const actType = item.action;
                    const title =
                      (item.metadata?.title as string) ||
                      actType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                    const desc = (item.metadata?.description as string) || item.contentType.replace(/_/g, ' ');
                    return (
                      <li
                        key={`${item.timestamp}-${i}`}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--prep-surface-muted)] transition-colors"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                          {activityIcons[actType] || activityIcons.question}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[var(--prep-text-primary)] truncate">
                            {title}
                          </p>
                          <p className="text-xs text-[var(--prep-text-tertiary)] truncate">{desc}</p>
                        </div>
                        <span className="flex-shrink-0 text-xs text-[var(--prep-text-tertiary)] whitespace-nowrap">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrepActivityPage;
