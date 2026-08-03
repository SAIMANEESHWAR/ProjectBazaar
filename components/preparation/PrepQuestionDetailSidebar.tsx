import PrepDetailSidebar, { difficultyBadgeVariant } from './PrepDetailSidebar';
import PrepLockedPremiumBlock from './PrepLockedPremiumBlock';
import { usePrepContentAccess } from './prepContentAccess';
import PrepRichContentRenderer, {
  isRichHtmlContent,
  richHtmlToPlainText,
} from './PrepRichContentRenderer';

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

function RichOrPlain({
  content,
  emptyLabel = 'No content available yet.',
}: {
  content: string;
  emptyLabel?: string;
}) {
  const trimmed = content.trim();
  if (!trimmed) {
    return <p className="text-sm italic text-neutral-500">{emptyLabel}</p>;
  }
  if (isRichHtmlContent(trimmed)) {
    return (
      <PrepRichContentRenderer
        html={trimmed}
        variant="nocturnal"
        className="text-[15px] md:text-base"
      />
    );
  }
  return (
    <p className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-200 md:text-base">
      {trimmed}
    </p>
  );
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

  const title = richHtmlToPlainText(question.question) || question.question;
  const questionIsRich = isRichHtmlContent(question.question);
  const answer = question.answer?.trim() ?? '';

  return (
    <PrepDetailSidebar
      itemId={question.id}
      title={title}
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
      {questionIsRich && (
        <section className="mb-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Question
          </p>
          <RichOrPlain content={question.question} />
        </section>
      )}

      <section className="mb-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Answer
        </p>
        {canViewAnswers ? (
          <RichOrPlain content={answer} emptyLabel="No answer available yet." />
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
