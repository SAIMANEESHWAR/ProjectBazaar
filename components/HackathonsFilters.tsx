import React, { useState } from 'react';

interface HackathonsFiltersProps {
  statusFilter: 'all' | 'live' | 'upcoming';
  setStatusFilter: (filter: 'all' | 'live' | 'upcoming') => void;
  modeFilter: 'all' | 'Online' | 'Offline';
  setModeFilter: (filter: 'all' | 'Online' | 'Offline') => void;
  locationFilter: string[];
  setLocationFilter: (locations: string[]) => void;
  hackathons: any[];
}

const HackathonsFilters: React.FC<HackathonsFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  modeFilter,
  setModeFilter,
  locationFilter,
  setLocationFilter,
  hackathons,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    locations: false,
  });

  // Extract unique locations from hackathons
  const uniqueLocations = Array.from(
    new Set(hackathons.map(h => h.location).filter(Boolean))
  ).sort() as string[];

  // Calculate active filter count (only based on actual data fields)
  const activeFilterCount = [
    statusFilter !== 'all' ? 1 : 0,
    modeFilter !== 'all' ? 1 : 0,
    locationFilter.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setStatusFilter('all');
    setModeFilter('all');
    setLocationFilter([]);
  };

  const toggleLocation = (location: string) => {
    setLocationFilter(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  // Status options based on actual API data (status field)
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'live', label: 'Live' },
    { value: 'upcoming', label: 'Upcoming' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">All Filters</h3>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Status Filter - Chip Format */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">Status</span>
          {statusFilter !== 'all' && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
              1
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                statusFilter === option.value
                  ? option.value === 'live'
                    ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-sm'
                    : option.value === 'upcoming'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 shadow-sm'
                    : 'bg-blue-100 text-blue-700 border-2 border-blue-500 shadow-sm'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {option.value === 'live' && '🔴 '}
              {option.value === 'upcoming' && '⏰ '}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Type Filter - Chip Format */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">Event Type</span>
          {modeFilter !== 'all' && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
              1
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Online', 'Offline'].map(type => {
            const isSelected = (type === 'All' && modeFilter === 'all') || modeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setModeFilter(type === 'All' ? 'all' : type as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? type === 'Online'
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-500 shadow-sm'
                      : type === 'Offline'
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-500 shadow-sm'
                      : 'bg-blue-100 text-blue-700 border-2 border-blue-500 shadow-sm'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {type === 'Online' && '🌐 '}
                {type === 'Offline' && '📍 '}
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Locations Filter - Collapsible with checkboxes */}
      {uniqueLocations.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setExpandedSections(prev => ({ ...prev, locations: !prev.locations }))}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Locations</span>
              {locationFilter.length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
                  {locationFilter.length}
                </span>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedSections.locations ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.locations && (
            <div className="mt-2 space-y-1 max-h-64 overflow-y-auto pr-2">
              {uniqueLocations.slice(0, 30).map(location => (
                <label
                  key={location}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={locationFilter.includes(location)}
                    onChange={() => toggleLocation(location)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="line-clamp-1">{location}</span>
                </label>
              ))}
              {uniqueLocations.length > 30 && (
                <p className="px-3 py-2 text-xs text-gray-400">
                  +{uniqueLocations.length - 30} more locations
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HackathonsFilters;

