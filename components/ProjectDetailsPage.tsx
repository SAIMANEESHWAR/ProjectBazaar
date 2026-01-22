import React, { useState, useEffect } from 'react';
import type { BuyerProject } from './BuyerProjectCard';
import { useWishlist } from './DashboardPage';
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
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ project, onBack, onViewSeller }) => {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { userId } = useAuth();
    const [activeTab, setActiveTab] = useState<'description' | 'features' | 'support'>('description');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    
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
    const finalPrice = appliedPromo && project.promoCode ? project.price * 0.9 : project.price;
    const discount = project.discount || (project.originalPrice ? Math.round(((project.originalPrice - project.price) / project.originalPrice) * 100) : 0);

    const handleLikeClick = () => {
        toggleWishlist(project.id);
    };

    const handlePromoApply = () => {
        if (promoCode === project.promoCode || promoCode === '444555') {
            setAppliedPromo(true);
        }
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
        <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Projects</span>
            </button>

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
                        {/* Logo Overlay */}
                        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                            <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                                {project.title}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Code, Chat and Collaborate</p>
                        </div>
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

                {/* Right Column - Product Details */}
                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">{project.title}</h1>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-6 mb-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleLikeClick}
                                    className={`p-2 rounded-lg transition-all ${
                                        liked
                                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={liked ? 0 : 2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                    </svg>
                                </button>
                                <span className="text-sm font-semibold text-gray-700">{project.likes} likes</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-sm font-semibold">{project.purchases} members bought</span>
                            </div>
                        </div>

                        {/* Technology Tags */}
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
                                <p className="text-4xl font-bold text-gray-900">₹{finalPrice.toFixed(2)}</p>
                                {project.originalPrice && (
                                    <p className="text-lg text-gray-500 line-through mt-1">₹{project.originalPrice.toFixed(2)}</p>
                                )}
                            </div>
                            {discount > 0 && (
                                <span className="px-3 py-1 bg-purple-500 text-white text-sm font-bold rounded-full">
                                    {discount}% OFF
                                </span>
                            )}
                        </div>

                        {/* Promo Code */}
                        <div className="space-y-2 mb-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter promo code"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handlePromoApply}
                                    className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                STUDENT OFFER: 10% DISCOUNT with code <span className="font-semibold text-orange-600">444555</span>
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Buy Now
                            </button>
                            <button
                                onClick={() => setReportModalOpen(true)}
                                className="w-full bg-white border-2 border-red-200 text-red-600 font-semibold py-3 px-6 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Report Issue
                            </button>
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                                {project.seller.avatar ? (
                                    <img src={project.seller.avatar} alt={project.seller.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    project.seller.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{project.seller.name}</p>
                                <p className="text-sm text-gray-600">{project.seller.email}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-sm font-medium text-gray-700">{project.seller.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{project.seller.totalSales} sales</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onViewSeller?.(project.seller)}
                            className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 text-sm shadow-sm hover:shadow-md"
                        >
                            View Seller Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="mt-12">
                <div className="flex gap-2 border-b border-gray-200 mb-6">
                    {(['description', 'features', 'support'] as const).map((tab) => (
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
                                {project.description} It enables parallel development with seamless live editing and code sharing across multiple users. 
                                Developers can communicate through an integrated chat system without switching tabs. The paint/draw feature makes 
                                whiteboarding and flowcharting easy during collaboration. Ideal for team projects, hackathons, and remote coding interviews.
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

                    {activeTab === 'support' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Support & Help</h2>
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <p className="text-gray-600 leading-relaxed mb-6">
                                    {project.supportInfo || 'For any questions or support regarding this project, please contact the seller directly through their profile or email.'}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => onViewSeller?.(project.seller)}
                                        className="flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Contact Seller
                                    </button>
                                    <button 
                                        onClick={() => setReportModalOpen(true)}
                                        className="flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-red-300 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-400 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

