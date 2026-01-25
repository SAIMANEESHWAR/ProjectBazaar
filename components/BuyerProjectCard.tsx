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
    className={`h-4 w-4 transition-all duration-300 ${liked ? 'scale-110' : 'scale-100'}`}
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
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const DocsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;


const BuyerProjectCard: React.FC<BuyerProjectCardProps> = ({ project, onViewDetails, onReport }) => {
  const { id, imageUrl, category, title, description, tags, price, isPremium, hasDocumentation, hasExecutionVideo } = project;
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCart, addToCart, removeFromCart } = useCart();
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
    if (inCart) {
      removeFromCart(id);
    } else {
      addToCart(id);
    }
    setTimeout(() => setIsCartAnimating(false), 300);
  };

  const handleCardClick = () => {
    onViewDetails?.(project);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-2xl overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 border border-gray-200/60 hover:border-orange-200 flex flex-col h-full relative w-full cursor-pointer"
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-3 left-3 z-10">
          <div className="relative group/premium">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full blur-[3px] opacity-60"></div>
            <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-white/20">
              <PremiumIcon />
              <span className="text-xs text-white font-bold uppercase tracking-wider">Pro</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Top Right */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Report Button */}
        {userId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onReport) onReport(project);
              else setReportModalOpen(true);
            }}
            className="p-2 rounded-full bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-500 shadow-sm backdrop-blur-md transition-colors"
            title="Report"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLikeClick();
          }}
          className={`p-2 rounded-full shadow-sm backdrop-blur-md transition-colors ${liked
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : 'bg-white/90 text-gray-500 hover:text-orange-500 hover:bg-orange-50'
            } ${isAnimating ? 'animate-pulse' : ''}`}
        >
          <HeartIcon liked={liked} />
        </button>
      </div>

      {/* Image Section - Larger Height */}
      <div className="relative overflow-hidden bg-gray-100 h-52">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Type Icon Overlay */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          {hasDocumentation && <div className="p-1.5 bg-white/90 rounded-lg shadow-sm" title="Documentation included"><DocsIcon /></div>}
          {hasExecutionVideo && <div className="p-1.5 bg-white/90 rounded-lg shadow-sm" title="Video included"><VideoIcon /></div>}
        </div>
      </div>

      {/* Content Section - Enhanced Layout */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Category & Title */}
        <div>
          <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1.5 opacity-90 truncate">
            {category}
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors" title={title}>
            {title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200 truncate max-w-[100px]">
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-xs text-gray-400 px-1.5 py-1">+{tags.length - 2}</span>
          )}
        </div>

        {/* Footer: Price & Actions */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900">₹{price.toFixed(0)}</span>
              {/* <span className="text-xs text-gray-400 line-through">₹{(price * 1.2).toFixed(0)}</span> */}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className={`p-2.5 rounded-xl transition-all ${inCart
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                } ${isCartAnimating ? 'scale-90' : ''}`}
              title={inCart ? 'Remove from Cart' : 'Add to Cart'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {inCart ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                )}
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(project);
              }}
              className="text-sm font-semibold bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              View
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
          isPurchased={false}
          onSuccess={() => {
            setReportModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default BuyerProjectCard;