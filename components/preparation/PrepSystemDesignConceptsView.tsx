import { useMemo } from "react";
import PrepRichContentRenderer from "./PrepRichContentRenderer";
import { type SDQuestion } from "./SDDetailPanel";

function groupBySection(items: SDQuestion[]) {
  const map = new Map<string, SDQuestion[]>();
  for (const item of items) {
    const section = item.section || "General";
    if (!map.has(section)) map.set(section, []);
    map.get(section)!.push(item);
  }
  return Array.from(map.entries()).map(([section, concepts]) => ({
    section,
    concepts,
  }));
}

export interface PrepSystemDesignConceptsViewProps {
  concepts: SDQuestion[];
  loading: boolean;
  viewMode: "grid" | "table";
  selectedConcept: SDQuestion | null;
  onSelectConcept: (concept: SDQuestion | null) => void;
  shortLabel: string;
}

export default function PrepSystemDesignConceptsView({
  concepts,
  loading,
  viewMode,
  selectedConcept,
  onSelectConcept,
  shortLabel,
}: PrepSystemDesignConceptsViewProps) {
  const groups = useMemo(() => groupBySection(concepts), [concepts]);

  if (selectedConcept) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onSelectConcept(null)}
          className="mb-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          ← Back to {shortLabel} concepts
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-50 text-cyan-700">
              {selectedConcept.section}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{selectedConcept.title}</h2>
          {selectedConcept.content ? (
            <PrepRichContentRenderer html={selectedConcept.content} />
          ) : (
            <p className="text-gray-400">No content available for this concept.</p>
          )}
          {selectedConcept.topics && selectedConcept.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-gray-100">
              {selectedConcept.topics.map((t) => (
                <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500">Loading concepts…</p>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <p className="text-gray-500 font-medium">No {shortLabel} concepts available yet.</p>
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Section</th>
            </tr>
          </thead>
          <tbody>
            {concepts.map((concept) => (
              <tr
                key={concept.id}
                onClick={() => onSelectConcept(concept)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 font-medium text-gray-900">{concept.title}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{concept.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.section}>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{group.section}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.concepts.map((concept) => (
              <button
                key={concept.id}
                type="button"
                onClick={() => onSelectConcept(concept)}
                className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <h3 className="font-semibold text-gray-900">{concept.title}</h3>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
