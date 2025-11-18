import React from 'react';
import BuyerProjectCard, { BuyerProject } from './BuyerProjectCard';
import { useWishlist } from './DashboardPage';

interface WishlistPageProps {
    allProjects: BuyerProject[];
}

const WishlistPage: React.FC<WishlistPageProps> = ({ allProjects }) => {
    const { wishlist } = useWishlist();

    const wishlistedProjects = allProjects.filter(p => wishlist.includes(p.id));

    return (
        <div className="mt-8">
            {wishlistedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {wishlistedProjects.map((project) => (
                        <BuyerProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your wishlist is empty</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click the heart on any project to save it here.</p>
                </div>
            )}
        </div>
    );
};

export default WishlistPage;