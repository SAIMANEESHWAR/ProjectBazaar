import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import { knownForLabelToDimension } from '../../../lib/companyCompareData';
import { DEFAULT_EXPLORE_FILTERS, type ExploreFilters, type RatingDimensionKey } from '../../../types/companyCompare';

const COLLECTION_DATA = [
    {
        id: 'industries',
        title: 'By Industries',
        icon: 'https://static.ambitionbox.com/static/loc/industries.png',
        bgGradient: 'linear-gradient(307.95deg, rgb(210, 237, 255) 6.42%, rgb(255, 255, 255) 88.28%)',
        items: [
            { name: 'IT Services & Consulting' },
            { name: 'Engineering & Construction' },
            { name: 'Auto Components' },
        ],
        footerLabel: 'View all industries',
        filterType: 'industry' as const,
    },
    {
        id: 'locations',
        title: 'By Locations',
        icon: 'https://static.ambitionbox.com/static/loc/locations-pin.png',
        bgGradient: 'linear-gradient(140.21deg, rgb(255, 255, 255) 18.41%, rgb(255, 234, 226) 116.28%)',
        items: [{ name: 'Bengaluru' }, { name: 'Mumbai' }, { name: 'New Delhi' }],
        footerLabel: 'View all locations',
        filterType: 'location' as const,
    },
    {
        id: 'designations',
        title: 'By Designation',
        icon: 'https://static.ambitionbox.com/static/loc/user.png',
        bgGradient: 'linear-gradient(307.95deg, rgb(234, 255, 255) 6.42%, rgb(255, 255, 255) 88.28%)',
        items: [
            { name: 'Software Engineer' },
            { name: 'System Engineer' },
            { name: 'IT Analyst' },
        ],
        footerLabel: 'View all designations',
        filterType: 'role' as const,
    },
    {
        id: 'knownfor',
        title: 'Known For',
        icon: 'https://static.ambitionbox.com/static/loc/others.png',
        bgGradient: 'linear-gradient(321.03deg, rgb(255, 248, 224) 5.11%, rgb(255, 255, 255) 99.28%)',
        items: [
            { name: 'Job Security' },
            { name: 'Work Satisfaction' },
            { name: 'Skill Development' },
        ],
        footerLabel: 'View all categories',
        filterType: 'knownFor' as const,
    },
] as const;

interface CollectionCardProps {
    title: string;
    icon: string;
    bgGradient: string;
    items: ReadonlyArray<{ name: string }>;
    footerLabel: string;
    onSelect: (value: string, filterType: (typeof COLLECTION_DATA)[number]['filterType']) => void;
    filterType: (typeof COLLECTION_DATA)[number]['filterType'];
}

const CollectionCard: React.FC<CollectionCardProps> = ({
    title,
    icon,
    bgGradient,
    items,
    footerLabel,
    onSelect,
    filterType,
}) => (
    <motion.div
        whileHover={{ y: -4 }}
        className="flex flex-col w-[237px] h-[244px] bg-white rounded-xl overflow-hidden shadow-sm"
    >
        <div
            className="flex justify-between items-start p-4 border-b border-[#EBF0F6]"
            style={{ background: bgGradient }}
        >
            <span className="text-[14px] leading-[20px] font-semibold text-[#1E223C]">{title}</span>
            <img src={icon} alt={title} width={40} height={40} className="mt-[-4px] mr-[-4px]" />
        </div>

        <div className="flex flex-col gap-0 px-4 py-2 flex-grow">
            {items.map((item, index) => (
                <button
                    key={item.name + index}
                    type="button"
                    onClick={() => onSelect(item.name, filterType)}
                    className={cn(
                        'flex justify-between items-center h-[32px] group w-full text-left',
                        index !== items.length - 1 && 'border-b border-[#EBF0F6]'
                    )}
                >
                    <span className="text-[12px] leading-[16px] text-[#1E223C] truncate max-w-[180px]">
                        {item.name}
                    </span>
                    <img
                        src="https://static.ambitionbox.com/static/loc/arrow-right-ios.png"
                        alt=""
                        className="w-3 h-3 transition-transform group-hover:translate-x-1"
                    />
                </button>
            ))}
        </div>

        <button
            type="button"
            onClick={() => onSelect('', filterType)}
            className="bg-[#FAFCFF] border-t border-[#EBF0F6] h-[48px] px-4 flex items-center cursor-pointer hover:bg-[#F0F5FF] transition-colors w-full text-left"
        >
            <span className="text-[12px] font-semibold text-[#5670FB]">{footerLabel}</span>
        </button>
    </motion.div>
);

export interface CompareExploreHeroProps {
    filters: ExploreFilters;
    onFiltersChange: (filters: ExploreFilters) => void;
}

export const CompareExploreHero: React.FC<CompareExploreHeroProps> = ({ filters, onFiltersChange }) => {
    const handleSelect = (value: string, filterType: (typeof COLLECTION_DATA)[number]['filterType']) => {
        if (!value) {
            // "View all ..." should open the full list without restrictive chips.
            onFiltersChange(DEFAULT_EXPLORE_FILTERS);
            return;
        }

        const patch: Partial<ExploreFilters> = {};
        if (filterType === 'industry') patch.industry = value;
        if (filterType === 'location') patch.location = value;
        if (filterType === 'role') patch.role = value;
        if (filterType === 'knownFor') {
            patch.knownFor = knownForLabelToDimension(value) as RatingDimensionKey | null;
        }

        // Start from a clean state so hero selections don't stack into zero-result filters.
        onFiltersChange({ ...DEFAULT_EXPLORE_FILTERS, ...patch, search: '' });
    };

    return (
        <div className="w-full my-6 px-2 sm:px-4">
            <div className="relative flex flex-col items-center justify-start rounded-[20px] pt-5 px-5 pb-8 overflow-hidden min-h-[460px] bg-[#1a2768] max-w-[1024px] mx-auto">
                <img
                    src="https://static.ambitionbox.com/static/loc/monument-with-bg.png"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
                />
                <div className="absolute inset-0 bg-[#1a2768]/30 pointer-events-none" aria-hidden />
                <div className="flex flex-col items-center text-center z-10">
                    <div className="w-16 h-16 mb-[-4px]">
                        <img
                            src="https://static.ambitionbox.com/static/loc/generic/india.png"
                            alt="India"
                            width={64}
                            height={64}
                        />
                    </div>

                    <div className="flex flex-col items-center">
                        <h2 className="text-[20px] leading-[26px] font-bold text-white mb-0">Top Companies in</h2>
                        <div className="flex items-center gap-3">
                            <img
                                src="https://static.ambitionbox.com/static/loc/loc-star.png"
                                width={12}
                                height={12}
                                alt=""
                            />
                            <h1 className="text-[48px] leading-[56px] font-black text-white tracking-tight uppercase">
                                INDIA
                            </h1>
                            <img
                                src="https://static.ambitionbox.com/static/loc/loc-star.png"
                                width={12}
                                height={12}
                                alt=""
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-[14px] leading-[20px] text-[#E4E6EE] mt-1">
                        <span>Curated from AmbitionBox</span>
                        <img
                            src="https://static.ambitionbox.com/static/loc/information.png"
                            width={20}
                            height={20}
                            className="cursor-pointer opacity-80"
                            alt="More info"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mt-5 w-full z-10">
                    {COLLECTION_DATA.map(card => (
                        <CollectionCard
                            key={card.id}
                            title={card.title}
                            icon={card.icon}
                            bgGradient={card.bgGradient}
                            items={card.items}
                            footerLabel={card.footerLabel}
                            filterType={card.filterType}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>

                <img
                    src="https://static.ambitionbox.com/static/loc/loc-wave.png"
                    className="absolute bottom-0 left-0 w-full min-h-[48px] object-cover object-bottom pointer-events-none z-[1]"
                    alt=""
                />
            </div>
        </div>
    );
};
