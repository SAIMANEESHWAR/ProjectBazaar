import React, { useState, useEffect } from 'react';

const GET_ALL_COURSES_ENDPOINT = 'https://lejjk9h72l.execute-api.ap-south-2.amazonaws.com/default/Get_all_courses_for_admin_and_buyer';

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

    // Get unique categories
    const categories = Array.from(new Set(courses.map(c => c.category)));

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
                    <p className="text-gray-600 mt-1">Explore and learn from our curated courses</p>
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

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Courses</label>
                        <input
                            type="text"
                            placeholder="Search by title, description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="all">All Levels</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
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
                <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading courses...</p>
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
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                            >
                                {course.thumbnailUrl ? (
                                    <div className="relative h-48 overflow-hidden">
                                        <img 
                                            src={course.thumbnailUrl} 
                                            alt={course.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                                            }}
                                        />
                                        {course.promoVideoUrl && (
                                            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                </svg>
                                                Video
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                )}
                                
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-xl text-gray-900 line-clamp-2 flex-1 group-hover:text-orange-600 transition-colors">
                                            {course.title}
                                        </h3>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                                        {course.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                            {course.category}
                                        </span>
                                        {course.subCategory && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                                {course.subCategory}
                                            </span>
                                        )}
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                            {course.level}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            {course.likesCount || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            {course.purchasesCount || 0} students
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div>
                                            <span className="text-orange-500 font-bold text-xl">
                                                {course.isFree ? (
                                                    <span className="text-green-600">Free</span>
                                                ) : (
                                                    `${course.currency} ${course.price}`
                                                )}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => onViewCourse?.(course)}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                                        >
                                            View Course
                                        </button>
                                    </div>

                                    {course.content && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                            <div className="flex flex-wrap gap-2">
                                                {course.content.pdfs?.length > 0 && (
                                                    <span>📄 {course.content.pdfs.length} PDF(s)</span>
                                                )}
                                                {course.content.videos?.length > 0 && (
                                                    <span>🎥 {course.content.videos.length} Video(s)</span>
                                                )}
                                                {course.content.notes?.length > 0 && (
                                                    <span>📝 {course.content.notes.length} Note(s)</span>
                                                )}
                                                {course.content.additionalResources?.length > 0 && (
                                                    <span>📦 {course.content.additionalResources.length} Resource(s)</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredCourses.length === 0 && (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-gray-500 text-lg mb-2">
                        {searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all' 
                            ? 'No courses match your filters' 
                            : 'No courses available'}
                    </p>
                    {searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all' && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                                setSelectedLevel('all');
                            }}
                            className="mt-4 px-4 py-2 text-orange-500 hover:text-orange-600 font-medium"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default BuyerCoursesPage;

