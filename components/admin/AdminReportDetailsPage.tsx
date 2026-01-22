import React, { useState, useEffect } from 'react';

const GET_PROJECT_DETAILS_ENDPOINT = 'https://8y8bbugmbd.execute-api.ap-south-2.amazonaws.com/default/Get_project_details_by_projectId';
const ADMIN_APPROVAL_ENDPOINT = 'https://wt58x2f09d.execute-api.ap-south-2.amazonaws.com/default/Admin_approved_or_rejected';
const UPDATE_REPORT_ENDPOINT = 'https://8des0d7j84.execute-api.ap-south-2.amazonaws.com/default/Update_report_details_by_Admin';

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

interface ProjectDetails {
    projectId: string;
    title: string;
    description: string;
    price: number;
    category: string;
    tags: string[];
    thumbnailUrl?: string;
    sellerId: string;
    sellerEmail: string;
    status: string;
    adminApprovalStatus?: string;
    uploadedAt: string;
    documentationUrl?: string;
    youtubeVideoUrl?: string;
    purchasesCount?: number;
    likesCount?: number;
    viewsCount?: number;
    projectFilesUrl?: string;
}

interface AdminReportDetailsPageProps {
    report: FraudReport;
    onBack: () => void;
    onStatusUpdate?: (reportId: string, status: 'resolved' | 'dismissed', comment: string) => void;
    onReportUpdated?: () => void; // Callback to refresh reports list
}

const AdminReportDetailsPage: React.FC<AdminReportDetailsPageProps> = ({ report, onBack, onStatusUpdate, onReportUpdated }) => {
    const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusUpdateComment, setStatusUpdateComment] = useState(report.adminComment || '');
    const [selectedAction, setSelectedAction] = useState<'disable_project' | 'first_warning' | 'others'>(() => {
        // Default to 'others' if no previous status
        return 'others';
    });
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [, setDisablingProject] = useState(false);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(GET_PROJECT_DETAILS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: report.projectId }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch project details: ${response.statusText}`);
                }

                const data = await response.json();
                if (data.success && data.data) {
                    setProjectDetails(data.data);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (err) {
                console.error('Error fetching project details:', err);
                setError(err instanceof Error ? err.message : 'Failed to load project details');
            } finally {
                setLoading(false);
            }
        };

        fetchProjectDetails();
    }, [report.projectId]);


    // Map API status to UI status
    const mapAPIStatusToUI = (apiStatus: string): 'resolved' | 'dismissed' | 'pending' => {
        if (apiStatus === 'approved') return 'resolved';
        if (apiStatus === 'rejected') return 'dismissed';
        return 'pending';
    };

    const handleUpdateStatus = async () => {
        if (!statusUpdateComment.trim()) {
            alert('Please provide a comment/message before updating the status.');
            return;
        }

        setUpdatingStatus(true);
        setUpdateSuccess(false);
        
        try {
            // If "Disable Project" is selected, disable the project first
            if (selectedAction === 'disable_project') {
                try {
                    const disableResponse = await fetch(ADMIN_APPROVAL_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            projectId: report.projectId,
                            adminApprovalStatus: 'disabled'
                        })
                    });

                    if (!disableResponse.ok) {
                        throw new Error(`Failed to disable project: ${disableResponse.statusText}`);
                    }

                    const disableData = await disableResponse.json();
                    if (!disableData.success) {
                        throw new Error(disableData.error?.message || disableData.message || 'Failed to disable project');
                    }
                } catch (disableErr) {
                    console.error('Error disabling project:', disableErr);
                    alert(`Failed to disable project: ${disableErr instanceof Error ? disableErr.message : 'Unknown error'}`);
                    setUpdatingStatus(false);
                    return;
                }
            }

            // Map selected action to API status and adminAction
            let apiStatus: 'approved' | 'rejected' | 'under_review';
            let adminAction: string;

            if (selectedAction === 'disable_project') {
                apiStatus = 'rejected'; // Report is resolved (rejected) when project is disabled
                adminAction = 'project_disabled';
            } else if (selectedAction === 'first_warning') {
                apiStatus = 'under_review';
                adminAction = 'first_warning';
            } else { // others
                apiStatus = 'under_review';
                adminAction = 'other_action';
            }

            // Update report status
            const requestBody: any = {
                role: 'admin',
                reportId: report.reportId,
                status: apiStatus,
                adminComment: statusUpdateComment.trim(),
                adminAction: adminAction,
            };

            const response = await fetch(UPDATE_REPORT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Failed to update report: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                setUpdateSuccess(true);
                // Call callback if provided to refresh reports list
                if (onReportUpdated) {
                    setTimeout(() => {
                        onReportUpdated();
                    }, 1000);
                }
                // Also call onStatusUpdate if provided
                if (onStatusUpdate) {
                    const uiStatus = mapAPIStatusToUI(apiStatus);
                    onStatusUpdate(report.id, uiStatus as 'resolved' | 'dismissed', statusUpdateComment);
                }
                // Show success message
                setTimeout(() => {
                    setUpdateSuccess(false);
                }, 3000);
            } else {
                throw new Error(data.error || 'Failed to update report');
            }
        } catch (err) {
            console.error('Error updating report status:', err);
            alert(`Failed to update report: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleUpdateCommentOnly = async () => {
        if (!statusUpdateComment.trim()) {
            alert('Please provide a comment/message.');
            return;
        }

        setUpdatingStatus(true);
        setUpdateSuccess(false);
        try {
            const requestBody: any = {
                role: 'admin',
                reportId: report.reportId,
                adminComment: statusUpdateComment.trim(),
            };

            const response = await fetch(UPDATE_REPORT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Failed to update comment: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                setUpdateSuccess(true);
                if (onReportUpdated) {
                    setTimeout(() => {
                        onReportUpdated();
                    }, 1000);
                }
                setTimeout(() => {
                    setUpdateSuccess(false);
                }, 3000);
            } else {
                throw new Error(data.error || 'Failed to update comment');
            }
        } catch (err) {
            console.error('Error updating comment:', err);
            alert(`Failed to update comment: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setUpdatingStatus(false);
        }
    };

    // @ts-ignore - Function kept for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleDisableProject = async () => {
        if (!confirm('Are you sure you want to disable this project? This action can be reversed later.')) {
            return;
        }

        setDisablingProject(true);
        try {
            const response = await fetch(ADMIN_APPROVAL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: report.projectId,
                    adminApprovalStatus: 'disabled'
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to disable project: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                alert('Project disabled successfully');
            } else {
                throw new Error(data.error?.message || data.message || 'Failed to disable project');
            }
        } catch (err) {
            console.error('Error disabling project:', err);
            alert(`Failed to disable project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setDisablingProject(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'resolved': 'bg-green-100 text-green-800 border-green-300',
            'dismissed': 'bg-gray-100 text-gray-800 border-gray-300',
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    const getSeverityBadge = (severity: string) => {
        const styles = {
            'low': 'bg-blue-100 text-blue-800 border-blue-300',
            'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'high': 'bg-orange-100 text-orange-800 border-orange-300',
            'critical': 'bg-red-100 text-red-800 border-red-300',
        };
        return styles[severity as keyof typeof styles] || styles.low;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
                                <p className="text-sm text-gray-500 mt-1">Review and take action on this report</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusBadge(report.status)}`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                            <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getSeverityBadge(report.severity)}`}>
                                {report.severity.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Project Details Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white">Project Information</h2>
                                <p className="text-orange-100 text-sm mt-1">Complete project details</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
                                <p className="text-gray-600 font-medium">Loading project details...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-16 bg-red-50 rounded-xl border border-red-200">
                                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-800 font-semibold mb-2">Error loading project</p>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        ) : projectDetails ? (
                            <div className="space-y-6">
                                {/* Project Image */}
                                {projectDetails.thumbnailUrl && (
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                        <img 
                                            src={projectDetails.thumbnailUrl} 
                                            alt={projectDetails.title}
                                            className="w-full h-96 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-8">
                                            <h3 className="text-3xl font-bold text-white mb-2">{projectDetails.title}</h3>
                                            <p className="text-orange-200 text-lg">Project ID: <span className="font-mono">{projectDetails.projectId}</span></p>
                                        </div>
                                    </div>
                                )}

                                {/* Project Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-blue-700">Category</p>
                                        </div>
                                        <p className="text-xl font-bold text-blue-900">{projectDetails.category || 'N/A'}</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-green-700">Price</p>
                                        </div>
                                        <p className="text-xl font-bold text-green-900">₹{projectDetails.price?.toFixed(2) || '0.00'}</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-purple-700">Status</p>
                                        </div>
                                        <p className="text-xl font-bold text-purple-900 capitalize">{projectDetails.adminApprovalStatus || projectDetails.status || 'N/A'}</p>
                                    </div>

                                    {projectDetails.likesCount !== undefined && (
                                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-pink-700">Likes</p>
                                            </div>
                                            <p className="text-xl font-bold text-pink-900">{projectDetails.likesCount}</p>
                                        </div>
                                    )}

                                    {projectDetails.purchasesCount !== undefined && (
                                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-indigo-700">Purchases</p>
                                            </div>
                                            <p className="text-xl font-bold text-indigo-900">{projectDetails.purchasesCount}</p>
                                        </div>
                                    )}

                                    {projectDetails.viewsCount !== undefined && (
                                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-cyan-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-cyan-700">Views</p>
                                            </div>
                                            <p className="text-xl font-bold text-cyan-900">{projectDetails.viewsCount}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {projectDetails.description && (
                                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                        <h4 className="text-lg font-bold text-gray-900 mb-3">Description</h4>
                                        <p className="text-gray-700 leading-relaxed">{projectDetails.description}</p>
                                    </div>
                                )}

                                {/* Tags */}
                                {projectDetails.tags && projectDetails.tags.length > 0 && (
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-3">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {projectDetails.tags.map((tag, idx) => (
                                                <span key={idx} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold border border-orange-200">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Report Details Section */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-red-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white">Report Information</h2>
                                <p className="text-red-100 text-sm mt-1">Details of the reported issue</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Reporter Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {report.reportedBy.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Reported By</p>
                                        <p className="text-lg font-bold text-blue-900">{report.reportedBy}</p>
                                        <p className="text-sm text-blue-700">{report.reporterEmail}</p>
                                    </div>
                                </div>
                            </div>

                            {report.sellerName && (
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                            {report.sellerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Seller</p>
                                            <p className="text-lg font-bold text-orange-900">{report.sellerName}</p>
                                            <p className="text-sm text-orange-700">{report.sellerEmail}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Report Message */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-xl font-bold text-gray-900">Report Message</h3>
                            </div>
                            <div className="bg-white rounded-lg p-6 border border-red-300">
                                <p className="text-gray-800 leading-relaxed text-lg">{report.message}</p>
                            </div>
                        </div>

                        {/* Attachments */}
                        {report.attachments && report.attachments.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Attachments</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {report.attachments.map((url, idx) => (
                                        <a 
                                            key={idx}
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-4 bg-white border-2 border-gray-300 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all group"
                                        >
                                            <div className="w-12 h-12 bg-orange-100 group-hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                                                <svg className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Attachment {idx + 1}</p>
                                                <p className="text-xs text-gray-500 truncate">{url}</p>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Update Section - Always Visible for Editing */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white">Update Report Status & Comment</h2>
                                <p className="text-blue-100 text-sm mt-1">Edit status and add your comment</p>
                            </div>
                            {updateSuccess && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-300">
                                    <svg className="w-5 h-5 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-green-100 font-semibold">Updated!</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Action Selector */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">
                                    Select Action <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setSelectedAction('disable_project')}
                                        disabled={updatingStatus}
                                        className={`px-6 py-4 rounded-xl border-2 font-bold text-lg transition-all transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                            selectedAction === 'disable_project'
                                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 shadow-lg'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-red-400 hover:bg-red-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                            <span>Disable Project</span>
                                        </div>
                                        <p className="text-xs mt-1 opacity-75">Disable the project</p>
                                    </button>
                                    <button
                                        onClick={() => setSelectedAction('first_warning')}
                                        disabled={updatingStatus}
                                        className={`px-6 py-4 rounded-xl border-2 font-bold text-lg transition-all transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                            selectedAction === 'first_warning'
                                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-600 shadow-lg'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span>1st Warning</span>
                                        </div>
                                        <p className="text-xs mt-1 opacity-75">Issue first warning</p>
                                    </button>
                                    <button
                                        onClick={() => setSelectedAction('others')}
                                        disabled={updatingStatus}
                                        className={`px-6 py-4 rounded-xl border-2 font-bold text-lg transition-all transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                            selectedAction === 'others'
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <span>Others</span>
                                        </div>
                                        <p className="text-xs mt-1 opacity-75">Other actions</p>
                                    </button>
                                </div>
                            </div>

                            {/* Admin Comment */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">
                                    Admin Comment / Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={statusUpdateComment}
                                    onChange={(e) => setStatusUpdateComment(e.target.value)}
                                    rows={6}
                                    placeholder="Enter your comment or message regarding this report. This will be saved with the status update..."
                                    disabled={updatingStatus}
                                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 resize-none text-lg leading-relaxed transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    This message will be saved with the status update for audit purposes.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 flex-wrap">
                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={updatingStatus || !statusUpdateComment.trim()}
                                    className={`flex items-center gap-3 px-8 py-4 text-white rounded-xl transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none ${
                                        selectedAction === 'disable_project'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                            : selectedAction === 'first_warning'
                                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                    }`}
                                >
                                    {updatingStatus ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {selectedAction === 'disable_project' ? 'Disabling Project...' : 'Updating...'}
                                        </>
                                    ) : (
                                        <>
                                            {selectedAction === 'disable_project' ? (
                                                <>
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                    Disable Project & Update Report
                                                </>
                                            ) : selectedAction === 'first_warning' ? (
                                                <>
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    Issue Warning & Update Report
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Update Report
                                                </>
                                            )}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleUpdateCommentOnly}
                                    disabled={updatingStatus || !statusUpdateComment.trim()}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                                >
                                    {updatingStatus ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Update Comment Only
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Info */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-700 font-medium">Report ID: <span className="font-mono text-gray-900">{report.reportId}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReportDetailsPage;

