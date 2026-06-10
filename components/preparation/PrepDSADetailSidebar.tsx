import { ExternalLink } from 'lucide-react';
import PrepDetailSidebar, { difficultyBadgeVariant } from './PrepDetailSidebar';
import PrepLockedPremiumBlock from './PrepLockedPremiumBlock';
import { usePrepContentAccess } from './prepContentAccess';

export interface PrepDSADetail {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  company: string[];
  acceptance: number;
  isSolved: boolean;
  isBookmarked: boolean;
  solutionLink?: string;
  solution?: string;
  constraints?: string;
  examples?: { input: string; output: string }[];
  hints?: string[];
}

interface PrepDSADetailSidebarProps {
  problem: PrepDSADetail;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onToggleSolved: () => void;
  onToggleBookmark: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const sectionLabel =
  'mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500';
const bodyText =
  'text-[15px] leading-relaxed text-neutral-200 md:text-base';

export default function PrepDSADetailSidebar({
  problem,
  onClose,
  onNext,
  onPrev,
  onToggleSolved,
  onToggleBookmark,
  hasNext = false,
  hasPrev = false,
}: PrepDSADetailSidebarProps) {
  const { canViewAnswers, promptUpgrade } = usePrepContentAccess();

  const tags = [
    { label: problem.difficulty, variant: difficultyBadgeVariant(problem.difficulty) },
    { label: problem.topic, variant: 'default' as const },
    { label: `${problem.acceptance}% acceptance`, variant: 'default' as const },
  ];

  return (
    <PrepDetailSidebar
      itemId={problem.id}
      title={problem.title}
      tags={tags}
      isSolved={problem.isSolved}
      isBookmarked={problem.isBookmarked}
      onClose={onClose}
      onNext={onNext}
      onPrev={onPrev}
      onToggleSolved={onToggleSolved}
      onToggleBookmark={onToggleBookmark}
      hasNext={hasNext}
      hasPrev={hasPrev}
      ariaLabel="DSA problem details"
    >
      <section className="mb-8">
        <p className={sectionLabel}>Description</p>
        <p className={`whitespace-pre-line ${bodyText}`}>{problem.description}</p>
      </section>

      {problem.company.length > 0 && (
        <section className="mb-8">
          <p className={sectionLabel}>Companies</p>
          <div className="flex flex-wrap gap-2">
            {problem.company.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-neutral-300 ring-1 ring-white/10"
              >
                {c}
              </span>
            ))}
          </div>
        </section>
      )}

      {problem.constraints && (
        <section className="mb-8">
          <p className={sectionLabel}>Constraints</p>
          <p className={`whitespace-pre-line ${bodyText}`}>{problem.constraints}</p>
        </section>
      )}

      {problem.examples && problem.examples.length > 0 && (
        <section className="mb-8">
          <p className={sectionLabel}>Examples</p>
          <ul className="space-y-4">
            {problem.examples.map((ex, i) => (
              <li
                key={i}
                className="rounded-xl border border-white/10 bg-[#141414] p-4 text-sm text-neutral-200"
              >
                <p>
                  <span className="font-semibold text-neutral-400">Input: </span>
                  {ex.input}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-neutral-400">Output: </span>
                  {ex.output}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(problem.solution || problem.solutionLink) && (
        <section className="mb-8">
          <p className={sectionLabel}>Solution</p>
          {canViewAnswers ? (
            <>
              {problem.solution && (
                <p className={`mb-4 whitespace-pre-line ${bodyText}`}>{problem.solution}</p>
              )}
              {problem.solutionLink ? (
                <a
                  href={problem.solutionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-300"
                >
                  <ExternalLink size={16} />
                  View full solution
                </a>
              ) : (
                !problem.solution && (
                  <p className="text-sm italic text-neutral-500">No solution link available yet.</p>
                )
              )}
            </>
          ) : (
            <PrepLockedPremiumBlock
              title="Solution locked"
              message="Upgrade to Premium to view DSA solutions and full walkthroughs."
              onUpgrade={promptUpgrade}
            />
          )}
        </section>
      )}

      {problem.hints && problem.hints.length > 0 && (
        <section>
          <p className={sectionLabel}>Hints</p>
          {canViewAnswers ? (
            <ul className="list-inside list-disc space-y-2 text-[15px] leading-relaxed text-neutral-200 md:text-base">
              {problem.hints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ul>
          ) : (
            <PrepLockedPremiumBlock
              compact
              title="Hints locked"
              message="Upgrade to Premium to unlock hints."
              onUpgrade={promptUpgrade}
            />
          )}
        </section>
      )}
    </PrepDetailSidebar>
  );
}
