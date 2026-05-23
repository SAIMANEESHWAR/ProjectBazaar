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

export type PrepDetailBadgeVariant = 'success' | 'warning' | 'danger' | 'default';

export interface PrepDetailTag {
  label: string;
  variant: PrepDetailBadgeVariant;
}

export function difficultyBadgeVariant(
  difficulty: 'Easy' | 'Medium' | 'Hard'
): PrepDetailBadgeVariant {
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
  variant?: PrepDetailBadgeVariant;
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
    default: 'bg-[var(--prep-surface-muted)] text-[var(--prep-text-primary)] hover:opacity-90',
    accent: 'bg-[var(--prep-surface-raised)] text-[var(--prep-accent)] hover:opacity-90',
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
          : 'border-[var(--prep-border-muted)] bg-[var(--prep-surface-muted)] text-[var(--prep-text-primary)] hover:opacity-90',
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

export { ActionButton as PrepDetailActionButton };

const TRANSITION_MS = 320;
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export interface PrepDetailSidebarProps {
  itemId: string;
  title: string;
  tags: PrepDetailTag[];
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  ariaLabel?: string;
  panelClassName?: string;
  children: ReactNode;
  /** Custom header actions; when set, replaces Mark as Solved / Revision buttons */
  headerActions?: ReactNode;
  isSolved?: boolean;
  isBookmarked?: boolean;
  onToggleSolved?: () => void;
  onToggleBookmark?: () => void;
}

export default function PrepDetailSidebar({
  itemId,
  title,
  tags,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  ariaLabel = 'Question details',
  panelClassName,
  headerActions,
  isSolved = false,
  isBookmarked = false,
  onToggleSolved,
  onToggleBookmark,
  children,
}: PrepDetailSidebarProps) {
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosingRef = useRef(false);
  const skipItemFadeRef = useRef(true);

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
    if (skipItemFadeRef.current) {
      skipItemFadeRef.current = false;
      return;
    }
    if (!visible || isClosingRef.current) return;
    setContentVisible(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setContentVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [itemId, visible]);

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
        className={cn(
          'prep-detail-sidebar fixed top-0 right-0 z-[201] flex h-full w-full max-w-[min(100vw,560px)] flex-col shadow-2xl will-change-transform',
          panelClassName
        )}
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${TRANSITION_MS}ms ${EASE}`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: contentVisible ? 1 : 0, y: contentVisible ? 0 : -8 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
          className="flex shrink-0 flex-col gap-3 border-b border-[var(--prep-border-muted)] px-5 py-5 md:px-6 md:py-5"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="min-w-0 flex-1 text-left text-xl font-semibold leading-snug tracking-tight text-[var(--prep-text-primary)] md:text-2xl">
              {title}
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

          {headerActions ?? (onToggleSolved && onToggleBookmark ? (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <ActionButton
                icon={<CircleCheckBig size={16} />}
                active={isSolved}
                activeTone={isSolved ? 'green' : 'white'}
                onClick={onToggleSolved}
              >
                {isSolved ? 'Solved' : 'Mark as Solved'}
              </ActionButton>
              <ActionButton
                icon={
                  <Bookmark size={16} className={isBookmarked ? 'fill-current' : ''} />
                }
                active={isBookmarked}
                activeTone="orange"
                onClick={onToggleBookmark}
              >
                {isBookmarked ? 'In Revision' : 'Add to Revision'}
              </ActionButton>
            </div>
          ) : null)}
        </motion.header>

        <div
          className="flex-1 overflow-y-auto px-5 py-6 md:px-6 md:py-7"
          style={fadeStyle(100)}
        >
          {children}
        </div>
      </aside>
    </>,
    document.body
  );
}
