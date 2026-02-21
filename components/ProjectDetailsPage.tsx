import React, { useState, useEffect } from 'react';
import type { BuyerProject } from './BuyerProjectCard';
import { useWishlist, useCart } from './DashboardPage';
import { useAuth } from '../App';
import { fetchUserData } from '../services/buyerApi';
import ReportProjectModal from './ReportProjectModal';

interface ExtendedProject extends BuyerProject {
    likes: number;
    purchases: number;
    seller: {
        id?: string;
        name: string;
        email: string;
        avatar: string;
        rating: number;
        totalSales: number;
    };
    originalPrice?: number;
    discount?: number;
    promoCode?: string;
    demoVideoUrl?: string;
    features?: string[];
    supportInfo?: string;
    images?: string[];
}

interface ProjectDetailsPageProps {
    project: ExtendedProject;
    onBack: () => void;
    onViewSeller?: (seller: ExtendedProject['seller']) => void;
    toggleSidebar?: () => void;
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ project, onBack, onViewSeller, toggleSidebar }) => {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { addToCart, isInCart } = useCart();
    const { userId } = useAuth();
    const [activeTab, setActiveTab] = useState<'description' | 'features' | 'support'>('description');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const [cartAnimating, setCartAnimating] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);

    // Sync cartAdded state with actual cart
    useEffect(() => {
        setCartAdded(isInCart(project.id));
    }, [isInCart, project.id]);

    const handleAddToCart = () => {
        if (cartAdded || cartAnimating) return;
        setCartAnimating(true);
        addToCart(project.id);
        setTimeout(() => {
            setCartAnimating(false);
            setCartAdded(true);
        }, 1200);
    };

    const liked = isInWishlist(project.id);

    // Check if project is purchased
    useEffect(() => {
        const checkPurchaseStatus = async () => {
            if (!userId) {
                setIsPurchased(false);
                return;
            }

            try {
                const userData = await fetchUserData(userId);
                if (userData && userData.purchases) {
                    const purchased = userData.purchases.some(
                        (purchase: any) => purchase.projectId === project.id
                    );
                    setIsPurchased(purchased);
                } else {
                    setIsPurchased(false);
                }
            } catch (error) {
                console.error('Error checking purchase status:', error);
                setIsPurchased(false);
            }
        };

        checkPurchaseStatus();
    }, [userId, project.id]);
    const images = project.images || [project.imageUrl];
    const finalPrice = project.price;
    const discount = project.discount || (project.originalPrice ? Math.round(((project.originalPrice - project.price) / project.originalPrice) * 100) : 0);

    const handleLikeClick = () => {
        toggleWishlist(project.id);
    };



    const features = project.features || [
        'Real-time collaboration',
        'Live code editing',
        'Integrated chat system',
        'Drawing/paint board',
        'Multiple user support',
        'Code sharing capabilities'
    ];

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Back Navigation */}
            <div className="flex items-center gap-3 mb-8">
                {toggleSidebar && (
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Projects
                </button>
                {/* Breadcrumb */}
                <span className="text-gray-300 hidden sm:inline">/</span>
                <span className="text-sm text-gray-400 hidden sm:inline truncate max-w-[200px]">{project.title}</span>
            </div>

            {/* Hero Section - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-10">
                {/* Left Column - Image Gallery (3/5 width) */}
                <div className="lg:col-span-3 space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-lg group">
                        <img
                            src={images[currentImageIndex]}
                            alt={project.title}
                            className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                        {/* Image counter badge */}
                        {images.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                {currentImageIndex + 1} / {images.length}
                            </div>
                        )}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    {images.length > 1 && (
                        <div className="flex gap-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === index
                                        ? 'border-orange-500 ring-2 ring-orange-200 shadow-md'
                                        : 'border-gray-200 hover:border-orange-300 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img} alt={`${project.title} ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column - Product Info (2/5 width) */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    {/* Category Badge */}
                    <div>
                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full uppercase tracking-wide mb-3">
                            {project.category}
                        </span>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{project.title}</h1>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 py-3 border-y border-gray-100">
                        <button
                            onClick={handleLikeClick}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${liked
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                                }`}
                        >
                            <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={liked ? 0 : 2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                            </svg>
                            {project.likes}
                        </button>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.208V17.19a2 2 0 012.228-1.987 9.338 9.338 0 004.121.952A9.38 9.38 0 0012 15.783" />
                            </svg>
                            <span className="font-medium">{project.purchases}</span> bought
                        </div>
                        {project.hasDocumentation && (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Docs
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg border border-gray-200 uppercase tracking-wider"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Short Description */}
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{project.description}</p>

                    {/* Pricing Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-orange-50/50 rounded-2xl p-5 border border-orange-100/80 shadow-sm">
                        <div className="flex items-end gap-3 mb-4">
                            <p className="text-3xl font-extrabold text-gray-900">₹{finalPrice.toFixed(2)}</p>
                            {project.originalPrice && (
                                <p className="text-base text-gray-400 line-through mb-0.5">₹{project.originalPrice.toFixed(2)}</p>
                            )}
                            {discount > 0 && (
                                <span className="px-2.5 py-0.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-full mb-0.5">
                                    {discount}% OFF
                                </span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5">
                            {/* Add to Cart Animation Styles */}
                            <style>{`
                                @keyframes cartSlide {
                                    0% { left: -10%; }
                                    45% { left: 42%; }
                                    55% { left: 42%; }
                                    100% { left: 110%; }
                                }
                                @keyframes itemDrop {
                                    0% { transform: translateY(-18px) scale(0.4); opacity: 0; }
                                    50% { transform: translateY(2px) scale(1.1); opacity: 1; }
                                    70% { transform: translateY(-3px) scale(0.95); opacity: 1; }
                                    100% { transform: translateY(0) scale(1); opacity: 0; }
                                }
                                @keyframes checkPop {
                                    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                                    50% { transform: scale(1.3) rotate(0deg); opacity: 1; }
                                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                                }
                                @keyframes slideTextIn {
                                    0% { transform: translateY(10px); opacity: 0; }
                                    100% { transform: translateY(0); opacity: 1; }
                                }
                                .cart-slide { animation: cartSlide 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                                .item-drop { animation: itemDrop 0.4s ease-out 0.35s both; }
                                .check-pop { animation: checkPop 0.4s ease-out 0.7s both; }
                                .slide-text { animation: slideTextIn 0.3s ease-out 0.8s both; }
                            `}</style>
                            <button
                                onClick={handleAddToCart}
                                disabled={cartAdded}
                                className={`w-full relative overflow-hidden font-semibold py-3.5 px-6 rounded-xl transition-all duration-500 shadow-md flex items-center justify-center gap-2.5 text-sm ${cartAdded
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-default shadow-green-200/50'
                                    : cartAnimating
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white scale-[0.98]'
                                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.97]'
                                    }`}
                            >
                                {cartAdded ? (
                                    <>
                                        <svg className="w-4 h-4 check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="slide-text">Added to Cart!</span>
                                    </>
                                ) : cartAnimating ? (
                                    <>
                                        <span className="text-white/70">Adding...</span>
                                        <div className="absolute cart-slide" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                                            <div className="relative">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 item-drop">
                                                    <div className="w-2 h-2 bg-white rounded-sm shadow-md"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Add to Cart
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setReportModalOpen(true)}
                                className="mx-auto mt-1 flex items-center gap-1.5 px-4 py-1.5 text-[11px] text-red-500 bg-red-50 rounded-full border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                Report an issue
                            </button>
                        </div>
                    </div>

                    {/* Seller Card - Compact */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {project.seller.avatar ? (
                                    <img src={project.seller.avatar} alt={project.seller.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    project.seller.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{project.seller.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-0.5">
                                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-xs font-medium text-gray-600">{project.seller.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-gray-300 text-xs">•</span>
                                    <span className="text-xs text-gray-500">{project.seller.totalSales} sales</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onViewSeller?.(project.seller)}
                                className="px-3.5 py-1.5 bg-orange-50 text-orange-600 font-semibold text-xs rounded-lg hover:bg-orange-100 transition-colors flex-shrink-0"
                            >
                                View Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Section */}
            <div>
                {/* Tab Navigation - Pills Style */}
                <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1.5 mb-8 w-fit">
                    {(['description', 'features', 'support'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${activeTab === tab
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'description' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3">About This Project</h2>
                                <p className="text-gray-600 leading-7 text-[15px]">
                                    {project.description} It enables parallel development with seamless live editing and code sharing across multiple users.
                                    Developers can communicate through an integrated chat system without switching tabs. The paint/draw feature makes
                                    whiteboarding and flowcharting easy during collaboration. Ideal for team projects, hackathons, and remote coding interviews.
                                </p>
                            </div>

                            {/* Demo Video */}
                            {project.demoVideoUrl && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">Demo Video</h2>
                                    <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video shadow-lg">
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
                            <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 text-sm font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'support' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Support & Help</h2>
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">
                                    {project.supportInfo || 'For any questions or support regarding this project, please contact the seller directly through their profile or email.'}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => onViewSeller?.(project.seller)}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Contact Seller
                                    </button>
                                    <button
                                        onClick={() => setReportModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-500 font-medium rounded-xl hover:bg-red-50 transition-all text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Report Issue
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Project Modal */}
            {userId && (
                <ReportProjectModal
                    isOpen={reportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    projectId={project.id}
                    projectTitle={project.title}
                    buyerId={userId}
                    isPurchased={isPurchased}
                    onSuccess={() => {
                        console.log('Report submitted successfully');
                        setReportModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default ProjectDetailsPage;

