import React, { useState } from 'react';

const ToggleButton = ({ text, active }: { text: string, active: boolean }) => (
    <button className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${active ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'}`}>
        {text}
    </button>
);

const DashboardHeader: React.FC = () => {
    const [dashboardMode, setDashboardMode] = useState<'buyer' | 'seller'>('buyer');

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mode:</p>
                    <div className="flex items-center p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
                        <button 
                            onClick={() => setDashboardMode('buyer')}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${dashboardMode === 'buyer' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            Buyer
                        </button>
                        <button
                             onClick={() => setDashboardMode('seller')}
                             className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${dashboardMode === 'seller' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            Seller
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
                    <ToggleButton text="All Projects" active={true} />
                    <ToggleButton text="Activated" active={false} />
                    <ToggleButton text="Disabled" active={false} />
                </div>
                <div className="flex space-x-3">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                        <input className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search" />
                    </div>
                    <button className="flex items-center px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-black">
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Add Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
