import React, { useState, useEffect, useMemo } from 'react';

const GET_REPORTS_ENDPOINT = 'https://0en59tzhoa.execute-api.ap-south-2.amazonaws.com/default/Get_ReportDetails_by_sellerid_buyerId_ReportId';
const GET_PROJECT_DETAILS_ENDPOINT = 'https://8y8bbugmbd.execute-api.ap-south-2.amazonaws.com/default/Get_project_details_by_projectId';
const GET_USER_DETAILS_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';
const ADMIN_APPROVAL_ENDPOINT = 'https://wt58x2f09d.execute-api.ap-south-2.amazonaws.com/default/Admin_approved_or_rejected';
const UPDATE_REPORT_STATUS_ENDPOINT = 'https://0en59tzhoa.execute-api.ap-south-2.amazonaws.com/default/Get_ReportDetails_by_sellerid_buyerId_ReportId';

interface ApiReport {
    reportId: string;
    buyerId: string;
    projectId: string;
    sellerId: string;
    reason: string;
    description: string;
    attachments?: string[];
    status: string;
    adminAction?: string | null;
    adminComment?: string | null;
    createdAt: string;
    updatedAt: string;
}

interface ProjectDetails {
    projectId: string;
    title: string;
    thumbnailUrl?: string;
    category?: string;
    price?: number;
    description?: string;
}

interface UserDetails {
    userId: string;
    email?: string;
    fullName?: string;
}

interface FraudReport {
    id: string;
    reportId: string;
    projectId: string;
    projectTitle: string;
    projectImage: string;
    reportedBy: string;
    reporterEmail: string;
    reportedDate: string;
    message: string;
    reason: string;
    attachments: string[];
    status: 'pending' | 'resolved' | 'dismissed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    sellerName?: string;
    sellerEmail?: string;
    adminComment?: string | null;
}

interface FraudManagementPageProps {
    onViewReport?: (report: FraudReport) => void;
}

const FraudManagementPage: React.FC<FraudManagementPageProps> = ({ onViewReport }) => {
    const [reports, setReports] = useState<FraudReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
    const [reasonFilter, setReasonFilter] = useState<'all' | string>('all');
    const [updatingProjects, setUpdatingProjects] = useState<Set<string>>(new Set());
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyComment, setReplyComment] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [selectedReport, setSelectedReport] = useState<FraudReport | null>(null);
    const [statusUpdateComment, setStatusUpdateComment] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [loadingProjectDetails] = useState(false);
    const [selectedProjectDetails] = useState<ProjectDetails | null>(null);

    // Map API report to FraudReport interface
    const mapApiReportToComponent = async (apiReport: ApiReport): Promise<FraudReport> => {
        // Fetch project details
        let projectDetails: ProjectDetails | null = null;
        try {
            const projectRes = await fetch(GET_PROJECT_DETAILS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: apiReport.projectId }),
            });
            if (projectRes.ok) {
                const projectData = await projectRes.json();
                if (projectData.success && projectData.data) {
                    projectDetails = projectData.data;
                }
            }
        } catch (err) {
            console.error('Error fetching project details:', err);
        }

        // Fetch buyer details
        let buyerDetails: UserDetails | null = null;
        try {
            const buyerRes = await fetch(GET_USER_DETAILS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: apiReport.buyerId }),
            });
            if (buyerRes.ok) {
                const buyerData = await buyerRes.json();
                if (buyerData.success && buyerData.data) {
                    buyerDetails = buyerData.data;
                }
            }
        } catch (err) {
            console.error('Error fetching buyer details:', err);
        }

        // Fetch seller details
        let sellerDetails: UserDetails | null = null;
        try {
            const sellerRes = await fetch(GET_USER_DETAILS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: apiReport.sellerId }),
            });
            if (sellerRes.ok) {
                const sellerData = await sellerRes.json();
                if (sellerData.success && sellerData.data) {
                    sellerDetails = sellerData.data;
                }
            }
        } catch (err) {
            console.error('Error fetching seller details:', err);
        }

        // Map API status to UI status
        // API uses: 'approved', 'rejected', 'under_review', 'pending'
        // UI uses: 'resolved', 'dismissed', 'pending'
        let status: 'pending' | 'resolved' | 'dismissed' = 'pending';
        if (apiReport.status === 'approved') {
            status = 'resolved';
        } else if (apiReport.status === 'rejected') {
            status = 'dismissed';
        } else if (apiReport.status === 'under_review' || apiReport.status === 'pending') {
            status = 'pending';
        } else if (apiReport.adminAction) {
            // Fallback: check adminAction if status is not set
            status = 'resolved';
        } else if (apiReport.adminComment && apiReport.adminComment.toLowerCase().includes('dismiss')) {
            // Fallback: check adminComment for dismiss keyword
            status = 'dismissed';
        }

        // Map reason to category
        const reasonToCategory: Record<string, string> = {
            'NOT_WORKING': 'Technical Issue',
            'MISSING_FILES': 'Missing Files',
            'POOR_QUALITY': 'Quality Issue',
            'MISMATCHED_DESCRIPTION': 'Description Mismatch',
            'SCAM': 'Scam/Fraud',
            'INAPPROPRIATE_CONTENT': 'Inappropriate Content',
            'COPYRIGHT_VIOLATION': 'Copyright Violation',
            'OTHER': 'Other',
        };

        // Determine severity based on reason
        const getSeverity = (reason: string): 'low' | 'medium' | 'high' | 'critical' => {
            if (reason === 'SCAM' || reason === 'COPYRIGHT_VIOLATION') return 'critical';
            if (reason === 'NOT_WORKING' || reason === 'INAPPROPRIATE_CONTENT') return 'high';
            if (reason === 'MISSING_FILES' || reason === 'MISMATCHED_DESCRIPTION') return 'medium';
            return 'low';
        };

        const buyerName = buyerDetails?.fullName || buyerDetails?.email?.split('@')[0] || 'Unknown Buyer';
        const buyerEmail = buyerDetails?.email || 'N/A';
        const sellerName = sellerDetails?.fullName || sellerDetails?.email?.split('@')[0] || 'Unknown Seller';
        const sellerEmail = sellerDetails?.email || 'N/A';

        return {
            id: apiReport.reportId,
            reportId: apiReport.reportId,
            projectId: apiReport.projectId,
            projectTitle: projectDetails?.title || 'Unknown Project',
            projectImage: projectDetails?.thumbnailUrl || 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
            reportedBy: buyerName,
            reporterEmail: buyerEmail,
            reportedDate: new Date(apiReport.createdAt).toLocaleDateString(),
            message: apiReport.description,
            reason: apiReport.reason,
            attachments: apiReport.attachments || [],
            status: status,
            severity: getSeverity(apiReport.reason),
            category: reasonToCategory[apiReport.reason] || apiReport.reason,
            sellerName: sellerName,
            sellerEmail: sellerEmail,
            adminComment: apiReport.adminComment,
        };
    };

    // Fetch reports from API
    const fetchReports = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${GET_REPORTS_ENDPOINT}?role=admin&all=true`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch reports: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                // Map all reports with their project and user details
                const mappedReports = await Promise.all(
                    data.data.map((apiReport: ApiReport) => mapApiReportToComponent(apiReport))
                );
                
                // Sort by date (newest first)
                mappedReports.sort((a, b) => {
                    const dateA = new Date(data.data.find((r: ApiReport) => r.reportId === a.reportId)?.createdAt || 0).getTime();
                    const dateB = new Date(data.data.find((r: ApiReport) => r.reportId === b.reportId)?.createdAt || 0).getTime();
                    return dateB - dateA;
                });
                
                setReports(mappedReports);
            } else {
                setReports([]);
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err instanceof Error ? err.message : 'Failed to load reports');
            setReports([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Get unique reasons for filter
    const uniqueReasons = useMemo(() => {
        const reasons = new Set(reports.map(r => r.category));
        return Array.from(reasons);
    }, [reports]);

    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const matchesSearch = 
                report.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.reportedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.projectId.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
            const matchesReason = reasonFilter === 'all' || report.category === reasonFilter;
            return matchesSearch && matchesStatus && matchesReason;
        });
    }, [reports, searchQuery, statusFilter, reasonFilter]);

    // Disable project
    const handleDisableProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to disable this project? This action can be reversed later.')) {
            return;
        }

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
                alert('Project disabled successfully');
                // Refresh reports
                fetchReports();
            } else {
                throw new Error(data.error?.message || data.message || 'Failed to disable project');
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

    const handleUpdateStatus = async (reportId: string, newStatus: 'resolved' | 'dismissed') => {
        if (!statusUpdateComment.trim()) {
            alert('Please provide a comment before updating the status.');
            return;
        }

        setUpdatingStatus(true);
        try {
            const response = await fetch(UPDATE_REPORT_STATUS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reportId: reportId,
                    status: newStatus,
                    adminComment: statusUpdateComment
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                alert(`Report marked as ${newStatus} successfully`);
                setStatusUpdateComment('');
                setSelectedReport(null);
                fetchReports();
            } else {
                throw new Error(data.error?.message || data.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Handle view details - navigate to full page
    const handleViewDetails = (report: FraudReport) => {
        if (onViewReport) {
            onViewReport(report);
        }
    };

    // Handle reply/comment (for now, just update local state - you may need to create an API endpoint for this)
    const handleReply = (reportId: string) => {
        setReplyingTo(reportId);
        const report = reports.find(r => r.id === reportId);
        if (report?.adminComment) {
            setReplyComment(report.adminComment);
        } else {
            setReplyComment('');
        }
    };


    const handleSubmitReply = (reportId: string) => {
        // Update local state (in production, this should call an API to update the report)
        setReports(reports.map(r => 
            r.id === reportId 
                ? { ...r, adminComment: replyComment, status: replyComment.toLowerCase().includes('dismiss') ? 'dismissed' as const : r.status }
                : r
        ));
        setReplyingTo(null);
        setReplyComment('');
        alert('Reply saved (Note: In production, this should call an API endpoint to persist the comment)');
    };

    const handleResolve = (reportId: string) => {
        setReports(reports.map(r => 
            r.id === reportId ? { ...r, status: 'resolved' as const } : r
        ));
    };

    const handleDismiss = (reportId: string) => {
        setReports(reports.map(r => 
            r.id === reportId ? { ...r, status: 'dismissed' as const } : r
        ));
    };

    const pendingReports = reports.filter(r => r.status === 'pending');
    const resolvedReports = reports.filter(r => r.status === 'resolved');
    const dismissedReports = reports.filter(r => r.status === 'dismissed');
    const criticalReports = reports.filter(r => r.severity === 'critical' && r.status === 'pending');

    const getStatusBadge = (status: FraudReport['status']) => {
        const styles = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'resolved': 'bg-green-100 text-green-800 border-green-300',
            'dismissed': 'bg-gray-100 text-gray-800 border-gray-300',
        };
        return styles[status] || styles.pending;
    };

    const getSeverityBadge = (severity: FraudReport['severity']) => {
        const styles = {
            'low': 'bg-blue-100 text-blue-800 border-blue-300',
            'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'high': 'bg-orange-100 text-orange-800 border-orange-300',
            'critical': 'bg-red-100 text-red-800 border-red-300',
        };
        return styles[severity] || styles.low;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-800 font-semibold mb-2">Error loading reports</p>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                    onClick={fetchReports}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Refresh and View Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Fraud Management</h2>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-orange-50 rounded-lg p-1 border border-orange-200">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all duration-200 ${
                                viewMode === 'table'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-orange-600'
                            }`}
                            title="Table View"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all duration-200 ${
                                viewMode === 'grid'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-orange-600'
                            }`}
                            title="Grid View"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                    </div>
                    {/* Refresh Button */}
                    <button
                        onClick={fetchReports}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Reports</p>
                            <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-yellow-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-yellow-700 font-medium">Pending</p>
                            <p className="text-2xl font-bold text-yellow-900">{pendingReports.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-green-700 font-medium">Resolved</p>
                            <p className="text-2xl font-bold text-green-900">{resolvedReports.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-red-700 font-medium">Critical</p>
                            <p className="text-2xl font-bold text-red-900">{criticalReports.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-700 font-medium">Dismissed</p>
                            <p className="text-2xl font-bold text-gray-900">{dismissedReports.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="flex-1 w-full lg:w-auto">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search reports by project, reporter, or message..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3 flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                        <select
                            value={reasonFilter}
                            onChange={(e) => setReasonFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="all">All Reasons</option>
                            {uniqueReasons.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Reports List - Table View */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-orange-50 to-orange-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Project</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reporter</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Severity</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <p className="text-gray-500">No reports found matching your criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-orange-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={report.projectImage} alt={report.projectTitle} className="w-12 h-12 rounded-lg object-cover" />
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{report.projectTitle}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{report.projectId.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{report.reportedBy}</div>
                                                <div className="text-xs text-gray-500">{report.reporterEmail}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    {report.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityBadge(report.severity)}`}>
                                                    {report.severity.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(report.status)}`}>
                                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {report.reportedDate}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleViewDetails(report)}
                                                    className="text-orange-600 hover:text-orange-700 font-medium text-sm hover:underline"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reports List - Grid View */}
            {viewMode === 'grid' && (
                <div className="space-y-4">
                    {filteredReports.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <p className="text-gray-500">No reports found matching your criteria.</p>
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div 
                                key={report.id} 
                                className={`bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl ${
                                    report.severity === 'critical' ? 'border-red-300' :
                                    report.severity === 'high' ? 'border-orange-300' :
                                    report.severity === 'medium' ? 'border-yellow-300' :
                                    'border-gray-200'
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex gap-6">
                                        {/* Project Image */}
                                        <div className="flex-shrink-0">
                                            <div className="relative">
                                                <img 
                                                    src={report.projectImage} 
                                                    alt={report.projectTitle} 
                                                    className="w-32 h-32 rounded-xl object-cover shadow-md"
                                                />
                                                {report.severity === 'critical' && (
                                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Report Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900">{report.projectTitle}</h3>
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityBadge(report.severity)}`}>
                                                            {report.severity.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-2">Project ID: <span className="font-mono">{report.projectId}</span></p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(report.status)}`}>
                                                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                        </span>
                                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                            {report.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reporter Info */}
                                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {report.reportedBy.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{report.reportedBy}</p>
                                                            <p className="text-xs text-gray-500">{report.reporterEmail}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Reported on</p>
                                                        <p className="text-sm font-semibold text-gray-900">{report.reportedDate}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Seller Info */}
                                            {report.sellerName && (
                                                <div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {report.sellerName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-orange-700 font-medium">Seller</p>
                                                            <p className="text-sm font-semibold text-gray-900">{report.sellerName}</p>
                                                            <p className="text-xs text-gray-600">{report.sellerEmail}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Message */}
                                            <div className="mb-4">
                                                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    Report Message:
                                                </p>
                                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                                                    <p className="text-sm text-gray-800 leading-relaxed">{report.message}</p>
                                                </div>
                                                {report.attachments && report.attachments.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-600 mb-1">Attachments:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {report.attachments.map((url, idx) => (
                                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                                                    Attachment {idx + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Admin Comment */}
                                            {report.adminComment && (
                                                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-blue-700 mb-1">Admin Comment:</p>
                                                    <p className="text-sm text-gray-800">{report.adminComment}</p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {report.status === 'pending' && (
                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        onClick={() => handleResolve(report.id)}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Mark as Resolved
                                                    </button>
                                                    <button
                                                        onClick={() => handleDismiss(report.id)}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Dismiss Report
                                                    </button>
                                                    <button
                                                        onClick={() => handleDisableProject(report.projectId)}
                                                        disabled={updatingProjects.has(report.projectId)}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updatingProjects.has(report.projectId) ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Disabling...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                                Disable Project
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReply(report.id)}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                        Reply
                                                    </button>
                                                </div>
                                            )}
                                            {report.status !== 'pending' && (
                                                <div className="text-sm text-gray-500 italic">
                                                    This report has been {report.status}.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Reply Modal */}
                                {replyingTo === report.id && (
                                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-gray-700">Admin Comment/Reply:</label>
                                            <textarea
                                                value={replyComment}
                                                onChange={(e) => setReplyComment(e.target.value)}
                                                rows={3}
                                                placeholder="Enter your comment or reply to this report..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                            />
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleSubmitReply(report.id)}
                                                    className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                                                >
                                                    Save Comment
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyComment('');
                                                    }}
                                                    className="px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}></div>
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Report Details</h2>
                                    <p className="text-orange-50 text-sm mt-1">{selectedReport.projectTitle}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="text-white/90 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                                {/* Project Details */}
                                {loadingProjectDetails ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                                        <p className="text-gray-600 mt-2">Loading project details...</p>
                                    </div>
                                ) : selectedProjectDetails ? (
                                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            Project Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Project Title</p>
                                                <p className="text-base font-semibold text-gray-900">{selectedProjectDetails.title || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Project ID</p>
                                                <p className="text-base font-mono text-gray-900">{selectedReport.projectId}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Category</p>
                                                <p className="text-base font-semibold text-gray-900">{selectedProjectDetails.category || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Price</p>
                                                <p className="text-base font-semibold text-gray-900">₹{selectedProjectDetails.price?.toFixed(2) || '0.00'}</p>
                                            </div>
                                            {selectedProjectDetails.description && (
                                                <div className="md:col-span-2">
                                                    <p className="text-sm text-gray-500 mb-1">Description</p>
                                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedProjectDetails.description}</p>
                                                </div>
                                            )}
                                        </div>
                                        {selectedProjectDetails.thumbnailUrl && (
                                            <div className="mt-4">
                                                <img 
                                                    src={selectedProjectDetails.thumbnailUrl} 
                                                    alt={selectedProjectDetails.title}
                                                    className="w-full h-64 object-cover rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {/* Report Information */}
                                <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Report Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Reported By</p>
                                            <p className="text-base font-semibold text-gray-900">{selectedReport.reportedBy}</p>
                                            <p className="text-sm text-gray-500">{selectedReport.reporterEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Reason</p>
                                            <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800 mt-1">
                                                {selectedReport.category}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Severity</p>
                                            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border mt-1 ${getSeverityBadge(selectedReport.severity)}`}>
                                                {selectedReport.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Status</p>
                                            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border mt-1 ${getStatusBadge(selectedReport.status)}`}>
                                                {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-gray-600 mb-2">Report Message</p>
                                            <div className="bg-white border border-red-300 rounded-lg p-4">
                                                <p className="text-sm text-gray-800 leading-relaxed">{selectedReport.message}</p>
                                            </div>
                                        </div>
                                        {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                                            <div className="md:col-span-2">
                                                <p className="text-sm text-gray-600 mb-2">Attachments</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedReport.attachments.map((url, idx) => (
                                                        <a 
                                                            key={idx} 
                                                            href={url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                                                        >
                                                            Attachment {idx + 1} →
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Update Section */}
                                {selectedReport.status === 'pending' && (
                                    <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Update Report Status
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Admin Comment / Message <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    value={statusUpdateComment}
                                                    onChange={(e) => setStatusUpdateComment(e.target.value)}
                                                    rows={4}
                                                    placeholder="Enter your comment or message regarding this report..."
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">This message will be saved with the status update.</p>
                                            </div>
                                            <div className="flex gap-3 flex-wrap">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                                                    disabled={updatingStatus || !statusUpdateComment.trim()}
                                                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Mark as Resolved
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                                                    disabled={updatingStatus || !statusUpdateComment.trim()}
                                                    className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Dismiss Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 flex-wrap">
                                    <button
                                        onClick={() => handleDisableProject(selectedReport.projectId)}
                                        disabled={updatingProjects.has(selectedReport.projectId)}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                    >
                                        {updatingProjects.has(selectedReport.projectId) ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Disabling...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                                Disable Project
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold shadow-md hover:shadow-lg"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FraudManagementPage;

