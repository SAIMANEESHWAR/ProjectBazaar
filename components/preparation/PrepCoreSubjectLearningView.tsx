import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  Bookmark,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
} from "lucide-react";
import PrepRichContentRenderer from "./PrepRichContentRenderer";
import PrepLockedPremiumBlock from "./PrepLockedPremiumBlock";
import { usePrepContentAccess } from "./prepContentAccess";
import PrepTopicQuizRunner from "./PrepTopicQuizRunner";
import { groupByTopic } from "./prepTopicGrouping";
import { type SDQuestion } from "./SDDetailPanel";
import { type CoreSubjectTopicQuizPublic } from "../../data/coreSubjectQuizTypes";

export interface PrepCoreSubjectLearningViewProps {
  subjectTitle: string;
  concepts: SDQuestion[];
  quizzesByTopic: Record<string, CoreSubjectTopicQuizPublic>;
  onToggleCompleted: (conceptId: string) => void;
  onToggleRevision: (conceptId: string) => void;
  onBack: () => void;
}

export default function PrepCoreSubjectLearningView({
  subjectTitle,
  concepts,
  quizzesByTopic,
  onToggleCompleted,
  onToggleRevision,
  onBack,
}: PrepCoreSubjectLearningViewProps) {
  const topicGroups = useMemo(() => groupByTopic(concepts), [concepts]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    () => new Set(topicGroups.slice(0, 1).map((group) => group.topic)),
  );
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
  const [activeQuizTopic, setActiveQuizTopic] = useState<string | null>(null);

  const activeConcept = useMemo(
    () => concepts.find((concept) => concept.id === activeConceptId) ?? null,
    [concepts, activeConceptId],
  );
  const activeQuiz = activeQuizTopic ? quizzesByTopic[activeQuizTopic] ?? null : null;
  const { canViewAnswers, promptUpgrade } = usePrepContentAccess();

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  const openConcept = (concept: SDQuestion) => {
    setActiveConceptId(concept.id);
    setActiveQuizTopic(null);
  };

  const openQuiz = (topic: string) => {
    if (!quizzesByTopic[topic]) return;
    setActiveQuizTopic(topic);
    setActiveConceptId(null);
  };

  const clearMain = () => {
    setActiveConceptId(null);
    setActiveQuizTopic(null);
  };

  return (
    <div className="prep-core-learning">
      <div className="prep-core-learning__sidebar">
        <button type="button" onClick={onBack} className="prep-core-learning__back">
          ← Core Subjects
        </button>
        <h2 className="prep-core-learning__subject">{subjectTitle}</h2>

        <div className="prep-core-learning__tree">
          {topicGroups.map((group) => {
            const isOpen = expandedTopics.has(group.topic);
            const quiz = quizzesByTopic[group.topic];
            return (
              <div key={group.topic} className="prep-core-learning__topic">
                <button
                  type="button"
                  className="prep-core-learning__topic-btn"
                  onClick={() => toggleTopic(group.topic)}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{group.topic}</span>
                </button>

                {isOpen && (
                  <ul className="prep-core-learning__items">
                    {group.items.map((concept) => (
                      <li key={concept.id}>
                        <button
                          type="button"
                          onClick={() => openConcept(concept)}
                          className={`prep-core-learning__item ${
                            activeConceptId === concept.id ? "prep-core-learning__item--active" : ""
                          }`}
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{concept.title}</span>
                          {concept.isSolved && (
                            <BookOpenCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          )}
                          {concept.isBookmarked && (
                            <Bookmark className="h-3.5 w-3.5 shrink-0 text-orange-400 fill-orange-400" />
                          )}
                        </button>
                      </li>
                    ))}
                    {quiz && (
                      <li>
                        <button
                          type="button"
                          onClick={() => openQuiz(group.topic)}
                          className={`prep-core-learning__item prep-core-learning__item--quiz ${
                            activeQuizTopic === group.topic ? "prep-core-learning__item--active" : ""
                          }`}
                        >
                          <ClipboardList className="h-4 w-4 shrink-0" />
                          <span className="truncate">{quiz.title}</span>
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="prep-core-learning__main">
        {!activeConcept && !activeQuiz ? (
          <div className="prep-core-learning__empty">
            <p>Select a concept or quiz from the sidebar to begin.</p>
          </div>
        ) : activeQuiz && activeQuizTopic ? (
          <PrepTopicQuizRunner
            quiz={activeQuiz}
            topic={activeQuizTopic}
            onExit={clearMain}
          />
        ) : activeConcept ? (
          <div className="prep-core-learning__concept">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => onToggleCompleted(activeConcept.id)}
                className={`prep-core-learning__action ${
                  activeConcept.isSolved ? "prep-core-learning__action--active" : ""
                }`}
              >
                <BookOpenCheck className="h-4 w-4" />
                {activeConcept.isSolved ? "Completed" : "Mark completed"}
              </button>
              <button
                type="button"
                onClick={() => onToggleRevision(activeConcept.id)}
                className={`prep-core-learning__action ${
                  activeConcept.isBookmarked ? "prep-core-learning__action--active-revision" : ""
                }`}
              >
                <Bookmark className={`h-4 w-4 ${activeConcept.isBookmarked ? "fill-current" : ""}`} />
                {activeConcept.isBookmarked ? "Marked for revision" : "Mark for revision"}
              </button>
            </div>

            <div className="mb-3">
              <span className="prep-core-learning__badge">{activeConcept.topics?.[0] ?? "Concept"}</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--prep-text-primary)] mb-6">
              {activeConcept.title}
            </h2>
            {activeConcept.content ? (
              canViewAnswers ? (
                <PrepRichContentRenderer html={activeConcept.content} variant="nocturnal" />
              ) : (
                <PrepLockedPremiumBlock
                  title="Content locked"
                  message="Upgrade to Premium to read full concept notes and answers."
                  onUpgrade={promptUpgrade}
                />
              )
            ) : (
              <p className="text-[var(--prep-text-tertiary)]">No content available for this concept.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
