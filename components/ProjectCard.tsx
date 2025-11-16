
import React from 'react';
import { useNavigation } from '../App';

export interface Project {
  imageUrl: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { imageUrl, category, title, description, tags, price } = project;
  const { navigateTo } = useNavigation();

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden group transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/10 dark:hover:shadow-blue-500/20">
      <div className="overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-6">
        <p className="text-sm text-blue-500 dark:text-blue-400 mb-2">{category}</p>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 h-10 overflow-hidden">{description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 dark:from-blue-400 to-purple-600 dark:to-purple-500">
            ${price}
          </p>
          <button onClick={() => navigateTo('auth')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white transition-all duration-300">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
