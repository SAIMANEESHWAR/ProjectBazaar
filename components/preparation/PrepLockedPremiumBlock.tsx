import { Lock } from 'lucide-react';

interface PrepLockedPremiumBlockProps {
  title?: string;
  message?: string;
  onUpgrade: () => void;
  compact?: boolean;
}

export default function PrepLockedPremiumBlock({
  title = 'Premium content',
  message = 'Upgrade to Premium to view answers, solutions, and browse beyond the first page.',
  onUpgrade,
  compact = false,
}: PrepLockedPremiumBlockProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-transparent text-center ${
        compact ? 'px-4 py-5' : 'px-6 py-8'
      }`}
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
        <Lock className="h-5 w-5 text-orange-400" strokeWidth={2} aria-hidden />
      </div>
      <p className="text-sm font-semibold text-[var(--prep-text-primary,#f5f5f5)]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--prep-text-secondary,#a3a3a3)]">{message}</p>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff9533] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,122,0,0.25)] transition hover:brightness-110"
      >
        Upgrade to Premium
      </button>
    </div>
  );
}
