import React, { useState } from 'react';
import { useWishlist, useCart } from './DashboardPage';
import { useAuth } from '../App';
import ReportProjectModal from './ReportProjectModal';

export interface BuyerProject {
  id: string;
  imageUrl: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  isPremium?: boolean;
  hasDocumentation?: boolean;
  hasExecutionVideo?: boolean;
}

interface BuyerProjectCardProps {
  project: BuyerProject;
  onViewDetails?: (project: BuyerProject) => void;
  onReport?: (project: BuyerProject) => void;
}

const HeartIcon = ({ liked }: { liked: boolean }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 transition-all duration-300 ${liked ? 'scale-110' : 'scale-100'}`}
        fill={liked ? 'currentColor' : 'none'} 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={liked ? 0 : 2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" 
        />
    </svg>
);
const PremiumIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const DocsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;


const BuyerProjectCard: React.FC<BuyerProjectCardProps> = ({ project, onViewDetails, onReport }) => {
  const { id, imageUrl, category, title, description, tags, price, isPremium, hasDocumentation, hasExecutionVideo } = project;
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCart, addToCart } = useCart();
  const { userId } = useAuth();
  const liked = isInWishlist(id);
  const inCart = isInCart(id);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const handleLikeClick = () => {
    setIsAnimating(true);
    toggleWishlist(id);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCartAnimating(true);
    addToCart(id);
    setTimeout(() => setIsCartAnimating(false), 300);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 border border-gray-100 flex flex-col h-full relative">
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-4 left-4 z-10">
          <div className="relative group/premium">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full blur-md opacity-60 animate-pulse"></div>
            {/* Main badge */}
            <div className="relative bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border-2 border-white/30 backdrop-blur-sm overflow-hidden hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 transition-all duration-300">
              {/* Shine effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/premium:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              <PremiumIcon />
              <span className="text-xs text-white font-bold tracking-wide drop-shadow-sm relative z-10 uppercase">Premium</span>
              {/* Sparkle effects */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"></div>
              <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-amber-300 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Report Button */}
        {userId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onReport) {
                onReport(project);
              } else {
                setReportModalOpen(true);
              }
            }}
            className="p-2.5 rounded-full bg-white/95 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all duration-300 shadow-lg backdrop-blur-sm hover:scale-110 group/report"
            title="Report this project"
            aria-label="Report project"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {/* Tooltip */}
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/report:opacity-100 transition-opacity pointer-events-none">
              Report Issue
            </span>
          </button>
        )}
        
        {/* Wishlist Button */}
        <button 
            onClick={handleLikeClick}
            className={`p-2.5 rounded-full transition-all duration-300 shadow-lg backdrop-blur-sm ${
                liked 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700' 
                    : 'bg-white/95 text-gray-600 hover:bg-white hover:text-orange-500'
            } ${isAnimating ? 'animate-pulse scale-125' : liked ? 'scale-110' : 'scale-100 hover:scale-110'}`}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
        >
            <HeartIcon liked={liked} />
        </button>
      </div>

      {/* Image Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Category Badge */}
        <div className="mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold uppercase tracking-wide">
            {category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
          {description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-400 font-medium px-2 py-1.5">
              +{tags.length - 3} more
            </span>
          )}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-5">
            {hasDocumentation && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-200">
                <DocsIcon /> 
                <span>Docs</span>
              </span>
            )}
            {hasExecutionVideo && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200">
                <VideoIcon /> 
                <span>Video</span>
              </span>
            )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-5 border-t border-gray-100 mt-auto">
          <div>
            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
              ₹{price.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">One-time purchase</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className={`p-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                inCart
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              } ${isCartAnimating ? 'animate-pulse scale-125' : ''}`}
              title={inCart ? 'Already in cart' : 'Add to cart'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {inCart ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                )}
              </svg>
            </button>
            <button 
              onClick={() => onViewDetails?.(project)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Report Project Modal */}
      {userId && (
        <ReportProjectModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          projectId={project.id}
          projectTitle={project.title}
          buyerId={userId}
          isPurchased={false} // Cards in dashboard are for non-purchased projects
          onSuccess={() => {
            setReportModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default BuyerProjectCard;