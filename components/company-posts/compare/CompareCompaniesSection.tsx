import * as React from 'react';
import { ChevronDown, CirclePlus, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CompanyCompare } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';
import { CompareMatrix } from './CompareMatrix';
import { StarRating } from './RatingBars';

export interface CompareCompaniesSectionProps {
    companies: CompanyCompare[];
    selection: [CompanyCompare | null, CompanyCompare | null];
    onSelectionChange: (selection: [CompanyCompare | null, CompanyCompare | null]) => void;
}

interface CompanyPickerProps {
    companies: CompanyCompare[];
    selected: CompanyCompare | null;
    otherSelectedId: string | null;
    onSelect: (company: CompanyCompare | null) => void;
    side: 'left' | 'right';
    placeholder: string;
    disabled?: boolean;
}

const CompanyPicker: React.FC<CompanyPickerProps> = ({
    companies,
    selected,
    otherSelectedId,
    onSelect,
    side,
    placeholder,
    disabled = false,
}) => {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const options = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        return companies.filter(c => {
            if (c.id === otherSelectedId) return false;
            if (!q) return true;
            return c.identity.name.toLowerCase().includes(q);
        });
    }, [companies, otherSelectedId, query]);

    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={containerRef} className="relative flex-1">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(v => (disabled ? false : !v))}
                className={cn(
                    'flex h-[60px] w-full items-center gap-3 rounded-full border border-white/30 bg-white px-5 text-left shadow-[0px_2px_6px_rgba(0,106,194,0.2)] transition',
                    'hover:shadow-[0px_4px_12px_rgba(0,106,194,0.3)]',
                    disabled && 'cursor-not-allowed opacity-60 hover:shadow-[0px_2px_6px_rgba(0,106,194,0.2)]',
                )}
            >
                {selected ? (
                    <>
                        <CompanyAvatar name={selected.identity.name} logoUrl={selected.logoUrl} size="sm" className="rounded-lg" />
                        <span className="min-w-0 flex-1 truncate text-base font-medium text-[#1E223C]">
                            {selected.identity.name}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <X
                                size={16}
                                className="text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(null);
                                }}
                            />
                            <ChevronDown size={16} className={cn('text-gray-400 transition', open && 'rotate-180')} />
                        </span>
                    </>
                ) : (
                    <>
                        <CirclePlus size={22} className={cn(side === 'left' ? 'text-[#5670FB]' : 'text-emerald-600')} />
                        <span className="min-w-0 flex-1 truncate text-xl font-medium text-[#1E223C]/70">
                            {placeholder}
                        </span>
                        <ChevronDown size={16} className={cn('text-gray-400 transition', open && 'rotate-180')} />
                    </>
                )}
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-[#EBF0F6] bg-white shadow-lg">
                    <div className="border-b border-[#EBF0F6] p-2">
                        <input
                            type="search"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search companies"
                            className="w-full rounded-lg border border-[#EBF0F6] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5670FB]/20"
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-56 overflow-y-auto py-1">
                        {options.map(company => (
                            <li key={company.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelect(company);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#FAFCFF]"
                                >
                                    <CompanyAvatar name={company.identity.name} logoUrl={company.logoUrl} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[#1E223C]">
                                            {company.identity.name}
                                        </p>
                                        <StarRating value={company.ratings.overall_rating} size="sm" />
                                    </div>
                                </button>
                            </li>
                        ))}
                        {options.length === 0 && (
                            <li className="px-3 py-4 text-center text-xs text-gray-400">No companies found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const CompareCompaniesSection: React.FC<CompareCompaniesSectionProps> = ({
    companies,
    selection,
    onSelectionChange,
}) => {
    const [left, right] = selection;
    const [showAllPopular, setShowAllPopular] = React.useState(false);

    const setSlot = (index: 0 | 1, company: CompanyCompare | null) => {
        const next: [CompanyCompare | null, CompanyCompare | null] = [...selection];
        next[index] = company;
        onSelectionChange(next);
    };

    const bothSelected = left && right;
    const popularPairs = React.useMemo(() => {
        const sorted = [...companies]
            .sort((a, b) => (b.ratings.overall_rating || 0) - (a.ratings.overall_rating || 0))
            .slice(0, 40);
        const pairs: Array<[CompanyCompare, CompanyCompare]> = [];
        for (let i = 0; i < sorted.length - 1; i += 2) {
            pairs.push([sorted[i], sorted[i + 1]]);
        }
        return pairs;
    }, [companies]);
    const visiblePopularPairs = showAllPopular ? popularPairs : popularPairs.slice(0, 6);

    return (
        <div className="w-full pb-8">
            <div
                className="relative mx-auto mb-8 flex min-h-[420px] w-full max-w-[1024px] flex-col items-center justify-center overflow-visible rounded-[20px] px-4 py-10 md:py-14"
                style={{
                    backgroundImage:
                        'linear-gradient(to bottom, #5570ff, #273aa4), url(https://static.ambitionbox.com/static/compare-bg_web.svg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="relative z-10 w-full max-w-4xl">
                    <div className="mb-8 text-center">
                        <h2 className="mx-auto max-w-[640px] text-3xl font-bold leading-tight text-white md:text-5xl">
                            Compare companies to find the best workplace
                        </h2>
                        <p className="mt-3 text-lg font-medium text-white/90">
                            Because you deserve better <span role="img" aria-label="smiley">😀</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
                        <CompanyPicker
                            side="left"
                            companies={companies}
                            selected={left}
                            otherSelectedId={right?.id ?? null}
                            onSelect={company => setSlot(0, company)}
                            placeholder="Add first company"
                        />
                        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-lg font-bold text-white md:border-none md:bg-transparent md:p-0">
                            VS
                        </span>
                        <CompanyPicker
                            side="right"
                            companies={companies}
                            selected={right}
                            otherSelectedId={left?.id ?? null}
                            onSelect={company => setSlot(1, company)}
                            placeholder="Add second company"
                            disabled={!left}
                        />
                    </div>
                </div>

                <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-blue-300/20 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-blue-900/40 blur-[100px]" />
            </div>

            <div className="mx-auto mb-8 w-full max-w-[1024px] px-2 sm:px-4">
                <h3 className="mb-4 text-2xl font-bold text-[#1E223C]">Popular comparisons</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visiblePopularPairs.map(([a, b]) => (
                        <button
                            type="button"
                            key={`${a.id}-${b.id}`}
                            onClick={() => onSelectionChange([a, b])}
                            className="rounded-xl border border-[#EBF0F6] bg-white p-4 text-left transition hover:shadow-sm"
                        >
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <div className="flex flex-col items-center gap-1">
                                    <CompanyAvatar name={a.identity.name} logoUrl={a.logoUrl} size="lg" />
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="text-[#68B300]">★</span>
                                        <span>{a.ratings.overall_rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-[#1E223C]">{a.identity.name}</span>
                                </div>
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500">VS</span>
                                <div className="flex flex-col items-center gap-1">
                                    <CompanyAvatar name={b.identity.name} logoUrl={b.logoUrl} size="lg" />
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="text-[#68B300]">★</span>
                                        <span>{b.ratings.overall_rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-[#1E223C]">{b.identity.name}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                {popularPairs.length > 6 && (
                    <div className="mt-5 flex justify-center">
                        <button
                            type="button"
                            onClick={() => setShowAllPopular((prev) => !prev)}
                            className="rounded-full border border-[#5670FB]/40 px-5 py-2 text-sm font-semibold text-[#5670FB] transition hover:bg-[#EEF4FF]"
                        >
                            {showAllPopular ? 'View less' : 'View more'}
                        </button>
                    </div>
                )}
            </div>

            {bothSelected ? (
                <div className="mx-auto w-full max-w-[1024px] px-2 sm:px-4">
                    <CompareMatrix left={left} right={right} />
                </div>
            ) : (
                <div className="mx-auto w-full max-w-[1024px] px-2 sm:px-4">
                    <div className="rounded-xl border border-dashed border-[#EBF0F6] bg-white px-6 py-14 text-center">
                        <p className="text-sm font-medium text-[#1E223C]">Select two companies to see the comparison</p>
                        <p className="mt-1 text-xs text-gray-500">
                            Use the pickers above or add companies from Explore.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
