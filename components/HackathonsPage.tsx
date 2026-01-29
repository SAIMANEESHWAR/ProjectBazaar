import React, { useState, useEffect } from 'react';
import HackathonCard from './HackathonCard';
import type { Hackathon } from './HackathonCard';
import HackathonsFilters from './HackathonsFilters';
import HackathonsFeatured from './HackathonsFeatured';
import Pagination from './Pagination';
import { fetchHackathons } from '../services/buyerApi';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Marquee } from './ui/marquee';

interface HackathonsPageProps {
  toggleSidebar?: () => void;
}

const HackathonsPage: React.FC<HackathonsPageProps> = ({ toggleSidebar }) => {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'Online' | 'Offline'>('all');
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  // Fetch hackathons from API
  useEffect(() => {
    const loadHackathons = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await fetchHackathons();
        if (result.success && result.data?.hackathons) {
          setHackathons(result.data.hackathons);
          setFilteredHackathons(result.data.hackathons);
          setError(null); // Clear any previous errors
        } else {
          // Extract error message from error object
          const errorMessage = result.error 
            ? (typeof result.error === 'string' 
                ? result.error 
                : (result.error.message || result.error.code || 'Failed to load hackathons'))
            : 'Failed to load hackathons';
          
          console.warn('Failed to fetch hackathons:', result.error);
          setError(errorMessage);
        }
      } catch (err) {
        console.error('Error fetching hackathons:', err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'An unexpected error occurred while loading hackathons. Please try again later.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadHackathons();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...hackathons];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(query) ||
        h.platform.toLowerCase().includes(query) ||
        h.location.toLowerCase().includes(query)
      );
    }

    // Status filter (based on actual API status field)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(h => 
        h.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Mode filter
    if (modeFilter !== 'all') {
      filtered = filtered.filter(h => h.mode === modeFilter);
    }

    // Location filter
    if (locationFilter.length > 0) {
      filtered = filtered.filter(h => 
        locationFilter.some(loc => h.location.toLowerCase().includes(loc.toLowerCase()))
      );
    }

    setFilteredHackathons(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, modeFilter, locationFilter, hackathons]);
  
  // Get featured hackathons (top 8 based on some criteria, e.g., live or upcoming)
  const featuredHackathons = hackathons
    .filter(h => h.status === 'live' || h.status === 'upcoming')
    .slice(0, 8);

  // Calculate pagination
  const totalPages = Math.ceil(filteredHackathons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHackathons = filteredHackathons.slice(startIndex, endIndex);

  const handleHackathonClick = (hackathon: Hackathon) => {
    // Open hackathon URL in new tab
    window.open(hackathon.official_url, '_blank', 'noopener,noreferrer');
  };

  // Platform logos and info with reliable favicon URLs
  const platforms = [
    { 
      name: 'Unstop', 
      domain: 'unstop.com', 
      logo: `https://www.google.com/s2/favicons?domain=unstop.com&sz=128`,
      fallback: 'U',
      color: 'bg-gradient-to-br from-orange-500 to-amber-500'
    },
    { 
      name: 'Devfolio', 
      domain: 'devfolio.co', 
      logo: `https://www.google.com/s2/favicons?domain=devfolio.co&sz=128`,
      fallback: 'DF',
      color: 'bg-gradient-to-br from-orange-500 to-amber-500'
    },
    { 
      name: 'HackerEarth', 
      domain: 'hackerearth.com', 
      logo: `https://www.google.com/s2/favicons?domain=hackerearth.com&sz=128`,
      fallback: 'HE',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    { 
      name: 'TechGig', 
      domain: 'techgig.com', 
      logo: `https://www.google.com/s2/favicons?domain=techgig.com&sz=128`,
      fallback: 'TG',
      color: 'bg-gradient-to-br from-red-500 to-red-600'
    },
    { 
      name: 'Skillenza', 
      domain: 'skillenza.com', 
      logo: `https://www.google.com/s2/favicons?domain=skillenza.com&sz=128`,
      fallback: 'SK',
      color: 'bg-gradient-to-br from-orange-500 to-amber-500'
    },
  ];

  return (
    <div className="mt-4 sm:mt-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          {/* Mobile Menu Button */}
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">Discover Hackathons</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Find and participate in exciting hackathons from top platforms</p>
      </div>

      {/* Integrated Platforms Section */}
      <div className="mb-6 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/80 backdrop-blur-sm rounded-2xl border border-orange-200/60 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
              Hackathons integrated from:
            </span>
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-3">
              {platforms.map((platform) => {
                const hasError = logoErrors[platform.domain];
                const [imageLoaded, setImageLoaded] = React.useState(false);
                
                return (
                  <Tooltip key={platform.domain}>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://${platform.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 group relative overflow-hidden ${
                          hasError || !imageLoaded
                            ? `${platform.color} border-transparent hover:shadow-lg hover:-translate-y-1 text-white`
                            : 'bg-white border-gray-200 hover:border-orange-400 hover:bg-white hover:shadow-lg hover:-translate-y-1'
                        }`}
                      >
                        {hasError || !imageLoaded ? (
                          <span className="text-sm font-bold leading-none z-10">
                            {platform.fallback || platform.name.charAt(0)}
                          </span>
                        ) : null}
                        <img
                          src={platform.logo}
                          alt={`${platform.name} logo`}
                          className={`w-7 h-7 object-contain transition-opacity duration-200 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                          }`}
                          onError={() => {
                            setLogoErrors(prev => ({ ...prev, [platform.domain]: true }));
                            setImageLoaded(false);
                          }}
                          onLoad={() => {
                            setImageLoaded(true);
                            setLogoErrors(prev => {
                              const newState = { ...prev };
                              delete newState[platform.domain];
                              return newState;
                            });
                          }}
                          loading="lazy"
                        />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-xs text-gray-400">{platform.domain}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Auto-scrolling Platform Names */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white z-10 pointer-events-none"></div>
        <Marquee speed={40} pauseOnHover={true} className="mb-0">
          {['unstop', 'devfolio', 'hackerrank', 'techgig', 'skillenza'].map((platform, idx) => (
            <div
              key={idx}
              className="relative h-full w-fit mx-8 flex items-center justify-start"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 text-sm font-semibold text-gray-700 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap">
                {platform}
              </span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <svg 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search hackathons by name, platform, organizer, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder:text-gray-400 text-gray-900"
          />
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Filters Sidebar */}
        <div className="lg:col-span-3">
          <HackathonsFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            modeFilter={modeFilter}
            setModeFilter={setModeFilter}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            hackathons={hackathons}
          />
        </div>

        {/* Middle Column - Hackathons List */}
        <div className="lg:col-span-6">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">Loading hackathons...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium flex-1">
                  {typeof error === 'string' ? error : 'An error occurred while loading hackathons'}
                </p>
                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    const loadHackathons = async () => {
                      try {
                        const result = await fetchHackathons();
                        if (result.success && result.data?.hackathons) {
                          setHackathons(result.data.hackathons);
                          setFilteredHackathons(result.data.hackathons);
                          setError(null);
                        } else {
                          const errorMessage = result.error 
                            ? (typeof result.error === 'string' 
                                ? result.error 
                                : (result.error.message || result.error.code || 'Failed to load hackathons'))
                            : 'Failed to load hackathons';
                          setError(errorMessage);
                        }
                      } catch (err) {
                        console.error('Error fetching hackathons:', err);
                        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
                      } finally {
                        setIsLoading(false);
                      }
                    };
                    loadHackathons();
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Results Count */}
          {!isLoading && !error && (
            <div className="mb-4 text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredHackathons.length}</span> hackathon{filteredHackathons.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}

          {/* Hackathons List */}
          {!isLoading && !error && paginatedHackathons.length > 0 && (
            <>
              <div className="space-y-4">
                {paginatedHackathons.map((hackathon, index) => (
                  <HackathonCard
                    key={`${hackathon.id || hackathon.name}-${hackathon.platform}-${index}`}
                    hackathon={hackathon}
                    onClick={handleHackathonClick}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredHackathons.length}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setItemsPerPage(newItemsPerPage);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredHackathons.length === 0 && (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No hackathons found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery || statusFilter !== 'all' || modeFilter !== 'all' || locationFilter.length > 0
                  ? 'Try adjusting your filters or search query'
                  : 'No hackathons available at the moment. Please check back later.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || modeFilter !== 'all' || locationFilter.length > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setModeFilter('all');
                    setLocationFilter([]);
                  }}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Featured Sidebar */}
        <div className="lg:col-span-3">
          <HackathonsFeatured
            featuredHackathons={featuredHackathons}
            onHackathonClick={handleHackathonClick}
          />
        </div>
      </div>
    </div>
  );
};

export default HackathonsPage;

