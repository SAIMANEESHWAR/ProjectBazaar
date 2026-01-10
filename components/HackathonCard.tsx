import React, { useState, useRef } from 'react';
import ShareMenu from './ShareMenu';

export interface Hackathon {
  id: string;
  name: string;
  platform: string;
  official_url: string;
  status: 'live' | 'upcoming' | string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  location: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  created_at: number;
}

interface HackathonCardProps {
  hackathon: Hackathon;
  onClick?: (hackathon: Hackathon) => void;
}

const HackathonCard: React.FC<HackathonCardProps> = ({ hackathon, onClick }) => {
  const {
    name,
    platform,
    official_url,
    status,
    mode,
    location,
    start_date,
    end_date,
    image_url,
    created_at,
  } = hackathon;

  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [shareMenuPosition, setShareMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  // Get image URL or use default
  const imageUrl = image_url || 
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop';
  
  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'TBA';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };
  
  // Calculate days left until end date
  const getDaysLeft = (): string | null => {
    if (!end_date) return null;
    try {
      const end = new Date(end_date);
      if (isNaN(end.getTime())) return null;
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Ended';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day left';
      return `${diffDays} days left`;
    } catch {
      return null;
    }
  };
  
  // Format created date for "Posted" display
  const getPostedDate = (): string => {
    try {
      if (created_at) {
        const date = new Date(created_at * 1000); // Convert Unix timestamp to milliseconds
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        }
      }
      if (start_date) {
        return formatDate(start_date);
      }
      return 'Recently';
    } catch {
      return 'Recently';
    }
  };

  const daysLeft = getDaysLeft();
  const postedDate = getPostedDate();

  // Get mode color for badge
  const modeColor = mode === 'Online' 
    ? 'bg-gray-100 text-gray-700 border-gray-200' 
    : 'bg-gray-100 text-gray-700 border-gray-200';

  const handleClick = () => {
    if (onClick) {
      onClick(hackathon);
    } else {
      // Default: open in new tab
      window.open(official_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Calculate position when opening menu (position above the button)
    if (shareButtonRef.current) {
      const rect = shareButtonRef.current.getBoundingClientRect();
      const menuHeight = 200; // Approximate menu height
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // Position above if there's more space, otherwise below
      const positionTop = spaceAbove > spaceBelow 
        ? rect.top - menuHeight - 5 
        : rect.bottom + 5;
      
      setShareMenuPosition({
        top: positionTop + window.scrollY,
        right: window.innerWidth - rect.right,
      });
    } else {
      setShareMenuPosition({ top: 100, right: 100 });
    }
    
    setIsShareMenuOpen(true);
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex gap-6">
        {/* Left Content */}
        <div className="flex-1 min-w-0">
          {/* Title - Large and Bold */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {name}
          </h3>

          {/* Platform/Organizer */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-1">
            {platform}
          </p>

          {/* Details Row with Icons */}
          <div className="flex flex-wrap items-center gap-5 mb-3 text-sm text-gray-600">
            {/* Location */}
            {location && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
          </div>

          {/* Mode Badge and Posted Date */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Mode Badge */}
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200`}>
              {mode === 'Online' ? 'Online Hackathon' : mode === 'Offline' ? 'Offline Hackathon' : 'Hybrid Hackathon'}
            </span>

            {/* Posted Date and Days Left */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">Posted {postedDate}</span>
              {daysLeft && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={status === 'live' ? 'text-green-600 font-medium' : 'text-gray-600'}>{daysLeft}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Logo/Image */}
        <div className="flex-shrink-0 flex items-start">
          <div className="w-28 h-28 rounded-lg overflow-hidden bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
            <img 
              src={imageUrl} 
              alt={name} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop';
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Icons - Aligned to Right */}
      <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-gray-100 relative">
        <button
          ref={shareButtonRef}
          onClick={handleShare}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors relative"
          title="Share"
          onMouseEnter={(e) => e.stopPropagation()}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Share Menu */}
      {isShareMenuOpen && (
        <ShareMenu
          isOpen={isShareMenuOpen}
          onClose={() => setIsShareMenuOpen(false)}
          position={shareMenuPosition}
          shareData={{
            title: name,
            text: `Check out this hackathon: ${name}`,
            url: official_url,
          }}
        />
      )}
    </div>
  );
};

export default HackathonCard;

