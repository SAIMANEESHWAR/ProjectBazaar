import React, { useState } from 'react';

interface ProjectDashboardCardProps {
    name: string;
    domain: string;
    description: string;
    logo: string;
    tags: string[];
}

const ProjectDashboardCard: React.FC<ProjectDashboardCardProps> = ({ name, domain, description, logo, tags }) => {
    const [isEnabled, setIsEnabled] = useState(true);

    return (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col justify-between h-full transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{name}</h4>
                        <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                            {domain}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center">
                        <img src={logo} alt={`${name} logo`} className="h-7 w-7 object-contain" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {description}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tag) => (
                        <span key={tag} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">
                        {tag}
                        </span>
                    ))}
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <button className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Documentation
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={isEnabled}
                        onChange={() => setIsEnabled(!isEnabled)}
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                </label>
            </div>
        </div>
    );
};

export default ProjectDashboardCard;