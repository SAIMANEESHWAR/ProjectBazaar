import React, { useState, useEffect } from 'react';
import HackathonCard from './HackathonCard';
import type { Hackathon } from './HackathonCard';
import HackathonsFilters from './HackathonsFilters';
import HackathonsFeatured from './HackathonsFeatured';
import Pagination from './Pagination';
import { fetchHackathons } from '../services/buyerApi';

const HackathonsPage: React.FC = () => {
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

  // Platform logos and info
  const platforms = [
    { 
      name: 'Unstop', 
      domain: 'unstop.com', 
      logo: 'https://d8it4huxumps7.cloudfront.net/images/favicon/favicon-32x32.png',
      fallback: 'U'
    },
    { 
      name: 'Devfolio', 
      domain: 'devfolio.co', 
      logo: 'https://assets.devfolio.co/favicon/favicon-32x32.png',
      fallback: 'DF'
    },
    { 
      name: 'HackerEarth', 
      domain: 'hackerearth.com', 
      logo: 'https://static-fastly.hackerearth.com/static/images/favicon.ico',
      fallback: 'HE'
    },
    { 
      name: 'TechGig', 
      domain: 'techgig.com', 
      logo: 'https://www.techgig.com/favicon.ico',
      fallback: 'TG'
    },
    { 
      name: 'Skillenza', 
      domain: 'skillenza.com', 
      logo: 'https://www.skillenza.com/favicon.ico',
      fallback: 'SK'
    },
  ];

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Hackathons</h1>
        <p className="text-gray-600">Find and participate in exciting hackathons from top platforms</p>
      </div>

      {/* Integrated Platforms Section */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0">
            Hackathons integrated from:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {platforms.map((platform) => (
              <a
                key={platform.domain}
                href={`https://${platform.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                title={`Visit ${platform.name}`}
              >
                <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0 bg-gray-50 rounded overflow-hidden">
                  {logoErrors[platform.domain] ? (
                    <span className="text-xs font-bold text-gray-600">
                      {platform.fallback || platform.name.charAt(0)}
                    </span>
                  ) : (
                    <img
                      src={platform.logo}
                      alt={`${platform.name} logo`}
                      className="w-full h-full object-contain"
                      onError={() => {
                        setLogoErrors(prev => ({ ...prev, [platform.domain]: true }));
                      }}
                    />
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                  {platform.domain}
                </span>
                <svg 
                  className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search hackathons by name, platform, organizer, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
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

