import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import noCourseAnimation from '../lottiefiles/no_courseanimation.json';
import SkeletonDashboard from './ui/skeleton-dashboard';

import { useAuth } from '../App';

const GET_ALL_COURSES_ENDPOINT = 'https://lejjk9h72l.execute-api.ap-south-2.amazonaws.com/default/Get_all_courses_for_admin_and_buyer';
const COURSE_LIKE_ENDPOINT = 'https://d5mbqkhoz7.execute-api.ap-south-2.amazonaws.com/default/course_likes_handler';

interface BuyerCoursesPageProps {
    onViewCourse?: (course: Course) => void;
}

export interface Course {
    courseId: string;
    title: string;
    description: string;
    category: string;
    subCategory?: string;
    level: string;
    language: string;
    price: number;
    currency: string;
    isFree: boolean;
    thumbnailUrl?: string;
    promoVideoUrl?: string;
    status: string;
    visibility: string;
    likesCount: number;
    purchasesCount: number;
    viewsCount: number;
    createdAt: string;
    updatedAt: string;
    instructor: {
        adminId: string;
        name: string;
    };
    content: {
        pdfs: Array<{ name: string; url: string }>;
        videos: Array<{ title: string; url: string }>;
        notes: Array<{ name: string; url: string }>;
        additionalResources: Array<{ name: string; url: string }>;
    };
}

const BuyerCoursesPage: React.FC<BuyerCoursesPageProps> = ({ onViewCourse }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedLevel, setSelectedLevel] = useState<string>('all');
    const [likedCourseIds, setLikedCourseIds] = useState<Set<string>>(new Set());
    const [isLiking, setIsLiking] = useState<{ [key: string]: boolean }>({});
    const { userId, isLoggedIn } = useAuth();

    // Fetch courses from API
    const fetchCourses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(GET_ALL_COURSES_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch courses: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Courses API Response:', data);

            // Handle both array and object with courses property
            const coursesArray = Array.isArray(data.courses) ? data.courses : (data.courses || []);

            if (data.success && coursesArray.length > 0) {
                console.log('Total courses received:', coursesArray.length);
                console.log('Raw courses data:', coursesArray);

                // Filter courses - show all public courses (including draft for testing)
                // In production, change to: course.status === 'published' && course.visibility === 'public'
                const publishedCourses = coursesArray
                    .filter((course: any) => {
                        const isPublic = course.visibility === 'public' || course.visibility === undefined;
                        console.log(`Course filter check - ID: ${course.courseId}, status: ${course.status}, visibility: ${course.visibility}, isPublic: ${isPublic}`);
                        // Show all public courses regardless of status (for now)
                        // Change to: return course.status === 'published' && isPublic; for production
                        return isPublic;
                    })
                    .map((course: any) => ({
                        courseId: course.courseId || '',
                        title: course.title || 'Untitled Course',
                        description: course.description || '',
                        category: course.category || '',
                        subCategory: course.subCategory,
                        level: course.level || 'Beginner',
                        language: course.language || 'English',
                        price: typeof course.price === 'number' ? course.price : parseFloat(String(course.price || 0)),
                        currency: course.currency || 'INR',
                        isFree: course.isFree || course.price === 0,
                        thumbnailUrl: course.thumbnailUrl,
                        promoVideoUrl: course.promoVideoUrl,
                        status: course.status || 'published',
                        visibility: course.visibility || 'public',
                        likesCount: course.likesCount || 0,
                        purchasesCount: course.purchasesCount || 0,
                        viewsCount: course.viewsCount || 0,
                        createdAt: course.createdAt || '',
                        updatedAt: course.updatedAt || '',
                        instructor: course.instructor || { adminId: '', name: '' },
                        content: course.content || {
                            pdfs: [],
                            videos: [],
                            notes: [],
                            additionalResources: []
                        }
                    }));

                setCourses(publishedCourses);
                console.log('Filtered courses count:', publishedCourses.length);
                console.log('Mapped courses:', publishedCourses);

                if (publishedCourses.length === 0 && coursesArray.length > 0) {
                    console.warn('No courses passed filter. All courses:', coursesArray.map((c: any) => ({
                        id: c.courseId,
                        status: c.status,
                        visibility: c.visibility
                    })));
                }
            } else if (data.success && (!coursesArray || coursesArray.length === 0)) {
                console.log('API returned success but no courses');
                setCourses([]);
            } else {
                throw new Error(data.message || 'Invalid response format from API');
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch courses');
            setCourses([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Fetch user liked courses
    useEffect(() => {
        const fetchLikedCourses = async () => {
            if (!isLoggedIn || !userId) {
                setLikedCourseIds(new Set());
                return;
            }
            try {
                const response = await fetch(COURSE_LIKE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, action: 'get_user_likes' })
                });
                const data = await response.json();
                if (data.success && data.likedCourses) {
                    setLikedCourseIds(new Set(data.likedCourses));
                }
            } catch (err) {
                console.error('Error fetching liked courses:', err);
            }
        };
        fetchLikedCourses();
    }, [userId, isLoggedIn]);

    const handleLikeToggle = async (e: React.MouseEvent, courseId: string) => {
        e.stopPropagation();

        if (!isLoggedIn || !userId) {
            // Ideally trigger login modal or redirect, for now just alert
            alert('Please log in to like courses');
            return;
        }

        if (isLiking[courseId]) return;

        // Optimistic UI update
        const isCurrentlyLiked = likedCourseIds.has(courseId);
        setIsLiking(prev => ({ ...prev, [courseId]: true }));

        setLikedCourseIds(prev => {
            const newSet = new Set(prev);
            if (isCurrentlyLiked) newSet.delete(courseId);
            else newSet.add(courseId);
            return newSet;
        });

        setCourses(prev => prev.map(course => {
            if (course.courseId === courseId) {
                return {
                    ...course,
                    likesCount: isCurrentlyLiked ? Math.max(0, course.likesCount - 1) : course.likesCount + 1
                };
            }
            return course;
        }));

        try {
            const response = await fetch(COURSE_LIKE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, userId, action: 'toggle' })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to toggle like');
            }

            // Sync with backend truth if needed
            if (data.likesCount !== undefined) {
                setCourses(prev => prev.map(course =>
                    course.courseId === courseId ? { ...course, likesCount: data.likesCount } : course
                ));
            }

        } catch (err) {
            console.error('Error toggling like:', err);
            // Revert optimistic update
            setLikedCourseIds(prev => {
                const newSet = new Set(prev);
                if (isCurrentlyLiked) newSet.add(courseId);
                else newSet.delete(courseId);
                return newSet;
            });
            setCourses(prev => prev.map(course => {
                if (course.courseId === courseId) {
                    return {
                        ...course,
                        likesCount: isCurrentlyLiked ? course.likesCount + 1 : Math.max(0, course.likesCount - 1)
                    };
                }
                return course;
            }));
        } finally {
            setIsLiking(prev => ({ ...prev, [courseId]: false }));
        }
    };

    // Get unique categories and format them
    const categories = Array.from(new Set(courses.map(c => c.category)));

    // Helper function to format text to Title Case
    const toTitleCase = (str: string): string => {
        if (!str) return '';
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Filter courses
    const filteredCourses = courses.filter(course => {
        const matchesSearch = searchQuery === '' ||
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
        const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;

        return matchesSearch && matchesCategory && matchesLevel;
    });

    return (
        <div className="space-y-5">
            {/* Subtitle */}
            <p className="text-gray-600 text-sm">Discover expert-led courses to advance your skills and career</p>

            {/* Enhanced Search and Filters */}
            <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                    <label htmlFor="course-search" className="sr-only">Search courses</label>
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            id="course-search"
                            type="text"
                            placeholder="Search courses... (e.g., React, Python, Web Development)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-10 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 bg-white transition-all outline-none shadow-sm ${searchQuery
                                ? 'border-orange-300 hover:border-orange-400'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            aria-label="Search courses by title, description, or category"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
                                aria-label="Clear search"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-0.5">Filters:</span>

                    {/* Category Filter */}
                    <div className="relative inline-flex">
                        <label htmlFor="course-category" className="sr-only">Filter by category</label>
                        <select
                            id="course-category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className={`appearance-none pl-3 pr-8 py-2 text-sm rounded-full border transition-all outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer font-medium min-w-[140px] ${selectedCategory !== 'all'
                                ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            aria-label="Filter courses by category"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{toTitleCase(cat)}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
                            {selectedCategory !== 'all' && (
                                <svg className="w-3.5 h-3.5 text-orange-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            <svg className={`w-3.5 h-3.5 ${selectedCategory !== 'all' ? 'text-orange-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Level Filter */}
                    <div className="relative inline-flex">
                        <label htmlFor="course-level" className="sr-only">Filter by level</label>
                        <select
                            id="course-level"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className={`appearance-none pl-3 pr-8 py-2 text-sm rounded-full border transition-all outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer font-medium min-w-[130px] ${selectedLevel !== 'all'
                                ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            aria-label="Filter courses by difficulty level"
                        >
                            <option value="all">All Levels</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
                            {selectedLevel !== 'all' && (
                                <div className={`w-2 h-2 rounded-full mr-1 ${selectedLevel === 'Beginner' ? 'bg-green-500' :
                                    selectedLevel === 'Intermediate' ? 'bg-yellow-500' :
                                        'bg-red-500'
                                    }`} aria-hidden="true"></div>
                            )}
                            <svg className={`w-3.5 h-3.5 ${selectedLevel !== 'all' ? 'text-orange-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Active Filters Clear Button */}
                    {(selectedCategory !== 'all' || selectedLevel !== 'all' || searchQuery) && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                                setSelectedLevel('all');
                            }}
                            className="ml-auto px-3 py-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-300 rounded-full hover:bg-orange-100 hover:border-orange-400 transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 shadow-sm"
                            aria-label="Clear all filters"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-800 font-medium text-sm flex-1">Error: {error}</p>
                        <button
                            onClick={fetchCourses}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            aria-label="Retry loading courses"
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
                    <div className="mb-4">
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">{filteredCourses.length}</span> {filteredCourses.length === 1 ? 'result found' : 'results found'}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <article
                                key={course.courseId}
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all duration-200 group focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2"
                            >
                                <div
                                    className="relative h-48 overflow-hidden bg-gray-100 cursor-pointer"
                                    onClick={() => onViewCourse?.(course)}
                                    role="button"
                                    tabIndex={-1}
                                    aria-label={`View ${course.title}`}
                                >
                                    {course.thumbnailUrl ? (
                                        <>
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={`${course.title} course thumbnail`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                                                }}
                                            />
                                            {course.promoVideoUrl && (
                                                <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-md">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                    </svg>
                                                    Video
                                                </div>
                                            )}
                                            {course.isFree && (
                                                <div className="absolute top-2 left-2 bg-green-600 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-md">
                                                    FREE
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="h-full bg-gradient-to-br from-orange-100 via-orange-50 to-orange-200 flex items-center justify-center">
                                            <svg className="w-16 h-16 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    {/* Title - More Prominent */}
                                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
                                        {toTitleCase(course.title)}
                                    </h3>

                                    {/* Description - Reduced Dominance */}
                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3 min-h-[2.5rem]">
                                        {course.description}
                                    </p>

                                    {/* Tags - Clear Distinction */}
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold border border-blue-200">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            {toTitleCase(course.category)}
                                        </span>
                                        {course.subCategory && course.subCategory.length >= 3 && (
                                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">
                                                {toTitleCase(course.subCategory)}
                                            </span>
                                        )}
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                                            {course.level}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-600 pb-3 border-b border-gray-100">
                                        <button
                                            onClick={(e) => handleLikeToggle(e, course.courseId)}
                                            disabled={isLiking[course.courseId]}
                                            className={`flex items-center gap-1.5 focus:outline-none transition-transform active:scale-90 ${isLiking[course.courseId] ? 'opacity-70 cursor-wait' : 'hover:scale-105'} ${likedCourseIds.has(course.courseId) ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
                                            title={likedCourseIds.has(course.courseId) ? 'Unlike this course' : 'Like this course'}
                                            aria-label={likedCourseIds.has(course.courseId) ? 'Unlike course' : 'Like course'}
                                        >
                                            <svg className="w-4 h-4" fill={likedCourseIds.has(course.courseId) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={likedCourseIds.has(course.courseId) ? 0 : 2} aria-hidden="true">
                                                {likedCourseIds.has(course.courseId) ? (
                                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                )}
                                            </svg>
                                            <span className={`font-medium ${likedCourseIds.has(course.courseId) ? 'text-red-600' : 'text-gray-600'}`}>{course.likesCount || 0}</span>
                                            <span className="sr-only">{likedCourseIds.has(course.courseId) ? 'saved' : 'likes'}</span>
                                        </button>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span className="font-medium">{course.purchasesCount || 0} enrolled</span>
                                        </span>
                                    </div>

                                    {course.content && (course.content.pdfs?.length > 0 || course.content.videos?.length > 0 || course.content.notes?.length > 0 || course.content.additionalResources?.length > 0) && (
                                        <div className="mb-3 pb-3 border-b border-gray-100">
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {course.content.pdfs?.length > 0 && (
                                                    <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        {course.content.pdfs.length} PDF{course.content.pdfs.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {course.content.videos?.length > 0 && (
                                                    <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                        </svg>
                                                        {course.content.videos.length} Video{course.content.videos.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {course.content.notes?.length > 0 && (
                                                    <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        {course.content.notes.length} Note{course.content.notes.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {course.content.additionalResources?.length > 0 && (
                                                    <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                        </svg>
                                                        {course.content.additionalResources.length} Resource{course.content.additionalResources.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Price and CTA - Aligned */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-shrink-0">
                                            {course.isFree ? (
                                                <span className="text-green-600 font-bold text-lg">Free</span>
                                            ) : (
                                                <span className="text-orange-600 font-bold text-xl">₹{(course.currency === 'USD' ? course.price * 83 : course.price).toLocaleString('en-IN')}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewCourse?.(course);
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-all font-semibold text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                            aria-label={`${course.isFree ? 'Start learning' : 'Enroll in'} ${course.title}`}
                                        >
                                            {course.isFree ? 'Start Learning' : 'Enroll Now'}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredCourses.length === 0 && (
                <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl">
                    <div className="max-w-md mx-auto">
                        <div className="w-64 h-64 mx-auto mb-6 flex items-center justify-center">
                            <Lottie
                                animationData={noCourseAnimation}
                                loop={true}
                                autoplay={true}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all'
                                ? 'No courses match your search'
                                : 'No courses available yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all'
                                ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                                : 'Check back soon for new courses or browse other categories.'}
                        </p>
                        {(searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                    setSelectedLevel('all');
                                }}
                                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyerCoursesPage;

