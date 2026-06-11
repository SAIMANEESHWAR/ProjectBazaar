import React, { type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';

const RAINBOW_CONIC =
  'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff0000)';

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<'button'> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  rainbow?: boolean;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#ffffff',
      shimmerSize = '0.05em',
      shimmerDuration = '3s',
      borderRadius = '100px',
      background = 'rgba(0, 0, 0, 1)',
      className,
      rainbow = false,
      children,
      ...props
    },
    ref
  ) => {
    const speed = rainbow ? '2s' : shimmerDuration;
    const cut = rainbow ? '2px' : shimmerSize;

    return (
      <button
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': speed,
            '--cut': cut,
            '--bg': background,
          } as CSSProperties
        }
        className={cn(
          'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] px-6 py-3 whitespace-nowrap [background:var(--bg)]',
          rainbow ? 'border-0' : 'border border-white/10',
          'transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px',
          className
        )}
        ref={ref}
        {...props}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-0 -z-30 overflow-hidden',
            rainbow ? 'blur-[3px] opacity-95' : 'blur-[2px]'
          )}
        >
          <div className="animate-shimmer-slide absolute inset-0 h-full w-full [mask:none]">
            <div
              className="animate-spin-around absolute -inset-full h-[200%] w-[200%]"
              style={{
                background: rainbow
                  ? RAINBOW_CONIC
                  : 'conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))',
              }}
            />
          </div>
        </div>
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
        <div
          className={cn(
            'pointer-events-none absolute inset-0 size-full rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]',
            'transform-gpu transition-all duration-300 ease-in-out',
            'group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]',
            'group-active:shadow-[inset_0_-10px_10px_#ffffff3f]'
          )}
        />
        <div
          className="pointer-events-none absolute -z-20 [border-radius:var(--radius)] [background:var(--bg)]"
          style={{
            top: 'var(--cut)',
            right: 'var(--cut)',
            bottom: 'var(--cut)',
            left: 'var(--cut)',
          }}
        />
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
