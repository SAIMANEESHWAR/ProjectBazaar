import React from 'react';
import { useWishlist } from './DashboardPage';

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
}

const HeartIcon = ({ liked }: { liked: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={liked ? '#ef4444' : 'none'} viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
);
const PremiumIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const DocsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;


const BuyerProjectCard: React.FC<BuyerProjectCardProps> = ({ project }) => {
  const { id, imageUrl, category, title, description, tags, price, isPremium, hasDocumentation, hasExecutionVideo } = project;
  const { isInWishlist, toggleWishlist } = useWishlist();
  const liked = isInWishlist(id);

  return (
    <div className="bg-white dark:bg-gray-900/50 rounded-xl overflow-hidden group transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 border border-gray-200 dark:border-gray-800 flex flex-col h-full">
      <div className="relative">
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
        
        {isPremium && (
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <PremiumIcon />
            <span className="text-xs text-white font-semibold">Premium</span>
          </div>
        )}
        
        <button 
            onClick={() => toggleWishlist(id)}
            className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm p-1.5 rounded-full text-white hover:bg-black/50 transition-colors duration-200"
            aria-label="Like project"
        >
            <HeartIcon liked={liked} />
        </button>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <p className="text-sm text-blue-500 dark:text-blue-400 font-medium mb-1">{category}</p>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 truncate">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 h-12 overflow-hidden">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
            {hasDocumentation && <span className="flex items-center gap-1.5 bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full"><DocsIcon /> Documentation</span>}
            {hasExecutionVideo && <span className="flex items-center gap-1.5 bg-green-100/50 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold px-2.5 py-1 rounded-full"><VideoIcon /> Execution Video</span>}
        </div>

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            ${price.toFixed(2)}
          </p>
          <button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 text-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyerProjectCard;