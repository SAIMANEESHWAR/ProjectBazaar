import React from 'react';
import Lottie from 'lottie-react';
import type { BuyerProject } from './BuyerProjectCard';
import BuyerProjectCard from './BuyerProjectCard';
import { useWishlist } from './DashboardPage';
import noWishlistAnimation from '../lottiefiles/no_wishlist_animation.json';

interface WishlistPageProps {
  allProjects: BuyerProject[];
  onViewDetails: (project: BuyerProject) => void;
  onBack: () => void;
}

const BackButton: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <button
    type="button"
    onClick={onBack}
    className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors mb-4"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Back to dashboard
  </button>
);

const WishlistPage: React.FC<WishlistPageProps> = ({ allProjects, onViewDetails, onBack }) => {
  const { wishlist, isLoading } = useWishlist();
  const wishlistProjects = allProjects.filter(project => wishlist.includes(project.id));

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <BackButton onBack={onBack} />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg font-medium">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (wishlistProjects.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <BackButton onBack={onBack} />
        <div className="text-center py-12">
          <div className="mx-auto mb-4 w-full max-w-[380px] h-[280px] flex items-center justify-center">
            <Lottie
              animationData={noWishlistAnimation}
              loop
              className="w-full h-full"
            />
          </div>
          <p className="text-gray-500 text-lg font-medium">Your wishlist is empty</p>
          <p className="text-gray-400 text-sm mt-2">Start adding projects to your wishlist!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">
          {wishlistProjects.length} {wishlistProjects.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistProjects.map((project) => (
          <BuyerProjectCard
            key={project.id}
            project={project}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
