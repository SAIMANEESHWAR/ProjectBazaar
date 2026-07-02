import * as React from 'react';
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ExploreFilters, RatingDimensionKey } from '../../../types/companyCompare';
import { DEFAULT_EXPLORE_FILTERS } from '../../../types/companyCompare';

const FILTER_CHIPS: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    showChevron?: boolean;
    apply: (filters: ExploreFilters) => Partial<ExploreFilters>;
}> = [
    {
        id: 'rating',
        label: 'Rating 3.5+',
        showChevron: true,
        apply: () => ({ minRating: 3.5 }),
    },
    {
        id: 'location',
        label: 'Mumbai',
        apply: () => ({ location: 'Mumbai' }),
    },
    {
        id: 'metro',
        label: 'Bengaluru',
        apply: () => ({ location: 'Bengaluru' }),
    },
    {
        id: 'role',
        label: 'Software Engineer',
        apply: () => ({ role: 'Software Engineer' }),
    },
    {
        id: 'industry',
        label: 'IT Services',
        showChevron: true,
        apply: () => ({ industry: 'IT Services & Consulting' }),
    },
    {
        id: 'known-for',
        label: 'Job Security',
        showChevron: true,
        apply: () => ({ knownFor: 'job_security' as RatingDimensionKey }),
    },
];

export interface CompareFilterBarProps {
    filters: ExploreFilters;
    onFiltersChange: (filters: ExploreFilters) => void;
}

export const CompareFilterBar: React.FC<CompareFilterBarProps> = ({ filters, onFiltersChange }) => {
    const [searchDraft, setSearchDraft] = React.useState(filters.search);
    const chipsRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setSearchDraft(filters.search);
    }, [filters.search]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFiltersChange({ ...filters, search: searchDraft.trim() });
    };

    const handleClearFilters = () => {
        onFiltersChange(DEFAULT_EXPLORE_FILTERS);
        setSearchDraft('');
    };

    const scrollFilters = () => {
        chipsRef.current?.scrollBy({ left: 180, behavior: 'smooth' });
    };

    const isChipActive = (chip: (typeof FILTER_CHIPS)[number]): boolean => {
        const patch = chip.apply(filters);
        return Object.entries(patch).every(([key, value]) => {
            const k = key as keyof ExploreFilters;
            return filters[k] === value;
        });
    };

    const handleChipClick = (chip: (typeof FILTER_CHIPS)[number]) => {
        if (isChipActive(chip)) {
            onFiltersChange(DEFAULT_EXPLORE_FILTERS);
            setSearchDraft('');
            return;
        }
        onFiltersChange({ ...DEFAULT_EXPLORE_FILTERS, ...chip.apply(filters), search: '' });
        setSearchDraft('');
    };

    return (
        <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4 mb-4">
            <form onSubmit={handleSearchSubmit} className="relative mb-5 max-w-[720px] mx-auto">
                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                    type="search"
                    value={searchDraft}
                    onChange={e => setSearchDraft(e.target.value)}
                    placeholder="Search designation / company / industry"
                    className="w-full h-[46px] pl-11 pr-4 rounded-full border border-[#D6DFEA] bg-white text-sm text-[#1E223C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5670FB]/25 focus:border-[#5670FB]/35"
                    autoComplete="off"
                />
            </form>

            <div className="relative flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[#5670FB] hover:text-[#4358d9] transition-colors pl-0.5"
                >
                    <SlidersHorizontal size={15} className="text-[#5670FB]" />
                    <span>All Filters</span>
                </button>

                <div
                    ref={chipsRef}
                    className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide py-1"
                >
                    {FILTER_CHIPS.map(chip => (
                        <button
                            key={chip.id}
                            type="button"
                            onClick={() => handleChipClick(chip)}
                            className={cn(
                                'inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                                isChipActive(chip)
                                    ? 'border-[#5670FB] bg-[#5670FB] text-white'
                                    : 'border-[#EBF0F6] bg-white text-[#1E223C] hover:border-[#5670FB]/30'
                            )}
                        >
                            {chip.icon}
                            <span>{chip.label}</span>
                            {chip.showChevron && <ChevronDown size={13} className="opacity-70" />}
                        </button>
                    ))}
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
