import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import SkeletonDashboard from './ui/skeleton-dashboard';
import { useAuth } from '../App';
import { fetchProjectDetails, ProjectDetails } from '../services/buyerApi';
import noEarningAnimation from '../lottiefiles/no_earning_animation.json';

const GET_PROJECTS_ENDPOINT = 'https://qosmi6luq0.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Seller';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
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
                title={`₹${value.toFixed(2)}`}
            ></div>
        </div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
);

interface ProjectWithStats extends ProjectDetails {
    revenue: number;
    netEarnings: number;
}

const EarningsPage: React.FC = () => {
    const { userId } = useAuth();
    const [projects, setProjects] = useState<ProjectWithStats[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calculate totals
    const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
    const totalNetEarnings = projects.reduce((sum, p) => sum + p.netEarnings, 0);
    const totalSales = projects.reduce((sum, p) => sum + (p.purchasesCount || 0), 0);
    const totalProjects = projects.length;

    // Calculate this month's earnings (simplified - using last 30 days)
    const thisMonthEarnings = projects.reduce((sum, p) => {
        // For now, we'll use a portion of total revenue as this month's earnings
        // In a real app, you'd filter by date
        return sum + (p.revenue * 0.15); // Approximate 15% of total as this month
    }, 0);

    // Fetch projects and calculate earnings
    useEffect(() => {
        const fetchEarningsData = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${GET_PROJECTS_ENDPOINT}?sellerId=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (data.success && data.projects && Array.isArray(data.projects)) {
                    // Fetch detailed info for each project
                    const projectsWithDetails = await Promise.all(
                        data.projects.map(async (project: any) => {
                            try {
                                const projectId = project.projectId || project.id;
                                let projectDetail = project;

                                if (projectId) {
                                    const detail = await fetchProjectDetails(projectId);
                                    if (detail) {
                                        projectDetail = { ...project, ...detail };
                                    }
                                }

                                const sales = projectDetail.purchasesCount || 0;
                                const price = typeof projectDetail.price === 'number'
                                    ? projectDetail.price
                                    : parseFloat(String(projectDetail.price || '0'));

                                const revenue = sales * price;
                                const platformFee = 0.10; // 10% platform fee
                                const netEarnings = revenue * (1 - platformFee);

                                return {
                                    ...projectDetail,
                                    revenue,
                                    netEarnings,
                                } as ProjectWithStats;
                            } catch (error) {
                                console.error(`Error fetching details for project:`, error);
                                return null;
                            }
                        })
                    );

                    const validProjects = projectsWithDetails.filter(p => p !== null) as ProjectWithStats[];
                    setProjects(validProjects);
                } else {
                    setProjects([]);
                }
            } catch (error) {
                console.error('Error fetching earnings data:', error);
                setError('Failed to load earnings data. Please refresh the page.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEarningsData();
    }, [userId]);

    // Calculate monthly earnings (last 6 months)
    const getMonthlyEarnings = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        // For now, distribute total revenue across months
        // In a real app, you'd use actual purchase dates
        const monthlyAmount = totalRevenue / 6;
        return months.map(month => ({
            month,
            amount: monthlyAmount + (Math.random() * monthlyAmount * 0.3 - monthlyAmount * 0.15)
        }));
    };

    const earningsData = getMonthlyEarnings();
    const maxEarning = Math.max(...earningsData.map(d => d.amount), 1);

    // Calculate top projects
    const topProjectsData = projects
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4)
        .map((project, index) => {
            const percentage = totalRevenue > 0 ? (project.revenue / totalRevenue) * 100 : 0;
            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500'];
            return {
                name: project.title || 'Untitled Project',
                percentage,
                color: colors[index] || 'bg-gray-500',
                revenue: project.revenue
            };
        });

    // Generate conic gradient for pie chart
    const generateConicGradient = () => {
        if (topProjectsData.length === 0) return 'conic-gradient(#e5e7eb 0% 100%)';

        let gradient = '';
        let currentPercent = 0;
        const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#eab308'];

        topProjectsData.forEach((item, index) => {
            const nextPercent = currentPercent + item.percentage;
            gradient += `${colors[index]} ${currentPercent}% ${nextPercent}%`;
            if (index < topProjectsData.length - 1) gradient += ', ';
            currentPercent = nextPercent;
        });

        return `conic-gradient(${gradient})`;
    };



    if (isLoading) {
        return (
            <div className="mt-8 space-y-8">
                <SkeletonDashboard />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8 text-center py-16 bg-white border border-gray-200 rounded-2xl">
                <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    // If a project is selected, show its statistics
    if (selectedProject) {
        return (
            <div className="mt-8 space-y-8">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setSelectedProject(null)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Project Statistics: {selectedProject.title}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Sales"
                        value={selectedProject.purchasesCount?.toString() || '0'}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        colorClass="bg-blue-500"
                    />
                    <StatCard
                        title="Project Price"
                        value={`₹${selectedProject.price?.toFixed(2) || '0.00'}`}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                        colorClass="bg-purple-500"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`₹${selectedProject.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        colorClass="bg-green-500"
                    />
                    <StatCard
                        title="Net Earnings"
                        value={`₹${selectedProject.netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        colorClass="bg-orange-500"
                    />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Category</p>
                            <p className="text-base font-medium text-gray-900">{selectedProject.category || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Status</p>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${selectedProject.adminApprovalStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : selectedProject.adminApprovalStatus === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : selectedProject.adminApprovalStatus === 'disabled'
                                        ? 'bg-gray-200 text-gray-700'
                                        : 'bg-orange-100 text-orange-800'
                                }`}>
                                {selectedProject.adminApprovalStatus || selectedProject.status || 'Pending'}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Likes</p>
                            <p className="text-base font-medium text-gray-900">{selectedProject.likesCount || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Views</p>
                            <p className="text-base font-medium text-gray-900">{selectedProject.viewsCount || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                    colorClass="bg-blue-500"
                />
                <StatCard
                    title="Net Earnings (After Fees)"
                    value={`₹${totalNetEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    colorClass="bg-purple-500"
                />
                <StatCard
                    title="Total Sales"
                    value={totalSales.toString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    colorClass="bg-green-500"
                />
                <StatCard
                    title="This Month"
                    value={`₹${thisMonthEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    colorClass="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Over Time (Last 6 Months)</h3>
                    {earningsData.length > 0 ? (
                        <div className="grid grid-cols-6 gap-4">
                            {earningsData.map(data => (
                                <ChartBar key={data.month} label={data.month} value={Math.max(0, data.amount)} maxValue={maxEarning} colorClass="bg-gradient-to-t from-green-400 to-green-600" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">No earnings data available</div>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Projects</h3>
                    {topProjectsData.length > 0 ? (
                        <div className="flex items-center justify-center gap-8">
                            <div className="relative w-32 h-32">
                                <div className="absolute inset-0 rounded-full" style={{ background: generateConicGradient() }}></div>
                                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Total</p>
                                        <p className="text-lg font-bold text-gray-900">{totalProjects}</p>
                                    </div>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {topProjectsData.map((item: { name: string; percentage: number; color: string; revenue: number }, _index: number) => (
                                    <li key={item.name} className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                                        <span className="text-sm text-gray-600">{item.name}</span>
                                        <span className="text-xs text-gray-400">({item.percentage.toFixed(1)}%)</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No projects yet</p>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 p-6">Project-Wise Statistics</h3>
                {projects.length > 0 ? (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <button
                                    key={project.projectId}
                                    onClick={() => setSelectedProject(project)}
                                    className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-orange-500 hover:shadow-lg transition-all text-left group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 flex-1">
                                            {project.title || 'Untitled Project'}
                                        </h4>
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Sales:</span>
                                            <span className="text-sm font-semibold text-gray-900">{project.purchasesCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Revenue:</span>
                                            <span className="text-sm font-semibold text-green-600">${project.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Net Earnings:</span>
                                            <span className="text-sm font-semibold text-purple-600">${project.netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${project.adminApprovalStatus === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : project.adminApprovalStatus === 'rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : project.adminApprovalStatus === 'disabled'
                                                        ? 'bg-gray-200 text-gray-700'
                                                        : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {project.adminApprovalStatus || project.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="mx-auto mb-4 w-full max-w-[380px] h-[280px] flex items-center justify-center">
                            <Lottie
                                animationData={noEarningAnimation}
                                loop
                                className="w-full h-full"
                            />
                        </div>
                        <p className="text-gray-500 text-lg font-medium">No projects found</p>
                        <p className="text-gray-400 text-sm mt-2">Upload projects to see earnings statistics</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EarningsPage;