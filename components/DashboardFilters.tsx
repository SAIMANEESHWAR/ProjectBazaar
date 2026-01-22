import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { BuyerProject } from './BuyerProjectCard';
import OrangeCheckbox from './OrangeCheckbox';

interface DashboardFiltersProps {
    projects: BuyerProject[];
    onFilterChange: (filteredProjects: BuyerProject[]) => void;
}

type SortOption = 'price-low' | 'price-high' | 'name-asc' | 'name-desc' | 'newest';

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ projects, onFilterChange }) => {
    // Calculate min/max price from actual projects
    const { minPrice, maxPrice } = useMemo(() => {
        if (projects.length === 0) return { minPrice: 0, maxPrice: 9000 };
        const prices = projects.map(p => p.price);
        return {
            minPrice: Math.floor(Math.min(...prices)),
            maxPrice: Math.ceil(Math.max(...prices))
        };
    }, [projects]);

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
    const [premiumFilter, setPremiumFilter] = useState<'all' | 'premium' | 'regular'>('all');
    const [hasDocumentation, setHasDocumentation] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);
    const [sortOption, setSortOption] = useState<SortOption>('price-low');
    const [isOpen, setIsOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        categories: true,
        price: true,
        projectType: true,
        features: true
    });
    const filterRef = useRef<HTMLDivElement>(null);
    const minPriceRef = useRef<HTMLInputElement>(null);
    const maxPriceRef = useRef<HTMLInputElement>(null);

    // Update price range when min/max changes
    useEffect(() => {
        setPriceRange([minPrice, maxPrice]);
    }, [minPrice, maxPrice]);

    // Close filter menu when clicking outside (mobile only)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Get unique categories
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(projects.map(p => p.category)));
        if (categorySearch.trim()) {
            return uniqueCategories.filter(cat => 
                cat.toLowerCase().includes(categorySearch.toLowerCase())
            );
        }
        return uniqueCategories;
    }, [projects, categorySearch]);

    // Dual range slider handlers
    const handleMinPriceChange = (value: number) => {
        const newMin = Math.min(value, priceRange[1] - 1);
        setPriceRange([newMin, priceRange[1]]);
    };

    const handleMaxPriceChange = (value: number) => {
        const newMax = Math.max(value, priceRange[0] + 1);
        setPriceRange([priceRange[0], newMax]);
    };

    const handlePriceInputChange = (index: 0 | 1, value: string) => {
        const numValue = parseInt(value) || (index === 0 ? minPrice : maxPrice);
        const clampedValue = Math.max(minPrice, Math.min(maxPrice, numValue));
        
        if (index === 0) {
            handleMinPriceChange(clampedValue);
        } else {
            handleMaxPriceChange(clampedValue);
        }
    };

    // Apply filters
    React.useEffect(() => {
        let filtered = [...projects];

        // Category filter
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(p => selectedCategories.includes(p.category));
        }

        // Price range filter
        filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

        // Premium filter
        if (premiumFilter === 'premium') {
            filtered = filtered.filter(p => p.isPremium);
        } else if (premiumFilter === 'regular') {
            filtered = filtered.filter(p => !p.isPremium);
        }

        // Features filter
        if (hasDocumentation) {
            filtered = filtered.filter(p => p.hasDocumentation);
        }
        if (hasVideo) {
            filtered = filtered.filter(p => p.hasExecutionVideo);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortOption) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'name-asc':
                    return a.title.localeCompare(b.title);
                case 'name-desc':
                    return b.title.localeCompare(a.title);
                case 'newest':
                    // Assuming projects have an id that reflects creation order
                    // If you have a date field, use that instead
                    return 0; // Placeholder - update if you have date/createdAt field
                default:
                    return 0;
            }
        });

        onFilterChange(filtered);
    }, [selectedCategories, priceRange, premiumFilter, hasDocumentation, hasVideo, sortOption, projects, onFilterChange]);

    const clearFilters = () => {
        setSelectedCategories([]);
        setPriceRange([minPrice, maxPrice]);
        setPremiumFilter('all');
        setHasDocumentation(false);
        setHasVideo(false);
        setSortOption('price-low');
        setCategorySearch('');
    };

    const hasActiveFilters = selectedCategories.length > 0 || 
        priceRange[0] > minPrice || priceRange[1] < maxPrice || 
        premiumFilter !== 'all' || 
        hasDocumentation || 
        hasVideo;

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Calculate slider positions for dual range
    const minPercent = ((priceRange[0] - minPrice) / (maxPrice - minPrice)) * 100;
    const maxPercent = ((priceRange[1] - minPrice) / (maxPrice - minPrice)) * 100;

    return (
        <>
            {/* Mobile Filter Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 mb-4 shadow-sm"
            >
                <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Filters</span>
                {hasActiveFilters && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                        {selectedCategories.length + (premiumFilter !== 'all' ? 1 : 0) + (hasDocumentation ? 1 : 0) + (hasVideo ? 1 : 0)}
                    </span>
                )}
            </button>

            {/* Filter Sidebar */}
            <div ref={filterRef} className={`${isOpen ? 'block' : 'hidden'} lg:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg h-fit lg:sticky lg:top-4 z-10 transition-all duration-300`}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filters</h3>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-semibold transition-colors duration-200 hover:underline"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Sort */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Sort By</label>
                    <div className="relative">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer transition-all duration-200 hover:border-orange-400 dark:hover:border-orange-500"
                        >
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name-asc">Name: A to Z</option>
                            <option value="name-desc">Name: Z to A</option>
                            <option value="newest">Newest First</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                    <button
                        onClick={() => toggleSection('categories')}
                        className="w-full flex items-center justify-between mb-3 group"
                    >
                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                            Categories {selectedCategories.length > 0 && (
                                <span className="ml-2 text-xs font-normal text-orange-500">({selectedCategories.length})</span>
                            )}
                        </label>
                        <svg 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.categories ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {expandedSections.categories && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            {/* Category Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    className="w-full px-4 py-2.5 pl-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                                />
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {categories.length > 0 ? (
                                    categories.map((category) => (
                                        <label
                                            key={category}
                                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 group/item"
                                        >
                                            <OrangeCheckbox
                                                checked={selectedCategories.includes(category)}
                                                onChange={(checked) => {
                                                    if (checked && !selectedCategories.includes(category)) {
                                                        setSelectedCategories(prev => [...prev, category]);
                                                    } else if (!checked && selectedCategories.includes(category)) {
                                                        setSelectedCategories(prev => prev.filter(c => c !== category));
                                                    }
                                                }}
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                                                {category}
                                            </span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No categories found</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Price Range */}
                <div className="mb-6">
                    <button
                        onClick={() => toggleSection('price')}
                        className="w-full flex items-center justify-between mb-3 group"
                    >
                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                            Price Range: <span className="text-orange-500 font-semibold">₹{priceRange[0].toLocaleString()}</span> - <span className="text-orange-500 font-semibold">₹{priceRange[1].toLocaleString()}</span>
                        </label>
                        <svg 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.price ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {expandedSections.price && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                            {/* Dual Range Slider */}
                            <div className="relative h-8 py-3">
                                <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-y-1/2"></div>
                                <div 
                                    className="absolute top-1/2 h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transform -translate-y-1/2"
                                    style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                                ></div>
                                {/* Min Price Slider - Higher z-index to ensure it's accessible */}
                                <input
                                    type="range"
                                    min={minPrice}
                                    max={maxPrice}
                                    value={priceRange[0]}
                                    onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                                    className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-30"
                                    style={{
                                        background: 'transparent',
                                        WebkitAppearance: 'none',
                                    }}
                                />
                                {/* Max Price Slider - Lower z-index but still accessible via thumb */}
                                <input
                                    type="range"
                                    min={minPrice}
                                    max={maxPrice}
                                    value={priceRange[1]}
                                    onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                                    className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-20"
                                    style={{
                                        background: 'transparent',
                                        WebkitAppearance: 'none',
                                    }}
                                />
                                <style>{`
                                    input[type="range"]::-webkit-slider-thumb {
                                        -webkit-appearance: none;
                                        appearance: none;
                                        width: 20px;
                                        height: 20px;
                                        border-radius: 50%;
                                        background: #f97316;
                                        cursor: pointer;
                                        border: 3px solid white;
                                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                                        transition: all 0.2s;
                                    }
                                    input[type="range"]::-webkit-slider-thumb:hover {
                                        transform: scale(1.1);
                                        box-shadow: 0 3px 8px rgba(249, 115, 22, 0.4);
                                    }
                                    input[type="range"]::-moz-range-thumb {
                                        width: 20px;
                                        height: 20px;
                                        border-radius: 50%;
                                        background: #f97316;
                                        cursor: pointer;
                                        border: 3px solid white;
                                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                                        transition: all 0.2s;
                                    }
                                    input[type="range"]::-moz-range-thumb:hover {
                                        transform: scale(1.1);
                                        box-shadow: 0 3px 8px rgba(249, 115, 22, 0.4);
                                    }
                                `}</style>
                            </div>
                            {/* Price Inputs */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Min Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">$</span>
                                        <input
                                            ref={minPriceRef}
                                            type="number"
                                            min={minPrice}
                                            max={maxPrice}
                                            value={priceRange[0]}
                                            onChange={(e) => handlePriceInputChange(0, e.target.value)}
                                            onBlur={() => {
                                                if (priceRange[0] >= priceRange[1]) {
                                                    handleMinPriceChange(priceRange[1] - 1);
                                                }
                                            }}
                                            className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium transition-all duration-200"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Max Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">$</span>
                                        <input
                                            ref={maxPriceRef}
                                            type="number"
                                            min={minPrice}
                                            max={maxPrice}
                                            value={priceRange[1]}
                                            onChange={(e) => handlePriceInputChange(1, e.target.value)}
                                            onBlur={() => {
                                                if (priceRange[1] <= priceRange[0]) {
                                                    handleMaxPriceChange(priceRange[0] + 1);
                                                }
                                            }}
                                            className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Premium Filter */}
                <div className="mb-6">
                    <button
                        onClick={() => toggleSection('projectType')}
                        className="w-full flex items-center justify-between mb-3 group"
                    >
                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                            Project Type
                        </label>
                        <svg 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.projectType ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {expandedSections.projectType && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            {(['all', 'premium', 'regular'] as const).map((option) => (
                                <label
                                    key={option}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 group/item"
                                >
                                    <input
                                        type="radio"
                                        name="premium"
                                        checked={premiumFilter === option}
                                        onChange={() => setPremiumFilter(option)}
                                        className="w-4 h-4 text-orange-500 border-gray-300 dark:border-gray-600 focus:ring-orange-500 focus:ring-2 dark:bg-gray-700"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium capitalize group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                                        {option === 'all' ? 'All Projects' : option === 'premium' ? 'Premium Only' : 'Regular Only'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="mb-6">
                    <button
                        onClick={() => toggleSection('features')}
                        className="w-full flex items-center justify-between mb-3 group"
                    >
                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                            Features {(hasDocumentation || hasVideo) && (
                                <span className="ml-2 text-xs font-normal text-orange-500">
                                    ({(hasDocumentation ? 1 : 0) + (hasVideo ? 1 : 0)})
                                </span>
                            )}
                        </label>
                        <svg 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.features ? 'rotate-180' : ''}`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {expandedSections.features && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 group/item">
                                <OrangeCheckbox
                                    checked={hasDocumentation}
                                    onChange={(checked) => setHasDocumentation(checked)}
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                                    Has Documentation
                                </span>
                            </label>
                            <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 group/item">
                                <OrangeCheckbox
                                    checked={hasVideo}
                                    onChange={(checked) => setHasVideo(checked)}
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                                    Has Execution Video
                                </span>
                            </label>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #f97316;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ea580c;
                }
                @keyframes slide-in-from-top-2 {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-in {
                    animation: slide-in-from-top-2 0.2s ease-out;
                }
            `}</style>
        </>
    );
};

export default DashboardFilters;

