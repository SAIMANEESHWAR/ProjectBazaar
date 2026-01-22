import React, { useState } from 'react';
import type { BuyerProject } from '../BuyerProjectCard';

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
    
    const images = project.images || [project.imageUrl];
    const features = project.features || [
        'Real-time collaboration',
        'Live code editing',
        'Integrated chat system',
        'Drawing/paint board',
        'Multiple user support',
        'Code sharing capabilities'
    ];

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
                        <span className="text-sm opacity-75">Uploaded: {project.uploadedDate}</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Left Column - Image Carousel */}
                <div className="space-y-4">
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl">
                        <img
                            src={images[currentImageIndex]}
                            alt={project.title}
                            className="w-full h-[500px] object-cover"
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                        {/* Premium Badge */}
                        {project.isPremium && (
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
                    
                    {/* Thumbnail Navigation */}
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        currentImageIndex === index
                                            ? 'border-orange-500 ring-2 ring-orange-200'
                                            : 'border-gray-200 hover:border-orange-300'
                                    }`}
                                >
                                    <img src={img} alt={`${project.title} ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column - Project Details */}
                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">{project.title}</h1>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-6 mb-4">
                            {project.likes !== undefined && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-700">{project.likes} likes</span>
                                </div>
                            )}
                            {project.purchases !== undefined && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold">{project.purchases} purchases</span>
                                </div>
                            )}
                        </div>

                        {/* Category and Tags */}
                        <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-sm font-semibold uppercase tracking-wide mb-3">
                                {project.category}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {project.tags.map((tag) => (
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
                    <p className="text-gray-600 leading-relaxed">{project.description}</p>

                    {/* Pricing */}
                    <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                        <div className="flex items-baseline gap-4 mb-4">
                            <div>
                                <p className="text-4xl font-bold text-gray-900">₹{project.price.toFixed(2)}</p>
                                {project.originalPrice && (
                                    <p className="text-lg text-gray-500 line-through mt-1">₹{project.originalPrice.toFixed(2)}</p>
                                )}
                            </div>
                            {project.discount && project.discount > 0 && (
                                <span className="px-3 py-1 bg-purple-500 text-white text-sm font-bold rounded-full">
                                    {project.discount}% OFF
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                                {project.sellerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{project.sellerName}</p>
                                <p className="text-sm text-gray-600">{project.sellerEmail}</p>
                            </div>
                        </div>
                        {onViewUser && (
                            <button
                                onClick={() => onViewUser({ id: project.sellerId, name: project.sellerName, email: project.sellerEmail })}
                                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 text-sm shadow-sm hover:shadow-md"
                            >
                                View Seller Profile
                            </button>
                        )}
                    </div>

                    {/* Features Icons */}
                    <div className="flex flex-wrap gap-2">
                        {project.hasDocumentation && (
                            <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Documentation</span>
                            </span>
                        )}
                        {project.hasExecutionVideo && (
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
                                {project.description} This project provides a comprehensive solution with modern technologies and best practices.
                                It includes detailed documentation, code examples, and support for developers.
                            </p>
                            
                            {/* Demo Video */}
                            {project.demoVideoUrl && (
                                <div className="mt-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Demo Video</h2>
                                    <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
                                        <iframe
                                            src={project.demoVideoUrl}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
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
                        </div>
                    )}

                    {activeTab === 'links' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Links</h2>
                            <div className="space-y-4">
                                {project.githubUrl && (
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
                                                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:text-orange-700 break-all">
                                                        {project.githubUrl}
                                                    </a>
                                                </div>
                                            </div>
                                            <a
                                                href={project.githubUrl}
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
                                {project.liveDemoUrl && (
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
                                                    <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:text-orange-700 break-all">
                                                        {project.liveDemoUrl}
                                                    </a>
                                                </div>
                                            </div>
                                            <a
                                                href={project.liveDemoUrl}
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
                                {project.documentationUrl && (
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
                                                    <a href={project.documentationUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:text-orange-700 break-all">
                                                        {project.documentationUrl}
                                                    </a>
                                                </div>
                                            </div>
                                            <a
                                                href={project.documentationUrl}
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
                                {!project.githubUrl && !project.liveDemoUrl && !project.documentationUrl && (
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
                                    {project.supportInfo || 'For any questions or support regarding this project, please contact the seller directly through their profile or email.'}
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
        </div>
    );
};

export default AdminProjectDetailsPage;

