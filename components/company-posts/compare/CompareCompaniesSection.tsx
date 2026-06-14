import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CompanyCompare } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';
import { CompareMatrix } from './CompareMatrix';
import { CompareSidebarWidget } from './CompareSidebarWidget';
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
}

const CompanyPicker: React.FC<CompanyPickerProps> = ({ companies, selected, otherSelectedId, onSelect, side }) => {
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
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={containerRef} className="relative flex-1">
            {selected ? (
                <div className="relative rounded-xl border border-[#EBF0F6] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <CompanyAvatar name={selected.identity.name} logoUrl={selected.logoUrl} size="lg" />
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#1E223C]">{selected.identity.name}</p>
                            <StarRating value={selected.ratings.overall_rating} size="sm" />
                            <p className="mt-1 text-xs text-gray-500 truncate">{selected.identity.industry}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onSelect(null)}
                        className="absolute -right-2 -top-2 rounded-full border border-[#EBF0F6] bg-white p-1 text-gray-400 shadow-sm hover:text-gray-600"
                        aria-label={`Remove ${selected.identity.name}`}
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    className={cn(
                        'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition min-h-[120px]',
                        side === 'left'
                            ? 'border-[#5670FB]/40 bg-[#5670FB]/5 hover:border-[#5670FB]'
                            : 'border-emerald-400/40 bg-emerald-50/50 hover:border-emerald-500'
                    )}
                >
                    <span className="text-sm font-medium text-gray-500">Choose company</span>
                    <ChevronDown size={16} className={cn('mt-1 text-gray-400 transition', open && 'rotate-180')} />
                </button>
            )}

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

    const setSlot = (index: 0 | 1, company: CompanyCompare | null) => {
        const next: [CompanyCompare | null, CompanyCompare | null] = [...selection];
        next[index] = company;
        onSelectionChange(next);
    };

    const bothSelected = left && right;

    return (
        <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4 pb-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-[#1E223C]">Compare companies side by side</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Pick two companies to compare ratings, salaries, benefits, and more.
                </p>
            </div>

            <div className="mb-8 rounded-2xl border border-[#EBF0F6] bg-[#FAFCFF] p-4 sm:p-6">
                <div className="flex items-stretch gap-3 sm:gap-4">
                    <CompanyPicker
                        side="left"
                        companies={companies}
                        selected={left}
                        otherSelectedId={right?.id ?? null}
                        onSelect={company => setSlot(0, company)}
                    />
                    <div className="flex shrink-0 flex-col items-center justify-center px-1">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E223C] text-sm font-black text-white shadow-md">
                            VS
                        </span>
                    </div>
                    <CompanyPicker
                        side="right"
                        companies={companies}
                        selected={right}
                        otherSelectedId={left?.id ?? null}
                        onSelect={company => setSlot(1, company)}
                    />
                </div>
            </div>

            {bothSelected ? (
                <CompareMatrix left={left} right={right} />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                    <div className="rounded-xl border border-dashed border-[#EBF0F6] bg-white px-6 py-14 text-center">
                        <p className="text-sm font-medium text-[#1E223C]">Select two companies to see the comparison</p>
                        <p className="mt-1 text-xs text-gray-500">
                            Use the pickers above or add companies from Explore.
                        </p>
                    </div>
                    <CompareSidebarWidget selection={selection} onGoToCompare={() => {}} />
                </div>
            )}
        </div>
    );
};
