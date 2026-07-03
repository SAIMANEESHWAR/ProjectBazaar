import * as React from 'react';
import { ArrowLeft, BadgeCheck, ExternalLink, GitCompare, ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
    formatBenefitLabel,
    formatWebsiteUrl,
    getCompanyInterviewQuestions,
    getCompanyMetricCounts,
    getCompanyRatingEntries,
    getLowRatedDimensions,
    getPrimaryLocation,
    getTopRatedDimensions,
    normalizeCompanyFromApi,
} from '../../../lib/companyCompareData';
import { fetchCompanyByIdFromApi } from '../../../lib/companyCompareApi';
import type { CompanyCompare } from '../../../types/companyCompare';
import { RATING_DIMENSIONS } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';
import { CompanyPostsPreviewSection } from './CompanyPostsPreviewSection';
import { RatingBars, StarRating, ratingStarColor } from './RatingBars';
import { SalaryIndustryChart } from './SalaryIndustryChart';

type DetailTab = 'about' | 'ratings' | 'reviews' | 'salaries' | 'interviews' | 'benefits' | 'jobs';

function ChipSection({ title, items }: { title: string; items: string[] }) {
    const visible = items.map(item => item.trim()).filter(Boolean);
    if (!visible.length) return null;
    return (
        <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {visible.map(item => (
                    <span
                        key={item}
                        className="rounded-full border border-[#EBF0F6] bg-[#FAFCFF] px-3 py-1.5 text-sm text-[#1E223C]"
                    >
                        {item}
                    </span>
                ))}
            </div>
        </section>
    );
}

function FactItem({ label, value }: { label: string; value?: string | number | null }) {
    if (value == null || value === '') return null;
    return (
        <div className="rounded-lg border border-[#EBF0F6] bg-[#FAFCFF] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-[#1E223C]">{value}</p>
        </div>
    );
}

const SOCIAL_LABELS: Record<string, string> = {
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    facebook: 'Facebook',
    youtube: 'YouTube',
    instagram: 'Instagram',
    website: 'Website',
};

export interface CompanyDetailViewProps {
    company: CompanyCompare;
    allCompanies?: CompanyCompare[];
    onBack: () => void;
    onAddToCompare?: () => void;
}

export const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({
    company: initialCompany,
    allCompanies = [],
    onBack,
    onAddToCompare,
}) => {
    const [company, setCompany] = React.useState(initialCompany);
    const [refreshing, setRefreshing] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<DetailTab>('about');
    const metrics = getCompanyMetricCounts(company);
    const interviewQuestions = getCompanyInterviewQuestions(company);
    const ratingEntries = getCompanyRatingEntries(company);
    const topRated = getTopRatedDimensions(company, 1)[0];
    const lowRated = getLowRatedDimensions(company, 3);
    const websiteUrl = formatWebsiteUrl(company.identity.website);
    const topInterview = company.interviews[0];
    const topBenefit = formatBenefitLabel(company.benefits[0] ?? '');

    React.useEffect(() => {
        setCompany(initialCompany);
    }, [initialCompany]);

    React.useEffect(() => {
        let cancelled = false;
        setRefreshing(true);
        fetchCompanyByIdFromApi(initialCompany.id)
            .then(item => {
                if (!cancelled) {
                    setCompany(normalizeCompanyFromApi(item));
                }
            })
            .catch(() => {
                // Keep list data if the detail fetch fails.
            })
            .finally(() => {
                if (!cancelled) setRefreshing(false);
            });
        return () => {
            cancelled = true;
        };
    }, [initialCompany.id]);

    const tabs: Array<{ id: DetailTab; label: string; count?: number }> = [
        { id: 'about', label: 'About' },
        { id: 'ratings', label: 'Rating' },
        { id: 'salaries', label: 'Salaries', count: metrics.salaries },
        { id: 'interviews', label: 'Interview', count: metrics.interviews },
        { id: 'reviews', label: 'Reviews', count: metrics.reviews },
        { id: 'benefits', label: 'Benefits', count: metrics.benefits },
        ...(metrics.jobs > 0 ? [{ id: 'jobs' as const, label: 'Jobs', count: metrics.jobs }] : []),
    ];

    const socialEntries = Object.entries(company.socialLinks ?? {}).filter(
        ([, url]) => typeof url === 'string' && url.trim(),
    );
    const sourceUrl = company.overviewUrl || company.metadata?.source_urls?.[0]?.value;

    React.useEffect(() => {
        setActiveTab('about');
    }, [company.id]);

    const keyFactors = RATING_DIMENSIONS.slice(0, 4).map(dim => ({
        ...dim,
        value: company.ratings[dim.key],
    }));

    return (
        <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4 pb-8">
            <button
                type="button"
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5670FB] hover:text-[#4358d9]"
            >
                <ArrowLeft size={16} />
                Back to companies
            </button>

            <div className="rounded-xl border border-[#EBF0F6] bg-white overflow-hidden shadow-sm">
                <div className="border-b border-[#EBF0F6] bg-[#FAFCFF] px-4 sm:px-6 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                            <CompanyAvatar name={company.identity.name} logoUrl={company.logoUrl} size="lg" className="h-16 w-16 text-lg" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold text-[#1E223C]">{company.identity.name}</h1>
                                    <BadgeCheck size={20} className="text-[#5670FB]" />
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <StarRating value={company.ratings.overall_rating} />
                                    <span className="text-sm text-gray-500">
                                        based on {metrics.reviews} review{metrics.reviews !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    {company.identity.industry} | {getPrimaryLocation(company)}
                                    {company.employeeCount ? ` | ${company.employeeCount} employees` : ''}
                                    {company.foundedYear || company.identity.founded
                                        ? ` | Founded ${company.foundedYear ?? company.identity.founded}`
                                        : ''}
                                </p>
                            </div>
                        </div>
                        {onAddToCompare && (
                            <button
                                type="button"
                                onClick={onAddToCompare}
                                className="inline-flex items-center gap-2 rounded-lg border-2 border-[#5670FB] px-4 py-2 text-sm font-semibold text-[#5670FB] hover:bg-[#5670FB]/5 transition-colors"
                            >
                                <GitCompare size={16} />
                                Compare
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-1 overflow-x-auto border-b border-[#EBF0F6] px-4 py-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition border-b-2 -mb-[1px]',
                                activeTab === tab.id
                                    ? 'border-[#5670FB] text-[#5670FB] bg-[#5670FB]/5'
                                    : 'border-transparent text-gray-500 hover:text-[#1E223C]'
                            )}
                        >
                            {tab.label}
                            {tab.count != null && (
                                <span className="ml-1 text-xs font-normal text-gray-400">({tab.count})</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-4 sm:p-6">
                    {refreshing && (
                        <p className="mb-4 text-xs font-medium text-gray-400">Refreshing company data…</p>
                    )}
                    {activeTab === 'about' && (
                        <div className="space-y-6">
                            <section>
                                <h2 className="text-lg font-bold text-[#1E223C] mb-3">
                                    Working at {company.identity.name}
                                </h2>
                                <p className="text-sm leading-relaxed text-gray-600 mb-4">{company.identity.description}</p>
                                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <FactItem label="Company type" value={company.identity.company_type} />
                                    <FactItem label="Headquarters" value={company.identity.headquarters} />
                                    <FactItem
                                        label="Founded"
                                        value={company.foundedYear ?? company.identity.founded}
                                    />
                                    <FactItem label="Employees" value={company.employeeCount} />
                                    <FactItem label="CEO" value={company.identity.ceo} />
                                    <FactItem label="Stock" value={company.identity.stock_symbol} />
                                    <FactItem label="Parent company" value={company.identity.parent_company} />
                                    <FactItem label="Avg salary" value={company.salaryRange} />
                                </div>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="rounded-full border border-[#EBF0F6] bg-[#FAFCFF] px-3 py-1 text-xs font-medium text-[#1E223C]">
                                        {company.identity.industry}
                                    </span>
                                    {company.benefits.slice(0, 3).map(b => {
                                        const label = formatBenefitLabel(b);
                                        return (
                                        <span
                                            key={label}
                                            className="rounded-full border border-[#EBF0F6] px-3 py-1 text-xs text-gray-600"
                                        >
                                            {label}
                                        </span>
                                        );
                                    })}
                                </div>
                            </section>

                            <div className="space-y-6">
                                <ChipSection title="Specialties" items={company.identity.specialties ?? []} />
                                <ChipSection title="Office locations" items={company.locations ?? []} />
                                <ChipSection title="Technologies" items={company.technologies ?? []} />
                                {company.company_highlights && company.company_highlights.length > 0 && (
                                    <section>
                                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                            Company highlights
                                        </h3>
                                        <ul className="space-y-2">
                                            {company.company_highlights.map(highlight => (
                                                <li
                                                    key={highlight}
                                                    className="flex gap-2 text-sm text-gray-600 before:content-['•'] before:text-[#5670FB]"
                                                >
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                                {socialEntries.length > 0 && (
                                    <section>
                                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                            Social links
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {socialEntries.map(([key, url]) => (
                                                <a
                                                    key={key}
                                                    href={formatWebsiteUrl(url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#5670FB] hover:underline"
                                                >
                                                    {SOCIAL_LABELS[key] ?? key}
                                                    <ExternalLink size={12} />
                                                </a>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                {sourceUrl && (
                                    <p className="text-xs text-gray-400">
                                        Source:{' '}
                                        <a
                                            href={sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#5670FB] hover:underline"
                                        >
                                            {company.metadata?.source ?? 'View profile'}
                                        </a>
                                        {company.metadata?.last_verified
                                            ? ` · Last verified ${company.metadata.last_verified}`
                                            : ''}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                                <div className="rounded-xl border border-[#EBF0F6] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                                        Overall Rating
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-[#1E223C]">
                                            {company.ratings.overall_rating.toFixed(1)}
                                        </span>
                                        <span className="text-lg text-gray-400">/5</span>
                                    </div>
                                    <StarRating value={company.ratings.overall_rating} size="lg" showValue={false} />
                                    {topRated && (
                                        <div className="mt-4 flex items-start gap-2 text-sm">
                                            <ThumbsUp size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                                            <span className="text-gray-600">
                                                Highly rated for <strong>{topRated.label}</strong>
                                            </span>
                                        </div>
                                    )}
                                    <div className="mt-2 flex items-start gap-2 text-sm">
                                        <ThumbsDown size={14} className="mt-0.5 text-rose-600 shrink-0" />
                                        <span className="text-gray-600">
                                            Critically rated for{' '}
                                            <strong>{lowRated.map(r => r.label).join(', ')}</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#EBF0F6] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                                        Key factors to consider
                                    </p>
                                    <ul className="space-y-3">
                                        {keyFactors.map(f => (
                                            <li key={f.key} className="flex items-center justify-between gap-2">
                                                <span className="text-sm text-[#1E223C]">{f.label}</span>
                                                <span className={cn('flex items-center gap-1 text-sm font-semibold', ratingStarColor(f.value))}>
                                                    ★ {f.value.toFixed(1)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="rounded-xl border border-[#EBF0F6] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                                        Quick snapshot
                                    </p>
                                    <ul className="space-y-3 text-sm text-gray-600">
                                        {topBenefit && (
                                            <li>
                                                Top benefit: <strong>{topBenefit}</strong>
                                            </li>
                                        )}
                                        {topInterview && (
                                            <li>
                                                Interview difficulty:{' '}
                                                <strong>{topInterview.difficulty_level}</strong> ({topInterview.role})
                                            </li>
                                        )}
                                        {websiteUrl && (
                                            <li>
                                                <a
                                                    href={websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 font-semibold text-[#5670FB] hover:underline"
                                                >
                                                    {company.identity.website}
                                                    <ExternalLink size={12} />
                                                </a>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ratings' && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-[#EBF0F6] p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                                    Overall Rating
                                </p>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-5xl font-bold text-[#1E223C]">
                                        {company.ratings.overall_rating.toFixed(1)}
                                    </span>
                                    <span className="text-xl text-gray-400">/5</span>
                                </div>
                                <StarRating value={company.ratings.overall_rating} size="lg" />
                            </div>
                            <div className="rounded-xl border border-[#EBF0F6] p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                                    Category Ratings
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {ratingEntries.map(entry => (
                                        <div key={entry.key} className="flex items-center justify-between gap-2">
                                            <span className="text-sm text-[#1E223C]">{entry.label}</span>
                                            <span className={cn('text-sm font-bold', ratingStarColor(entry.value))}>
                                                ★ {entry.value.toFixed(1)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5">
                                    <RatingBars ratings={company.ratings} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-3">
                            {company.reviews.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-[#EBF0F6] bg-[#FAFCFF] px-4 py-8 text-center text-sm text-gray-500">
                                    No employee reviews available yet.
                                </p>
                            ) : (
                                company.reviews.map((review, idx) => (
                                <article key={`${review.review_date}-${idx}`} className="rounded-xl border border-[#EBF0F6] p-4">
                                    <p className="text-xs text-gray-400">{review.review_date}</p>
                                    <p className="mt-2 font-medium text-[#1E223C]">{review.summary}</p>
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
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'salaries' && (
                        <div className="space-y-6">
                            <SalaryIndustryChart
                                company={company}
                                allCompanies={allCompanies.length > 0 ? allCompanies : [company]}
                            />

                            {company.salaries.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-[#EBF0F6]">
                                    <table className="w-full min-w-[320px] text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-[#EBF0F6] bg-[#FAFCFF] text-xs uppercase text-gray-500">
                                                <th className="px-4 py-3 pr-3 font-semibold">Role</th>
                                                <th className="px-4 py-3 pr-3 font-semibold">Avg</th>
                                                <th className="px-4 py-3 pr-3 font-semibold">Range</th>
                                                <th className="px-4 py-3 font-semibold">Exp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {company.salaries.map(row => (
                                                <tr key={`${row.role}-${row.salary_range}`} className="border-b border-[#EBF0F6] last:border-0">
                                                    <td className="px-4 py-2.5 pr-3 font-medium text-[#1E223C]">{row.role}</td>
                                                    <td className="px-4 py-2.5 pr-3 font-semibold text-[#5670FB]">
                                                        {row.average_annual_salary}
                                                        {row.currency ? ` (${row.currency})` : ''}
                                                    </td>
                                                    <td className="px-4 py-2.5 pr-3 text-gray-600">{row.salary_range}</td>
                                                    <td className="px-4 py-2.5 text-xs text-gray-500">
                                                        {row.experience_level || row.salary_period || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : company.salaryRange ? (
                                <div className="rounded-xl border border-[#EBF0F6] bg-[#FAFCFF] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Average salary</p>
                                    <p className="mt-2 text-lg font-semibold text-[#5670FB]">{company.salaryRange}</p>
                                </div>
                            ) : (
                                <p className="rounded-xl border border-dashed border-[#EBF0F6] bg-[#FAFCFF] px-4 py-8 text-center text-sm text-gray-500">
                                    No salary data available yet.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'interviews' && (
                        <div className="space-y-4">
                            {company.interviews.map(item => (
                                <article key={`${item.role}-${item.difficulty_level}`} className="rounded-xl border border-[#EBF0F6] p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h4 className="font-semibold text-[#1E223C]">{item.role}</h4>
                                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                            {item.difficulty_level}
                                        </span>
                                    </div>
                                    {item.experience_summary && (
                                        <p className="mt-2 text-sm text-gray-600">{item.experience_summary}</p>
                                    )}
                                    {item.selection_process && item.selection_process.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Selection process
                                            </p>
                                            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
                                                {item.selection_process.map(step => (
                                                    <li key={step}>{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </article>
                            ))}
                            {interviewQuestions.length > 0 ? (
                                <div className="rounded-xl border border-[#EBF0F6] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Common questions ({interviewQuestions.length})
                                    </p>
                                    <ul className="mt-2 space-y-2">
                                        {interviewQuestions.map(question => (
                                            <li
                                                key={question}
                                                className="rounded-lg border border-[#EBF0F6] bg-[#FAFCFF] px-3 py-2 text-sm text-[#1E223C]"
                                            >
                                                {question}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="rounded-xl border border-dashed border-[#EBF0F6] bg-[#FAFCFF] px-4 py-8 text-center text-sm text-gray-500">
                                    No interview data available yet.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'benefits' && (
                        <div className="flex flex-wrap gap-2">
                            {company.benefits.length === 0 ? (
                                <p className="w-full rounded-xl border border-dashed border-[#EBF0F6] bg-[#FAFCFF] px-4 py-8 text-center text-sm text-gray-500">
                                    No benefits listed yet.
                                </p>
                            ) : (
                            company.benefits.map(b => {
                                const label = formatBenefitLabel(b);
                                return (
                                <span
                                    key={label}
                                    className="rounded-full border border-[#EBF0F6] bg-[#FAFCFF] px-3 py-1.5 text-sm text-[#1E223C]"
                                >
                                    {label}
                                </span>
                                );
                            })
                            )}
                        </div>
                    )}

                    {activeTab === 'jobs' && (
                        <div className="space-y-3">
                            {company.active_jobs.map(job => (
                                <article
                                    key={`${job.job_title}-${job.location}`}
                                    className="rounded-xl border border-[#EBF0F6] p-4"
                                >
                                    <h4 className="font-semibold text-[#1E223C]">{job.job_title}</h4>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {job.location}
                                        {job.posted_date ? ` · Posted ${job.posted_date}` : ''}
                                    </p>
                                    {job.apply_url && (
                                        <a
                                            href={job.apply_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#5670FB] hover:underline"
                                        >
                                            Apply
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CompanyPostsPreviewSection companyName={company.identity.name} />
        </div>
    );
};
