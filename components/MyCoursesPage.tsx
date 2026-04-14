import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getPurchasedCourses, PurchasedCourse } from '../services/buyerApi';
import Lottie from 'lottie-react';
import noCourseAnimation from '../lottiefiles/no_courseanimation.json';
import SkeletonDashboard from './ui/skeleton-dashboard';

interface MyCoursesPageProps {
    onViewCourse?: (course: PurchasedCourse) => void;
}

const MyCoursesPage: React.FC<MyCoursesPageProps> = ({ onViewCourse }) => {
    const { userId } = useAuth();
    const [courses, setCourses] = useState<PurchasedCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch purchased courses
    const fetchCourses = async () => {
        if (!userId) {
            setError('Please log in to view your courses');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await getPurchasedCourses(userId);
            
            if (response.success && response.purchasedCourses) {
                setCourses(response.purchasedCourses);
            } else {
                setError(response.error || 'Failed to fetch courses');
            }
        } catch (err) {
            console.error('Error fetching purchased courses:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch courses');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [userId]);

    // Filter courses by search
    const filteredCourses = courses.filter(course => {
        const query = searchQuery.toLowerCase();
        return (
            course.title?.toLowerCase().includes(query) ||
            course.description?.toLowerCase().includes(query) ||
            course.category?.toLowerCase().includes(query)
        );
    });

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <p className="text-gray-600 mt-1">Access your purchased and enrolled courses</p>
                </div>
                <button
                    onClick={fetchCourses}
                    disabled={isLoading}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isLoading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search your courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{courses.length}</p>
                            <p className="text-sm text-white/80">Total Courses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{courses.filter(c => c.isFree).length}</p>
                            <p className="text-sm text-white/80">Free Courses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{courses.filter(c => !c.isFree).length}</p>
                            <p className="text-sm text-white/80">Paid Courses</p>
                        </div>
                    </div>
                </div>
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
                            onClick={fetchCourses}
                            className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && courses.length === 0 && (
                <div className="space-y-8">
                    <SkeletonDashboard />
                </div>
            )}

            {/* Courses Grid */}
            {!isLoading && filteredCourses.length > 0 && (
                <div>
                    <div className="mb-4 text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <div 
                                key={course.courseId} 
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
                            >
                                {/* Course Thumbnail */}
                                <div className="relative h-40 overflow-hidden">
                                    {course.thumbnailUrl ? (
                                        <img 
                                            src={course.thumbnailUrl} 
                                            alt={course.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Course';
                                            }}
                                        />
                                    ) : (
                                        <div className="h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                    )}
                                    
                                    {/* Purchased Badge */}
                                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Purchased
                                    </div>
                                </div>
                                
                                {/* Course Content */}
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
                                        {course.title}
                                    </h3>
                                    
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {course.description || 'No description available'}
                                    </p>
                                    
                                    {/* Tags */}
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                            {course.category}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                            {course.level}
                                        </span>
                                    </div>

                                    {/* Content Stats */}
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                        {course.content?.videos?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                {course.content.videos.length} Videos
                                            </span>
                                        )}
                                        {course.content?.pdfs?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                {course.content.pdfs.length} PDFs
                                            </span>
                                        )}
                                    </div>

                                    {/* Purchase Info */}
                                    <div className="text-xs text-gray-500 mb-4 pt-3 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span>Purchased:</span>
                                            <span className="font-medium">{formatDate(course.purchasedAt)}</span>
                                        </div>
                                        {course.priceAtPurchase !== undefined && course.priceAtPurchase > 0 && (
                                            <div className="flex justify-between items-center mt-1">
                                                <span>Price:</span>
                                                <span className="font-medium">₹{course.priceAtPurchase.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <button 
                                        onClick={() => onViewCourse?.(course)}
                                        className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Continue Learning
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredCourses.length === 0 && (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                    <div className="w-64 h-64 mx-auto mb-6 flex items-center justify-center">
                        <Lottie 
                            animationData={noCourseAnimation} 
                            loop={true} 
                            autoplay={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {searchQuery ? 'No courses found' : 'No courses yet'}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        {searchQuery 
                            ? `No courses match "${searchQuery}". Try a different search term.`
                            : 'You haven\'t purchased any courses yet. Browse our catalog to find courses that interest you!'}
                    </p>
                    {!searchQuery && (
                        <button 
                            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                        >
                            Browse Courses
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyCoursesPage;

