import React, { useState, useEffect } from 'react';
import type { BuyerProject } from '../BuyerProjectCard';

const GET_PROJECT_DETAILS_ENDPOINT = 'https://8y8bbugmbd.execute-api.ap-south-2.amazonaws.com/default/Get_project_details_by_projectId';

interface BackendProjectDetails {
    projectId: string;
    title: string;
    description: string;
    price: number;
    category: string;
    tags: string[];
    thumbnailUrl?: string;
    imageUrls?: string[]; // Array of image URLs from backend
    sellerId: string;
    sellerEmail: string;
    sellerName?: string;
    status: string;
    adminApprovalStatus?: string;
    uploadedAt: string;
    documentationUrl?: string;
    youtubeVideoUrl?: string;
    demoVideoUrl?: string;
    githubUrl?: string;
    liveDemoUrl?: string;
    purchasesCount?: number;
    likesCount?: number;
    viewsCount?: number;
    projectFilesUrl?: string;
    features?: string[]; // Features array from backend
    supportInfo?: string; // Support info from backend
    isPremium?: boolean;
    originalPrice?: number;
    discount?: number;
}

interface AdminProject extends BuyerProject {
    status: 'pending' | 'in-review' | 'active' | 'disabled' | 'rejected';
    uploadedDate: string;
    sellerId: string;
    sellerName: string;
    sellerEmail: string;
    likes?: number;
    purchases?: number;
    demoVideoUrl?: string;
    features?: string[];
    supportInfo?: string;
    images?: string[];
    githubUrl?: string;
    liveDemoUrl?: string;
    documentationUrl?: string;
    originalPrice?: number;
    discount?: number;
}

interface AdminProjectDetailsPageProps {
    project: AdminProject;
    onBack: () => void;
    onStatusChange: (projectId: string, newStatus: AdminProject['status']) => void;
    onViewUser?: (user: { id: string; name: string; email: string }) => void;
}

const AdminProjectDetailsPage: React.FC<AdminProjectDetailsPageProps> = ({
    project,
    onBack,
    onStatusChange,
    onViewUser,
}) => {
    const [activeTab, setActiveTab] = useState<'description' | 'features' | 'links' | 'support'>('description');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isHoveringImage, setIsHoveringImage] = useState(false);
    const [projectDetails, setProjectDetails] = useState<BackendProjectDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch full project details from backend
    useEffect(() => {
        const fetchProjectDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(GET_PROJECT_DETAILS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: project.id }),
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
    }, [project.id]);

    // Get ALL images from backend database - combine imageUrls array and thumbnailUrl
    // Only use images from API response, not from project prop
    const getAllImagesFromDB = (): string[] => {
        if (!projectDetails) {
            // If no API data yet, return empty array (will show loading)
            return [];
        }

        const imagesFromDB: string[] = [];
        
        // Add thumbnailUrl if it exists and is valid
        if (projectDetails.thumbnailUrl && projectDetails.thumbnailUrl.trim() !== '') {
            imagesFromDB.push(projectDetails.thumbnailUrl);
        }
        
        // Add all imageUrls from the array if they exist
        if (projectDetails.imageUrls && Array.isArray(projectDetails.imageUrls)) {
            projectDetails.imageUrls.forEach((imgUrl: string) => {
                if (imgUrl && imgUrl.trim() !== '' && !imagesFromDB.includes(imgUrl)) {
                    imagesFromDB.push(imgUrl);
                }
            });
        }
        
        return imagesFromDB;
    };

    const images = getAllImagesFromDB();
    
    // If no images from DB and we have project prop as fallback (during loading or if API fails)
    const displayImages = images.length > 0 
        ? images 
        : (projectDetails === null && project.imageUrl) 
        ? [project.imageUrl] // Show project prop image only during loading
        : [];

    // Get features from backend data, fallback to empty array
    const features = projectDetails?.features && projectDetails.features.length > 0
        ? projectDetails.features
        : project.features && project.features.length > 0
        ? project.features
        : [];

    // Get links ONLY from backend API response (projectDetails) - do not use project prop as it may contain mock data
    // Only use links that actually exist in the database and are valid URLs
    const isValidUrl = (url: string | undefined): boolean => {
        if (!url || url.trim() === '') return false;
        // Check if it's a valid URL format
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const githubUrl = (projectDetails?.githubUrl && isValidUrl(projectDetails.githubUrl)) 
        ? projectDetails.githubUrl 
        : undefined;
    const liveDemoUrl = (projectDetails?.liveDemoUrl && isValidUrl(projectDetails.liveDemoUrl)) 
        ? projectDetails.liveDemoUrl 
        : undefined;
    const documentationUrl = (projectDetails?.documentationUrl && isValidUrl(projectDetails.documentationUrl)) 
        ? projectDetails.documentationUrl 
        : undefined;
    // Get video URL ONLY from backend API response - try demoVideoUrl first, then youtubeVideoUrl
    // Do not use project prop as it may contain mock data
    const demoVideoUrl = (projectDetails?.demoVideoUrl && projectDetails.demoVideoUrl.trim() !== '') 
        ? projectDetails.demoVideoUrl 
        : (projectDetails?.youtubeVideoUrl && projectDetails.youtubeVideoUrl.trim() !== '') 
        ? projectDetails.youtubeVideoUrl 
        : undefined;
    const supportInfo = projectDetails?.supportInfo || project.supportInfo;

    // Get stats from backend data
    const likes = projectDetails?.likesCount ?? project.likes ?? 0;
    const purchases = projectDetails?.purchasesCount ?? project.purchases ?? 0;
    const views = projectDetails?.viewsCount ?? 0;

    // Reset image index when images change
    useEffect(() => {
        if (displayImages.length > 0 && currentImageIndex >= displayImages.length) {
            setCurrentImageIndex(0);
        }
    }, [displayImages.length, currentImageIndex]);

    // Auto-scroll images
    useEffect(() => {
        if (displayImages.length <= 1 || isHoveringImage || isPreviewOpen) return;
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [displayImages.length, isHoveringImage, isPreviewOpen]);

    const getStatusBadge = (status: AdminProject['status']) => {
        const styles = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'in-review': 'bg-blue-100 text-blue-800 border-blue-300',
            'active': 'bg-green-100 text-green-800 border-green-300',
            'disabled': 'bg-gray-100 text-gray-800 border-gray-300',
            'rejected': 'bg-red-100 text-red-800 border-red-300',
        };
        return styles[status] || styles.pending;
    };

    const getStatusLabel = (status: AdminProject['status']) => {
        const labels = {
            'pending': 'Pending',
            'in-review': 'In Review',
            'active': 'Active',
            'disabled': 'Disabled',
            'rejected': 'Rejected',
        };
        return labels[status] || status;
    };

    const handleApprove = () => {
        onStatusChange(project.id, 'active');
    };

    const handleReject = () => {
        onStatusChange(project.id, 'rejected');
    };

    const handleDisable = () => {
        onStatusChange(project.id, 'disabled');
    };

    const handleEnable = () => {
        onStatusChange(project.id, 'active');
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading project details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Error loading project details</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    // Use backend data if available, otherwise fallback to project prop
    const displayProject = projectDetails ? {
        ...project,
        title: projectDetails.title || project.title,
        description: projectDetails.description || project.description,
        price: projectDetails.price ?? project.price,
        category: projectDetails.category || project.category,
        tags: projectDetails.tags || project.tags,
        sellerName: projectDetails.sellerName || project.sellerName,
        sellerEmail: projectDetails.sellerEmail || project.sellerEmail,
        uploadedDate: projectDetails.uploadedAt ? new Date(projectDetails.uploadedAt).toLocaleDateString() : project.uploadedDate,
    } : project;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Project Management</span>
            </button>

            {/* Status Banner */}
            <div className={`mb-6 p-4 rounded-lg border ${getStatusBadge(project.status)}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">Status: {getStatusLabel(project.status)}</span>
                        <span className="text-sm opacity-75">Uploaded: {displayProject.uploadedDate}</span>
                    </div>
                    {(project.status === 'pending' || project.status === 'in-review') && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleApprove}
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
                            >
                                {project.status === 'pending' ? 'Accept' : 'Approve'}
                            </button>
                            <button
                                onClick={handleReject}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
                            >
                                Reject
                            </button>
                        </div>
                    )}
                    {project.status === 'active' && (
                        <button
                            onClick={handleDisable}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                            Disable Project
                        </button>
                    )}
                    {project.status === 'disabled' && (
                        <button
                            onClick={handleEnable}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                            Enable Project
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-12">
                {/* Left Column - Image Gallery (3/5 width) - Same as user-facing page */}
                <div className="lg:col-span-3 space-y-3">
                    <div
                        className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-lg group cursor-pointer"
                        onClick={() => displayImages.length > 0 && setIsPreviewOpen(true)}
                        onMouseEnter={() => setIsHoveringImage(true)}
                        onMouseLeave={() => setIsHoveringImage(false)}
                    >
                        {displayImages.length > 0 ? (
                            <img
                                src={displayImages[currentImageIndex]}
                                alt={displayProject.title}
                                className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                        ) : (
                            <div className="w-full aspect-[16/10] bg-gray-200 flex items-center justify-center">
                                <div className="text-center">
                                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-500 text-sm font-medium">No images available</p>
                                </div>
                            </div>
                        )}
                        {displayImages.length > 0 && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
                                <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full font-medium text-sm shadow-lg flex items-center gap-2 backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                    Click to preview
                                </span>
                            </div>
                        )}
                        {/* Image counter badge */}
                        {displayImages.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                {currentImageIndex + 1} / {displayImages.length}
                            </div>
                        )}
                        {displayImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length); }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % displayImages.length); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                        {/* Premium Badge */}
                        {(project.isPremium || projectDetails?.isPremium) && (
                            <div className="absolute top-6 left-6">
                                <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-xs text-white font-bold uppercase">Premium</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Navigation - Show all images from database */}
                    {displayImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {displayImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                        currentImageIndex === index
                                            ? 'border-white ring-2 ring-white/50 shadow-md transform scale-110 z-10'
                                            : 'border-white/20 hover:border-white/60 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img src={img} alt={`${displayProject.title} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                    {displayImages.length === 0 && !loading && (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No images available in database</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Project Details (2/5 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title */}
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayProject.title}</h1>

                        {/* Stats */}
                        <div className="flex items-center gap-6 mb-4">
                            {likes > 0 && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-700">{likes} likes</span>
                                </div>
                            )}
                            {purchases > 0 && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold">{purchases} purchases</span>
                                </div>
                            )}
                            {views > 0 && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span className="text-sm font-semibold">{views} views</span>
                                </div>
                            )}
                        </div>

                        {/* Category and Tags */}
                        <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-sm font-semibold uppercase tracking-wide mb-3">
                                {displayProject.category}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {displayProject.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 leading-relaxed">{displayProject.description}</p>

                    {/* Pricing */}
                    <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                        <div className="flex items-baseline gap-4 mb-4">
                            <div>
                                <p className="text-4xl font-bold text-gray-900">₹{displayProject.price.toFixed(2)}</p>
                                {(projectDetails?.originalPrice || project.originalPrice) && (
                                    <p className="text-lg text-gray-500 line-through mt-1">₹{(projectDetails?.originalPrice || project.originalPrice)!.toFixed(2)}</p>
                                )}
                            </div>
                            {(projectDetails?.discount || project.discount) && (projectDetails?.discount || project.discount)! > 0 && (
                                <span className="px-3 py-1 bg-purple-500 text-white text-sm font-bold rounded-full">
                                    {(projectDetails?.discount || project.discount)}% OFF
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                                {displayProject.sellerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{displayProject.sellerName}</p>
                                <p className="text-sm text-gray-600">{displayProject.sellerEmail}</p>
                            </div>
                        </div>
                        {onViewUser && (
                            <button
                                onClick={() => onViewUser({ id: project.sellerId, name: displayProject.sellerName, email: displayProject.sellerEmail })}
                                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 text-sm shadow-sm hover:shadow-md"
                            >
                                View Seller Profile
                            </button>
                        )}
                    </div>

                    {/* Features Icons */}
                    <div className="flex flex-wrap gap-2">
                        {documentationUrl && (
                            <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Documentation</span>
                            </span>
                        )}
                        {demoVideoUrl && (
                            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Video</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="mt-12">
                <div className="flex gap-2 border-b border-gray-200 mb-6">
                    {(['description', 'features', 'links', 'support'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
                                activeTab === tab
                                    ? 'text-orange-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-8">
                    {activeTab === 'description' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Description</h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {displayProject.description}
                            </p>

                            {/* Demo Video */}
                            <div className="mt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Demo Video</h2>
                                {demoVideoUrl ? (
                                    <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
                                        <iframe
                                            src={demoVideoUrl.includes('youtube.com') || demoVideoUrl.includes('youtu.be') 
                                                ? demoVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').split('&')[0]
                                                : demoVideoUrl}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-gray-500 text-lg font-medium">No video available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
                            {features.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                            <svg className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-700 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                                    <p className="text-gray-500">No features listed for this project</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'links' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Links</h2>
                            <div className="space-y-4">
                                {githubUrl && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">GitHub Repository</p>
                                                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:text-orange-700 break-all">
                                                        {githubUrl}
                                                    </a>
                                                </div>
                                            </div>
                                            <a
                                                href={githubUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-orange-600 hover:text-orange-700"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {liveDemoUrl && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">Live Demo</p>
                                                    <a href={liveDemoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:text-orange-700 break-all">
                                                        {liveDemoUrl}
                                                    </a>
                                                </div>
                                            </div>
                                            <a
                                                href={liveDemoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-orange-600 hover:text-orange-700"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {documentationUrl && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">Documentation</p>
                                                    <a href={documentationUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:text-orange-700 break-all">
                                                        {documentationUrl}
                                                    </a>
                                                </div>
                                            </div>
                                            <a
                                                href={documentationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-orange-600 hover:text-orange-700"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {!githubUrl && !liveDemoUrl && !documentationUrl && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                                        <p className="text-gray-500">No links provided for this project</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'support' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Support Information</h2>
                            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    {supportInfo || 'For any questions or support regarding this project, please contact the seller directly through their profile or email.'}
                                </p>
                                <div className="flex gap-4">
                                    <button className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                                        Contact Seller
                                    </button>
                                    <button className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                                        Report Issue
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal - Show all images from database */}
            {isPreviewOpen && displayImages.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsPreviewOpen(false)}
                >
                    <div className="relative max-w-7xl w-full">
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={displayImages[currentImageIndex]}
                            alt={displayProject.title}
                            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {displayImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % displayImages.length); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <div className="absolute bottom-16 sm:bottom-20 flex gap-2 overflow-x-auto max-w-full px-4 py-2 custom-scrollbar">
                                    {displayImages.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                                            className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                                currentImageIndex === index
                                                    ? 'border-white ring-2 ring-white/50 shadow-md transform scale-110 z-10'
                                                    : 'border-white/20 hover:border-white/60 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt={`${displayProject.title} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProjectDetailsPage;
