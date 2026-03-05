import { useState, useMemo } from 'react';
import { roadmaps } from '../../data/preparationMockData';

interface PrepRoadmapsPageProps {
  toggleSidebar?: () => void;
}

interface RoadmapWithLocalSteps {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: { title: string; completed: boolean }[];
  isFree: boolean;
}

const PrepRoadmapsPage = (_props: PrepRoadmapsPageProps) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localRoadmaps, setLocalRoadmaps] = useState<RoadmapWithLocalSteps[]>(() =>
    roadmaps.map((r) => ({ ...r, steps: r.steps.map((s) => ({ ...s })) }))
  );

  const filteredRoadmaps = useMemo(() => {
    if (!search.trim()) return localRoadmaps;
    const q = search.toLowerCase();
    return localRoadmaps.filter((r) => r.title.toLowerCase().includes(q));
  }, [localRoadmaps, search]);

  const toggleStep = (roadmapId: string, stepIndex: number) => {
    setLocalRoadmaps((prev) =>
      prev.map((r) =>
        r.id === roadmapId
          ? {
              ...r,
              steps: r.steps.map((s, i) =>
                i === stepIndex ? { ...s, completed: !s.completed } : s
              ),
            }
          : r
      )
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roadmaps</h1>
        <p className="text-gray-600 mt-1">
          A comprehensive guide for navigating your career journey
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoadmaps.map((roadmap) => {
          const completed = roadmap.steps.filter((s) => s.completed).length;
          const total = roadmap.steps.length;
          const progress = total > 0 ? (completed / total) * 100 : 0;
          const isExpanded = expandedId === roadmap.id;

          return (
            <div
              key={roadmap.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{roadmap.title}</h3>
                  {roadmap.isFree && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Free
                    </span>
                  )}
                  <span className="prep-topic-chip px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    {roadmap.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{roadmap.description}</p>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">
                      {completed} / {total} steps
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => toggleExpanded(roadmap.id)}
                  className="w-full flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {isExpanded ? 'Hide' : 'Show'} steps
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="mt-4 space-y-2">
                    {roadmap.steps.map((step, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={step.completed}
                          onChange={() => toggleStep(roadmap.id, idx)}
                          className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span
                          className={`text-sm ${
                            step.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {step.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoadmaps.length === 0 && (
        <div className="text-center py-12 text-gray-500">No roadmaps found.</div>
      )}
    </div>
  );
};

export default PrepRoadmapsPage;
