import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CircleCheckBig,
  Bookmark,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

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

const TRANSITION_MS = 320;
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

function difficultyBadgeVariant(
  difficulty: PrepQuestionDetail['difficulty']
): 'success' | 'warning' | 'danger' {
  if (difficulty === 'Easy') return 'success';
  if (difficulty === 'Medium') return 'warning';
  return 'danger';
}

function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'default';
  className?: string;
}) {
  const variants = {
    success: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
    warning: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
    default: 'bg-white/5 text-neutral-300 ring-1 ring-white/10',
  };
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

function IconButton({
  icon,
  variant = 'default',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  variant?: 'default' | 'accent';
}) {
  const variants = {
    default: 'bg-[#1F1F1F] text-[#FDFDFD] hover:bg-[#2A2A2A]',
    accent: 'bg-[#1A1A1A] text-orange-500 hover:bg-[#252525]',
  };
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/5 transition-all duration-150 active:scale-[0.97]',
        variants[variant],
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center opacity-70">{icon}</span>
    </button>
  );
}

function ActionButton({
  icon,
  children,
  active,
  activeTone = 'orange',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  active?: boolean;
  activeTone?: 'green' | 'orange' | 'white';
}) {
  const activeStyles = {
    white:
      'border-white/20 bg-[#FDFDFD] text-[#0A0A0A] hover:bg-white shadow-sm',
    green:
      'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/15',
    orange:
      'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/15',
  };
  return (
    <button
      type="button"
      className={cn(
        'group inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.97]',
        active
          ? activeStyles[activeTone]
          : 'border-white/5 bg-[#1F1F1F] text-[#FDFDFD] hover:bg-[#2A2A2A]',
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn('shrink-0 opacity-60', active && 'opacity-90')}>
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
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
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosingRef = useRef(false);
  const skipQuestionFadeRef = useRef(true);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isClosingRef.current = false;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
        setContentVisible(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (skipQuestionFadeRef.current) {
      skipQuestionFadeRef.current = false;
      return;
    }
    if (!visible || isClosingRef.current) return;
    setContentVisible(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setContentVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [question.id, visible]);

  useEffect(() => {
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setVisible(false);
    setContentVisible(false);
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      onClose();
      closeTimerRef.current = null;
    }, TRANSITION_MS);
  }, [onClose, clearCloseTimer]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, handleClose, hasNext, hasPrev, onNext, onPrev]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  if (typeof document === 'undefined') return null;

  const fadeStyle = (delayMs: number) => ({
    opacity: contentVisible ? 1 : 0,
    transition: `opacity ${TRANSITION_MS - 60}ms ${EASE} ${visible && contentVisible ? `${delayMs}ms` : '0ms'}`,
  });

  const tags: { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }[] = [
    { label: question.difficulty, variant: difficultyBadgeVariant(question.difficulty) },
    { label: question.category, variant: 'default' },
  ];
  if (question.role) tags.push({ label: question.role, variant: 'default' });

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px]"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${TRANSITION_MS}ms ${EASE}`,
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onClick={handleClose}
        aria-hidden
      />
      <aside
        className="fixed top-0 right-0 z-[201] flex h-full w-full max-w-[min(100vw,560px)] flex-col border-l border-white/10 bg-[#0A0A0A] text-[#FDFDFD] shadow-2xl will-change-transform"
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${TRANSITION_MS}ms ${EASE}`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Question details"
      >
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: contentVisible ? 1 : 0, y: contentVisible ? 0 : -8 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
          className="flex shrink-0 flex-col gap-3 border-b border-white/10 px-5 py-5 md:px-6 md:py-5"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="min-w-0 flex-1 text-left text-xl font-semibold leading-snug tracking-tight text-[#FDFDFD] md:text-2xl">
              {question.question}
            </h2>
            <div className="mt-0.5 flex shrink-0 items-center gap-2">
              {hasPrev && onPrev && (
                <IconButton
                  icon={<ArrowLeft size={16} />}
                  onClick={onPrev}
                  aria-label="Previous question"
                />
              )}
              {hasNext && onNext && (
                <IconButton
                  icon={<ArrowRight size={16} />}
                  variant="accent"
                  onClick={onNext}
                  aria-label="Next question"
                />
              )}
              <IconButton
                icon={<X size={16} />}
                onClick={handleClose}
                aria-label="Close"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Badge key={tag.label} variant={tag.variant}>
                {tag.label}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <ActionButton
              icon={<CircleCheckBig size={16} />}
              active={question.isSolved}
              activeTone={question.isSolved ? 'green' : 'white'}
              onClick={onToggleSolved}
            >
              {question.isSolved ? 'Solved' : 'Mark as Solved'}
            </ActionButton>
            <ActionButton
              icon={<Bookmark size={16} className={question.isBookmarked ? 'fill-current' : ''} />}
              active={question.isBookmarked}
              activeTone="orange"
              onClick={onToggleBookmark}
            >
              {question.isBookmarked ? 'In Revision' : 'Add to Revision'}
            </ActionButton>
          </div>
        </motion.header>

        <div
          className="flex-1 overflow-y-auto px-5 py-6 md:px-6 md:py-7"
          style={fadeStyle(100)}
        >
          <section className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Answer
            </p>
            {question.answer ? (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-200 md:text-base">
                {question.answer}
              </p>
            ) : (
              <p className="text-sm italic text-neutral-500">No answer available yet.</p>
            )}
          </section>

          {question.hints && question.hints.length > 0 && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Hints
              </p>
              <ul className="list-inside list-disc space-y-2 text-[15px] leading-relaxed text-neutral-200 md:text-base">
                {question.hints.map((hint, i) => (
                  <li key={i}>{hint}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
}
