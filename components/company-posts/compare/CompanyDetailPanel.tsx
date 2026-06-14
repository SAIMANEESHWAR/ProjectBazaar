import * as React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatWebsiteUrl } from '../../../lib/companyCompareData';
import type { CompanyCompare } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';
import { RatingBars, StarRating } from './RatingBars';

type DetailTab = 'overview' | 'ratings' | 'reviews' | 'salaries' | 'interviews' | 'jobs';

const TABS: Array<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'ratings', label: 'Ratings' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'salaries', label: 'Salaries' },
    { id: 'interviews', label: 'Interviews' },
    { id: 'jobs', label: 'Jobs' },
];

export interface CompanyDetailPanelProps {
    company: CompanyCompare;
    onClose: () => void;
    onAddToCompare?: () => void;
}

export const CompanyDetailPanel: React.FC<CompanyDetailPanelProps> = ({
    company,
    onClose,
    onAddToCompare,
}) => {
    const [activeTab, setActiveTab] = React.useState<DetailTab>('overview');
    const websiteUrl = formatWebsiteUrl(company.identity.website);

    React.useEffect(() => {
        setActiveTab('overview');
    }, [company.id]);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button
                type="button"
                aria-label="Close company details"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#EBF0F6] px-5 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <CompanyAvatar name={company.identity.name} size="lg" />
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-[#1E223C]">{company.identity.name}</h2>
                            <p className="text-sm text-gray-500">{company.identity.industry}</p>
                            <div className="mt-1">
                                <StarRating value={company.ratings.overall_rating} />
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex gap-1 overflow-x-auto border-b border-[#EBF0F6] px-4 py-2 scrollbar-hide">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                                activeTab === tab.id
                                    ? 'bg-[#5670FB] text-white'
                                    : 'text-gray-500 hover:bg-[#FAFCFF] hover:text-[#1E223C]'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            <p className="text-sm leading-relaxed text-gray-600">{company.identity.description}</p>
                            <div className="rounded-xl border border-[#EBF0F6] bg-[#FAFCFF] p-4 text-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#5670FB]">Headquarters</p>
                                <p className="mt-1 text-[#1E223C]">{company.identity.headquarters}</p>
                                {websiteUrl && (
                                    <a
                                        href={websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#5670FB] hover:underline"
                                    >
                                        {company.identity.website}
                                        <ExternalLink size={13} />
                                    </a>
                                )}
                            </div>
                            {company.benefits.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Benefits
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {company.benefits.map(b => (
                                            <span
                                                key={b.value}
                                                className="rounded-full border border-[#EBF0F6] bg-white px-3 py-1 text-xs font-medium text-[#1E223C]"
                                            >
                                                {b.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'ratings' && <RatingBars ratings={company.ratings} />}

                    {activeTab === 'reviews' && (
                        <div className="space-y-3">
                            {company.reviews.slice(0, 3).map((review, idx) => (
                                <article
                                    key={`${review.review_date}-${idx}`}
                                    className="rounded-xl border border-[#EBF0F6] p-4"
                                >
                                    <p className="text-xs text-gray-400">{review.review_date}</p>
                                    <p className="mt-2 text-sm font-medium text-[#1E223C]">{review.summary}</p>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        <div className="rounded-lg bg-emerald-50 p-3">
                                            <p className="text-[10px] font-semibold uppercase text-emerald-700">Pros</p>
                                            <p className="mt-1 text-xs text-emerald-900">{review.pros}</p>
                                        </div>
                                        <div className="rounded-lg bg-rose-50 p-3">
                                            <p className="text-[10px] font-semibold uppercase text-rose-700">Cons</p>
                                            <p className="mt-1 text-xs text-rose-900">{review.cons}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {activeTab === 'salaries' && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[320px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#EBF0F6] text-xs uppercase text-gray-500">
                                        <th className="pb-2 pr-3 font-semibold">Role</th>
                                        <th className="pb-2 pr-3 font-semibold">Avg</th>
                                        <th className="pb-2 pr-3 font-semibold">Range</th>
                                        <th className="pb-2 font-semibold">Exp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {company.salaries.map(row => (
                                        <tr key={row.role} className="border-b border-[#EBF0F6] last:border-0">
                                            <td className="py-2.5 pr-3 font-medium text-[#1E223C]">{row.role}</td>
                                            <td className="py-2.5 pr-3 text-[#5670FB] font-semibold">
                                                {row.average_annual_salary}
                                            </td>
                                            <td className="py-2.5 pr-3 text-gray-600">{row.salary_range}</td>
                                            <td className="py-2.5 text-gray-500 text-xs">{row.experience_level}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'interviews' && (
                        <div className="space-y-3">
                            {company.interviews.map(item => (
                                <article
                                    key={`${item.role}-${item.difficulty_level}`}
                                    className="rounded-xl border border-[#EBF0F6] p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h4 className="text-sm font-semibold text-[#1E223C]">{item.role}</h4>
                                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                            {item.difficulty_level}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">{item.experience_summary}</p>
                                </article>
                            ))}
                        </div>
                    )}

                    {activeTab === 'jobs' && (
                        <div className="space-y-3">
                            {company.active_jobs.map(job => (
                                <article
                                    key={`${job.job_title}-${job.location}`}
                                    className="rounded-xl border border-[#EBF0F6] p-4"
                                >
                                    <h4 className="text-sm font-semibold text-[#1E223C]">{job.job_title}</h4>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {job.location} · Posted {job.posted_date}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-[#EBF0F6] px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[11px] text-gray-400">
                            Data sourced from{' '}
                            {company.overviewUrl ? (
                                <a
                                    href={company.overviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-[#5670FB] hover:underline"
                                >
                                    AmbitionBox
                                </a>
                            ) : (
                                'AmbitionBox'
                            )}
                        </p>
                        {onAddToCompare && (
                            <button
                                type="button"
                                onClick={onAddToCompare}
                                className="rounded-lg bg-[#5670FB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4358d9]"
                            >
                                Add to compare
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
};
