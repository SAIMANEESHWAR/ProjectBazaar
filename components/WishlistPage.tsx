import React from 'react';
import Lottie from 'lottie-react';
import type { BuyerProject } from './BuyerProjectCard';
import BuyerProjectCard from './BuyerProjectCard';
import { useWishlist } from './DashboardPage';
import noWishlistAnimation from '../lottiefiles/no_wishlist_animation.json';

interface WishlistPageProps {
  allProjects: BuyerProject[];
  onViewDetails: (project: BuyerProject) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ allProjects, onViewDetails }) => {
  const { wishlist, isLoading } = useWishlist();
  const wishlistProjects = allProjects.filter(project => wishlist.includes(project.id));

  if (isLoading) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-500 text-lg font-medium">Loading wishlist...</p>
      </div>
    );
  }

  if (wishlistProjects.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        {/* <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2> */}
        <span className="text-gray-600">{wishlistProjects.length} {wishlistProjects.length === 1 ? 'item' : 'items'}</span>
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
