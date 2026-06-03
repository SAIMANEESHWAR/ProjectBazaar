import PrepDetailSidebar, { difficultyBadgeVariant } from './PrepDetailSidebar';
import { SDDetailPanel, type SDQuestion } from './SDDetailPanel';

interface PrepSystemDesignDetailSidebarProps {
  question: SDQuestion;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onToggleSolved: () => void;
  onToggleBookmark: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function PrepSystemDesignDetailSidebar({
  question,
  onClose,
  onNext,
  onPrev,
  onToggleSolved,
  onToggleBookmark,
  hasNext = false,
  hasPrev = false,
}: PrepSystemDesignDetailSidebarProps) {
  const tags = [
    { label: question.difficulty, variant: difficultyBadgeVariant(question.difficulty) },
    { label: question.section, variant: 'default' as const },
  ];

  return (
    <PrepDetailSidebar
      itemId={question.id}
      title={question.title}
      tags={tags}
      isSolved={question.isSolved ?? false}
      isBookmarked={question.isBookmarked ?? false}
      onClose={onClose}
      onNext={onNext}
      onPrev={onPrev}
      onToggleSolved={onToggleSolved}
      onToggleBookmark={onToggleBookmark}
      hasNext={hasNext}
      hasPrev={hasPrev}
      ariaLabel="System design question details"
      panelClassName="w-full max-w-none sm:w-1/2 sm:max-w-[50vw]"
    >
      <SDDetailPanel q={question} variant="nocturnal" />
    </PrepDetailSidebar>
  );
}
