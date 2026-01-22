import React, { useState, useEffect } from 'react';
import type { BuyerProject } from '../BuyerProjectCard';

interface PendingProject extends BuyerProject {
    sellerEmail: string;
    sellerName: string;
    sellerId: string;
    uploadedDate: string;
    status: 'pending' | 'in-review' | 'active' | 'disabled' | 'rejected';
}

interface ProjectManagementPageProps {
    onViewUser?: (user: { id: string; name: string; email: string }) => void;
    onViewProjectDetails?: (project: PendingProject) => void;
}

const GET_ALL_PROJECTS_ENDPOINT = 'https://vwqfgtwerj.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Admin_Buyer';
const ADMIN_APPROVAL_ENDPOINT = 'https://wt58x2f09d.execute-api.ap-south-2.amazonaws.com/default/Admin_approved_or_rejected';

interface ApiProject {
    projectId: string;
    title: string;
    description: string;
    price: number;
    category: string;
    tags: string[];
    thumbnailUrl: string;
    sellerId: string;
    sellerEmail: string;
    status: string;
    adminApproved?: boolean;
    adminApprovalStatus?: string; // "approved" | "rejected" | undefined
    uploadedAt: string;
    documentationUrl?: string;
    youtubeVideoUrl?: string;
    purchasesCount?: number;
    likesCount?: number;
    viewsCount?: number;
    updatedAt?: string;
}

const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({ onViewUser, onViewProjectDetails }) => {
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [projects, setProjects] = useState<PendingProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'disabled' | 'all'>('pending');
    const [updatingProjects, setUpdatingProjects] = useState<Set<string>>(new Set());

    // Map API project to PendingProject interface
    const mapApiProjectToComponent = (apiProject: ApiProject): PendingProject => {
        // Map status based on adminApprovalStatus (priority), adminApproved, and status fields
        // Lambda function sets both adminApprovalStatus and status to the same value
        let status: 'pending' | 'in-review' | 'active' | 'disabled' | 'rejected' = 'pending';
        
        // Priority 1: Check adminApprovalStatus (set by Lambda function)
        if (apiProject.adminApprovalStatus === 'approved') {
            status = 'active';
        } else if (apiProject.adminApprovalStatus === 'rejected') {
            status = 'rejected';
        } else if (apiProject.adminApprovalStatus === 'disabled') {
            status = 'disabled';
        }
        // Priority 2: Check status field (may also be set by Lambda)
        else if (apiProject.status === 'approved') {
            status = 'active';
        } else if (apiProject.status === 'rejected') {
            status = 'rejected';
        } else if (apiProject.status === 'disabled') {
            status = 'disabled';
        } else if (apiProject.status === 'pending') {
            status = 'pending';
        }
        // Priority 3: Check adminApproved boolean (legacy field)
        else if (apiProject.adminApproved === true) {
            if (apiProject.status === 'active' || apiProject.status === 'live') {
                status = 'active';
            } else if (apiProject.status === 'disabled' || apiProject.status === 'inactive') {
                status = 'disabled';
            } else {
                status = 'active';
            }
        } else if (apiProject.adminApproved === false) {
            if (apiProject.status === 'pending' || !apiProject.status) {
                status = 'pending';
            } else if (apiProject.status === 'in-review' || apiProject.status === 'review') {
                status = 'in-review';
            } else if (apiProject.status === 'rejected') {
                status = 'rejected';
            } else {
                status = 'pending';
            }
        }
        // Default: pending if no status information
        else {
            status = 'pending';
        }

        // Format uploaded date
        const uploadedDate = apiProject.uploadedAt 
            ? new Date(apiProject.uploadedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        // Extract seller name from email (or use email as fallback)
        const sellerName = apiProject.sellerEmail 
            ? apiProject.sellerEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            : 'Unknown Seller';

        return {
            id: apiProject.projectId,
            imageUrl: apiProject.thumbnailUrl || 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
            category: apiProject.category || 'Uncategorized',
            title: apiProject.title || 'Untitled Project',
            description: apiProject.description || 'No description available',
            tags: apiProject.tags || [],
            price: typeof apiProject.price === 'number' ? apiProject.price : parseFloat(String(apiProject.price || '0')),
            isPremium: false, // API doesn't provide this, can be updated later
            hasDocumentation: !!apiProject.documentationUrl,
            hasExecutionVideo: !!apiProject.youtubeVideoUrl,
            sellerEmail: apiProject.sellerEmail || '',
            sellerName: sellerName,
            sellerId: apiProject.sellerId || '',
            uploadedDate: uploadedDate,
            status: status
        };
    };

    // Fetch projects from API
    const fetchProjects = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch(GET_ALL_PROJECTS_ENDPOINT);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch projects: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.projects) {
                const mappedProjects = data.projects.map((apiProject: ApiProject) => 
                    mapApiProjectToComponent(apiProject)
                );
                setProjects(mappedProjects);
                console.log('Fetched projects:', mappedProjects.length);
                console.log('Projects status breakdown:', {
                    pending: mappedProjects.filter((p: PendingProject) => p.status === 'pending' || p.status === 'in-review').length,
                    approved: mappedProjects.filter((p: PendingProject) => p.status === 'active').length,
                    rejected: mappedProjects.filter((p: PendingProject) => p.status === 'rejected').length
                });
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch projects on component mount
    useEffect(() => {
        fetchProjects();
    }, []);

    // Call API to approve, reject, or disable project
    const updateProjectStatus = async (projectId: string, adminApprovalStatus: 'approved' | 'rejected' | 'disabled') => {
        setUpdatingProjects(prev => new Set(prev).add(projectId));
        
        try {
            const response = await fetch(ADMIN_APPROVAL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: projectId,
                    adminApprovalStatus: adminApprovalStatus
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update project status: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Update local state immediately for better UX
                // Lambda returns the updated project with adminApprovalStatus and status set
                setProjects(projects.map(p => {
                    if (p.id === projectId) {
                        // Map the status from API response
                        const newStatus: 'pending' | 'in-review' | 'active' | 'disabled' | 'rejected' = 
                            adminApprovalStatus === 'approved' ? 'active' :
                            adminApprovalStatus === 'rejected' ? 'rejected' :
                            adminApprovalStatus === 'disabled' ? 'disabled' :
                            'pending';
                        return {
                            ...p,
                            status: newStatus
                        };
                    }
                    return p;
                }));
                
                console.log(`Project ${projectId} ${adminApprovalStatus} successfully`);
                console.log('Updated project data:', data.project);
                
                // Refresh projects list to ensure data consistency with backend
                setTimeout(() => {
                    fetchProjects();
                }, 500);
            } else {
                // Handle error response from Lambda
                const errorMessage = data.error?.message || data.message || 'Failed to update project status';
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('Error updating project status:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            alert(`Failed to ${adminApprovalStatus === 'approved' ? 'approve' : 'reject'} project: ${errorMessage}`);
        } finally {
            setUpdatingProjects(prev => {
                const newSet = new Set(prev);
                newSet.delete(projectId);
                return newSet;
            });
        }
    };

    const handleApprove = (projectId: string) => {
        updateProjectStatus(projectId, 'approved');
    };

    const handleReject = (projectId: string) => {
        updateProjectStatus(projectId, 'rejected');
    };

    // Disable project - calls API with "disabled" status
    const handleDisable = async (projectId: string) => {
        setUpdatingProjects(prev => new Set(prev).add(projectId));
        
        try {
            const response = await fetch(ADMIN_APPROVAL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: projectId,
                    adminApprovalStatus: 'disabled'
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to disable project: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Update local state immediately for better UX
                setProjects(projects.map(p => {
                    if (p.id === projectId) {
                        return {
                            ...p,
                            status: 'disabled' as const
                        };
                    }
                    return p;
                }));
                
                console.log(`Project ${projectId} disabled successfully`);
                console.log('Updated project data:', data.project);
                
                // Refresh projects list to ensure data consistency with backend
                setTimeout(() => {
                    fetchProjects();
                }, 500);
            } else {
                const errorMessage = data.error?.message || data.message || 'Failed to disable project';
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('Error disabling project:', err);
            alert(`Failed to disable project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setUpdatingProjects(prev => {
                const newSet = new Set(prev);
                newSet.delete(projectId);
                return newSet;
            });
        }
    };

    const handleEnable = async (projectId: string) => {
        setUpdatingProjects(prev => new Set(prev).add(projectId));
        
        try {
            // Re-enable by approving the project
            // This will set it back to active status
            const response = await fetch(ADMIN_APPROVAL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: projectId,
                    adminApprovalStatus: 'approved'
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to enable project: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Update local state
                setProjects(projects.map(p => {
                    if (p.id === projectId) {
                        return {
                            ...p,
                            status: 'active' as const
                        };
                    }
                    return p;
                }));
                
                console.log(`Project ${projectId} enabled successfully`);
                
                // Refresh projects list to ensure data consistency with backend
                setTimeout(() => {
                    fetchProjects();
                }, 500);
            } else {
                const errorMessage = data.error?.message || data.message || 'Failed to enable project';
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('Error enabling project:', err);
            alert(`Failed to enable project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setUpdatingProjects(prev => {
                const newSet = new Set(prev);
                newSet.delete(projectId);
                return newSet;
            });
        }
    };

    const handleViewUser = (project: PendingProject) => {
        if (onViewUser) {
            onViewUser({
                id: project.sellerId,
                name: project.sellerName,
                email: project.sellerEmail,
            });
        }
    };

    const pendingProjects = projects.filter(p => p.status === 'pending' || p.status === 'in-review');
    const approvedProjects = projects.filter(p => p.status === 'active');
    const rejectedProjects = projects.filter(p => p.status === 'rejected');
    const disabledProjects = projects.filter(p => p.status === 'disabled');

    // Get projects based on active tab
    const getFilteredProjects = () => {
        switch (activeTab) {
            case 'pending':
                return pendingProjects;
            case 'approved':
                return approvedProjects;
            case 'rejected':
                return rejectedProjects;
            case 'disabled':
                return disabledProjects;
            case 'all':
                return projects;
            default:
                return projects;
        }
    };

    const filteredProjects = getFilteredProjects();

    return (
        <div className="space-y-6">
            {/* Header with Refresh Button */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
                <button
                    onClick={fetchProjects}
                    disabled={isLoading}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isLoading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-800 font-medium">Error: {error}</p>
                        <button
                            onClick={fetchProjects}
                            className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && projects.length === 0 && (
                <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading projects...</p>
                </div>
            )}

            {/* Stats */}
            {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-700">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{pendingProjects.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-700">Approved</p>
                    <p className="text-2xl font-bold text-green-900">{approvedProjects.length}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-red-700">Rejected</p>
                    <p className="text-2xl font-bold text-red-900">{rejectedProjects.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700">Disabled</p>
                    <p className="text-2xl font-bold text-gray-900">{disabledProjects.length}</p>
                </div>
            </div>
            )}

            {/* Tabs for filtering projects */}
            {!isLoading && projects.length > 0 && (
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                activeTab === 'pending'
                                    ? 'bg-yellow-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Pending ({pendingProjects.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('approved')}
                            className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                activeTab === 'approved'
                                    ? 'bg-green-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Approved ({approvedProjects.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('rejected')}
                            className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                activeTab === 'rejected'
                                    ? 'bg-red-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Rejected ({rejectedProjects.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('disabled')}
                            className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                activeTab === 'disabled'
                                    ? 'bg-gray-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Disabled ({disabledProjects.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                activeTab === 'all'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Projects ({projects.length})
                        </button>
                    </div>
                </div>
            )}

            {/* View Mode Toggle */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'table' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Table View
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'grid' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Grid View
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isLoading && projects.length === 0 && !error && (
                <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 font-medium text-lg mb-2">No projects found</p>
                    <p className="text-gray-500 text-sm">Projects will appear here once sellers upload them.</p>
                </div>
            )}

            {!isLoading && projects.length > 0 && (
            <>
            {viewMode === 'table' ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-3/4">Project Name</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center">
                                            <p className="text-gray-500 font-medium">No {activeTab === 'all' ? '' : activeTab} projects found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                filteredProjects.map((project) => {
                                    const isUpdating = updatingProjects.has(project.id);
                                    return (
                                    <tr key={project.id} className="hover:bg-orange-50/30 transition-colors">
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex items-start gap-4">
                                                <img 
                                                    className="h-20 w-20 rounded-xl object-cover shadow-md flex-shrink-0" 
                                                    src={project.imageUrl} 
                                                    alt={project.title} 
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <h3 className="text-lg font-bold text-gray-900">{project.title}</h3>
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${
                                                            project.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' :
                                                            project.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                                            project.status === 'in-review' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                            project.status === 'disabled' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                                                            'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                        }`}>
                                                            {project.status === 'active' ? 'Active' :
                                                             project.status === 'in-review' ? 'In Review' :
                                                             project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                                        </span>
                                                        {project.isPremium && (
                                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center gap-1 whitespace-nowrap">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                                PREMIUM
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{project.description}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            <button
                                                                onClick={() => handleViewUser(project)}
                                                                className="hover:text-orange-600 transition-colors font-medium"
                                                            >
                                                                {project.sellerName}
                                                            </button>
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 font-medium">
                                                            {project.category}
                                                        </span>
                                                        <span className="font-semibold text-gray-700">₹{project.price.toFixed(2)}</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span>Uploaded: {project.uploadedDate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top text-right">
                                            <div className="flex flex-col gap-2 items-end justify-start">
                                                <button
                                                    onClick={() => onViewProjectDetails?.(project)}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg whitespace-nowrap"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    More Details
                                                </button>
                                                {(project.status === 'pending' || project.status === 'in-review') && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(project.id)}
                                                            disabled={isUpdating}
                                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {isUpdating ? (
                                                                <>
                                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                    </svg>
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                project.status === 'pending' ? 'Accept' : 'Approve'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(project.id)}
                                                            disabled={isUpdating}
                                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {isUpdating ? (
                                                                <>
                                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                    </svg>
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                'Reject'
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                                {project.status === 'active' && (
                                                    <button
                                                        onClick={() => handleDisable(project.id)}
                                                        disabled={updatingProjects.has(project.id)}
                                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        {updatingProjects.has(project.id) ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            'Disable'
                                                        )}
                                                    </button>
                                                )}
                                                {project.status === 'disabled' && (
                                                    <button
                                                        onClick={() => handleEnable(project.id)}
                                                        disabled={updatingProjects.has(project.id)}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        {updatingProjects.has(project.id) ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            'Enable'
                                                        )}
                                                    </button>
                                                )}
                                                {project.status === 'rejected' && (
                                                    <button
                                                        onClick={() => handleApprove(project.id)}
                                                        disabled={isUpdating}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        {isUpdating ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            'Approve'
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.length === 0 ? (
                        <div className="col-span-full bg-white rounded-lg p-12 border border-gray-200 text-center">
                            <p className="text-gray-500 font-medium">No {activeTab === 'all' ? '' : activeTab} projects found.</p>
                        </div>
                    ) : (
                    filteredProjects.map((project) => {
                        const isUpdating = updatingProjects.has(project.id);
                        return (
                        <div key={project.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                            <img src={project.imageUrl} alt={project.title} className="w-full h-48 object-cover" />
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                        {project.category}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                                        project.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        project.status === 'in-review' ? 'bg-blue-100 text-blue-800' :
                                        project.status === 'disabled' ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {project.status === 'active' ? 'Active' :
                                         project.status === 'in-review' ? 'In Review' :
                                         project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                                <div className="mb-4">
                                    <button
                                        onClick={() => handleViewUser(project)}
                                        className="text-left hover:text-orange-600 transition-colors group"
                                    >
                                        <p className="text-sm font-medium text-gray-500 group-hover:text-orange-600">Seller: {project.sellerName}</p>
                                        <p className="text-xs text-gray-400">{project.sellerEmail}</p>
                                    </button>
                                    <p className="text-xs text-gray-400 mt-1">Uploaded: {project.uploadedDate}</p>
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xl font-bold text-orange-600">₹{project.price.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => onViewProjectDetails?.(project)}
                                    className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold mb-2"
                                >
                                    More Details
                                </button>
                                {(project.status === 'pending' || project.status === 'in-review') && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(project.id)}
                                            disabled={isUpdating}
                                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                project.status === 'pending' ? 'Accept' : 'Approve'
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleReject(project.id)}
                                            disabled={isUpdating}
                                            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                'Reject'
                                            )}
                                        </button>
                                    </div>
                                )}
                                {project.status === 'active' && (
                                    <button
                                        onClick={() => handleDisable(project.id)}
                                        disabled={updatingProjects.has(project.id)}
                                        className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {updatingProjects.has(project.id) ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            'Disable'
                                        )}
                                    </button>
                                )}
                                {project.status === 'disabled' && (
                                    <button
                                        onClick={() => handleEnable(project.id)}
                                        disabled={updatingProjects.has(project.id)}
                                        className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {updatingProjects.has(project.id) ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            'Enable'
                                        )}
                                    </button>
                                )}
                                {project.status === 'rejected' && (
                                    <button
                                        onClick={() => handleApprove(project.id)}
                                        disabled={isUpdating}
                                        className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            'Approve'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                        );
                    })
                    )}
                </div>
            )}
            </>
            )}
        </div>
    );
};

export default ProjectManagementPage;

