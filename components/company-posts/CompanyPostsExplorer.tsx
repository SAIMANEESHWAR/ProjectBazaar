import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import type { PostCategory } from '../../types/companyPosts';
import { CompanyPostsExploreHeader } from './CompanyPostsExploreHeader';
import type { BrowseFilterKind, ExplorerSelectPayload } from './explorerTypes';

const COLLECTION_DATA = [
    {
        id: 'industries',
        title: 'By Industries',
        kind: 'industry' as BrowseFilterKind,
        icon: 'https://static.ambitionbox.com/static/loc/industries.png',
        bgGradient: 'linear-gradient(307.95deg, rgb(210, 237, 255) 6.42%, rgb(255, 255, 255) 88.28%)',
        items: [
            { name: 'IT Services & Consulting' },
            { name: 'Engineering & Construction' },
            { name: 'Auto Components' },
        ],
        footerLabel: 'View all industries',
    },
    {
        id: 'locations',
        title: 'By Locations',
        kind: 'location' as BrowseFilterKind,
        icon: 'https://static.ambitionbox.com/static/loc/locations-pin.png',
        bgGradient: 'linear-gradient(140.21deg, rgb(255, 255, 255) 18.41%, rgb(255, 234, 226) 116.28%)',
        items: [{ name: 'Bengaluru' }, { name: 'Mumbai' }, { name: 'New Delhi' }],
        footerLabel: 'View all locations',
    },
    {
        id: 'designations',
        title: 'By Designation',
        kind: 'role' as BrowseFilterKind,
        icon: 'https://static.ambitionbox.com/static/loc/user.png',
        bgGradient: 'linear-gradient(307.95deg, rgb(234, 255, 255) 6.42%, rgb(255, 255, 255) 88.28%)',
        items: [
            { name: 'Sales Executive' },
            { name: 'Area Sales Manager' },
            { name: 'Sales Officer' },
        ],
        footerLabel: 'View all designations',
    },
    {
        id: 'knownfor',
        title: 'Known For',
        kind: 'known-for' as BrowseFilterKind,
        icon: 'https://static.ambitionbox.com/static/loc/others.png',
        bgGradient: 'linear-gradient(321.03deg, rgb(255, 248, 224) 5.11%, rgb(255, 255, 255) 99.28%)',
        items: [
            { name: 'Job Security' },
            { name: 'Work Satisfaction' },
            { name: 'Skill Development' },
        ],
        footerLabel: 'View all categories',
    },
] as const;

const LOCATIONS_DATA = [
    {
        id: '1',
        name: 'New Delhi',
        icon: 'https://static.ambitionbox.com/static/icons/locations/delhi.svg',
    },
    {
        id: '2',
        name: 'Mumbai',
        icon: 'https://static.ambitionbox.com/static/icons/locations/mumbai.svg',
    },
    {
        id: '3',
        name: 'Hyderabad',
        icon: 'https://static.ambitionbox.com/static/icons/locations/hyderabad.svg',
    },
    {
        id: '4',
        name: 'Chennai',
        icon: 'https://static.ambitionbox.com/static/icons/locations/chennai.svg',
    },
    {
        id: '5',
        name: 'Bengaluru',
        icon: 'https://static.ambitionbox.com/static/icons/locations/bengaluru.svg',
    },
    {
        id: '6',
        name: 'Pune',
        icon: 'https://static.ambitionbox.com/static/icons/locations/pune.svg',
    },
] as const;

interface CollectionCardProps {
    title: string;
    icon: string;
    bgGradient: string;
    items: ReadonlyArray<{ name: string }>;
    footerLabel: string;
    kind: BrowseFilterKind;
    onSelect: (payload: ExplorerSelectPayload) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
    title,
    icon,
    bgGradient,
    items,
    footerLabel,
    kind,
    onSelect,
}) => {
    const handleSelect = (name: string) => {
        onSelect({
            kind,
            value: name,
            title: name,
            subtitle: title,
        });
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="flex flex-col flex-shrink-0 w-[237px] h-[244px] bg-white rounded-xl overflow-hidden shadow-sm"
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
                        onClick={() => handleSelect(item.name)}
                        className={cn(
                            'flex justify-between items-center h-[32px] group w-full text-left',
                            index !== items.length - 1 && 'border-b border-[#EBF0F6]',
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
                onClick={() =>
                    onSelect({
                        kind,
                        value: '',
                        title: footerLabel.replace('View all ', ''),
                        subtitle: title,
                    })
                }
                className="bg-[#FAFCFF] border-t border-[#EBF0F6] h-[48px] px-4 flex items-center cursor-pointer hover:bg-[#F0F5FF] transition-colors w-full text-left"
            >
                <span className="text-[12px] font-semibold text-[#5670FB]">{footerLabel}</span>
            </button>
        </motion.div>
    );
};

interface LocationCardProps {
    location: (typeof LOCATIONS_DATA)[number];
    onSelect: (payload: ExplorerSelectPayload) => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, onSelect }) => (
    <motion.div
        whileHover={{
            y: -4,
            boxShadow: '0 4px 12px -2px rgba(0, 106, 194, 0.25)',
        }}
        role="button"
        tabIndex={0}
        onClick={() =>
            onSelect({
                kind: 'location',
                value: location.name,
                title: location.name,
                subtitle: 'Companies by location',
            })
        }
        onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect({
                    kind: 'location',
                    value: location.name,
                    title: location.name,
                    subtitle: 'Companies by location',
                });
            }
        }}
        className="flex-shrink-0 w-[154px] h-[164px] bg-white border border-[#ebf0f6] rounded-md p-4 flex flex-col items-center text-center cursor-pointer transition-colors hover:border-[#5b6ff2]/30 shadow-[0_2px_6px_-2px_rgba(0,106,194,0.2)]"
    >
        <div className="w-[94px] h-[76px] mb-2.5 flex items-center justify-center">
            <img
                src={location.icon}
                alt={location.name}
                className="w-full h-full object-contain"
                loading="lazy"
            />
        </div>
        <span className="text-[#1e223c] text-base font-semibold leading-tight hover:text-[#5b6ff2] transition-colors">
            <span className="block text-sm font-normal text-gray-500">Companies in</span>
            <span className="block">{location.name}</span>
        </span>
    </motion.div>
);

export interface CompanyPostsExplorerProps {
    onSelect: (payload: ExplorerSelectPayload) => void;
    onViewAllPosts?: () => void;
    onSearch?: (query: string) => void;
    onCategorySelect?: (category: PostCategory, title: string) => void;
    onAddPost?: () => void;
}

export const CompanyCollectionIndia: React.FC<Pick<CompanyPostsExplorerProps, 'onSelect'>> = ({ onSelect }) => (
    <div className="w-full my-6">
        <div className="relative flex flex-col items-center justify-start rounded-[20px] pt-5 px-5 pb-8 overflow-hidden min-h-[460px] bg-[#1a2768]">
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
                    <span>Curated company posts &amp; experiences</span>
                    <img
                        src="https://static.ambitionbox.com/static/loc/information.png"
                        width={20}
                        height={20}
                        className="cursor-pointer opacity-80"
                        alt="More info"
                    />
                </div>
            </div>

            <div className="flex flex-nowrap justify-center gap-3 mt-5 w-full z-10 overflow-x-auto pb-1 scrollbar-hide">
                {COLLECTION_DATA.map(card => (
                    <CollectionCard
                        key={card.id}
                        title={card.title}
                        icon={card.icon}
                        bgGradient={card.bgGradient}
                        items={card.items}
                        footerLabel={card.footerLabel}
                        kind={card.kind}
                        onSelect={onSelect}
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

export const CompanyLocations: React.FC<Pick<CompanyPostsExplorerProps, 'onSelect' | 'onViewAllPosts'>> = ({
    onSelect,
    onViewAllPosts,
}) => (
    <section className="w-full max-w-[1024px] mx-auto px-6 py-8 bg-white font-sans rounded-2xl border border-[#EBF0F6]">
        <div className="flex items-center justify-between py-3 mb-2">
            <h2 className="text-[#1e223c] text-xl sm:text-2xl font-bold">Browse Companies by Location</h2>
            <button
                type="button"
                onClick={onViewAllPosts}
                className="text-[#5b6ff2] font-semibold text-sm sm:text-base hover:underline flex items-center gap-1 group"
            >
                <span>View all</span>
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>

        <div className="relative group">
            <div className="flex overflow-x-auto pb-6 scrollbar-hide -mx-1 px-1 gap-5 snap-x snap-mandatory">
                {LOCATIONS_DATA.map(location => (
                    <div key={location.id} className="snap-start">
                        <LocationCard location={location} onSelect={onSelect} />
                    </div>
                ))}
            </div>
            <div className="md:hidden absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-white pointer-events-none" />
        </div>
    </section>
);

export const CompanyPostsExplorer: React.FC<CompanyPostsExplorerProps> = ({
    onSelect,
    onViewAllPosts,
    onSearch,
    onCategorySelect,
    onAddPost,
}) => (
    <div className="w-full bg-white pb-4">
        {onViewAllPosts && onSearch && onCategorySelect && (
            <CompanyPostsExploreHeader
                onSelect={onSelect}
                onViewAllPosts={onViewAllPosts}
                onSearch={onSearch}
                onCategorySelect={onCategorySelect}
                onAddPost={onAddPost}
            />
        )}
        <CompanyCollectionIndia onSelect={onSelect} />
        <div className="w-full max-w-[1024px] mx-auto px-2 sm:px-4">
        <CompanyLocations onSelect={onSelect} onViewAllPosts={onViewAllPosts} />
        <div className="max-w-[1024px] mx-auto px-2 sm:px-6 pb-4">
            <button
                type="button"
                onClick={onViewAllPosts}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
            >
                View all company posts
            </button>
        </div>
        </div>
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

export default CompanyPostsExplorer;
