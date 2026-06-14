import * as React from 'react';
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BrowseFilterKind, ExplorerSelectPayload } from './explorerTypes';
import type { PostCategory } from '../../types/companyPosts';

const DC_BANNER_SRC = '/company-posts/dc-banner.png';

const FILTER_CHIPS: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    showChevron?: boolean;
    action:
        | { type: 'browse'; kind: BrowseFilterKind; value?: string; title: string }
        | { type: 'category'; category: PostCategory; title: string };
}> = [
    {
        id: 'experience',
        label: 'Experience',
        showChevron: true,
        action: { type: 'category', category: 'interview-experience', title: 'Interview experiences' },
    },
    {
        id: 'remote',
        label: 'Remote',
        action: { type: 'category', category: 'career-discussion', title: 'Remote work' },
    },
    {
        id: 'location',
        label: 'Location',
        showChevron: true,
        action: { type: 'browse', kind: 'location', title: 'Locations' },
    },
    {
        id: 'metro',
        label: 'Metro cities',
        action: { type: 'browse', kind: 'location', value: 'Bengaluru', title: 'Bengaluru' },
    },
    {
        id: 'salary',
        label: 'Salary',
        icon: <span className="text-emerald-600 text-sm leading-none">₹</span>,
        showChevron: true,
        action: { type: 'category', category: 'salary-compensation', title: 'Salary & compensation' },
    },
    {
        id: 'industry',
        label: 'Industry',
        showChevron: true,
        action: { type: 'browse', kind: 'industry', title: 'Industries' },
    },
    {
        id: 'rating',
        label: 'Rating',
        showChevron: true,
        action: { type: 'category', category: 'company-feedback', title: 'Company feedback' },
    },
    {
        id: 'known-for',
        label: 'Known For',
        showChevron: true,
        action: { type: 'browse', kind: 'known-for', title: 'Known for' },
    },
];

export interface CompanyPostsExploreHeaderProps {
    onSelect: (payload: ExplorerSelectPayload) => void;
    onViewAllPosts: () => void;
    onSearch: (query: string) => void;
    onCategorySelect: (category: PostCategory, title: string) => void;
    onAddPost?: () => void;
    searchPlaceholder?: string;
    allFiltersLabel?: string;
}

export const CompanyPostsExploreHeader: React.FC<CompanyPostsExploreHeaderProps> = ({
    onSelect,
    onViewAllPosts,
    onSearch,
    onCategorySelect,
    onAddPost,
    searchPlaceholder = 'Search designation / job profile',
    allFiltersLabel = 'All Filters',
}) => {
    const [searchDraft, setSearchDraft] = React.useState('');
    const chipsRef = React.useRef<HTMLDivElement>(null);

    const handleChipClick = (chip: (typeof FILTER_CHIPS)[number]) => {
        const { action } = chip;
        if (action.type === 'category') {
            onCategorySelect(action.category, action.title);
            return;
        }
        if (action.type === 'browse') {
            onSelect({
                kind: action.kind,
                value: action.value ?? '',
                title: action.value || action.title,
                subtitle: chip.label,
            });
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchDraft.trim();
        if (!q) return;
        onSearch(q);
    };

    const scrollFilters = () => {
        chipsRef.current?.scrollBy({ left: 180, behavior: 'smooth' });
    };

    return (
        <header className="w-full max-w-[1024px] mx-auto px-2 sm:px-4 pt-4 pb-5">
            <div className="relative flex flex-col items-center mb-6">
                {onAddPost && (
                    <button
                        type="button"
                        onClick={onAddPost}
                        className="absolute right-0 top-0 inline-flex items-center gap-1.5 rounded-lg bg-[#1E223C] text-white text-xs font-semibold px-3 py-2 hover:bg-[#2a3050] transition-colors"
                    >
                        Add Post
                    </button>
                )}
                <img
                    src={DC_BANNER_SRC}
                    alt="Dream Company explorer"
                    className="h-[72px] sm:h-[88px] w-auto max-w-full object-contain"
                />
            </div>

            <form onSubmit={handleSearchSubmit} className="relative mb-5 max-w-[720px] mx-auto">
                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                    type="search"
                    value={searchDraft}
                    onChange={e => setSearchDraft(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-[46px] pl-11 pr-4 rounded-full border border-[#D6DFEA] bg-white text-sm text-[#1E223C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5670FB]/25 focus:border-[#5670FB]/35"
                    autoComplete="off"
                />
            </form>

            <div className="relative flex items-center gap-2">
                <button
                    type="button"
                    onClick={onViewAllPosts}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[#5670FB] hover:text-[#4358d9] transition-colors pl-0.5"
                >
                    <SlidersHorizontal size={15} className="text-[#5670FB]" />
                    <span>{allFiltersLabel}</span>
                </button>

                <div
                    ref={chipsRef}
                    className="flex flex-1 overflow-x-auto gap-2 pb-0.5 scrollbar-hide min-w-0"
                >
                    {FILTER_CHIPS.map(chip => (
                        <button
                            key={chip.id}
                            type="button"
                            onClick={() => handleChipClick(chip)}
                            className={cn(
                                'inline-flex flex-shrink-0 items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#D6DFEA] bg-white text-[13px] font-medium text-[#1E223C] hover:border-[#5670FB]/35 hover:bg-[#FAFCFF] transition-colors',
                            )}
                        >
                            {chip.icon}
                            <span className="whitespace-nowrap">{chip.label}</span>
                            {chip.showChevron && <ChevronDown size={14} className="text-gray-400" />}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={scrollFilters}
                    aria-label="Scroll filters"
                    className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#EBF0F6] bg-white shadow-sm hover:bg-[#FAFCFF] transition-colors"
                >
                    <ChevronRight size={18} className="text-[#1E223C]" />
                </button>
            </div>
        </header>
    );
};

export default CompanyPostsExploreHeader;
