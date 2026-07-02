import * as React from 'react';
import { GitCompare, ThumbsDown, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import {
    getCompanyMetricCounts,
    getLowRatedDimensions,
    getPrimaryLocation,
    getTopRatedDimensions,
    getTopSalaryRole,
} from '../../../lib/companyCompareData';
import type { CompanyCompare } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';
import { StarRating } from './RatingBars';

export interface CompanyExploreListCardProps {
    company: CompanyCompare;
    selected?: boolean;
    onViewDetails: () => void;
    onAddToCompare: () => void;
}

export const CompanyExploreListCard: React.FC<CompanyExploreListCardProps> = ({
    company,
    selected = false,
    onViewDetails,
    onAddToCompare,
}) => {
    const metrics = getCompanyMetricCounts(company);
    const topRated = getTopRatedDimensions(company, 2);
    const lowRated = getLowRatedDimensions(company, 3);
    const topSalary = getTopSalaryRole(company);
    const location = getPrimaryLocation(company);

    const metricItems = [
        { label: 'Salaries', count: metrics.salaries },
        { label: 'Interview', count: metrics.interviews },
        { label: 'Reviews', count: metrics.reviews },
        { label: 'Benefits', count: metrics.benefits },
    ];

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'rounded-xl border border-[#EBF0F6] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow',
                selected && 'ring-2 ring-[#5670FB]/25 border-[#5670FB]/40',
            )}
        >
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <button
                        type="button"
                        onClick={onViewDetails}
                        className="flex min-w-0 flex-1 cursor-pointer gap-3 text-left"
                    >
                        <CompanyAvatar name={company.identity.name} logoUrl={company.logoUrl} size="lg" />
                        <div className="min-w-0">
                            <p className="text-lg font-bold text-[#1E223C] transition-colors hover:text-[#5670FB]">
                                {company.identity.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <StarRating value={company.ratings.overall_rating} size="sm" />
                                <span className="text-xs text-gray-500">
                                    based on {metrics.reviews} review{metrics.reviews !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 truncate">
                                {company.identity.industry} | {location}
                            </p>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={onAddToCompare}
                        className="hidden sm:inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-orange-500 bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-900 transition-colors"
                    >
                        <GitCompare size={14} className="text-orange-400" />
                        Compare
                    </button>
                </div>

                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5">
                        <ThumbsUp size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                                Highly rated for
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#1E223C]">
                                {topRated.map(r => r.label).join(', ')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <ThumbsDown size={16} className="mt-0.5 shrink-0 text-rose-500" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500">
                                Critically rated for
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#1E223C]">
                                {lowRated.map(r => r.label).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>

                {topSalary && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#EEF4FF] px-3 py-2.5">
                        <span className="text-xs text-[#1E223C]">
                            Top role: <strong>{topSalary.role}</strong> · {topSalary.average_annual_salary}
                        </span>
                        <button
                            type="button"
                            onClick={onViewDetails}
                            className="cursor-pointer text-xs font-semibold text-[#5670FB] hover:underline"
                        >
                            View salaries
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-4 border-t border-[#EBF0F6] bg-[#FAFCFF]">
                {metricItems.map(item => (
                    <button
                        key={item.label}
                        type="button"
                        onClick={onViewDetails}
                        className="flex cursor-pointer flex-col items-center px-2 py-3 hover:bg-white transition-colors border-r border-[#EBF0F6] last:border-r-0"
                    >
                        <span className="text-sm font-bold text-[#1E223C]">{item.count}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex sm:hidden border-t border-[#EBF0F6]">
                <button
                    type="button"
                    onClick={onViewDetails}
                    className="flex-1 cursor-pointer py-2.5 text-xs font-semibold text-[#1E223C] hover:bg-[#FAFCFF]"
                >
                    View details
                </button>
                <button
                    type="button"
                    onClick={onAddToCompare}
                    className="flex-1 cursor-pointer py-2.5 text-xs font-semibold text-white bg-black hover:bg-gray-900 border-l border-[#EBF0F6]"
                >
                    Compare
                </button>
            </div>
        </motion.article>
    );
};
