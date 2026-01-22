import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { fetchProjectDetails, ProjectDetails } from '../services/buyerApi';

const GET_PROJECTS_ENDPOINT = 'https://qosmi6luq0.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Seller';

interface ProjectAnalytics extends ProjectDetails {
    conversionRate: number;
    revenue: number;
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
    change: string;
    changeType: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, change, changeType }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} shadow-sm`}>
                {icon}
            </div>
            <div>
                 <p className="text-sm text-gray-500">{title}</p>
                 <p className="text-2xl font-bold text-gray-900">{value}</p>
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
    const { userId } = useAuth();
    const [projects, setProjects] = useState<ProjectAnalytics[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calculate overall analytics
    const totalViews = projects.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    const totalLikes = projects.reduce((sum, p) => sum + (p.likesCount || 0), 0);
    const totalSales = projects.reduce((sum, p) => sum + (p.purchasesCount || 0), 0);
    const avgConversionRate = projects.length > 0 
        ? projects.reduce((sum, p) => sum + p.conversionRate, 0) / projects.length 
        : 0;

    // Calculate changes (simplified - in real app, compare with previous period)
    const viewsChange = totalViews > 0 ? '+12.5%' : '0%';
    const likesChange = totalLikes > 0 ? '+8.3%' : '0%';
    const conversionChange = avgConversionRate > 0 ? (avgConversionRate > 3 ? '+2.1%' : '-0.5%') : '0%';

    useEffect(() => {
        const fetchAnalyticsData = async () => {
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

                                const views = projectDetail.viewsCount || 0;
                                const sales = projectDetail.purchasesCount || 0;
                                const conversionRate = views > 0 ? (sales / views) * 100 : 0;
                                const price = typeof projectDetail.price === 'number' 
                                    ? projectDetail.price 
                                    : parseFloat(String(projectDetail.price || '0'));
                                const revenue = sales * price;

                                return {
                                    ...projectDetail,
                                    conversionRate,
                                    revenue,
                                } as ProjectAnalytics;
                            } catch (error) {
                                console.error(`Error fetching details for project:`, error);
                                return null;
                            }
                        })
                    );

                    const validProjects = projectsWithDetails.filter(p => p !== null) as ProjectAnalytics[];
                    setProjects(validProjects);
                } else {
                    setProjects([]);
                }
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setError('Failed to load analytics data. Please refresh the page.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [userId]);

    if (isLoading) {
        return (
            <div className="mt-8 flex items-center justify-center py-16">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500 text-lg font-medium">Loading analytics...</p>
                </div>
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

    // If a project is selected, show its detailed analytics
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
                    <h2 className="text-2xl font-bold text-gray-900">Analytics: {selectedProject.title}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Views" 
                        value={selectedProject.viewsCount?.toLocaleString() || '0'} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        colorClass="bg-gradient-to-br from-orange-500 to-orange-600"
                        change="+12.5%"
                        changeType="increase"
                    />
                    <StatCard 
                        title="Likes" 
                        value={selectedProject.likesCount?.toLocaleString() || '0'} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>}
                        colorClass="bg-gradient-to-br from-orange-400 to-orange-500"
                        change="+8.3%"
                        changeType="increase"
                    />
                    <StatCard 
                        title="Sales" 
                        value={selectedProject.purchasesCount?.toLocaleString() || '0'} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        colorClass="bg-gradient-to-br from-green-500 to-green-600"
                        change="+15.2%"
                        changeType="increase"
                    />
                    <StatCard 
                        title="Conversion Rate" 
                        value={`${selectedProject.conversionRate.toFixed(2)}%`} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                        colorClass="bg-gradient-to-br from-purple-500 to-purple-600"
                        change={selectedProject.conversionRate > 3 ? '+2.1%' : '-0.5%'}
                        changeType={selectedProject.conversionRate > 3 ? 'increase' : 'decrease'}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Views to Sales Conversion</span>
                                    <span className="text-sm font-semibold text-gray-900">{selectedProject.conversionRate.toFixed(2)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full" 
                                        style={{width: `${Math.min(selectedProject.conversionRate * 10, 100)}%`}}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Revenue Generated</span>
                                    <span className="text-sm font-semibold text-green-600">₹{selectedProject.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" 
                                        style={{width: `${Math.min((selectedProject.revenue / Math.max(...projects.map(p => p.revenue), 1)) * 100, 100)}%`}}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Engagement Rate (Likes/Views)</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {selectedProject.viewsCount && selectedProject.viewsCount > 0 
                                            ? ((selectedProject.likesCount || 0) / selectedProject.viewsCount * 100).toFixed(2)
                                            : '0'}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full" 
                                        style={{
                                            width: `${Math.min(
                                                selectedProject.viewsCount && selectedProject.viewsCount > 0 
                                                    ? ((selectedProject.likesCount || 0) / selectedProject.viewsCount * 100) * 2
                                                    : 0, 
                                                100
                                            )}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Category</span>
                                <span className="text-sm font-medium text-gray-900">{selectedProject.category || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Price</span>
                                <span className="text-sm font-medium text-gray-900">₹{selectedProject.price?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Status</span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    selectedProject.adminApprovalStatus === 'approved' 
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
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-500">Average Sale Value</span>
                                <span className="text-sm font-medium text-gray-900">
                                    ₹{selectedProject.purchasesCount && selectedProject.purchasesCount > 0 
                                        ? (selectedProject.revenue / selectedProject.purchasesCount).toFixed(2)
                                        : '0.00'}
                                </span>
                            </div>
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
                    title="Total Views" 
                    value={totalViews.toLocaleString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    colorClass="bg-gradient-to-br from-orange-500 to-orange-600"
                    change={viewsChange}
                    changeType="increase"
                />
                <StatCard 
                    title="Total Likes" 
                    value={totalLikes.toLocaleString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>}
                    colorClass="bg-gradient-to-br from-orange-400 to-orange-500"
                    change={likesChange}
                    changeType="increase"
                />
                <StatCard 
                    title="Total Sales" 
                    value={totalSales.toLocaleString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    colorClass="bg-gradient-to-br from-green-500 to-green-600"
                    change="+15.2%"
                    changeType="increase"
                />
                <StatCard 
                    title="Avg Conversion Rate" 
                    value={`${avgConversionRate.toFixed(2)}%`} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    colorClass="bg-gradient-to-br from-purple-500 to-purple-600"
                    change={conversionChange}
                    changeType={avgConversionRate > 3 ? 'increase' : 'decrease'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Projects</h3>
                    {projects.length > 0 ? (
                        <div className="space-y-4">
                            {projects
                                .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
                                .slice(0, 5)
                                .map((project, index) => {
                                    const maxViews = Math.max(...projects.map(p => p.viewsCount || 0), 1);
                                    const percentage = ((project.viewsCount || 0) / maxViews) * 100;
                                    return (
                                        <div key={project.projectId} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                                                    {index + 1}. {project.title || 'Untitled Project'}
                                                </span>
                                                <span className="text-sm font-semibold text-gray-900">{project.viewsCount?.toLocaleString() || 0} views</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" 
                                                    style={{width: `${percentage}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No projects yet</p>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Conversion Rates</h3>
                    {projects.length > 0 ? (
                        <div className="space-y-4">
                            {projects
                                .sort((a, b) => b.conversionRate - a.conversionRate)
                                .slice(0, 5)
                                .map((project, index) => {
                                    const maxConversion = Math.max(...projects.map(p => p.conversionRate), 1);
                                    const percentage = (project.conversionRate / maxConversion) * 100;
                                    return (
                                        <div key={project.projectId} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                                                    {index + 1}. {project.title || 'Untitled Project'}
                                                </span>
                                                <span className="text-sm font-semibold text-green-600">{project.conversionRate.toFixed(2)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" 
                                                    style={{width: `${percentage}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No projects yet</p>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 p-6">Project-Wise Analytics</h3>
                {projects.length > 0 ? (
                    <div className="p-6 pt-0">
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
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Views</p>
                                                <p className="text-sm font-semibold text-gray-900">{project.viewsCount?.toLocaleString() || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Likes</p>
                                                <p className="text-sm font-semibold text-gray-900">{project.likesCount?.toLocaleString() || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Sales</p>
                                                <p className="text-sm font-semibold text-green-600">{project.purchasesCount?.toLocaleString() || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Conversion</p>
                                                <p className="text-sm font-semibold text-purple-600">{project.conversionRate.toFixed(2)}%</p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Revenue</span>
                                                <span className="text-sm font-semibold text-green-600">
                                                    ₹{project.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No projects found</p>
                        <p className="text-gray-400 text-sm mt-2">Upload projects to see analytics</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerAnalyticsPage;