import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
    change: string;
    changeType: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, change, changeType }) => (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
        <p className={`mt-2 text-sm flex items-center ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'increase' ? 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" transform="rotate(-90 12 12)" /></svg> :
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" transform="rotate(90 12 12)" /></svg>
            }
            {change} vs last month
        </p>
    </div>
);

const SellerAnalyticsPage: React.FC = () => {
    return (
        <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard 
                    title="Project Views" 
                    value="24.5k" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    colorClass="bg-blue-500"
                    change="+15.2%"
                    changeType="increase"
                />
                <StatCard 
                    title="Wishlist Adds" 
                    value="1,204" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>}
                    colorClass="bg-purple-500"
                    change="+8.9%"
                    changeType="increase"
                />
                <StatCard 
                    title="Conversion Rate" 
                    value="4.9%" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    colorClass="bg-green-500"
                    change="-0.5%"
                    changeType="decrease"
                />
            </div>

             <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Traffic Sources</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Where your project views are coming from.</p>
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Direct</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">12,482</span>
                    </div>
                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '51%'}}></div>
                    </div>
                </div>
                 <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Organic Search</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">8,330</span>
                    </div>
                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '34%'}}></div>
                    </div>
                </div>
                 <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Referral</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">3,675</span>
                    </div>
                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '15%'}}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerAnalyticsPage;