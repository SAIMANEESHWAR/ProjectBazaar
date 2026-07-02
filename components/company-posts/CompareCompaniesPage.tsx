import * as React from 'react';
import { cn } from '../../lib/utils';
import { useDashboard } from '../../context/DashboardContext';
import { loadCompaniesFromApi } from '../../lib/companyCompareData';
import type { CompanyCompare, ExploreFilters } from '../../types/companyCompare';
import { DEFAULT_EXPLORE_FILTERS } from '../../types/companyCompare';
import { CompareCompaniesSection } from './compare/CompareCompaniesSection';
import { ExploreCompaniesSection } from './compare/ExploreCompaniesSection';
import { CompanyAvatar } from './compare/CompanyAvatar';

type ActiveSection = 'explore' | 'compare';

const CompareCompaniesPage: React.FC = () => {
    const { companySectionTab } = useDashboard();
    const [activeSection, setActiveSection] = React.useState<ActiveSection>('explore');
    const [compareSelection, setCompareSelection] = React.useState<[CompanyCompare | null, CompanyCompare | null]>([
        null,
        null,
    ]);
    const [exploreFilters, setExploreFilters] = React.useState<ExploreFilters>(DEFAULT_EXPLORE_FILTERS);
    const [detailCompanyId, setDetailCompanyId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (companySectionTab !== 'compare-companies') return;
        setExploreFilters(DEFAULT_EXPLORE_FILTERS);
        setDetailCompanyId(null);
        setActiveSection('explore');
    }, [companySectionTab]);
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
        setActiveSection('compare');
    }, []);

    const selectedCompanies = [compareSelection[0], compareSelection[1]].filter(Boolean) as CompanyCompare[];

    return (
        <div className="w-full bg-white pb-4">
            <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4 pt-4 pb-2">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-xl border border-[#EBF0F6] bg-[#FAFCFF] p-1">
                        {(['explore', 'compare'] as const).map(section => (
                            <button
                                key={section}
                                type="button"
                                onClick={() => setActiveSection(section)}
                                className={cn(
                                    'rounded-lg px-4 py-2 text-sm font-semibold transition',
                                    activeSection === section
                                        ? 'bg-[#5670FB] text-white shadow-sm'
                                        : 'text-[#1E223C] hover:bg-white'
                                )}
                            >
                                {section === 'explore' ? 'Explore Companies' : 'Compare Companies'}
                            </button>
                        ))}
                    </div>

                    {selectedCompanies.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveSection('compare')}
                            className="inline-flex items-center gap-2 rounded-full border border-[#EBF0F6] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E223C] hover:border-[#5670FB]/40 transition-colors"
                        >
                            <span className="flex -space-x-1.5">
                                {selectedCompanies.map(c => (
                                    <CompanyAvatar
                                        key={c.id}
                                        name={c.identity.name}
                                        logoUrl={c.logoUrl}
                                        size="sm"
                                        className="ring-2 ring-white h-7 w-7 text-[10px]"
                                    />
                                ))}
                            </span>
                            {selectedCompanies.map(c => c.identity.name).join(' vs ')}
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="w-full max-w-[1024px] mx-auto px-4 py-16 text-center">
                    <p className="text-sm text-gray-500">Loading companies…</p>
                </div>
            ) : loadError ? (
                <div className="w-full max-w-[1024px] mx-auto px-4 py-8">
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {loadError}
                    </div>
                </div>
            ) : activeSection === 'explore' ? (
                <ExploreCompaniesSection
                    companies={companies}
                    filters={exploreFilters}
                    onFiltersChange={setExploreFilters}
                    compareSelection={compareSelection}
                    onAddToCompare={handleAddToCompare}
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
