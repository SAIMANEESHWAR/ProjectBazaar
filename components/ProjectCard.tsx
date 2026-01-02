
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden group transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 dark:hover:shadow-orange-500/20">
      <div className="overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-6">
        <p className="text-sm text-orange-500 mb-2">{category}</p>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden">{description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
            ${price}
          </p>
          <button onClick={() => navigateTo('auth')} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gradient-to-r from-orange-500 to-orange-600 hover:text-white transition-all duration-300">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
