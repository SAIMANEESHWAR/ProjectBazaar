import * as React from 'react';
import { filterCompanies } from '../../../lib/companyCompareData';
import { DEFAULT_EXPLORE_FILTERS, type CompanyCompare, type ExploreFilters } from '../../../types/companyCompare';
import { CompareExploreHero } from './CompareExploreHero';
import { CompareFilterBar } from './CompareFilterBar';
import { CompareSidebarWidget } from './CompareSidebarWidget';
import { CompanyDetailView } from './CompanyDetailView';
import { CompanyExploreListCard } from './CompanyExploreListCard';

export interface ExploreCompaniesSectionProps {
    companies: CompanyCompare[];
    filters: ExploreFilters;
    onFiltersChange: (filters: ExploreFilters) => void;
    compareSelection: [CompanyCompare | null, CompanyCompare | null];
    onAddToCompare: (company: CompanyCompare) => void;
    onGoToCompare: () => void;
    detailCompanyId: string | null;
    onDetailCompanyChange: (id: string | null) => void;
}

export const ExploreCompaniesSection: React.FC<ExploreCompaniesSectionProps> = ({
    companies,
    filters,
    onFiltersChange,
    compareSelection,
    onAddToCompare,
    onGoToCompare,
    detailCompanyId,
    onDetailCompanyChange,
}) => {
    const filtered = React.useMemo(() => filterCompanies(filters, companies), [filters, companies]);
    const detailCompany = detailCompanyId
        ? filtered.find(c => c.id === detailCompanyId) ?? companies.find(c => c.id === detailCompanyId)
        : null;
    const compareIds = new Set(compareSelection.filter(Boolean).map(c => c!.id));

    const hasActiveFilters =
        filters.search ||
        filters.industry ||
        filters.minRating != null ||
        filters.location ||
        filters.role ||
        filters.knownFor;

    if (detailCompany) {
        return (
            <CompanyDetailView
                company={detailCompany}
                allCompanies={companies}
                onBack={() => onDetailCompanyChange(null)}
                onAddToCompare={() => onAddToCompare(detailCompany)}
            />
        );
    }

    return (
        <div className="w-full pb-6">
            <div className="sticky top-0 z-30 overflow-visible border-b border-[#EBF0F6]/80 bg-white/95 py-2 shadow-sm backdrop-blur-sm">
                <CompareFilterBar companies={companies} filters={filters} onFiltersChange={onFiltersChange} />
            </div>
            {!hasActiveFilters && <CompareExploreHero onFiltersChange={onFiltersChange} />}

            <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4">
                {!hasActiveFilters && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-[#1E223C]">Companies in India</h2>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">Popular</span>
                            <select
                                className="rounded-lg border border-[#EBF0F6] bg-white px-3 py-1.5 text-sm text-[#1E223C] focus:outline-none focus:ring-2 focus:ring-[#5670FB]/20"
                                defaultValue="popular"
                                aria-label="Sort companies"
                            >
                                <option value="popular">Popular</option>
                                <option value="rating">Top rated</option>
                                <option value="reviews">Most reviewed</option>
                            </select>
                        </label>
                    </div>
                )}

                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EBF0F6] bg-[#FAFCFF] px-4 py-3">
                    <p className="text-sm text-[#1E223C]">
                        Showing <strong>{filtered.length}</strong> of <strong>{companies.length}</strong> compan
                        {companies.length === 1 ? 'y' : 'ies'}
                        {hasActiveFilters ? ' (filtered)' : ''}
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => onFiltersChange(DEFAULT_EXPLORE_FILTERS)}
                            className="text-xs font-semibold text-[#5670FB] hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 lg:items-start">
                    <div className="space-y-4 min-w-0">
                        {filtered.length === 0 ? (
                            <div className="flex min-h-[480px] flex-col items-center justify-center rounded-xl border border-dashed border-[#EBF0F6] bg-[#FAFCFF] px-6 py-16 text-center">
                                <img
                                    src="/company_not_found.png"
                                    alt="No companies found"
                                    className="mx-auto h-auto w-full max-w-[420px] object-contain sm:max-w-[520px] lg:max-w-[600px]"
                                />
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={() => onFiltersChange(DEFAULT_EXPLORE_FILTERS)}
                                        className="mt-6 text-sm font-semibold text-orange-500 hover:text-orange-600"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            filtered.map(company => (
                                <CompanyExploreListCard
                                    key={company.id}
                                    company={company}
                                    selected={compareIds.has(company.id)}
                                    onViewDetails={() => onDetailCompanyChange(company.id)}
                                    onAddToCompare={() => onAddToCompare(company)}
                                />
                            ))
                        )}
                    </div>

                    {!hasActiveFilters && (
                        <div className="hidden lg:block">
                            <div className="sticky top-24">
                                <CompareSidebarWidget
                                    selection={compareSelection}
                                    onGoToCompare={onGoToCompare}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
