import * as React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
    buildIndustryFilterFacets,
    buildKnownForFilterFacets,
    buildLocationFilterFacets,
    buildRatingFilterFacets,
    buildRoleFilterFacets,
    countActiveExploreFilters,
    formatFilterCount,
} from '../../../lib/companyCompareData';
import type { CompanyCompare, ExploreFilters } from '../../../types/companyCompare';
import { DEFAULT_EXPLORE_FILTERS, RATING_DIMENSIONS } from '../../../types/companyCompare';

type FilterMenuId = 'rating' | 'location' | 'role' | 'industry' | 'knownFor';

interface FilterMenuProps {
    title: string;
    open: boolean;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLButtonElement | null>;
    children: React.ReactNode;
    className?: string;
}

const FilterMenu: React.FC<FilterMenuProps> = ({ title, open, onClose, anchorRef, children, className }) => {
    const menuRef = React.useRef<HTMLDivElement>(null);
    const [coords, setCoords] = React.useState({ top: 0, left: 0 });

    const updatePosition = React.useCallback(() => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const menuWidth = className?.includes('w-[300px]') ? 300 : 280;
        const maxLeft = Math.max(8, window.innerWidth - menuWidth - 8);
        setCoords({
            top: rect.bottom + 8,
            left: Math.min(rect.left, maxLeft),
        });
    }, [anchorRef, className]);

    React.useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open, updatePosition]);

    React.useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (menuRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
            onClose();
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose, anchorRef]);

    if (!open) return null;

    return createPortal(
        <div
            ref={menuRef}
            style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 100 }}
            className={cn(
                'w-[280px] overflow-hidden rounded-xl border border-[#EBF0F6] bg-white shadow-lg',
                className,
            )}
        >
            <div className="border-b border-[#EBF0F6] px-4 py-3">
                <p className="text-sm font-bold text-[#1E223C]">{title}</p>
            </div>
            {children}
        </div>,
        document.body,
    );
};

interface SearchableOptionsProps {
    options: Array<{ value: string; count: number }>;
    query: string;
    onQueryChange: (value: string) => void;
    selected: string | null;
    onSelect: (value: string) => void;
    searchPlaceholder: string;
    emptyLabel?: string;
}

const SearchableOptions: React.FC<SearchableOptionsProps> = ({
    options,
    query,
    onQueryChange,
    selected,
    onSelect,
    searchPlaceholder,
    emptyLabel = 'No results found',
}) => {
    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(o => o.value.toLowerCase().includes(q));
    }, [options, query]);

    return (
        <>
            <div className="border-b border-[#EBF0F6] p-2">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={e => onQueryChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full rounded-lg border border-[#EBF0F6] py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5670FB]/20"
                        autoFocus
                    />
                </div>
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
                {filtered.map(option => (
                    <li key={option.value}>
                        <button
                            type="button"
                            onClick={() => onSelect(option.value)}
                            className={cn(
                                'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#FAFCFF]',
                                selected === option.value && 'bg-[#EEF4FF]',
                            )}
                        >
                            <span className="min-w-0 flex-1 truncate font-medium text-[#1E223C]">{option.value}</span>
                            <span className="text-xs text-gray-400">({formatFilterCount(option.count)})</span>
                        </button>
                    </li>
                ))}
                {filtered.length === 0 && (
                    <li className="px-4 py-6 text-center text-xs text-gray-400">{emptyLabel}</li>
                )}
            </ul>
        </>
    );
};

export interface CompareFilterBarProps {
    companies: CompanyCompare[];
    filters: ExploreFilters;
    onFiltersChange: (filters: ExploreFilters) => void;
}

export const CompareFilterBar: React.FC<CompareFilterBarProps> = ({ companies, filters, onFiltersChange }) => {
    const [openMenu, setOpenMenu] = React.useState<FilterMenuId | null>(null);
    const [industryQuery, setIndustryQuery] = React.useState('');
    const [locationQuery, setLocationQuery] = React.useState('');
    const [roleQuery, setRoleQuery] = React.useState('');
    const chipsRef = React.useRef<HTMLDivElement>(null);

    const ratingBtnRef = React.useRef<HTMLButtonElement>(null);
    const locationBtnRef = React.useRef<HTMLButtonElement>(null);
    const roleBtnRef = React.useRef<HTMLButtonElement>(null);
    const industryBtnRef = React.useRef<HTMLButtonElement>(null);
    const knownForBtnRef = React.useRef<HTMLButtonElement>(null);

    const ratingFacets = React.useMemo(() => buildRatingFilterFacets(companies), [companies]);
    const industryFacets = React.useMemo(() => buildIndustryFilterFacets(companies), [companies]);
    const locationFacets = React.useMemo(() => buildLocationFilterFacets(companies), [companies]);
    const roleFacets = React.useMemo(() => buildRoleFilterFacets(companies), [companies]);
    const knownForFacets = React.useMemo(() => buildKnownForFilterFacets(companies), [companies]);
    const activeFilterCount = countActiveExploreFilters(filters);

    const handleClearFilters = () => {
        onFiltersChange(DEFAULT_EXPLORE_FILTERS);
        setOpenMenu(null);
        setIndustryQuery('');
        setLocationQuery('');
        setRoleQuery('');
    };

    const scrollFilters = () => {
        chipsRef.current?.scrollBy({ left: 180, behavior: 'smooth' });
    };

    const applyPatch = (patch: Partial<ExploreFilters>) => {
        onFiltersChange({ ...DEFAULT_EXPLORE_FILTERS, ...filters, ...patch, search: '' });
        setOpenMenu(null);
    };

    const toggleMenu = (id: FilterMenuId) => {
        setOpenMenu(prev => (prev === id ? null : id));
    };

    const knownForLabel =
        filters.knownFor != null
            ? RATING_DIMENSIONS.find(d => d.key === filters.knownFor)?.label ?? 'Known For'
            : 'Known For';

    const ratingLabel =
        filters.minRating != null ? `Rating ${filters.minRating}+` : 'Rating';

    return (
        <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4">
            <div className="relative flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[#5670FB] hover:text-[#4358d9] transition-colors pl-0.5"
                >
                    <SlidersHorizontal size={15} className="text-[#5670FB]" />
                    <span>All Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
                </button>

                <div
                    ref={chipsRef}
                    className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide py-1"
                >
                    <div className="relative flex-shrink-0">
                        <button
                            ref={ratingBtnRef}
                            type="button"
                            onClick={() => toggleMenu('rating')}
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                                filters.minRating != null
                                    ? 'border-[#5670FB]/35 bg-[#EEF4FF] text-[#5670FB] font-semibold'
                                    : 'border-[#EBF0F6] bg-white text-[#1E223C] hover:border-[#5670FB]/30',
                            )}
                        >
                            <span>{ratingLabel}</span>
                            <ChevronDown size={13} className="opacity-70" />
                        </button>
                        <FilterMenu
                            title="Rating"
                            open={openMenu === 'rating'}
                            onClose={() => setOpenMenu(null)}
                            anchorRef={ratingBtnRef}
                        >
                            <ul className="py-1">
                                {ratingFacets.map(({ threshold, count }) => (
                                    <li key={threshold}>
                                        <button
                                            type="button"
                                            onClick={() => applyPatch({ minRating: threshold })}
                                            className={cn(
                                                'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#FAFCFF]',
                                                filters.minRating === threshold && 'bg-[#EEF4FF]',
                                            )}
                                        >
                                            <span className="font-medium text-[#1E223C]">Rating {threshold}+</span>
                                            <span className="text-xs text-gray-400">({formatFilterCount(count)})</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </FilterMenu>
                    </div>

                    {locationFacets.length > 0 && (
                    <div className="relative flex-shrink-0">
                        <button
                            ref={locationBtnRef}
                            type="button"
                            onClick={() => toggleMenu('location')}
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                                filters.location
                                    ? 'border-[#5670FB]/35 bg-[#EEF4FF] text-[#5670FB] font-semibold'
                                    : 'border-[#EBF0F6] bg-white text-[#1E223C] hover:border-[#5670FB]/30',
                            )}
                        >
                            <span className="max-w-[140px] truncate">{filters.location ?? 'Location'}</span>
                            <ChevronDown size={13} className="opacity-70" />
                        </button>
                        <FilterMenu
                            title="Location"
                            open={openMenu === 'location'}
                            onClose={() => setOpenMenu(null)}
                            anchorRef={locationBtnRef}
                            className="w-[300px]"
                        >
                            <SearchableOptions
                                options={locationFacets}
                                query={locationQuery}
                                onQueryChange={setLocationQuery}
                                selected={filters.location}
                                onSelect={value => applyPatch({ location: value })}
                                searchPlaceholder="Search locations"
                            />
                        </FilterMenu>
                    </div>
                    )}

                    {roleFacets.length > 0 && (
                    <div className="relative flex-shrink-0">
                        <button
                            ref={roleBtnRef}
                            type="button"
                            onClick={() => toggleMenu('role')}
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                                filters.role
                                    ? 'border-[#5670FB]/35 bg-[#EEF4FF] text-[#5670FB] font-semibold'
                                    : 'border-[#EBF0F6] bg-white text-[#1E223C] hover:border-[#5670FB]/30',
                            )}
                        >
                            <span className="max-w-[140px] truncate">{filters.role ?? 'Designation'}</span>
                            <ChevronDown size={13} className="opacity-70" />
                        </button>
                        <FilterMenu
                            title="Designation"
                            open={openMenu === 'role'}
                            onClose={() => setOpenMenu(null)}
                            anchorRef={roleBtnRef}
                            className="w-[300px]"
                        >
                            <SearchableOptions
                                options={roleFacets}
                                query={roleQuery}
                                onQueryChange={setRoleQuery}
                                selected={filters.role}
                                onSelect={value => applyPatch({ role: value })}
                                searchPlaceholder="Search designations"
                                emptyLabel="No designations found"
                            />
                        </FilterMenu>
                    </div>
                    )}

                    {industryFacets.length > 0 && (
                    <div className="relative flex-shrink-0">
                        <button
                            ref={industryBtnRef}
                            type="button"
                            onClick={() => toggleMenu('industry')}
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                                filters.industry
                                    ? 'border-[#5670FB]/35 bg-[#EEF4FF] text-[#5670FB] font-semibold'
                                    : 'border-[#EBF0F6] bg-white text-[#1E223C] hover:border-[#5670FB]/30',
                            )}
                        >
                            <span className="max-w-[140px] truncate">{filters.industry ?? 'Industry'}</span>
                            <ChevronDown size={13} className="opacity-70" />
                        </button>
                        <FilterMenu
                            title="Industry"
                            open={openMenu === 'industry'}
                            onClose={() => setOpenMenu(null)}
                            anchorRef={industryBtnRef}
                            className="w-[300px]"
                        >
                            <SearchableOptions
                                options={industryFacets}
                                query={industryQuery}
                                onQueryChange={setIndustryQuery}
                                selected={filters.industry}
                                onSelect={value => applyPatch({ industry: value })}
                                searchPlaceholder="Search industries"
                                emptyLabel="No industries found"
                            />
                        </FilterMenu>
                    </div>
                    )}

                    <div className="relative flex-shrink-0">
                        <button
                            ref={knownForBtnRef}
                            type="button"
                            onClick={() => toggleMenu('knownFor')}
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                                filters.knownFor
                                    ? 'border-[#5670FB]/35 bg-[#EEF4FF] text-[#5670FB] font-semibold'
                                    : 'border-[#EBF0F6] bg-white text-[#1E223C] hover:border-[#5670FB]/30',
                            )}
                        >
                            <span className="max-w-[140px] truncate">{knownForLabel}</span>
                            <ChevronDown size={13} className="opacity-70" />
                        </button>
                        <FilterMenu
                            title="Known For"
                            open={openMenu === 'knownFor'}
                            onClose={() => setOpenMenu(null)}
                            anchorRef={knownForBtnRef}
                        >
                            <ul className="py-1">
                                {knownForFacets.map(({ key, label, count }) => (
                                    <li key={key}>
                                        <button
                                            type="button"
                                            onClick={() => applyPatch({ knownFor: key })}
                                            className={cn(
                                                'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#FAFCFF]',
                                                filters.knownFor === key && 'bg-[#EEF4FF]',
                                            )}
                                        >
                                            <span className="font-medium text-[#1E223C]">{label}</span>
                                            <span className="text-xs text-gray-400">({formatFilterCount(count)})</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </FilterMenu>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={scrollFilters}
                    className="flex-shrink-0 rounded-full border border-[#EBF0F6] bg-white p-1.5 text-[#5670FB] hover:bg-[#FAFCFF]"
                    aria-label="Scroll filters"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
