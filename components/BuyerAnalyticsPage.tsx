import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { fetchUserData, Purchase } from '../services/buyerApi';

const GET_ALL_PROJECTS_ENDPOINT = 'https://vwqfgtwerj.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Admin_Buyer';

interface ApiProject {
    projectId: string;
    title: string;
    category: string;
    price: number;
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
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
        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-end">
            <div 
                className={`w-full rounded-lg ${colorClass}`}
                style={{ height: `${(value / maxValue) * 100}%` }}
                title={`₹${value}`}
            ></div>
        </div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
);


const BuyerAnalyticsPage: React.FC = () => {
    const { userId } = useAuth();
    const [userData, setUserData] = useState<any>(null);
    const [projects, setProjects] = useState<Map<string, ApiProject>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user data and projects
    useEffect(() => {
        const loadData = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch user data
                const user = await fetchUserData(userId);
                setUserData(user);

                // Fetch all projects to get category information
                const response = await fetch(GET_ALL_PROJECTS_ENDPOINT);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.projects) {
                        const projectMap = new Map<string, ApiProject>();
                        data.projects.forEach((project: ApiProject) => {
                            projectMap.set(project.projectId, project);
                        });
                        setProjects(projectMap);
                    }
                }
            } catch (error) {
                console.error('Error loading analytics data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [userId]);

    // Calculate monthly spend data
    const monthlySpendData = useMemo(() => {
        if (!userData || !userData.purchases) {
            return [];
        }

        const monthMap = new Map<string, number>();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize all months to 0
        const currentDate = new Date();
        const last6Months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            last6Months.push(monthKey);
            monthMap.set(monthKey, 0);
        }

        // Calculate spends for each month
        userData.purchases.forEach((purchase: Purchase) => {
            const purchaseDate = new Date(purchase.purchasedAt);
            const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
            const currentAmount = monthMap.get(monthKey) || 0;
            monthMap.set(monthKey, currentAmount + purchase.priceAtPurchase);
        });

        // Convert to array format
        return last6Months.map(monthKey => {
            const date = new Date(monthKey + '-01');
            return {
                month: monthNames[date.getMonth()],
                amount: monthMap.get(monthKey) || 0,
            };
        });
    }, [userData]);

    const maxSpend = useMemo(() => {
        if (monthlySpendData.length === 0) return 1;
        return Math.max(...monthlySpendData.map(d => d.amount), 1);
    }, [monthlySpendData]);

    // Calculate category spend data
    const categorySpendData = useMemo(() => {
        if (!userData || !userData.purchases) {
            return [];
        }

        const categoryMap = new Map<string, number>();
        let totalSpent = 0;

        userData.purchases.forEach((purchase: Purchase) => {
            const project = projects.get(purchase.projectId);
            const category = project?.category || 'Other';
            const currentAmount = categoryMap.get(category) || 0;
            categoryMap.set(category, currentAmount + purchase.priceAtPurchase);
            totalSpent += purchase.priceAtPurchase;
        });

        // Convert to percentage and sort
        const colors = ['bg-orange-500', 'bg-orange-400', 'bg-orange-600', 'bg-orange-300', 'bg-orange-200'];
        const sortedCategories = Array.from(categoryMap.entries())
            .map(([category, amount], index) => ({
                category,
                amount: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
                color: colors[index % colors.length],
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5); // Top 5 categories

        return sortedCategories;
    }, [userData, projects]);

    // Generate conic gradient for pie chart
    const conicGradient = useMemo(() => {
        if (categorySpendData.length === 0) {
            return 'conic-gradient(#f97316 0% 100%)';
        }

        const colorMap: { [key: string]: string } = {
            'bg-orange-500': '#f97316',
            'bg-orange-400': '#fb923c',
            'bg-orange-600': '#ea580c',
            'bg-orange-300': '#fdba74',
            'bg-orange-200': '#fed7aa',
        };

        let currentPercent = 0;
        const stops = categorySpendData.map((item: { category: string; amount: number; color: string }, _index: number) => {
            const start = currentPercent;
            currentPercent += item.amount;
            const color = colorMap[item.color] || '#f97316';
            return `${color} ${start}% ${currentPercent}%`;
        }).join(', ');

        return `conic-gradient(${stops})`;
    }, [categorySpendData]);

    // Get recent purchases
    const recentPurchases = useMemo(() => {
        if (!userData || !userData.purchases) {
            return [];
        }

        return userData.purchases
            .sort((a: Purchase, b: Purchase) => {
                return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
            })
            .slice(0, 5)
            .map((purchase: Purchase) => {
                const project = projects.get(purchase.projectId);
                return {
                    title: project?.title || `Project ${purchase.projectId}`,
                    date: purchase.purchasedAt.split('T')[0],
                    price: purchase.priceAtPurchase,
                };
            });
    }, [userData, projects]);

    // Calculate favorite category
    const favoriteCategory = useMemo(() => {
        if (categorySpendData.length === 0) return 'N/A';
        return categorySpendData[0].category;
    }, [categorySpendData]);

    // Calculate average project cost
    const avgProjectCost = useMemo(() => {
        if (!userData || !userData.purchases || userData.purchases.length === 0) {
            return 0;
        }
        const total = userData.purchases.reduce((sum: number, p: Purchase) => sum + p.priceAtPurchase, 0);
        return total / userData.purchases.length;
    }, [userData]);

    if (isLoading) {
        return (
            <div className="mt-8 flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Spent" 
                    value={`₹${userData?.totalSpent?.toFixed(2) || '0.00'}`} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
                    colorClass="bg-gradient-to-br from-orange-500 to-orange-600" 
                />
                <StatCard 
                    title="Projects Purchased" 
                    value={String(userData?.totalPurchases || 0)} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} 
                    colorClass="bg-gradient-to-br from-orange-400 to-orange-500" 
                />
                <StatCard 
                    title="Favorite Category" 
                    value={favoriteCategory} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>} 
                    colorClass="bg-gradient-to-br from-orange-600 to-orange-700" 
                />
                <StatCard 
                    title="Avg. Project Cost" 
                    value={`₹${avgProjectCost.toFixed(2)}`} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>} 
                    colorClass="bg-gradient-to-br from-orange-500 to-orange-600" 
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spend (Last 6 Months)</h3>
                    {monthlySpendData.length > 0 ? (
                        <div className="grid grid-cols-6 gap-4">
                            {monthlySpendData.map(data => (
                                <ChartBar key={data.month} label={data.month} value={data.amount} maxValue={maxSpend} colorClass="bg-gradient-to-t from-orange-400 to-orange-600" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No purchase data available</p>
                        </div>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                    {categorySpendData.length > 0 ? (
                        <div className="flex items-center justify-center gap-8">
                            <div className="relative w-32 h-32">
                                <div className="absolute inset-0 rounded-full" style={{ background: conicGradient }}></div>
                                <div className="absolute inset-2 bg-white rounded-full"></div>
                            </div>
                            <ul className="space-y-2">
                                {categorySpendData.map(item => (
                                    <li key={item.category} className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                                        <span className="text-sm text-gray-600">{item.category} ({item.amount}%)</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No category data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Purchases */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchases</h3>
                {recentPurchases.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {recentPurchases.map((item: { title: string; price: number; date: string }, index: number) => (
                            <li key={`${item.title}-${index}`} className="py-3 flex justify-between items-center hover:bg-orange-50/30 px-2 rounded-lg transition-colors">
                                <div>
                                    <p className="font-medium text-gray-800">{item.title}</p>
                                    <p className="text-sm text-gray-500">{item.date}</p>
                                </div>
                                <p className="font-bold text-orange-600">₹{item.price.toFixed(2)}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No recent purchases</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuyerAnalyticsPage;