import * as React from 'react';
import { filterCompanies } from '../../../lib/companyCompareData';
import type { CompanyCompare, ExploreFilters } from '../../../types/companyCompare';
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
                onBack={() => onDetailCompanyChange(null)}
                onAddToCompare={() => onAddToCompare(detailCompany)}
            />
        );
    }

    return (
        <div className="w-full pb-6">
            <CompareFilterBar filters={filters} onFiltersChange={onFiltersChange} />
            <CompareExploreHero filters={filters} onFiltersChange={onFiltersChange} />

            <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4">
                {hasActiveFilters && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EBF0F6] bg-[#FAFCFF] px-4 py-3">
                        <p className="text-sm text-[#1E223C]">
                            Showing <strong>{filtered.length}</strong> compan{filtered.length === 1 ? 'y' : 'ies'}
                        </p>
                    </div>
                )}

                <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 lg:items-start">
                    <div className="space-y-4 min-w-0">
                        {filtered.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#EBF0F6] bg-[#FAFCFF] px-6 py-12 text-center">
                                <p className="text-sm font-medium text-[#1E223C]">No companies match your filters</p>
                                <p className="mt-1 text-xs text-gray-500">Try a different keyword or clear filters.</p>
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

                    <div className="hidden lg:block sticky top-4">
                        <CompareSidebarWidget selection={compareSelection} onGoToCompare={onGoToCompare} />
                    </div>
                </div>

                <div className="mt-6 lg:hidden">
                    <CompareSidebarWidget selection={compareSelection} onGoToCompare={onGoToCompare} />
                </div>
            </div>
        </div>
    );
};
