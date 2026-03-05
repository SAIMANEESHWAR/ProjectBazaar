import { prepStats, recentActivity } from '../../data/preparationMockData';

interface PrepActivityPageProps {
  toggleSidebar?: () => void;
}

const generateHeatmapData = () => {
  const cols = 12;
  const rows = 7;
  const data: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const col: number[] = [];
    for (let r = 0; r < rows; r++) {
      col.push(Math.floor(Math.random() * 5));
    }
    data.push(col);
  }
  return data;
};

const heatmapData = generateHeatmapData();

const getHeatmapColor = (value: number) => {
  if (value === 0) return 'bg-gray-100';
  if (value === 1) return 'bg-orange-200';
  if (value === 2) return 'bg-orange-300';
  if (value === 3) return 'bg-orange-400';
  return 'bg-orange-500';
};

const activityIcons: Record<string, string> = {
  question: '❓',
  dsa: '📊',
  quiz: '📝',
  dm: '✉️',
};

const PrepActivityPage = (_props: PrepActivityPageProps) => {
  const totalQuestions = prepStats.totalQuestions;
  const totalDSA = prepStats.totalDSA;
  const totalQuizzes = prepStats.totalQuizzes;
  const solvedQuestions = prepStats.solvedQuestions;
  const solvedDSA = prepStats.solvedDSA;
  const completedQuizzes = prepStats.completedQuizzes;
  const streak = prepStats.streak;

  const interviewProgress = totalQuestions > 0 ? (solvedQuestions / totalQuestions) * 100 : 0;
  const dsaProgress = totalDSA > 0 ? (solvedDSA / totalDSA) * 100 : 0;
  const quizProgress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
  const aptitudeProgress = 25;

  const overviewCards = [
    { label: 'Questions Solved', value: solvedQuestions, total: totalQuestions },
    { label: 'DSA Solved', value: solvedDSA, total: totalDSA },
    { label: 'Quizzes Completed', value: completedQuizzes, total: totalQuizzes },
    { label: 'Day Streak', value: streak, total: null },
  ];

  const categoryBars = [
    { label: 'Interview Questions', progress: interviewProgress },
    { label: 'DSA', progress: dsaProgress },
    { label: 'Quizzes', progress: quizProgress },
    { label: 'Aptitude', progress: aptitudeProgress },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Activity</h1>
        <p className="text-gray-600 mt-1">Track your preparation progress</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 transition-all duration-200"
          >
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {card.value}
              {card.total !== null && (
                <span className="text-base font-normal text-gray-500"> / {card.total}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Weekly Activity</h3>
        <div className="flex gap-1">
          {heatmapData.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {col.map((val, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`w-3 h-3 rounded-sm ${getHeatmapColor(val)} transition-all duration-200`}
                  title={`${val} activities`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={v}
                className={`w-3 h-3 rounded-sm ${getHeatmapColor(v)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Category Progress</h3>
          <div className="space-y-4">
            {categoryBars.map((cat) => (
              <div key={cat.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{cat.label}</span>
                  <span className="font-medium text-gray-900">
                    {Math.round(cat.progress)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-200"
                    style={{ width: `${cat.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <span className="text-2xl">{activityIcons[item.type] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                  <p className="text-sm text-gray-600 truncate">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrepActivityPage;
