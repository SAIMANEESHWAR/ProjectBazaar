import { useMemo, useState } from "react";
import PrepRichContentRenderer from "./PrepRichContentRenderer";
import PrepTopicFolderTree from "./PrepTopicFolderTree";
import { getPrimaryTopic, getGroupThumbnail, groupByTopic } from "./prepTopicGrouping";
import { type ViewMode } from "./PrepViewToggle";
import { type SDQuestion } from "./SDDetailPanel";

export interface PrepSystemDesignConceptsViewProps {
  concepts: SDQuestion[];
  loading: boolean;
  viewMode: ViewMode;
  selectedConcept: SDQuestion | null;
  onSelectConcept: (concept: SDQuestion | null) => void;
  shortLabel: string;
  /** Breadcrumb root label (defaults to "{shortLabel} concepts"). */
  listLabel?: string;
  onNavigateRoot?: () => void;
  onNavigateTopic?: () => void;
}

export default function PrepSystemDesignConceptsView({
  concepts,
  loading,
  viewMode,
  selectedConcept,
  onSelectConcept,
  shortLabel,
  listLabel,
  onNavigateRoot,
  onNavigateTopic,
}: PrepSystemDesignConceptsViewProps) {
  const [selectedTopicGroup, setSelectedTopicGroup] = useState<string | null>(null);
  const topicGroups = useMemo(() => groupByTopic(concepts), [concepts]);
  const activeGroup = useMemo(
    () => topicGroups.find((group) => group.topic === selectedTopicGroup) ?? null,
    [topicGroups, selectedTopicGroup],
  );

  const handleSelectConcept = (concept: SDQuestion) => {
    setSelectedTopicGroup((current) => current ?? getPrimaryTopic(concept));
    onSelectConcept(concept);
  };

  const handleBreadcrumbNavigate = (target: "root" | "topic") => {
    if (target === "root") {
      if (onNavigateRoot) {
        onNavigateRoot();
        return;
      }
      onSelectConcept(null);
      setSelectedTopicGroup(null);
      return;
    }

    if (onNavigateTopic) {
      onNavigateTopic();
      return;
    }
    onSelectConcept(null);
  };

  if (selectedConcept) {
    const topic = getPrimaryTopic(selectedConcept);
    const rootLabel = listLabel ?? `${shortLabel} concepts`;
    const breadcrumbSegments = [
      { label: rootLabel, target: "root" as const },
      { label: topic, target: "topic" as const },
      { label: selectedConcept.title, target: "current" as const },
    ];

    return (
      <div>
        <nav
          aria-label="Concept location"
          className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm"
        >
          {breadcrumbSegments.map((segment, index) => (
            <span key={segment.label} className="inline-flex items-center gap-1.5 min-w-0">
              {index > 0 && (
                <span className="text-[var(--prep-text-tertiary)] shrink-0" aria-hidden>
                  /
                </span>
              )}
              {segment.target === "current" ? (
                <span className="font-medium text-[var(--prep-text-primary)] truncate">
                  {segment.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBreadcrumbNavigate(segment.target)}
                  className="text-[var(--prep-text-tertiary)] hover:text-orange-500 transition-colors truncate"
                >
                  {segment.label}
                </button>
              )}
            </span>
          ))}
        </nav>
        <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
              {getPrimaryTopic(selectedConcept)}
            </span>
            {selectedConcept.section && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-neutral-400">
                {selectedConcept.section}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {selectedConcept.title}
          </h2>
          {selectedConcept.content ? (
            <PrepRichContentRenderer html={selectedConcept.content} variant="nocturnal" />
          ) : (
            <p className="text-gray-400">No content available for this concept.</p>
          )}
          {selectedConcept.topics && selectedConcept.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
              {selectedConcept.topics.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-neutral-400"
                >
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
      <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500 dark:text-neutral-400">Loading concepts…</p>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
        <p className="text-gray-500 dark:text-neutral-400 font-medium">
          No {shortLabel} concepts available yet.
        </p>
      </div>
    );
  }

  if (viewMode === "folder") {
    return (
      <PrepTopicFolderTree items={concepts} onSelect={handleSelectConcept} />
    );
  }

  if (viewMode === "table") {
    return (
      <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03]">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-neutral-300">
                Title
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-neutral-300">
                Topic
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-neutral-300 hidden md:table-cell">
                Section
              </th>
            </tr>
          </thead>
          <tbody>
            {concepts.map((concept) => (
              <tr
                key={concept.id}
                onClick={() => handleSelectConcept(concept)}
                className="border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-neutral-100">
                  {concept.title}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-neutral-400">
                  {getPrimaryTopic(concept)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-neutral-400 hidden md:table-cell">
                  {concept.section}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      {selectedTopicGroup && activeGroup ? (
        <>
          <button
            type="button"
            onClick={() => setSelectedTopicGroup(null)}
            className="mb-4 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
          >
            ← Back to all topics
          </button>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeGroup.topic}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
              {activeGroup.items.length} concept{activeGroup.items.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeGroup.items.map((concept) => (
              <button
                key={concept.id}
                type="button"
                onClick={() => handleSelectConcept(concept)}
                className="group text-left bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/40 transition-all duration-200"
              >
                <h3 className="font-semibold text-gray-900 dark:text-neutral-100 leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {concept.title}
                </h3>
                {concept.section && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-neutral-500 line-clamp-1">
                    {concept.section}
                  </p>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {topicGroups.map((group) => {
            const thumbnailUrl = getGroupThumbnail(group.items);

            return (
              <button
                key={group.topic}
                type="button"
                onClick={() => setSelectedTopicGroup(group.topic)}
                className="group text-left bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200"
              >
                <div className="relative h-40 overflow-hidden">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-end p-4">
                      <span className="text-lg font-bold text-white/95 line-clamp-2">{group.topic}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Topic
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400">
                      {group.items.length} concept{group.items.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-neutral-100 leading-snug line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {group.topic}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
