import * as React from 'react';
import type { CompanyCompare } from '../../../types/companyCompare';
import { RATING_DIMENSIONS } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';
import { CompareRatingPair, StarRating } from './RatingBars';

export interface CompareMatrixProps {
    left: CompanyCompare;
    right: CompanyCompare;
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

    if (shared.length > 0) return shared.slice(0, 3);

    return [
        {
            role: left.salaries[0]?.role ?? 'Top role',
            left: left.salaries[0],
            right: right.salaries[0],
        },
    ].filter(row => row.left && row.right) as Array<{
        role: string;
        left: CompanyCompare['salaries'][number];
        right: CompanyCompare['salaries'][number];
    }>;
}

function getBenefitComparison(left: CompanyCompare, right: CompanyCompare) {
    const leftSet = new Set(left.benefits.map(b => b.value));
    const rightSet = new Set(right.benefits.map(b => b.value));
    const common = left.benefits.filter(b => rightSet.has(b.value)).map(b => b.value);
    const leftOnly = left.benefits.filter(b => !rightSet.has(b.value)).map(b => b.value);
    const rightOnly = right.benefits.filter(b => !leftSet.has(b.value)).map(b => b.value);
    return { common, leftOnly, rightOnly };
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="border-b border-[#EBF0F6] last:border-0">
            <div className="bg-[#FAFCFF] px-4 sm:px-6 py-3 border-b border-[#EBF0F6]">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
            </div>
            <div className="px-4 sm:px-6 py-4">{children}</div>
        </section>
    );
}

export const CompareMatrix: React.FC<CompareMatrixProps> = ({ left, right }) => {
    const leftWinsOverall = left.ratings.overall_rating > right.ratings.overall_rating;
    const rightWinsOverall = right.ratings.overall_rating > left.ratings.overall_rating;
    const salaryRows = getSharedSalaries(left, right);
    const benefits = getBenefitComparison(left, right);
    const leftReview = left.reviews[0];
    const rightReview = right.reviews[0];
    const leftTopJob = left.active_jobs[0];
    const rightTopJob = right.active_jobs[0];

    return (
        <div className="overflow-hidden rounded-2xl border border-[#EBF0F6] bg-white shadow-sm">
            <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-[#EBF0F6] bg-white shadow-sm">
                <div className="flex items-center gap-3 border-r border-[#EBF0F6] px-4 sm:px-6 py-4">
                    <CompanyAvatar name={left.identity.name} logoUrl={left.logoUrl} size="lg" />
                    <div>
                        <p className="font-bold text-[#1E223C]">{left.identity.name}</p>
                        <StarRating value={left.ratings.overall_rating} size="sm" />
                        {leftWinsOverall && (
                            <span className="mt-1 inline-block rounded-full bg-[#5670FB]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5670FB]">
                                Higher rating
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
                    <CompanyAvatar name={right.identity.name} logoUrl={right.logoUrl} size="lg" />
                    <div>
                        <p className="font-bold text-[#1E223C]">{right.identity.name}</p>
                        <StarRating value={right.ratings.overall_rating} size="sm" />
                        {rightWinsOverall && (
                            <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                Higher rating
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <SectionCard title="Overall rating">
                <div className="grid grid-cols-2 gap-4">
                    <StarRating value={left.ratings.overall_rating} size="lg" />
                    <StarRating value={right.ratings.overall_rating} size="lg" />
                </div>
            </SectionCard>

            <SectionCard title="Rating dimensions">
                {RATING_DIMENSIONS.map(dim => (
                    <CompareRatingPair
                        key={dim.key}
                        label={dim.label}
                        leftValue={left.ratings[dim.key]}
                        rightValue={right.ratings[dim.key]}
                    />
                ))}
            </SectionCard>

            <SectionCard title="Salaries">
                <div className="space-y-3">
                    {salaryRows.map(row => (
                        <div key={row.role} className="rounded-xl border border-[#EBF0F6] p-4 bg-[#FAFCFF]">
                            <p className="text-sm font-semibold text-[#1E223C] mb-3">{row.role}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 mb-1">{left.identity.name}</p>
                                    <p className="text-[#5670FB] font-bold text-lg">{row.left.average_annual_salary}</p>
                                    <p className="text-xs text-gray-500">{row.left.salary_range}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-gray-400 mb-1">{right.identity.name}</p>
                                    <p className="text-emerald-600 font-bold text-lg">{row.right.average_annual_salary}</p>
                                    <p className="text-xs text-gray-500">{row.right.salary_range}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Benefits">
                {benefits.common.length > 0 && (
                    <div className="mb-4">
                        <p className="mb-2 text-[11px] font-semibold text-gray-500">Common benefits</p>
                        <div className="flex flex-wrap gap-1.5">
                            {benefits.common.map(b => (
                                <span
                                    key={b}
                                    className="rounded-full bg-[#5670FB]/10 px-2.5 py-1 text-xs font-medium text-[#5670FB]"
                                >
                                    {b}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="mb-2 text-[11px] font-semibold text-gray-500">{left.identity.name} only</p>
                        <div className="flex flex-wrap gap-1.5">
                            {benefits.leftOnly.slice(0, 4).map(b => (
                                <span
                                    key={b}
                                    className="rounded-full border border-[#EBF0F6] px-2.5 py-1 text-xs text-[#1E223C]"
                                >
                                    {b}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="mb-2 text-[11px] font-semibold text-gray-500">{right.identity.name} only</p>
                        <div className="flex flex-wrap gap-1.5">
                            {benefits.rightOnly.slice(0, 4).map(b => (
                                <span
                                    key={b}
                                    className="rounded-full border border-[#EBF0F6] px-2.5 py-1 text-xs text-[#1E223C]"
                                >
                                    {b}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Recent reviews">
                <div className="grid grid-cols-2 gap-4">
                    {[leftReview, rightReview].map((review, idx) => (
                        <div key={idx} className="rounded-xl bg-[#FAFCFF] border border-[#EBF0F6] p-4">
                            {review ? (
                                <>
                                    <p className="text-sm font-medium text-[#1E223C]">{review.summary}</p>
                                    <p className="mt-2 text-xs text-gray-500 line-clamp-3">{review.pros}</p>
                                </>
                            ) : (
                                <p className="text-xs text-gray-400">No reviews available</p>
                            )}
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Open jobs">
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[#EBF0F6] p-4 text-center">
                        <p className="text-3xl font-bold text-[#5670FB]">{left.active_jobs.length}</p>
                        <p className="text-xs text-gray-500 mt-1">open roles</p>
                        {leftTopJob && (
                            <p className="mt-2 text-xs font-medium text-[#1E223C]">{leftTopJob.job_title}</p>
                        )}
                    </div>
                    <div className="rounded-xl border border-[#EBF0F6] p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{right.active_jobs.length}</p>
                        <p className="text-xs text-gray-500 mt-1">open roles</p>
                        {rightTopJob && (
                            <p className="mt-2 text-xs font-medium text-[#1E223C]">{rightTopJob.job_title}</p>
                        )}
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};
