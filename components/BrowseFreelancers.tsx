import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigation } from '../App';
import Header from './Header';
import Footer from './Footer';
import Pagination from './Pagination';
import OrangeCheckbox from './OrangeCheckbox';
import type { Freelancer } from '../types/browse';
import freelancersData from '../mock/freelancers.json';

type SortOption = 'most-relevant' | 'highest-rated' | 'lowest-price';
type BrowseView = 'all' | 'freelancers' | 'projects';

const ToggleButton = ({
  text,
  active,
  onClick,
}: {
  text: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${active
      ? 'bg-orange-500 text-white shadow-sm'
      : 'text-gray-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
      }`}
  >
    {text}
  </button>
);

const BrowseFreelancers: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [view, setView] = useState<BrowseView>('freelancers');
  const [freelancers] = useState<Freelancer[]>(freelancersData as Freelancer[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hourlyRateRange, setHourlyRateRange] = useState<[number, number]>([10, 30]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('most-relevant');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hourlyRate: true,
    skills: true,
    country: true
  });
  const filterRef = useRef<HTMLDivElement>(null);

  // Get unique skills and countries
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    freelancers.forEach(f => f.skills.forEach(skill => skillsSet.add(skill)));
    return Array.from(skillsSet).sort();
  }, [freelancers]);

  const allCountries = useMemo(() => {
    const countriesSet = new Set<string>();
    freelancers.forEach(f => countriesSet.add(f.location.country));
    return Array.from(countriesSet).sort();
  }, [freelancers]);

  // Filter and sort freelancers
  const filteredAndSortedFreelancers = useMemo(() => {
    let filtered = [...freelancers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.username.toLowerCase().includes(query) ||
        f.skills.some(skill => skill.toLowerCase().includes(query)) ||
        f.location.city.toLowerCase().includes(query) ||
        f.location.country.toLowerCase().includes(query)
      );
    }

    // Hourly rate filter
    filtered = filtered.filter(f =>
      f.hourlyRate >= hourlyRateRange[0] && f.hourlyRate <= hourlyRateRange[1]
    );

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(f =>
        selectedSkills.some(skill => f.skills.includes(skill))
      );
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(f => f.location.country === selectedCountry);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'highest-rated':
          return b.rating - a.rating;
        case 'lowest-price':
          return a.hourlyRate - b.hourlyRate;
        case 'most-relevant':
        default:
          // For most relevant, sort by rating and then success rate
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.successRate - a.successRate;
      }
    });

    return filtered;
  }, [freelancers, searchQuery, hourlyRateRange, selectedSkills, selectedCountry, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedFreelancers.length / itemsPerPage);
  const paginatedFreelancers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedFreelancers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedFreelancers, currentPage, itemsPerPage]);

  // Close filter on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const clearFilters = () => {
    setHourlyRateRange([10, 30]);
    setSelectedSkills([]);
    setSelectedCountry('');
    setSearchQuery('');
    setSortOption('most-relevant');
  };

  const hasActiveFilters = selectedSkills.length > 0 || selectedCountry !== '' || hourlyRateRange[0] > 10 || hourlyRateRange[1] < 30;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const minPercent = ((hourlyRateRange[0] - 10) / 20) * 100;
  const maxPercent = ((hourlyRateRange[1] - 10) / 20) * 100;

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`w-4 h-4 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= Math.round(rating)} />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-300 min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Browse
          </h1>

          {/* Toggle Buttons - positioned right after title */}
          <div className="flex bg-orange-50 dark:bg-orange-900/20 rounded-lg p-1 w-fit">
            <ToggleButton
              text="All"
              active={view === 'all'}
              onClick={() => {
                setView('all');
                // For "All", show both - keep current view as freelancers
              }}
            />
            <ToggleButton
              text="Freelancers"
              active={view === 'freelancers'}
              onClick={() => setView('freelancers')}
            />
            <ToggleButton
              text="Projects"
              active={view === 'projects'}
              onClick={() => {
                setView('projects');
                navigateTo('browseProjects');
              }}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for freelancers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-14 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-gray-100 text-lg"
            />
            <svg
              className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div ref={filterRef} className="lg:w-80">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 mb-4 shadow-sm w-full"
            >
              <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Filters</span>
              {hasActiveFilters && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {selectedSkills.length + (selectedCountry ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Filter Sidebar */}
            <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg h-fit lg:sticky lg:top-4 z-10 transition-all duration-300`}>
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
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="most-relevant">Most Relevant</option>
                    <option value="highest-rated">Highest Rated</option>
                    <option value="lowest-price">Lowest Price</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hourly Rate */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('hourlyRate')}
                  className="w-full flex items-center justify-between mb-3 group"
                >
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                    Hourly Rate: <span className="text-orange-500 font-semibold">${hourlyRateRange[0]}</span> - <span className="text-orange-500 font-semibold">${hourlyRateRange[1]}</span>
                  </label>
                  <svg
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.hourlyRate ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.hourlyRate && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="relative h-8 py-3">
                      <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-y-1/2"></div>
                      <div
                        className="absolute top-1/2 h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transform -translate-y-1/2"
                        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                      ></div>
                      <input
                        type="range"
                        min={10}
                        max={30}
                        value={hourlyRateRange[0]}
                        onChange={(e) => setHourlyRateRange([Number(e.target.value), hourlyRateRange[1]])}
                        className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-30 pointer-events-none"
                      />
                      <input
                        type="range"
                        min={10}
                        max={30}
                        value={hourlyRateRange[1]}
                        onChange={(e) => setHourlyRateRange([hourlyRateRange[0], Number(e.target.value)])}
                        className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-20 pointer-events-none"
                      />
                      <style>{`
                        input[type="range"]::-webkit-slider-thumb {
                          pointer-events: auto;
                          -webkit-appearance: none;
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #f97316;
                          cursor: pointer;
                          border: 2px solid white;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        input[type="range"]::-moz-range-thumb {
                          pointer-events: auto;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #f97316;
                          cursor: pointer;
                          border: 2px solid white;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                      `}</style>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Min</label>
                        <input
                          type="number"
                          min={10}
                          max={30}
                          value={hourlyRateRange[0]}
                          onChange={(e) => {
                            const val = Math.max(10, Math.min(30, Number(e.target.value)));
                            setHourlyRateRange([val, hourlyRateRange[1]]);
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max</label>
                        <input
                          type="number"
                          min={10}
                          max={30}
                          value={hourlyRateRange[1]}
                          onChange={(e) => {
                            const val = Math.max(10, Math.min(30, Number(e.target.value)));
                            setHourlyRateRange([hourlyRateRange[0], val]);
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('skills')}
                  className="w-full flex items-center justify-between mb-3 group"
                >
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                    Skills {selectedSkills.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-orange-500">({selectedSkills.length})</span>
                    )}
                  </label>
                  <svg
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.skills ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.skills && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allSkills.map((skill) => (
                      <label
                        key={skill}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200"
                      >
                        <OrangeCheckbox
                          checked={selectedSkills.includes(skill)}
                          onChange={(checked) => {
                            if (checked) {
                              setSelectedSkills([...selectedSkills, skill]);
                            } else {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill));
                            }
                          }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{skill}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Country */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Country
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium"
                  >
                    <option value="">All Countries</option>
                    {allCountries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredAndSortedFreelancers.length}</span> freelancer{filteredAndSortedFreelancers.length !== 1 ? 's' : ''}
            </div>

            {paginatedFreelancers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {paginatedFreelancers.map((freelancer) => (
                    <div
                      key={freelancer.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        {/* Profile Image */}
                        <img
                          src={freelancer.profileImage}
                          alt={freelancer.name}
                          className="w-20 h-20 rounded-full object-cover border-2 border-orange-500"
                        />

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {freelancer.name}
                            </h3>
                            {freelancer.isVerified && (
                              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">@{freelancer.username}</p>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-3">
                            {renderStars(freelancer.rating)}
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {freelancer.rating}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({freelancer.reviewsCount} reviews)
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              • {freelancer.successRate}% Success
                            </span>
                          </div>

                          {/* Hourly Rate */}
                          <div className="mb-3">
                            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              ${freelancer.hourlyRate}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/{freelancer.currency}/hr</span>
                          </div>

                          {/* Location */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {freelancer.location.city}, {freelancer.location.country}
                          </p>

                          {/* Skills */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {freelancer.skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {freelancer.skills.length > 4 && (
                              <span className="px-3 py-1 text-gray-500 dark:text-gray-400 text-xs">
                                +{freelancer.skills.length - 4} more
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3">
                            <button className="flex-1 px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors duration-200">
                              Invite to Bid
                            </button>
                            <button className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                              Contact
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredAndSortedFreelancers.length}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setItemsPerPage(newItemsPerPage);
                      setCurrentPage(1);
                    }}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No freelancers found</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BrowseFreelancers;

