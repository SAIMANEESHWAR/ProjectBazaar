import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Concept } from '../../data/preparationTypes';
import { prepUserApi } from '../../services/preparationApi';
import { groupByCategory, isNonEmptyString } from '../../lib/prepContentHelpers';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';
import { RefreshCw } from 'lucide-react';
import { invalidateCache } from '../../lib/apiCache';

type FundSection = 'language' | 'oops';

export interface PrepFundamentalsPageProps { toggleSidebar?: () => void; section?: FundSection; }
type DiffFilter = 'all' | 'Easy' | 'Medium' | 'Hard';

function normalizeConcept(raw: Record<string, unknown>): Concept {
  const codeExamples = raw.codeExamples;
  let codeExample = '';
  if (Array.isArray(codeExamples) && codeExamples.length > 0) {
    const first = codeExamples[0];
    codeExample = typeof first === 'string' ? first : String((first as Record<string, unknown>)?.code ?? '');
  }

  const topic = String(raw.subcategory ?? raw.topic ?? raw.category ?? 'General');
  const difficultyRaw = raw.difficulty;
  const difficulty =
    difficultyRaw === 'Easy' || difficultyRaw === 'Medium' || difficultyRaw === 'Hard'
      ? difficultyRaw
      : 'Medium';

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    difficulty,
    category: String(raw.category ?? 'General'),
    topic,
    explanation: String(raw.content ?? raw.explanation ?? ''),
    codeExample,
    language: String(raw.language ?? 'general'),
  };
}

function isLanguageConcept(concept: Concept): boolean {
  return concept.topic === 'Language' || concept.category.toLowerCase().includes('language');
}

const diffBadge = (d: string) => {
  if (d === 'Easy') return 'bg-green-100 text-green-700';
  if (d === 'Medium') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export default function PrepFundamentalsPage({ section: sectionProp = 'oops' }: PrepFundamentalsPageProps) {
  const section = sectionProp;
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [viewMode, setViewMode] = useViewMode('grid');
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchConcepts = useCallback(async (cancelled = { current: false }) => {
    setLoading(true);
    try {
      const resp = await prepUserApi.listContent('fundamentals', { limit: 500 });
      if (!cancelled.current) {
        setAllConcepts(
          resp.success
            ? (resp.items ?? [])
                .map((item) =>
                  normalizeConcept(item as unknown as Record<string, unknown>),
                )
                .filter((concept) => isNonEmptyString(concept.title))
            : [],
        );
      }
    } catch {
      if (!cancelled.current) setAllConcepts([]);
    }
    if (!cancelled.current) setLoading(false);
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    fetchConcepts(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchConcepts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:fundamentals');
    await fetchConcepts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const concepts = useMemo(() => {
    const sectionConcepts = allConcepts.filter((concept) =>
      section === 'language' ? isLanguageConcept(concept) : !isLanguageConcept(concept)
    );
    if (diffFilter === 'all') return sectionConcepts;
    return sectionConcepts.filter((c) => c.difficulty === diffFilter);
  }, [allConcepts, section, diffFilter]);

  const groups = useMemo(() => groupByCategory(concepts), [concepts]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading fundamentals…</p>
      </div>
    );
  }

  if (selectedConcept) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <button onClick={() => setSelectedConcept(null)} className="hover:text-orange-600 transition-colors">
            {section === 'oops' ? 'OOPs Concepts' : 'Language Fundamentals'}
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 font-medium">{selectedConcept.title}</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedConcept.title}</h1>
            <p className="text-gray-500 mt-1">{selectedConcept.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${diffBadge(selectedConcept.difficulty)}`}>
                {selectedConcept.difficulty.toLowerCase()} level
              </span>
              <span className="prep-topic-chip px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                {selectedConcept.topic}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Explanation</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedConcept.explanation}</p>
        </div>

        {selectedConcept.codeExample && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Code Example</h2>
            </div>
            <div className="bg-[#1e1e2e] p-6 overflow-x-auto">
              <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">{selectedConcept.codeExample.replace(/```\w*\n?/g, '').replace(/```/g, '')}</pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {section === 'oops' ? 'OOPs Concepts' : 'Language Fundamentals'}
          </h1>
          <p className="text-gray-500 mt-1">
            {section === 'oops'
              ? 'Master object-oriented programming principles and design patterns'
              : 'Core language concepts for technical interviews'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 ${isRefreshing ? 'text-orange-500' : 'text-gray-500'}`}
            aria-label="Refresh fundamentals"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <PrepViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'Easy', 'Medium', 'Hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDiffFilter(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              diffFilter === d ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-orange-50'
            }`}
          >
            {d === 'all' ? 'All' : d}
          </button>
        ))}
      </div>

      {concepts.length === 0 ? (
        <p className="text-gray-500 py-12 text-center">No concepts available yet.</p>
      ) : viewMode === 'grid' ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.category}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{group.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.concepts.map((concept) => (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConcept(concept)}
                    className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                  >
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${diffBadge(concept.difficulty)}`}>
                      {concept.difficulty}
                    </span>
                    <h3 className="mt-3 font-semibold text-gray-900">{concept.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{concept.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {concepts.map((concept) => (
                <tr
                  key={concept.id}
                  onClick={() => setSelectedConcept(concept)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-gray-900">{concept.title}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{concept.category}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${diffBadge(concept.difficulty)}`}>
                      {concept.difficulty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
