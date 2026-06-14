import * as React from 'react';
import { cn } from '../../../lib/utils';
import type { AmbitionBoxRatings, RatingDimensionKey } from '../../../types/companyCompare';
import { RATING_DIMENSIONS } from '../../../types/companyCompare';

export interface RatingBarsProps {
    ratings: AmbitionBoxRatings;
    dimensions?: RatingDimensionKey[];
    compact?: boolean;
    className?: string;
}

function barWidth(value: number): string {
    const pct = Math.min(100, Math.max(0, (value / 5) * 100));
    return `${pct}%`;
}

export function ratingStarColor(value: number): string {
    if (value >= 3.5) return 'text-emerald-500';
    if (value >= 3.0) return 'text-amber-500';
    return 'text-orange-500';
}

export const StarRating: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg'; showValue?: boolean }> = ({
    value,
    size = 'md',
    showValue = true,
}) => {
    const starSize = size === 'lg' ? 18 : size === 'md' ? 14 : 12;
    const fullStars = Math.floor(value);
    const hasHalf = value - fullStars >= 0.25 && value - fullStars < 0.75;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
        <div className="inline-flex items-center gap-1.5">
            <div className="inline-flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: fullStars }).map((_, i) => (
                    <span key={`full-${i}`} style={{ fontSize: starSize }}>
                        ★
                    </span>
                ))}
                {hasHalf && (
                    <span style={{ fontSize: starSize }} className="text-amber-300">
                        ★
                    </span>
                )}
                {Array.from({ length: emptyStars }).map((_, i) => (
                    <span key={`empty-${i}`} style={{ fontSize: starSize }} className="text-gray-200">
                        ★
                    </span>
                ))}
            </div>
            {showValue && (
                <span className={cn('font-semibold text-[#1E223C]', size === 'lg' ? 'text-lg' : 'text-sm')}>
                    {value.toFixed(1)}
                    <span className="text-gray-400 font-normal">/5</span>
                </span>
            )}
        </div>
    );
};

export const RatingBars: React.FC<RatingBarsProps> = ({
    ratings,
    dimensions,
    compact = false,
    className,
}) => {
    const items = dimensions
        ? RATING_DIMENSIONS.filter(d => dimensions.includes(d.key))
        : RATING_DIMENSIONS;

    return (
        <div className={cn('space-y-2.5', className)}>
            {items.map(dim => {
                const value = ratings[dim.key];
                return (
                    <div key={dim.key}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                            <span className={cn('text-[#1E223C]', compact ? 'text-xs' : 'text-sm')}>
                                {compact ? dim.shortLabel : dim.label}
                            </span>
                            <span className="text-xs font-semibold text-[#5670FB]">{value.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBF0F6]">
                            <div
                                className="h-full rounded-full bg-[#5670FB] transition-all duration-300"
                                style={{ width: barWidth(value) }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export interface CompareRatingPairProps {
    label: string;
    leftValue: number;
    rightValue: number;
}

export const CompareRatingPair: React.FC<CompareRatingPairProps> = ({ label, leftValue, rightValue }) => {
    const leftWins = leftValue > rightValue;
    const rightWins = rightValue > leftValue;

    return (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 border-b border-[#EBF0F6] last:border-0">
            <div className="space-y-1">
                <div className="flex items-center justify-end gap-2">
                    <span className={cn('text-sm font-semibold', leftWins ? 'text-[#5670FB]' : 'text-[#1E223C]')}>
                        {leftValue.toFixed(1)}
                    </span>
                    {leftWins && (
                        <span className="rounded-full bg-[#5670FB]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5670FB]">
                            Higher
                        </span>
                    )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBF0F6]">
                    <div
                        className="ml-auto h-full rounded-full bg-[#5670FB] transition-all"
                        style={{ width: barWidth(leftValue) }}
                    />
                </div>
            </div>
            <span className="min-w-[100px] text-center text-xs font-medium text-gray-500">{label}</span>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', rightWins ? 'text-emerald-600' : 'text-[#1E223C]')}>
                        {rightValue.toFixed(1)}
                    </span>
                    {rightWins && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                            Higher
                        </span>
                    )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBF0F6]">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: barWidth(rightValue) }}
                    />
                </div>
            </div>
        </div>
    );
};
