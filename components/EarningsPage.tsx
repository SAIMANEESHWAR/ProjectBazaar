import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

interface ChartBarProps {
    label: string;
    value: number;
    maxValue: number;
    colorClass: string;
}

const ChartBar: React.FC<ChartBarProps> = ({ label, value, maxValue, colorClass }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-end">
            <div 
                className={`w-full rounded-lg ${colorClass}`}
                style={{ height: `${(value / maxValue) * 100}%` }}
                title={`$${value.toFixed(2)}`}
            ></div>
        </div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
    </div>
);

const EarningsPage: React.FC = () => {
    const earningsData = [
        { month: 'Jan', amount: 850 }, { month: 'Feb', amount: 1200 }, { month: 'Mar', amount: 950 },
        { month: 'Apr', amount: 1500 }, { month: 'May', amount: 1350 }, { month: 'Jun', amount: 1600 },
    ];
    const maxEarning = Math.max(...earningsData.map(d => d.amount));

    const topProjectsData = [
        { name: 'E-commerce Platform', percentage: 35, color: 'bg-blue-500' },
        { name: 'Fintech App UI Kit', percentage: 25, color: 'bg-purple-500' },
        { name: 'Social Media App', percentage: 20, color: 'bg-green-500' },
        { name: 'Other', percentage: 20, color: 'bg-yellow-500' },
    ];
    const conicGradient = `conic-gradient(
        #3b82f6 0% 35%,
        #8b5cf6 35% 60%,
        #22c55e 60% 80%,
        #eab308 80% 100%
    )`;

    const recentSales = [
        { id: 'sale-1', project: 'Fintech App UI Kit', date: '2024-06-22', amount: 29.99, status: 'Completed' },
        { id: 'sale-2', project: 'E-commerce Platform', date: '2024-06-21', amount: 49.99, status: 'Completed' },
        { id: 'sale-3', project: 'Social Media App', date: '2024-06-20', amount: 59.99, status: 'Pending' },
        { id: 'sale-4', project: 'Task Management Tool', date: '2024-06-19', amount: 44.99, status: 'Completed' },
    ];
    
    return (
        <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value="$8,450" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} colorClass="bg-blue-500" />
                <StatCard title="Net Earnings (After Fees)" value="$7,605" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} colorClass="bg-purple-500" />
                <StatCard title="This Month" value="$1,600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} colorClass="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Earnings Over Time</h3>
                    <div className="grid grid-cols-6 gap-4">
                        {earningsData.map(data => (
                            <ChartBar key={data.month} label={data.month} value={data.amount} maxValue={maxEarning} colorClass="bg-gradient-to-t from-green-400 to-green-600" />
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Projects</h3>
                    <div className="flex items-center justify-center gap-8">
                         <div className="relative w-32 h-32">
                            <div className="absolute inset-0 rounded-full" style={{ background: conicGradient }}></div>
                            <div className="absolute inset-2 bg-white dark:bg-gray-900/50 rounded-full"></div>
                        </div>
                        <ul className="space-y-2">
                            {topProjectsData.map(item => (
                                <li key={item.name} className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-6">Recent Sales</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-800">
                             {recentSales.map((sale) => (
                                <tr key={sale.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{sale.project}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{sale.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200">${sale.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    );
};

export default EarningsPage;