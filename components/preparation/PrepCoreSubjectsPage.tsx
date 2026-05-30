import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreVertical, RefreshCw } from "lucide-react";
import { mapCoreSubjectFromApi } from "../admin/core-subjects/coreSubjectsAdmin";
import { invalidateCache } from "../../lib/apiCache";
import {
  mapCoreSubjectCategoryFromApi,
  type CoreSubject,
} from "../../data/coreSubjectsConfig";
import { prepUserApi } from "../../services/preparationApi";
import PrepSystemDesignConceptsView from "./PrepSystemDesignConceptsView";
import PrepViewToggle, { useViewMode } from "./PrepViewToggle";
import { type SDQuestion } from "./SDDetailPanel";

export interface PrepCoreSubjectsPageProps {
  toggleSidebar?: () => void;
}

interface CoreConceptRecord {
  subject: string;
  concept: SDQuestion;
}

function toSdQuestion(item: ReturnType<typeof mapCoreSubjectFromApi>): SDQuestion {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    section: item.section,
    difficulty: item.difficulty as SDQuestion["difficulty"],
    designType: "core",
    contentKind: "concept",
    content: item.content,
    displayOrder: item.displayOrder,
    topics: item.topics,
    thumbnailUrl: item.thumbnailUrl,
  };
}

export default function PrepCoreSubjectsPage(_props: PrepCoreSubjectsPageProps) {
  const [subjects, setSubjects] = useState<CoreSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<CoreSubject | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<SDQuestion | null>(null);
  const [records, setRecords] = useState<CoreConceptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useViewMode("grid");

  const fetchData = useCallback(async (cancelled = { current: false }) => {
    setLoading(true);
    try {
      const [catResp, conceptResp] = await Promise.all([
        prepUserApi.listContent("core_subjects", {
          limit: 200,
          contentKind: "category",
          sortBy: "displayOrder",
          sortOrder: "asc",
        }),
        prepUserApi.listContent("core_subjects", {
          limit: 500,
          contentKind: "concept",
          sortBy: "displayOrder",
          sortOrder: "asc",
        }),
      ]);

      if (cancelled.current) return;

      const categories = catResp.success
        ? (catResp.items ?? []).map((item) =>
            mapCoreSubjectCategoryFromApi(item as Record<string, unknown>),
          )
        : [];

      setSubjects(categories);
      setRecords(
        conceptResp.success
          ? (conceptResp.items ?? []).map((item) => {
              const mapped = mapCoreSubjectFromApi(
                item as Record<string, unknown>,
                categories,
              );
              return { subject: mapped.subject, concept: toSdQuestion(mapped) };
            })
          : [],
      );
    } catch {
      if (!cancelled.current) {
        setSubjects([]);
        setRecords([]);
      }
    }
    if (!cancelled.current) setLoading(false);
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
    invalidateCache("prep:core_subjects");
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const conceptsForSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return records
      .filter((record) => record.subject === selectedSubject.subject)
      .map((record) => record.concept);
  }, [records, selectedSubject]);

  const conceptCountFor = (subject: CoreSubject) =>
    records.filter((record) => record.subject === subject.subject).length;

  const handleSelectConcept = (concept: SDQuestion | null) => {
    setSelectedConcept(concept);
  };

  const handleBackToSubjects = () => {
    setSelectedConcept(null);
    setSelectedSubject(null);
  };

  if (selectedSubject) {
    return (
      <div>
        {!selectedConcept && (
          <nav
            aria-label="Core subject location"
            className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm"
          >
            <button
              type="button"
              onClick={handleBackToSubjects}
              className="text-[var(--prep-text-tertiary)] hover:text-orange-500 transition-colors"
            >
              Core Subjects
            </button>
            <span className="text-[var(--prep-text-tertiary)]">/</span>
            <span className="font-medium text-[var(--prep-text-primary)]">
              {selectedSubject.title}
            </span>
          </nav>
        )}

        <PrepSystemDesignConceptsView
          concepts={conceptsForSubject}
          loading={loading}
          viewMode={viewMode}
          selectedConcept={selectedConcept}
          onSelectConcept={handleSelectConcept}
          shortLabel={selectedSubject.title}
          listLabel="Core Subjects"
          onNavigateRoot={handleBackToSubjects}
          onNavigateTopic={() => setSelectedConcept(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--prep-text-primary)]">Core Subjects</h1>
          <p className="mt-1 text-[var(--prep-text-tertiary)]">
            Explore subject-wise concepts grouped by topic — DBMS, OS, CN, and more
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 border border-[var(--prep-border-muted)] rounded-xl bg-[var(--prep-surface-raised)] hover:bg-[var(--prep-surface-muted)] transition-all duration-200 text-[var(--prep-text-tertiary)] hover:text-[var(--prep-text-primary)] disabled:opacity-60"
            aria-label="Refresh core subjects"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <PrepViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--prep-text-tertiary)]">Loading subjects…</p>
      ) : subjects.length === 0 ? (
        <div className="rounded-xl border border-[var(--prep-border-muted)] bg-[var(--prep-surface-raised)] p-8 text-center">
          <p className="text-[var(--prep-text-secondary)] font-medium">No subjects yet</p>
          <p className="mt-1 text-sm text-[var(--prep-text-tertiary)]">
            Subjects are added from Admin → Prep Content → Core Subjects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {subjects.map((subject) => {
            const count = conceptCountFor(subject);
            return (
              <article key={subject.id} className="prep-core-subject-card">
                <div className="prep-core-subject-card__accent" aria-hidden />
                <div className="prep-core-subject-card__body">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-[var(--prep-text-primary)]">
                        {subject.title}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--prep-text-tertiary)]">
                        {subject.description || "Start learning topic-wise concepts"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="prep-core-subject-card__menu"
                      aria-label={`${subject.title} options`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--prep-text-tertiary)]">
                      {`${count} concept${count === 1 ? "" : "s"}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubject(subject)}
                      className="prep-core-subject-card__cta"
                    >
                      Start Learning
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
