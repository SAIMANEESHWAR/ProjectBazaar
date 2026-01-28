import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import type { Course } from './BuyerCoursesPage';
import { createCourseOrder, verifyCoursePayment, enrollFreeCourse, getPurchasedCourses } from '../services/buyerApi';

// Declare Razorpay type for TypeScript
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface CourseDetailsPageProps {
    course: Course;
    onBack: () => void;
    onPurchaseSuccess?: () => void;
    toggleSidebar?: () => void;
    isPurchased?: boolean;
}

const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({ course, onBack, onPurchaseSuccess, toggleSidebar, isPurchased }) => {
    const { userId, userEmail, isLoggedIn } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'instructor'>('overview');
    const [selectedPdf, setSelectedPdf] = useState<{ name: string; url: string } | null>(null);
    const [pdfPages, setPdfPages] = useState<Array<{ page: number; url: string }>>([]);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [isAlreadyPurchased, setIsAlreadyPurchased] = useState(isPurchased || false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    // Check if user already purchased this course
    useEffect(() => {
        const checkPurchaseStatus = async () => {
            if (!userId) return;

            try {
                const response = await getPurchasedCourses(userId);
                if (response.success && response.purchasedCourses) {
                    const isPurchased = response.purchasedCourses.some(
                        (pc) => pc.courseId === course.courseId
                    );
                    setIsAlreadyPurchased(isPurchased);
                }
            } catch (err) {
                console.error('Error checking purchase status:', err);
            }
        };

        checkPurchaseStatus();
    }, [userId, course.courseId]);

    // Load Razorpay SDK
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Load PDF and extract first 3 pages
    useEffect(() => {
        if (selectedPdf) {
            // Create URLs for first 3 pages of PDF
            const pages = [];
            for (let i = 1; i <= 3; i++) {
                pages.push({
                    page: i,
                    url: `${selectedPdf.url}#page=${i}`
                });
            }
            setPdfPages(pages);
        }
    }, [selectedPdf]);

    // Handle course purchase with Razorpay
    const handlePurchase = async () => {
        if (!isLoggedIn || !userId) {
            setPurchaseError('Please log in to purchase this course');
            return;
        }

        if (isAlreadyPurchased) {
            setPurchaseError('You have already purchased this course');
            return;
        }

        setIsPurchasing(true);
        setPurchaseError(null);

        try {
            // Handle free course enrollment
            if (course.isFree || course.price === 0) {
                const response = await enrollFreeCourse(userId, course.courseId);

                if (response.success) {
                    setPurchaseSuccess(true);
                    setIsAlreadyPurchased(true);
                    onPurchaseSuccess?.();
                } else {
                    setPurchaseError(response.error || 'Failed to enroll in course');
                }
                setIsPurchasing(false);
                return;
            }

            // Create Razorpay order for paid course
            // IMPORTANT: Always use INR for Razorpay to enable all payment methods
            // USD/other currencies only support Cards - no UPI, Wallets, Netbanking
            const orderResponse = await createCourseOrder({
                userId,
                courseId: course.courseId,
                amount: course.price,
                currency: 'INR', // Force INR to enable UPI, Wallets, Netbanking
                userEmail: userEmail || undefined,
            });

            if (!orderResponse.success || !orderResponse.razorpayOrderId) {
                throw new Error(orderResponse.error || 'Failed to create order');
            }

            // Initialize Razorpay checkout
            const options = {
                key: orderResponse.key,
                amount: orderResponse.amount,
                currency: orderResponse.currency,
                name: orderResponse.name || 'ProjectBazaar',
                description: orderResponse.description || `Purchase: ${course.title}`,
                order_id: orderResponse.razorpayOrderId,
                prefill: orderResponse.prefill,
                theme: {
                    color: '#f97316', // Orange theme
                },
                handler: async function (response: any) {
                    // Verify payment on backend
                    try {
                        const verifyResponse = await verifyCoursePayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            userId,
                            courseId: course.courseId,
                        });

                        if (verifyResponse.success) {
                            setPurchaseSuccess(true);
                            setIsAlreadyPurchased(true);
                            onPurchaseSuccess?.();
                        } else {
                            setPurchaseError(verifyResponse.error || 'Payment verification failed');
                        }
                    } catch (err) {
                        console.error('Payment verification error:', err);
                        setPurchaseError('Payment verification failed. Please contact support.');
                    }
                    setIsPurchasing(false);
                },
                modal: {
                    ondismiss: function () {
                        setIsPurchasing(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                console.error('Payment failed:', response.error);
                setPurchaseError(response.error.description || 'Payment failed');
                setIsPurchasing(false);
            });
            razorpay.open();
        } catch (error) {
            console.error('Purchase error:', error);
            setPurchaseError(error instanceof Error ? error.message : 'Failed to initiate purchase');
            setIsPurchasing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Back Button */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Button */}
                        {toggleSidebar && (
                            <button
                                onClick={toggleSidebar}
                                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Toggle sidebar"
                            >
                                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium hidden sm:inline">Back to Courses</span>
                            <span className="font-medium sm:hidden">Back</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Course Header */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            {course.thumbnailUrl && (
                                <div className="mb-6 rounded-lg overflow-hidden">
                                    <img
                                        src={course.thumbnailUrl}
                                        alt={course.title}
                                        className="w-full h-64 object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Course+Image';
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                                    <div className="flex items-center gap-3 flex-wrap mb-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            {course.category}
                                        </span>
                                        {course.subCategory && (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                                {course.subCategory}
                                            </span>
                                        )}
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                            {course.level}
                                        </span>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                            {course.language}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm text-gray-600 border-t border-gray-200 pt-4">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {course.viewsCount || 0} views
                                </span>
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {course.likesCount || 0} likes
                                </span>
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {course.purchasesCount || 0} students
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="border-b border-gray-200">
                                <nav className="flex -mb-px">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('content')}
                                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'content'
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Content
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('instructor')}
                                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'instructor'
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Instructor
                                    </button>
                                </nav>
                            </div>

                            <div className="p-6">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                                {course.description || 'No description available for this course.'}
                                            </p>
                                        </div>

                                        {course.promoVideoUrl && (
                                            <div className="mt-8">
                                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Promo Video</h2>
                                                <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
                                                    <iframe
                                                        src={course.promoVideoUrl}
                                                        className="w-full h-full"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        title="Course Promo Video"
                                                    ></iframe>
                                                </div>
                                            </div>
                                        )}

                                        {/* Course Content Summary */}
                                        <div className="mt-8">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Included</h2>
                                            <div className="grid grid-cols-2 gap-4">
                                                {course.content.pdfs?.length > 0 && (
                                                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                                                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{course.content.pdfs.length}</p>
                                                            <p className="text-sm text-gray-600">PDF Documents</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {course.content.videos?.length > 0 && (
                                                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                                                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{course.content.videos.length}</p>
                                                            <p className="text-sm text-gray-600">Video Lessons</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {course.content.notes?.length > 0 && (
                                                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{course.content.notes.length}</p>
                                                            <p className="text-sm text-gray-600">Notes</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {course.content.additionalResources?.length > 0 && (
                                                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                                                        <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                        </svg>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{course.content.additionalResources.length}</p>
                                                            <p className="text-sm text-gray-600">Resources</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'content' && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Content</h2>

                                        {/* PDFs Section */}
                                        {course.content.pdfs && course.content.pdfs.length > 0 && (
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    PDF Documents
                                                </h3>
                                                <div className="space-y-3">
                                                    {course.content.pdfs.map((pdf, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setSelectedPdf(pdf)}
                                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedPdf?.url === pdf.url
                                                                ? 'border-orange-500 bg-orange-50'
                                                                : 'border-gray-200 hover:border-orange-300 bg-white'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900">{pdf.name}</p>
                                                                        <p className="text-sm text-gray-500">Click to preview first 3 pages</p>
                                                                    </div>
                                                                </div>
                                                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* PDF Preview - First 3 Pages */}
                                                {selectedPdf && pdfPages.length > 0 && (
                                                    <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-lg font-semibold text-gray-900">
                                                                Preview: {selectedPdf.name} (First 3 Pages)
                                                            </h4>
                                                            <button
                                                                onClick={() => setSelectedPdf(null)}
                                                                className="text-gray-500 hover:text-gray-700"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {pdfPages.map((page, index) => (
                                                                <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                                                                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                                                        <p className="text-sm font-medium text-gray-700">Page {page.page}</p>
                                                                    </div>
                                                                    <div className="w-full" style={{ height: '600px' }}>
                                                                        <iframe
                                                                            src={page.url}
                                                                            className="w-full h-full"
                                                                            title={`PDF Page ${page.page}`}
                                                                        ></iframe>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Videos Section */}
                                        {course.content.videos && course.content.videos.length > 0 && (
                                            <div className="mt-8">
                                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    Video Lessons
                                                </h3>
                                                <div className="space-y-4">
                                                    {course.content.videos.map((video, index) => (
                                                        <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                                                            <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
                                                            <a
                                                                href={video.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-2"
                                                            >
                                                                Watch Video
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes Section */}
                                        {course.content.notes && course.content.notes.length > 0 && (
                                            <div className="mt-8">
                                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Notes
                                                </h3>
                                                <div className="space-y-3">
                                                    {course.content.notes.map((note, index) => (
                                                        <a
                                                            key={index}
                                                            href={note.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                <span className="font-medium text-gray-900">{note.name}</span>
                                                            </div>
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Additional Resources Section */}
                                        {course.content.additionalResources && course.content.additionalResources.length > 0 && (
                                            <div className="mt-8">
                                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                    </svg>
                                                    Additional Resources
                                                </h3>
                                                <div className="space-y-3">
                                                    {course.content.additionalResources.map((resource, index) => (
                                                        <a
                                                            key={index}
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                                </svg>
                                                                <span className="font-medium text-gray-900">{resource.name}</span>
                                                            </div>
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(!course.content.pdfs || course.content.pdfs.length === 0) &&
                                            (!course.content.videos || course.content.videos.length === 0) &&
                                            (!course.content.notes || course.content.notes.length === 0) &&
                                            (!course.content.additionalResources || course.content.additionalResources.length === 0) && (
                                                <div className="text-center py-12 text-gray-500">
                                                    <p>No content available for this course yet.</p>
                                                </div>
                                            )}
                                    </div>
                                )}

                                {activeTab === 'instructor' && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructor</h2>
                                        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg">
                                            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                                {course.instructor.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-gray-900 mb-1">{course.instructor.name}</h3>
                                                <p className="text-gray-600">Course Instructor</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                            <div className="text-center mb-6">
                                <div className="text-3xl font-bold text-gray-900 mb-2">
                                    {course.isFree ? (
                                        <span className="text-green-600">Free</span>
                                    ) : (
                                        <span>{course.currency} {course.price}</span>
                                    )}
                                </div>
                            </div>

                            {/* Purchase Success Message */}
                            {purchaseSuccess && (
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">
                                            {course.isFree ? 'Successfully enrolled!' : 'Purchase successful!'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-green-600 mt-1">You now have full access to this course.</p>
                                </div>
                            )}

                            {/* Purchase Error Message */}
                            {purchaseError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">Error</span>
                                    </div>
                                    <p className="text-sm text-red-600 mt-1">{purchaseError}</p>
                                </div>
                            )}

                            {/* Purchase Button */}
                            {isAlreadyPurchased || purchaseSuccess ? (
                                <button
                                    className="w-full bg-green-500 text-white font-semibold py-3 px-4 rounded-lg mb-4 flex items-center justify-center gap-2"
                                    disabled
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {course.isFree ? 'Enrolled' : 'Purchased'}
                                </button>
                            ) : (
                                <button
                                    onClick={handlePurchase}
                                    disabled={isPurchasing || !isLoggedIn}
                                    className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2 ${isPurchasing || !isLoggedIn
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                        }`}
                                >
                                    {isPurchasing ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Processing...
                                        </>
                                    ) : !isLoggedIn ? (
                                        'Login to Purchase'
                                    ) : course.isFree ? (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Enroll Now
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Purchase Course
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Secure Payment Badge */}
                            {!course.isFree && !isAlreadyPurchased && !purchaseSuccess && (
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Secure payment via Razorpay
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Level</span>
                                    <span className="font-medium text-gray-900">{course.level}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Language</span>
                                    <span className="font-medium text-gray-900">{course.language}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Students</span>
                                    <span className="font-medium text-gray-900">{course.purchasesCount || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Created</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(course.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Money Back Guarantee */}
                            {!course.isFree && (
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">30-Day Guarantee</p>
                                            <p className="text-xs text-gray-600">Full refund if not satisfied</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailsPage;

