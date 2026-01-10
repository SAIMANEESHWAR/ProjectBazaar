import React from 'react';
import type { Hackathon } from './HackathonCard';

interface HackathonsFeaturedProps {
  featuredHackathons: Hackathon[];
  onHackathonClick: (hackathon: Hackathon) => void;
}

const HackathonsFeatured: React.FC<HackathonsFeaturedProps> = ({
  featuredHackathons,
  onHackathonClick,
}) => {
  // If no featured hackathons, show placeholder items
  const displayItems = featuredHackathons.length > 0 
    ? featuredHackathons.slice(0, 8)
    : [];

  if (displayItems.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured</h3>
        <p className="text-sm text-gray-500 text-center py-8">
          No featured hackathons at the moment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured</h3>
      <div className="space-y-3">
        {displayItems.map((hackathon, index) => (
          <div
            key={`featured-${hackathon.id || index}`}
            onClick={() => onHackathonClick(hackathon)}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
          >
            {/* Logo/Image */}
            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={hackathon.image_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop'}
                alt={hackathon.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop';
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors mb-1">
                {hackathon.name}
              </h4>
              <p className="text-xs text-gray-500 mb-1 line-clamp-1">{hackathon.platform}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {hackathon.status === 'live' ? 'Live' : 'Upcoming'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HackathonsFeatured;

