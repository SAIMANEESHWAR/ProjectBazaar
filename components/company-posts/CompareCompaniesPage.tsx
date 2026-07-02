import * as React from 'react';
import { X } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { loadCompaniesFromApi } from '../../lib/companyCompareData';
import type { CompanyCompare, ExploreFilters } from '../../types/companyCompare';
import { DEFAULT_EXPLORE_FILTERS } from '../../types/companyCompare';
import { CompareCompaniesSection } from './compare/CompareCompaniesSection';
import { ExploreCompaniesSection } from './compare/ExploreCompaniesSection';
import { CompanyAvatar } from './compare/CompanyAvatar';

const CompareCompaniesPage: React.FC = () => {
    const { companySectionTab, companyCompareMode, setCompanyCompareMode } = useDashboard();
    const [compareSelection, setCompareSelection] = React.useState<[CompanyCompare | null, CompanyCompare | null]>([
        null,
        null,
    ]);
    const [exploreFilters, setExploreFilters] = React.useState<ExploreFilters>(DEFAULT_EXPLORE_FILTERS);
    const [detailCompanyId, setDetailCompanyId] = React.useState<string | null>(null);
    const prevSectionTabRef = React.useRef(companySectionTab);

    React.useEffect(() => {
        const enteredCompareSection =
            companySectionTab === 'compare-companies' &&
            prevSectionTabRef.current !== 'compare-companies';
        prevSectionTabRef.current = companySectionTab;
        if (!enteredCompareSection) return;
        setExploreFilters(DEFAULT_EXPLORE_FILTERS);
        setDetailCompanyId(null);
        setCompanyCompareMode('explore');
    }, [companySectionTab, setCompanyCompareMode]);
    const [toast, setToast] = React.useState<string | null>(null);
    const [companies, setCompanies] = React.useState<CompanyCompare[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        loadCompaniesFromApi()
            .then(data => {
                if (!cancelled) setCompanies(data);
            })
            .catch(err => {
                if (!cancelled) {
                    setLoadError(err instanceof Error ? err.message : 'Failed to load companies');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    React.useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 3000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const handleAddToCompare = React.useCallback((company: CompanyCompare) => {
        setCompareSelection(prev => {
            if (prev[0]?.id === company.id || prev[1]?.id === company.id) {
                setToast(`${company.identity.name} is already in compare`);
                return prev;
            }
            if (!prev[0]) return [company, prev[1]];
            if (!prev[1]) return [prev[0], company];
            setToast('Compare list is full — remove a company first');
            return prev;
        });
        setCompanyCompareMode('compare');
    }, [setCompanyCompareMode]);

    const selectedCompanies = [compareSelection[0], compareSelection[1]].filter(Boolean) as CompanyCompare[];

    return (
        <div className="w-full bg-white pb-4">
            {selectedCompanies.length > 0 && (
                <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4 pt-3 pb-1">
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#5670FB]/25 bg-white py-1.5 pl-3 pr-1.5 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setCompanyCompareMode('compare')}
                            className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-[#1E223C] transition-colors hover:text-[#5670FB] sm:text-sm"
                        >
                            <span className="flex shrink-0 -space-x-1.5">
                                {selectedCompanies.map(c => (
                                    <CompanyAvatar
                                        key={c.id}
                                        name={c.identity.name}
                                        logoUrl={c.logoUrl}
                                        size="sm"
                                        className="h-7 w-7 ring-2 ring-white"
                                    />
                                ))}
                            </span>
                            <span className="truncate">
                                {selectedCompanies.map(c => c.identity.name).join(' vs ')}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setCompareSelection([null, null])}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Remove comparison"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div
                    className="w-full max-w-[1024px] mx-auto px-4 py-8"
                    aria-busy="true"
                    aria-label="Loading companies"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className="rounded-xl border border-[#EBF0F6] bg-white p-4 shadow-sm animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                                        <div className="h-3 w-1/2 rounded bg-gray-100" />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="h-3 w-full rounded bg-gray-100" />
                                    <div className="h-3 w-5/6 rounded bg-gray-100" />
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-6 w-16 rounded-full bg-gray-100" />
                                    <div className="h-6 w-20 rounded-full bg-gray-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : loadError ? (
                <div className="w-full max-w-[1024px] mx-auto px-4 py-8">
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {loadError}
                    </div>
                </div>
            ) : companyCompareMode === 'explore' ? (
                <ExploreCompaniesSection
                    companies={companies}
                    filters={exploreFilters}
                    onFiltersChange={setExploreFilters}
                    compareSelection={compareSelection}
                    onAddToCompare={handleAddToCompare}
                    onGoToCompare={() => setCompanyCompareMode('compare')}
                    detailCompanyId={detailCompanyId}
                    onDetailCompanyChange={setDetailCompanyId}
                />
            ) : (
                <CompareCompaniesSection
                    companies={companies}
                    selection={compareSelection}
                    onSelectionChange={setCompareSelection}
                />
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#1E223C] px-4 py-3 text-sm font-medium text-white shadow-lg">
                    {toast}
                </div>
            )}

            <style
                dangerouslySetInnerHTML={{
                    __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `,
                }}
            />
        </div>
    );
};

export default CompareCompaniesPage;
