import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PrepButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

export const PrepButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: PrepButtonVariant;
    loading?: boolean;
  }
>(function PrepButton(
  { className, variant = 'secondary', loading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'prep-btn',
        variant === 'primary' && 'prep-btn--primary',
        variant === 'secondary' && 'prep-btn--secondary',
        variant === 'ghost' && 'prep-btn--ghost',
        variant === 'icon' && 'prep-btn--icon prep-btn--secondary',
        className
      )}
      {...props}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
});

export const PrepInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(function PrepInput({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn('prep-input', error && 'prep-input--error', className)}
      {...props}
    />
  );
});

export function PrepCard({
  className,
  children,
  as: Component = 'div',
}: {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
}) {
  return <Component className={cn('prep-card', className)}>{children}</Component>;
}

export function PrepPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="prep-title-page text-2xl font-bold">{title}</h1>
      {subtitle && <p className="prep-subtitle">{subtitle}</p>}
    </header>
  );
}

export function PrepTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="prep-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          className={cn('prep-tab', active === tab && 'prep-tab--active')}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
