import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';

const COURSES_API_ENDPOINT = 'https://npvrcgotli.execute-api.ap-south-2.amazonaws.com/default/Admin_upload_courses_and_notes';
const GET_ALL_COURSES_ENDPOINT = 'https://lejjk9h72l.execute-api.ap-south-2.amazonaws.com/default/Get_all_courses_for_admin_and_buyer';
const GET_ALL_USERS_ENDPOINT = 'https://m81g90npsf.execute-api.ap-south-2.amazonaws.com/default/Get_All_users_for_admin';

interface CoursePurchase {
    courseId: string;
    courseTitle: string;
    priceAtPurchase: number;
    purchasedAt: string;
    paymentId: string;
    orderId?: string;
    orderStatus: string;
}

interface UserWithPurchases {
    userId: string;
    email?: string;
    fullName?: string;
    purchasedCourses?: CoursePurchase[];
}

interface Course {
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

interface CourseFormData {
    title: string;
    description: string;
    category: string;
    subCategory: string;
    level: string;
    language: string;
    price: string;
    currency: string;
    status: string;
    visibility: string;
    tags: string[];
}

const CoursesManagementPage: React.FC = () => {
    const { userId, userEmail } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'courses' | 'purchases'>('courses');
    const [allPurchases, setAllPurchases] = useState<Array<CoursePurchase & { userName: string; userEmail: string; userId: string }>>([]);
    const [isPurchasesLoading, setIsPurchasesLoading] = useState(false);
    const [purchaseStats, setPurchaseStats] = useState({ totalRevenue: 0, totalPurchases: 0, uniqueBuyers: 0 });
    const [purchaseViewMode, setPurchaseViewMode] = useState<'table' | 'grid'>('table');
    const [searchPurchase, setSearchPurchase] = useState('');
    
    const [formData, setFormData] = useState<CourseFormData>({
        title: '',
        description: '',
        category: '',
        subCategory: '',
        level: 'Beginner',
        language: 'English',
        price: '0',
        currency: 'INR',
        status: 'draft',
        visibility: 'public',
        tags: [],
    });

    const [files, setFiles] = useState<{
        thumbnail?: File;
        promoVideo?: File;
        pdfs: File[];
        videos: File[];
        notes: File[];
        resources: File[];
    }>({
        pdfs: [],
        videos: [],
        notes: [],
        resources: [],
    });

    const [tagInput, setTagInput] = useState('');

    // Fetch courses from API
    const fetchCourses = async () => {
        setIsLoading(true);
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
            
            if (data.success && data.courses) {
                // Map API courses to Course interface
                const mappedCourses: Course[] = data.courses.map((course: any) => ({
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
                    status: course.status || 'draft',
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
                
                setCourses(mappedCourses);
                console.log('Fetched courses:', mappedCourses.length);
            } else {
                throw new Error(data.message || 'Invalid response format from API');
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            setCourses([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Fetch all course purchases from all users
    const fetchAllPurchases = async () => {
        setIsPurchasesLoading(true);
        try {
            const response = await fetch(GET_ALL_USERS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: 'admin',
                    action: 'GET_ALL_USERS'
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            const data = await response.json();
            
            // API returns "data" array, not "users"
            const users = data.data || data.users || [];
            
            if (data.success && users.length > 0) {
                const purchases: Array<CoursePurchase & { userName: string; userEmail: string; userId: string }> = [];
                let totalRevenue = 0;
                const buyerSet = new Set<string>();

                users.forEach((user: UserWithPurchases) => {
                    if (user.purchasedCourses && user.purchasedCourses.length > 0) {
                        buyerSet.add(user.userId);
                        user.purchasedCourses.forEach((purchase: CoursePurchase) => {
                            purchases.push({
                                ...purchase,
                                userName: user.fullName || user.email?.split('@')[0] || 'Unknown User',
                                userEmail: user.email || 'N/A',
                                userId: user.userId,
                            });
                            totalRevenue += Number(purchase.priceAtPurchase) || 0;
                        });
                    }
                });

                // Sort by purchase date (most recent first)
                purchases.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());

                setAllPurchases(purchases);
                setPurchaseStats({
                    totalRevenue,
                    totalPurchases: purchases.length,
                    uniqueBuyers: buyerSet.size,
                });
                console.log('Fetched course purchases:', purchases.length);
            }
        } catch (error) {
            console.error('Error fetching purchases:', error);
            setAllPurchases([]);
        } finally {
            setIsPurchasesLoading(false);
        }
    };

    // Fetch purchases when tab changes to purchases
    useEffect(() => {
        if (activeTab === 'purchases' && allPurchases.length === 0) {
            fetchAllPurchases();
        }
    }, [activeTab]);

    // Get presigned URL for file upload
    const getPresignedUrl = async (fileName: string, courseId: string): Promise<{ uploadUrl: string; fileUrl: string }> => {
        const response = await fetch(COURSES_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getPresignedUrl',
                adminId: userId,
                fileName,
                courseId,
            }),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to get presigned URL');
        }

        return {
            uploadUrl: data.uploadUrl,
            fileUrl: data.fileUrl,
        };
    };

    // Upload file to S3 using fetch (better CORS handling)
    const uploadFileToS3 = async (file: File, uploadUrl: string, fileKey: string): Promise<void> => {
        try {
            console.log(`Uploading ${fileKey} (${file.name}, ${file.size} bytes)`);
            
            // Use fetch instead of XMLHttpRequest for better CORS handling
            const response = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                // DO NOT set Content-Type header - presigned URLs handle this
                // Setting it will cause signature mismatch and 403 errors
                headers: {
                    // Only set headers that are in the presigned URL signature
                    // Most presigned URLs don't require any headers
                },
                // Enable credentials if needed (usually not for presigned URLs)
                credentials: 'omit',
            });

            console.log(`Upload response for ${fileKey}:`, {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
            }

            console.log(`Successfully uploaded ${fileKey}`);
        } catch (error) {
            console.error(`Error uploading ${fileKey}:`, error);
            throw error;
        }
    };

    // Handle file selection
    const handleFileChange = (type: string, files: FileList | null) => {
        if (!files) return;

        if (type === 'thumbnail' || type === 'promoVideo') {
            setFiles(prev => ({ ...prev, [type]: files[0] }));
        } else {
            setFiles(prev => ({
                ...prev,
                [type]: Array.from(files),
            }));
        }
    };

    // Add tag
    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    // Remove tag
    const handleRemoveTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag),
        }));
    };

    // Submit course
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const courseId = `course-${Date.now()}`;
            const uploadedFiles: {
                thumbnailUrl?: string;
                promoVideoUrl?: string;
                pdfs: Array<{ name: string; url: string }>;
                videos: Array<{ title: string; url: string }>;
                notes: Array<{ name: string; url: string }>;
                resources: Array<{ name: string; url: string }>;
            } = {
                pdfs: [],
                videos: [],
                notes: [],
                resources: [],
            };

            // Upload thumbnail
            if (files.thumbnail) {
                try {
                    const { uploadUrl, fileUrl } = await getPresignedUrl(files.thumbnail.name, courseId);
                    console.log('Uploading thumbnail to:', fileUrl);
                    await uploadFileToS3(files.thumbnail, uploadUrl, 'thumbnail');
                    uploadedFiles.thumbnailUrl = fileUrl;
                } catch (error) {
                    console.error('Error uploading thumbnail:', error);
                    throw new Error(`Failed to upload thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Upload promo video
            if (files.promoVideo) {
                try {
                    const { uploadUrl, fileUrl } = await getPresignedUrl(files.promoVideo.name, courseId);
                    console.log('Uploading promo video to:', fileUrl);
                    await uploadFileToS3(files.promoVideo, uploadUrl, 'promoVideo');
                    uploadedFiles.promoVideoUrl = fileUrl;
                } catch (error) {
                    console.error('Error uploading promo video:', error);
                    throw new Error(`Failed to upload promo video: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Upload PDFs
            for (const pdf of files.pdfs) {
                try {
                    const { uploadUrl, fileUrl } = await getPresignedUrl(pdf.name, courseId);
                    console.log('Uploading PDF:', pdf.name);
                    await uploadFileToS3(pdf, uploadUrl, `pdf-${pdf.name}`);
                    uploadedFiles.pdfs.push({ name: pdf.name, url: fileUrl });
                } catch (error) {
                    console.error(`Error uploading PDF ${pdf.name}:`, error);
                    throw new Error(`Failed to upload PDF ${pdf.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Upload videos
            for (const video of files.videos) {
                try {
                    const { uploadUrl, fileUrl } = await getPresignedUrl(video.name, courseId);
                    console.log('Uploading video:', video.name);
                    await uploadFileToS3(video, uploadUrl, `video-${video.name}`);
                    uploadedFiles.videos.push({ title: video.name, url: fileUrl });
                } catch (error) {
                    console.error(`Error uploading video ${video.name}:`, error);
                    throw new Error(`Failed to upload video ${video.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Upload notes
            for (const note of files.notes) {
                try {
                    const { uploadUrl, fileUrl } = await getPresignedUrl(note.name, courseId);
                    console.log('Uploading note:', note.name);
                    await uploadFileToS3(note, uploadUrl, `note-${note.name}`);
                    uploadedFiles.notes.push({ name: note.name, url: fileUrl });
                } catch (error) {
                    console.error(`Error uploading note ${note.name}:`, error);
                    throw new Error(`Failed to upload note ${note.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Upload additional resources
            for (const resource of files.resources) {
                try {
                    const { uploadUrl, fileUrl } = await getPresignedUrl(resource.name, courseId);
                    console.log('Uploading resource:', resource.name);
                    await uploadFileToS3(resource, uploadUrl, `resource-${resource.name}`);
                    uploadedFiles.resources.push({ name: resource.name, url: fileUrl });
                } catch (error) {
                    console.error(`Error uploading resource ${resource.name}:`, error);
                    throw new Error(`Failed to upload resource ${resource.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Create course
            const response = await fetch(COURSES_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminId: userId,
                    adminName: userEmail || 'Admin',
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    subCategory: formData.subCategory || undefined,
                    level: formData.level,
                    language: formData.language,
                    price: parseFloat(formData.price) || 0,
                    currency: formData.currency,
                    status: formData.status,
                    visibility: formData.visibility,
                    tags: formData.tags,
                    thumbnailUrl: uploadedFiles.thumbnailUrl,
                    promoVideoUrl: uploadedFiles.promoVideoUrl,
                    pdfs: uploadedFiles.pdfs,
                    videos: uploadedFiles.videos,
                    notes: uploadedFiles.notes,
                    resources: uploadedFiles.resources,
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Course created successfully!');
                setShowForm(false);
                resetForm();
                fetchCourses();
            } else {
                alert(`Error: ${data.message || 'Failed to create course'}`);
            }
        } catch (error) {
            console.error('Error creating course:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create course';
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: '',
            subCategory: '',
            level: 'Beginner',
            language: 'English',
            price: '0',
            currency: 'INR',
            status: 'draft',
            visibility: 'public',
            tags: [],
        });
        setFiles({
            pdfs: [],
            videos: [],
            notes: [],
            resources: [],
        });
        setTagInput('');
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Courses Management</h2>
                <div className="flex items-center gap-3">
                    {activeTab === 'courses' && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {showForm ? 'Cancel Upload' : '+ Upload Course'}
                        </button>
                    )}
                    {activeTab === 'purchases' && (
                        <button
                            onClick={fetchAllPurchases}
                            disabled={isPurchasesLoading}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className={`w-4 h-4 ${isPurchasesLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                            activeTab === 'courses'
                                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            All Courses ({courses.length})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('purchases')}
                        className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                            activeTab === 'purchases'
                                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Course Purchases ({allPurchases.length})
                        </div>
                    </button>
                </div>
            </div>

            {/* Courses Tab Content */}
            {activeTab === 'courses' && (
                <>
                    {/* Course Form */}
                    {showForm && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4">Create New Course</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., Web Development"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                                <input
                                    type="text"
                                    value={formData.subCategory}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <input
                                    type="text"
                                    value={formData.language}
                                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="INR">INR</option>
                                        <option value="INR">INR</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                                <select
                                    value={formData.visibility}
                                    onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Add a tag and press Enter"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="text-orange-600 hover:text-orange-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* File Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange('thumbnail', e.target.files)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Promo Video</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleFileChange('promoVideo', e.target.files)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PDFs</label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    multiple
                                    onChange={(e) => handleFileChange('pdfs', e.target.files)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                {files.pdfs.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">{files.pdfs.length} PDF(s) selected</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Videos</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    onChange={(e) => handleFileChange('videos', e.target.files)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                {files.videos.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">{files.videos.length} Video(s) selected</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (PDF/DOC)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    multiple
                                    onChange={(e) => handleFileChange('notes', e.target.files)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                {files.notes.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">{files.notes.length} Note(s) selected</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Resources</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => handleFileChange('resources', e.target.files)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                {files.resources.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">{files.resources.length} Resource(s) selected</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Course'}
                            </button>
                        </div>
                    </form>
                </div>
                    )}

                    {/* Courses List */}
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold mb-4">All Courses</h3>
                            {isLoading ? (
                                <p className="text-gray-500">Loading courses...</p>
                            ) : courses.length === 0 ? (
                                <p className="text-gray-500">No courses found. Create your first course!</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {courses.map((course) => (
                                        <div key={course.courseId} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                                            {course.thumbnailUrl && (
                                                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                                            )}
                                            <h4 className="font-semibold text-lg mb-2">{course.title}</h4>
                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-orange-500 font-bold">
                                                    {course.isFree ? 'Free' : `${course.currency} ${course.price}`}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {course.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Purchases Tab Content */}
            {activeTab === 'purchases' && (
                <>
                    {/* Purchase Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                                    <p className="text-3xl font-bold mt-1">₹{purchaseStats.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Purchases</p>
                                    <p className="text-3xl font-bold mt-1">{purchaseStats.totalPurchases}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Unique Buyers</p>
                                    <p className="text-3xl font-bold mt-1">{purchaseStats.uniqueBuyers}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchases Section with View Toggle */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        {/* Header with Search and View Toggle */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">All Course Purchases</h3>
                                    <p className="text-sm text-gray-500 mt-1">Complete history of course purchases by users</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Search */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search purchases..."
                                            value={searchPurchase}
                                            onChange={(e) => setSearchPurchase(e.target.value)}
                                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent w-48"
                                        />
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    {/* View Toggle */}
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setPurchaseViewMode('table')}
                                            className={`p-2 rounded-md transition-colors ${
                                                purchaseViewMode === 'table'
                                                    ? 'bg-white text-orange-600 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                            title="Table View"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setPurchaseViewMode('grid')}
                                            className={`p-2 rounded-md transition-colors ${
                                                purchaseViewMode === 'grid'
                                                    ? 'bg-white text-orange-600 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                            title="Grid View"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        {isPurchasesLoading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                                <p className="mt-4 text-gray-500">Loading purchases...</p>
                            </div>
                        ) : allPurchases.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="mt-4 text-gray-500 font-medium">No purchases yet</p>
                                <p className="text-sm text-gray-400">Course purchases will appear here when users buy courses</p>
                            </div>
                        ) : (
                            <>
                                {/* Table View */}
                                {purchaseViewMode === 'table' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Buyer</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {allPurchases
                                                    .filter(p => 
                                                        searchPurchase === '' ||
                                                        p.userName.toLowerCase().includes(searchPurchase.toLowerCase()) ||
                                                        p.userEmail.toLowerCase().includes(searchPurchase.toLowerCase()) ||
                                                        p.courseTitle.toLowerCase().includes(searchPurchase.toLowerCase())
                                                    )
                                                    .map((purchase, index) => (
                                                    <tr key={`${purchase.courseId}-${purchase.paymentId}-${index}`} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                <div className="h-10 w-10 flex-shrink-0">
                                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                                                                        {purchase.userName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{purchase.userName}</div>
                                                                    <div className="text-sm text-gray-500">{purchase.userEmail}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{purchase.courseTitle}</div>
                                                            <div className="text-xs text-gray-500">{purchase.courseId.substring(0, 8)}...</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-sm font-bold ${purchase.priceAtPurchase > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                                                                {purchase.priceAtPurchase > 0 ? `₹${purchase.priceAtPurchase.toLocaleString()}` : 'Free'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                                                {purchase.paymentId ? purchase.paymentId.substring(0, 16) + '...' : 'N/A'}
                                                            </code>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                purchase.orderStatus === 'CAPTURED' || purchase.orderStatus === 'completed' || purchase.orderStatus === 'COMPLETED' || purchase.orderStatus === 'SUCCESS'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : purchase.orderStatus === 'PENDING' || purchase.orderStatus === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : purchase.orderStatus === 'FREE_ENROLLMENT' || purchase.orderStatus === 'enrolled'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {purchase.orderStatus === 'CAPTURED' || purchase.orderStatus === 'SUCCESS' ? '✓ Paid' : 
                                                                 purchase.orderStatus === 'FREE_ENROLLMENT' || purchase.orderStatus === 'enrolled' ? '📚 Enrolled' :
                                                                 purchase.orderStatus || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {formatDate(purchase.purchasedAt)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Grid View */}
                                {purchaseViewMode === 'grid' && (
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {allPurchases
                                            .filter(p => 
                                                searchPurchase === '' ||
                                                p.userName.toLowerCase().includes(searchPurchase.toLowerCase()) ||
                                                p.userEmail.toLowerCase().includes(searchPurchase.toLowerCase()) ||
                                                p.courseTitle.toLowerCase().includes(searchPurchase.toLowerCase())
                                            )
                                            .map((purchase, index) => (
                                            <div 
                                                key={`grid-${purchase.courseId}-${purchase.paymentId}-${index}`} 
                                                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-orange-300"
                                            >
                                                {/* Header with Avatar and Status */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                            {purchase.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-3">
                                                            <h4 className="font-semibold text-gray-900">{purchase.userName}</h4>
                                                            <p className="text-xs text-gray-500">{purchase.userEmail}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        purchase.orderStatus === 'CAPTURED' || purchase.orderStatus === 'completed' || purchase.orderStatus === 'COMPLETED' || purchase.orderStatus === 'SUCCESS'
                                                            ? 'bg-green-100 text-green-800'
                                                            : purchase.orderStatus === 'PENDING' || purchase.orderStatus === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : purchase.orderStatus === 'FREE_ENROLLMENT' || purchase.orderStatus === 'enrolled'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {purchase.orderStatus === 'CAPTURED' || purchase.orderStatus === 'SUCCESS' ? '✓ Paid' : 
                                                         purchase.orderStatus === 'FREE_ENROLLMENT' || purchase.orderStatus === 'enrolled' ? '📚 Free' :
                                                         purchase.orderStatus || 'Unknown'}
                                                    </span>
                                                </div>

                                                {/* Course Info */}
                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 mb-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        <span className="text-xs font-medium text-gray-500 uppercase">Course</span>
                                                    </div>
                                                    <p className="font-medium text-gray-900 truncate">{purchase.courseTitle}</p>
                                                </div>

                                                {/* Price and Date */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                                                        <p className={`text-xl font-bold ${purchase.priceAtPurchase > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                                                            {purchase.priceAtPurchase > 0 ? `₹${purchase.priceAtPurchase.toLocaleString()}` : 'Free'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 mb-1">Purchased</p>
                                                        <p className="text-sm font-medium text-gray-700">{formatDate(purchase.purchasedAt)}</p>
                                                    </div>
                                                </div>

                                                {/* Payment ID Footer */}
                                                <div className="mt-4 pt-3 border-t border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">Payment ID</span>
                                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                                                            {purchase.paymentId ? purchase.paymentId.substring(0, 12) + '...' : 'N/A'}
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CoursesManagementPage;

