import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreVertical, RefreshCw } from "lucide-react";
import { mapCoreSubjectFromApi } from "../admin/core-subjects/coreSubjectsAdmin";
import { invalidateCache } from "../../lib/apiCache";
import {
  mapCoreSubjectCategoryFromApi,
  type CoreSubject,
} from "../../data/coreSubjectsConfig";
import {
  mapCoreSubjectQuizPublicFromApi,
  type CoreSubjectTopicQuizPublic,
} from "../../data/coreSubjectQuizTypes";
import { prepUserApi } from "../../services/preparationApi";
import { useDashboard } from "../../context/DashboardContext";
import PrepCoreSubjectLearningView from "./PrepCoreSubjectLearningView";
import { type SDQuestion } from "./SDDetailPanel";

export interface PrepCoreSubjectsPageProps {
  toggleSidebar?: () => void;
}

interface CoreConceptRecord {
  subject: string;
  concept: SDQuestion;
}

function toSdQuestion(
  item: ReturnType<typeof mapCoreSubjectFromApi>,
  raw?: Record<string, unknown>,
): SDQuestion {
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
    isSolved: Boolean(raw?.isSolved),
    isBookmarked: Boolean(raw?.isBookmarked),
  };
}

export default function PrepCoreSubjectsPage(_props: PrepCoreSubjectsPageProps) {
  const { selectedCoreSubjectSlug, setSelectedCoreSubjectSlug } = useDashboard();
  const [subjects, setSubjects] = useState<CoreSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<CoreSubject | null>(null);
  const [records, setRecords] = useState<CoreConceptRecord[]>([]);
  const [quizzesByTopic, setQuizzesByTopic] = useState<Record<string, CoreSubjectTopicQuizPublic>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        prepUserApi.listContentWithProgress("core_subjects", {
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
              const raw = item as Record<string, unknown>;
              const mapped = mapCoreSubjectFromApi(raw, categories);
              return { subject: mapped.subject, concept: toSdQuestion(mapped, raw) };
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

  const fetchQuizzesForSubject = useCallback(async (subjectSlug: string) => {
    const resp = await prepUserApi.listContent("quizzes", {
      subject: subjectSlug,
      scope: "core_subjects",
      limit: 200,
    });
    const map: Record<string, CoreSubjectTopicQuizPublic> = {};
    if (resp.success) {
      for (const item of resp.items ?? []) {
        const quiz = mapCoreSubjectQuizPublicFromApi(item as Record<string, unknown>);
        if (quiz.topic) map[quiz.topic] = quiz;
      }
    }
    setQuizzesByTopic(map);
  }, []);

  useEffect(() => {
    if (!selectedCoreSubjectSlug || subjects.length === 0) return;
    const match = subjects.find((subject) => subject.subject === selectedCoreSubjectSlug);
    if (match) setSelectedSubject(match);
  }, [selectedCoreSubjectSlug, subjects]);

  useEffect(() => {
    if (!selectedCoreSubjectSlug) {
      setSelectedSubject(null);
    }
  }, [selectedCoreSubjectSlug]);

  useEffect(() => {
    const cancelled = { current: false };
    fetchData(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [fetchData]);

  useEffect(() => {
    if (!selectedSubject) {
      setQuizzesByTopic({});
      return;
    }
    void fetchQuizzesForSubject(selectedSubject.subject);
  }, [selectedSubject, fetchQuizzesForSubject]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache("prep:core_subjects");
    invalidateCache("prep:quizzes");
    await fetchData();
    if (selectedSubject) await fetchQuizzesForSubject(selectedSubject.subject);
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

  const patchConcept = (conceptId: string, patch: Partial<SDQuestion>) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.concept.id === conceptId
          ? { ...record, concept: { ...record.concept, ...patch } }
          : record,
      ),
    );
  };

  const handleToggleCompleted = async (conceptId: string) => {
    const current = records.find((record) => record.concept.id === conceptId)?.concept;
    if (!current) return;
    const next = !current.isSolved;
    patchConcept(conceptId, { isSolved: next });
    const result = await prepUserApi.toggleSolved("core_subjects", conceptId);
    if (result) patchConcept(conceptId, { isSolved: result.value });
  };

  const handleToggleRevision = async (conceptId: string) => {
    const current = records.find((record) => record.concept.id === conceptId)?.concept;
    if (!current) return;
    const next = !current.isBookmarked;
    patchConcept(conceptId, { isBookmarked: next });
    const result = await prepUserApi.toggleBookmarked("core_subjects", conceptId);
    if (result) patchConcept(conceptId, { isBookmarked: result.value });
  };

  if (selectedSubject) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="p-2 border border-[var(--prep-border-muted)] rounded-xl bg-[var(--prep-surface-raised)] hover:bg-[var(--prep-surface-muted)] transition-all duration-200 text-[var(--prep-text-tertiary)] hover:text-[var(--prep-text-primary)] disabled:opacity-60"
            aria-label="Refresh core subjects"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--prep-text-tertiary)]">Loading concepts…</p>
        ) : (
          <PrepCoreSubjectLearningView
            subjectTitle={selectedSubject.title}
            concepts={conceptsForSubject}
            quizzesByTopic={quizzesByTopic}
            onToggleCompleted={handleToggleCompleted}
            onToggleRevision={handleToggleRevision}
            onBack={() => {
              setSelectedSubject(null);
              setSelectedCoreSubjectSlug(null);
            }}
          />
        )}
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
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="p-2 border border-[var(--prep-border-muted)] rounded-xl bg-[var(--prep-surface-raised)] hover:bg-[var(--prep-surface-muted)] transition-all duration-200 text-[var(--prep-text-tertiary)] hover:text-[var(--prep-text-primary)] disabled:opacity-60"
            aria-label="Refresh core subjects"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
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
                      onClick={() => {
                        setSelectedCoreSubjectSlug(subject.subject);
                        setSelectedSubject(subject);
                      }}
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
