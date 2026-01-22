import React, { useState } from 'react';

interface ProjectDashboardCardProps {
    name: string;
    domain: string;
    description: string;
    logo: string;
    tags: string[];
    status?: 'Live' | 'In Review' | 'Draft' | 'Approved' | 'Rejected' | 'Disabled';
    sales?: number;
    price?: number;
    category?: string;
    adminComment?: string;
    adminAction?: string;
}

const ProjectDashboardCard: React.FC<ProjectDashboardCardProps> = ({ name, domain, description, logo, tags, status, sales, price, category, adminComment, adminAction }) => {
    const [isEnabled, setIsEnabled] = useState(true);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between h-full transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 group">
            <div>
                <div className="flex justify-between items-start mb-5">
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">{name}</h4>
                        {category && (
                            <p className="text-sm text-gray-500 mb-2">{category}</p>
                        )}
                        <a 
                            href={`https://${domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1.5 font-medium transition-colors"
                        >
                            <span>{domain}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                    <div className="w-14 h-14 flex-shrink-0 rounded-xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center shadow-sm group-hover:border-orange-200 transition-colors">
                        <img src={logo} alt={`${name} logo`} className="h-8 w-8 object-contain" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag) => (
                        <span key={tag} className="bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                            {tag}
                        </span>
                    ))}
                </div>
                
                {/* Sales, Price, and Status Info */}
                {(sales !== undefined || price !== undefined || status) && (
                    <div className="mb-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between gap-4 mb-3">
                            {status && (
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                    status === 'Live' || status === 'Approved'
                                        ? 'bg-green-100 text-green-800'
                                        : status === 'In Review'
                                        ? 'bg-orange-100 text-orange-800'
                                        : status === 'Rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : status === 'Disabled'
                                        ? 'bg-gray-200 text-gray-700'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {status}
                                </span>
                            )}
                            {price !== undefined && (
                                <span className="text-lg font-bold text-gray-900">₹{price.toFixed(2)}</span>
                            )}
                        </div>
                        {sales !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="font-medium">{sales} sales</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Admin Message and Action */}
                {adminComment && (
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                {adminAction && (
                                    <div className="mb-2">
                                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                            {adminAction === 'project_disabled' ? 'Project Disabled' : 
                                             adminAction === 'first_warning' ? 'First Warning' : 
                                             adminAction === 'other_action' ? 'Admin Action' : 
                                             adminAction}
                                        </span>
                                    </div>
                                )}
                                <p className="text-sm text-gray-800 font-medium mb-1">Admin Message:</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{adminComment}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                <button className="text-sm font-semibold text-gray-700 bg-gray-50 px-5 py-2.5 rounded-xl hover:bg-orange-500 hover:text-white transition-all duration-300 border border-gray-200 hover:border-orange-500">
                    Documentation
                </button>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {isEnabled ? 'Active' : 'Disabled'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isEnabled}
                            onChange={() => setIsEnabled(!isEnabled)}
                            className="sr-only peer" 
                        />
                        <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-inner"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ProjectDashboardCard;