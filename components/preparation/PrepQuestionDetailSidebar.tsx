import PrepDetailSidebar, { difficultyBadgeVariant } from './PrepDetailSidebar';
import PrepLockedPremiumBlock from './PrepLockedPremiumBlock';
import { usePrepContentAccess } from './prepContentAccess';

export interface PrepQuestionDetail {
  id: string;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  role?: string;
  isSolved: boolean;
  isBookmarked: boolean;
  answer?: string;
  hints?: string[];
}

interface PrepQuestionDetailSidebarProps {
  question: PrepQuestionDetail;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onToggleSolved: () => void;
  onToggleBookmark: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function PrepQuestionDetailSidebar({
  question,
  onClose,
  onNext,
  onPrev,
  onToggleSolved,
  onToggleBookmark,
  hasNext = false,
  hasPrev = false,
}: PrepQuestionDetailSidebarProps) {
  const { canViewAnswers, promptUpgrade } = usePrepContentAccess();

  const tags = [
    { label: question.difficulty, variant: difficultyBadgeVariant(question.difficulty) },
    { label: question.category, variant: 'default' as const },
    ...(question.role ? [{ label: question.role, variant: 'default' as const }] : []),
  ];

  return (
    <PrepDetailSidebar
      itemId={question.id}
      title={question.question}
      tags={tags}
      isSolved={question.isSolved}
      isBookmarked={question.isBookmarked}
      onClose={onClose}
      onNext={onNext}
      onPrev={onPrev}
      onToggleSolved={onToggleSolved}
      onToggleBookmark={onToggleBookmark}
      hasNext={hasNext}
      hasPrev={hasPrev}
      ariaLabel="Interview question details"
    >
      <section className="mb-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Answer
        </p>
        {canViewAnswers ? (
          question.answer ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-200 md:text-base">
              {question.answer}
            </p>
          ) : (
            <p className="text-sm italic text-neutral-500">No answer available yet.</p>
          )
        ) : (
          <PrepLockedPremiumBlock
            title="Answer locked"
            message="Upgrade to Premium to view interview answers and hints."
            onUpgrade={promptUpgrade}
          />
        )}
      </section>

      {question.hints && question.hints.length > 0 && (
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Hints
          </p>
          {canViewAnswers ? (
            <ul className="list-inside list-disc space-y-2 text-[15px] leading-relaxed text-neutral-200 md:text-base">
              {question.hints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ul>
          ) : (
            <PrepLockedPremiumBlock
              compact
              title="Hints locked"
              message="Upgrade to Premium to unlock hints for this question."
              onUpgrade={promptUpgrade}
            />
          )}
        </section>
      )}
    </PrepDetailSidebar>
  );
}
