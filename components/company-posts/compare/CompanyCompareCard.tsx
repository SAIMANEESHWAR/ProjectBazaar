import * as React from 'react';
import { MapPin, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import type { CompanyCompare } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';
import { RatingBars, StarRating } from './RatingBars';

export interface CompanyCompareCardProps {
    company: CompanyCompare;
    onViewDetails?: () => void;
    onAddToCompare?: () => void;
    compact?: boolean;
    selected?: boolean;
    className?: string;
}

export const CompanyCompareCard: React.FC<CompanyCompareCardProps> = ({
    company,
    onViewDetails,
    onAddToCompare,
    compact = false,
    selected = false,
    className,
}) => {
    const topDimensions = ['work_life_balance', 'company_culture', 'job_security'] as const;

    if (compact) {
        return (
            <div
                className={cn(
                    'flex items-center gap-3 rounded-xl border border-[#EBF0F6] bg-white p-3',
                    selected && 'ring-2 ring-[#5670FB]/30 border-[#5670FB]/40',
                    className
                )}
            >
                <CompanyAvatar name={company.identity.name} size="sm" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1E223C]">{company.identity.name}</p>
                    <StarRating value={company.ratings.overall_rating} size="sm" />
                </div>
            </div>
        );
    }

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className={cn(
                'flex flex-col rounded-xl border border-[#EBF0F6] bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
                selected && 'ring-2 ring-[#5670FB]/25',
                className
            )}
        >
            <div className="flex items-start gap-3">
                <CompanyAvatar name={company.identity.name} />
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#1E223C]">{company.identity.name}</h3>
                    <p className="text-xs text-gray-500">{company.identity.industry}</p>
                    <div className="mt-2">
                        <StarRating value={company.ratings.overall_rating} />
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin size={13} className="shrink-0 text-[#5670FB]" />
                <span className="truncate">{company.identity.headquarters}</span>
            </div>

            <div className="mt-4">
                <RatingBars ratings={company.ratings} dimensions={[...topDimensions]} compact />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {onViewDetails && (
                    <button
                        type="button"
                        onClick={onViewDetails}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#EBF0F6] px-3 py-2 text-xs font-semibold text-[#1E223C] transition hover:border-[#5670FB]/30 hover:bg-[#FAFCFF]"
                    >
                        View details
                    </button>
                )}
                {onAddToCompare && (
                    <button
                        type="button"
                        onClick={onAddToCompare}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#5670FB] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4358d9]"
                    >
                        <Star size={13} />
                        Add to compare
                    </button>
                )}
            </div>
        </motion.article>
    );
};
