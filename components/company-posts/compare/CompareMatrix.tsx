import * as React from 'react';
import {
    Briefcase,
    Clock,
    Gift,
    Info,
    MessageSquare,
    Shield,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CompanyCompare, RatingDimensionKey } from '../../../types/companyCompare';
import { RATING_DIMENSIONS } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';
import { StarRating } from './RatingBars';

export interface CompareMatrixProps {
    left: CompanyCompare;
    right: CompanyCompare;
}

const DIMENSION_ICONS: Record<RatingDimensionKey, React.ReactNode> = {
    work_life_balance: <Clock size={16} />,
    company_culture: <Users size={16} />,
    skill_development: <TrendingUp size={16} />,
    job_security: <Shield size={16} />,
    management: <Briefcase size={16} />,
};

function barWidth(value: number): string {
    return `${Math.min(100, Math.max(0, (value / 5) * 100))}%`;
}

function formatReviewCount(count: number): string {
    if (count >= 1000) {
        const k = count / 1000;
        return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return String(count);
}

function normalizeRole(role: string): string {
    return role.trim().toLowerCase();
}

function getSharedSalaries(left: CompanyCompare, right: CompanyCompare) {
    const rightByRole = new Map(right.salaries.map(s => [normalizeRole(s.role), s]));
    const shared = left.salaries
        .map(leftRow => {
            const rightRow = rightByRole.get(normalizeRole(leftRow.role));
            return rightRow ? { role: leftRow.role, left: leftRow, right: rightRow } : null;
        })
        .filter(Boolean) as Array<{
        role: string;
        left: CompanyCompare['salaries'][number];
        right: CompanyCompare['salaries'][number];
    }>;

    if (shared.length > 0) return shared[0];

    const leftRow = left.salaries[0];
    const rightRow = right.salaries[0];
    if (leftRow && rightRow) {
        return { role: leftRow.role, left: leftRow, right: rightRow };
    }
    return null;
}

function parseSalaryRange(range: string): { min: string; max: string } | null {
    const parts = range.split(/\s*[-–]\s*/);
    if (parts.length === 2) {
        return { min: parts[0].trim(), max: parts[1].trim() };
    }
    return null;
}

function getBenefitComparison(left: CompanyCompare, right: CompanyCompare) {
    const leftSet = new Set(left.benefits.map(b => b.value));
    const rightSet = new Set(right.benefits.map(b => b.value));
    const leftOnly = left.benefits.filter(b => !rightSet.has(b.value)).map(b => b.value);
    const rightOnly = right.benefits.filter(b => !leftSet.has(b.value)).map(b => b.value);
    return { leftOnly, rightOnly };
}

function pickWinner(left: CompanyCompare, right: CompanyCompare): 'left' | 'right' | 'tie' {
    if (left.ratings.overall_rating > right.ratings.overall_rating) return 'left';
    if (right.ratings.overall_rating > left.ratings.overall_rating) return 'right';

    let leftWins = 0;
    let rightWins = 0;
    for (const dim of RATING_DIMENSIONS) {
        if (left.ratings[dim.key] > right.ratings[dim.key]) leftWins += 1;
        else if (right.ratings[dim.key] > left.ratings[dim.key]) rightWins += 1;
    }
    if (leftWins > rightWins) return 'left';
    if (rightWins > leftWins) return 'right';
    return 'tie';
}

function SectionHeading({ title }: { title: string }) {
    return (
        <div className="flex items-center justify-center gap-1.5 border-b border-[#EBF0F6] bg-[#FAFCFF] px-4 py-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">{title}</h3>
            <Info size={13} className="text-gray-400" />
        </div>
    );
}

function OverallGauge({ leftRating, rightRating }: { leftRating: number; rightRating: number }) {
    const overall = ((leftRating + rightRating) / 2).toFixed(1);

    return (
        <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 140 80" className="h-[72px] w-[140px]" aria-hidden>
                <path
                    d="M 12 70 A 58 58 0 0 1 70 12"
                    fill="none"
                    stroke="#5670FB"
                    strokeWidth="10"
                    strokeLinecap="round"
                />
                <path
                    d="M 70 12 A 58 58 0 0 1 128 70"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="10"
                    strokeLinecap="round"
                />
            </svg>
            <div className="-mt-10 text-center">
                <p className="text-2xl font-bold leading-none text-[#1E223C]">{overall}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Overall</p>
            </div>
        </div>
    );
}

function DimensionRow({
    label,
    icon,
    leftValue,
    rightValue,
}: {
    label: string;
    icon: React.ReactNode;
    leftValue: number;
    rightValue: number;
}) {
    const leftWins = leftValue > rightValue;
    const rightWins = rightValue > leftValue;

    return (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[#EBF0F6] px-4 py-4 last:border-0 sm:px-6">
            <div className="space-y-2">
                <div className="flex items-center justify-end gap-2">
                    <span className={cn('text-sm font-bold', leftWins ? 'text-[#5670FB]' : 'text-[#1E223C]')}>
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

            <div className="flex min-w-[108px] flex-col items-center gap-1.5 px-1 text-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F7FB] text-gray-500">
                    {icon}
                </span>
                <span className="text-[11px] font-medium leading-tight text-gray-500">{label}</span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold', rightWins ? 'text-emerald-600' : 'text-[#1E223C]')}>
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
}

function CompanyHeaderCard({
    company,
    align,
}: {
    company: CompanyCompare;
    align: 'left' | 'right';
}) {
    const reviewCount = company.reviews.length;

    return (
        <div
            className={cn(
                'flex flex-col gap-2',
                align === 'right' ? 'items-end text-right' : 'items-start text-left',
            )}
        >
            <CompanyAvatar name={company.identity.name} logoUrl={company.logoUrl} size="xl" className="rounded-2xl p-1.5" />
            <div>
                <p className="max-w-[130px] text-base font-bold leading-tight text-[#1E223C] sm:max-w-[150px] sm:text-lg">
                    {company.identity.name}
                </p>
                <div className="mt-1">
                    <StarRating value={company.ratings.overall_rating} size="sm" />
                </div>
                {reviewCount > 0 && (
                    <p className="mt-1 text-xs text-gray-500">Based on {formatReviewCount(reviewCount)} reviews</p>
                )}
            </div>
        </div>
    );
}

export const CompareMatrix: React.FC<CompareMatrixProps> = ({ left, right }) => {
    const winner = pickWinner(left, right);
    const salaryRow = getSharedSalaries(left, right);
    const benefits = getBenefitComparison(left, right);
    const leftReview = left.reviews[0];
    const rightReview = right.reviews[0];
    const winnerCompany = winner === 'left' ? left : winner === 'right' ? right : null;

    return (
        <div className="overflow-hidden rounded-2xl border border-[#EBF0F6] bg-white shadow-sm">
            <div className="sticky top-0 z-10 border-b border-[#EBF0F6] bg-white shadow-sm">
                <div className="flex justify-center px-4 py-5 sm:px-6 sm:py-6">
                    <div className="flex max-w-full items-center gap-3 sm:gap-5 md:gap-6">
                        <CompanyHeaderCard company={left} align="left" />

                        <div className="flex flex-shrink-0 flex-col items-center justify-center">
                            {winner !== 'tie' ? (
                                <img
                                    src="/winner.png"
                                    alt="Winner"
                                    className="h-auto w-[120px] object-contain sm:w-[140px] md:w-[160px]"
                                />
                            ) : (
                                <span className="rounded-full border border-[#EBF0F6] bg-[#FAFCFF] px-3 py-1.5 text-xs font-bold text-gray-500">
                                    VS
                                </span>
                            )}
                        </div>

                        <CompanyHeaderCard company={right} align="right" />
                    </div>
                </div>
            </div>

            <section>
                <SectionHeading title="Overall rating" />
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-6 sm:px-6">
                    <div className="space-y-3">
                        <StarRating value={left.ratings.overall_rating} size="lg" />
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBF0F6]">
                            <div
                                className="h-full rounded-full bg-[#5670FB] transition-all"
                                style={{ width: barWidth(left.ratings.overall_rating) }}
                            />
                        </div>
                    </div>

                    <OverallGauge leftRating={left.ratings.overall_rating} rightRating={right.ratings.overall_rating} />

                    <div className="space-y-3">
                        <StarRating value={right.ratings.overall_rating} size="lg" />
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBF0F6]">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: barWidth(right.ratings.overall_rating) }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-t border-[#EBF0F6]">
                <SectionHeading title="Rating dimensions" />
                {RATING_DIMENSIONS.map(dim => (
                    <DimensionRow
                        key={dim.key}
                        label={dim.label}
                        icon={DIMENSION_ICONS[dim.key]}
                        leftValue={left.ratings[dim.key]}
                        rightValue={right.ratings[dim.key]}
                    />
                ))}
            </section>

            <section className="border-t border-[#EBF0F6]">
                <SectionHeading title="Salaries" />
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 px-4 py-6 sm:px-6">
                    {salaryRow ? (
                        <>
                            <div className="rounded-xl border border-[#5670FB]/15 bg-[#F5F8FF] p-4">
                                <p className="text-[11px] font-medium text-gray-500">Average role (per year)</p>
                                <p className="mt-2 text-lg font-bold text-[#5670FB]">{salaryRow.left.average_annual_salary}</p>
                                <p className="mt-1 text-xs text-gray-500">{salaryRow.left.salary_range}</p>
                                {parseSalaryRange(salaryRow.left.salary_range) && (
                                    <p className="mt-2 text-[11px] text-gray-400">
                                        Min {parseSalaryRange(salaryRow.left.salary_range)!.min} · Max{' '}
                                        {parseSalaryRange(salaryRow.left.salary_range)!.max}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-1.5 pt-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F7FB] text-gray-500">
                                    <Wallet size={16} />
                                </span>
                                <span className="max-w-[88px] text-center text-[11px] font-medium leading-tight text-gray-500">
                                    {salaryRow.role}
                                </span>
                            </div>

                            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                                <p className="text-[11px] font-medium text-gray-500">Average role (per year)</p>
                                <p className="mt-2 text-lg font-bold text-emerald-600">{salaryRow.right.average_annual_salary}</p>
                                <p className="mt-1 text-xs text-gray-500">{salaryRow.right.salary_range}</p>
                                {parseSalaryRange(salaryRow.right.salary_range) && (
                                    <p className="mt-2 text-[11px] text-gray-400">
                                        Min {parseSalaryRange(salaryRow.right.salary_range)!.min} · Max{' '}
                                        {parseSalaryRange(salaryRow.right.salary_range)!.max}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="col-span-3 py-6 text-center text-sm text-gray-400">No salary data available</div>
                    )}
                </div>
            </section>

            <section className="border-t border-[#EBF0F6]">
                <SectionHeading title="Benefits" />
                <div className="grid grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6">
                    <div className="rounded-xl border border-[#5670FB]/15 bg-[#F5F8FF] p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#5670FB]">
                                <Gift size={16} />
                            </span>
                            <p className="text-sm font-semibold text-[#1E223C]">{left.identity.name} only</p>
                        </div>
                        {benefits.leftOnly.length > 0 ? (
                            <ul className="space-y-2">
                                {benefits.leftOnly.slice(0, 5).map(benefit => (
                                    <li key={benefit} className="text-sm text-[#1E223C]">
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400">No exclusive benefits listed</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600">
                                <Gift size={16} />
                            </span>
                            <p className="text-sm font-semibold text-[#1E223C]">{right.identity.name} only</p>
                        </div>
                        {benefits.rightOnly.length > 0 ? (
                            <ul className="space-y-2">
                                {benefits.rightOnly.slice(0, 5).map(benefit => (
                                    <li key={benefit} className="text-sm text-[#1E223C]">
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400">No exclusive benefits listed</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="border-t border-[#EBF0F6]">
                <div className="grid grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6">
                    <div className="rounded-xl border border-[#EBF0F6] bg-[#FAFCFF] p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500">
                                <MessageSquare size={16} />
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Recent reviews</p>
                        </div>
                        {leftReview || rightReview ? (
                            <div className="space-y-3">
                                {[leftReview, rightReview].filter(Boolean).map((review, idx) => (
                                    <div key={idx}>
                                        <p className="text-sm font-medium text-[#1E223C]">{review!.summary}</p>
                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{review!.pros}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No reviews available</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-[#EBF0F6] bg-[#FAFCFF] p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500">
                                <Briefcase size={16} />
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Open jobs</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div>
                                <p className="text-2xl font-bold text-[#5670FB]">{left.active_jobs.length}</p>
                                <p className="text-[11px] text-gray-500">open roles</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-600">{right.active_jobs.length}</p>
                                <p className="text-[11px] text-gray-500">open roles</p>
                            </div>
                        </div>
                        {(left.overviewUrl || right.overviewUrl) && (
                            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                                {left.overviewUrl && (
                                    <a href={left.overviewUrl} target="_blank" rel="noopener noreferrer" className="text-[#5670FB] hover:underline">
                                        View jobs →
                                    </a>
                                )}
                                {right.overviewUrl && (
                                    <a href={right.overviewUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                                        View jobs →
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {winnerCompany && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Winner</p>
                                <img src="/winner.png" alt="" className="h-8 w-8 object-contain" aria-hidden />
                            </div>
                            <p className="text-base font-bold text-[#1E223C]">{winnerCompany.identity.name}</p>
                            <p className="mt-1 text-sm text-gray-600">Better overall match</p>
                            <p className="mt-2 text-xs text-gray-500">Based on rating dimensions</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
