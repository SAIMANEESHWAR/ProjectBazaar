import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';

const COURSES_API_ENDPOINT = 'https://npvrcgotli.execute-api.ap-south-2.amazonaws.com/default/Admin_upload_courses_and_notes';
const GET_ALL_COURSES_ENDPOINT = 'https://lejjk9h72l.execute-api.ap-south-2.amazonaws.com/default/Get_all_courses_for_admin_and_buyer';

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
    
    const [formData, setFormData] = useState<CourseFormData>({
        title: '',
        description: '',
        category: '',
        subCategory: '',
        level: 'Beginner',
        language: 'English',
        price: '0',
        currency: 'USD',
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
                    currency: course.currency || 'USD',
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
            currency: 'USD',
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Courses Management</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {showForm ? 'Cancel Upload' : '+ Upload Course'}
                    </button>
                </div>
            </div>

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
                                        <option value="USD">USD</option>
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
        </div>
    );
};

export default CoursesManagementPage;

