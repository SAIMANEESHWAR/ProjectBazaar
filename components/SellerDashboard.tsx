import React, { useState, useEffect } from 'react';
import ProjectDashboardCard from './ProjectDashboardCard';
import { useNavigation, usePremium, useAuth } from '../App';
import { fetchProjectDetails, ProjectDetails } from '../services/buyerApi';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

interface SectionCardProps {
    title: string;
    children: React.ReactNode;
    step: number;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, step }) => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">{step}</div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

interface InputFieldProps {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    value?: string;
    step?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, type = 'text', placeholder, required = false, value, step, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input 
            type={type} 
            id={id} 
            placeholder={placeholder}
            required={required}
            value={value}
            step={step}
            onChange={onChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900"
        />
    </div>
);

interface TextAreaProps {
    id: string;
    label: string;
    placeholder?: string;
    rows?: number;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextArea: React.FC<TextAreaProps> = ({ id, label, placeholder, rows = 4, value, onChange }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            id={id}
            placeholder={placeholder}
            rows={rows}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900"
        />
    </div>
)

interface UploadedProject {
    id: string;
    name: string;
    domain: string;
    description: string;
    logo: string;
    tags: string[];
    status: 'Live' | 'In Review' | 'Draft' | 'Approved' | 'Rejected' | 'Disabled';
    sales: number;
    price: number;
    category: string;
    adminApprovalStatus?: string;
}

const MAX_FREE_PROJECTS = 5;
const API_ENDPOINT = 'https://qh71ruloa8.execute-api.ap-south-2.amazonaws.com/default/Upload_project_from_buyer';
const GET_PROJECTS_ENDPOINT = 'https://qosmi6luq0.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Seller';

type ViewMode = 'grid' | 'table';

const SellerDashboard: React.FC = () => {
    const { navigateTo } = useNavigation();
    const { isPremium } = usePremium();
    const { userId, userEmail } = useAuth();
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [isDragging, setIsDragging] = useState(false);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        tags: '',
        price: '',
        originalPrice: '',
        youtubeVideoUrl: '',
        documentationUrl: ''
    });
    
    // File state
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    
    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [uploadedProjects, setUploadedProjects] = useState<UploadedProject[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);
    
    // Stats state
    const [stats, setStats] = useState({
        activatedProjects: 0,
        rejectedProjects: 0,
        disabledProjects: 0,
        totalProjectsSold: 0,
        totalRevenue: 0
    });

    // Function to map API project to component format
    const mapApiProjectToComponent = (apiProject: any): UploadedProject => {
        // Map status from API to component format based on adminApprovalStatus
        let status: 'Live' | 'In Review' | 'Draft' | 'Approved' | 'Rejected' | 'Disabled' = 'Draft';
        const approvalStatus = apiProject.adminApprovalStatus?.toLowerCase();
        const projectStatus = apiProject.status?.toLowerCase();
        
        // Priority: adminApprovalStatus > status
        if (approvalStatus === 'approved' || (approvalStatus === undefined && projectStatus === 'active')) {
            status = 'Approved';
        } else if (approvalStatus === 'rejected') {
            status = 'Rejected';
        } else if (approvalStatus === 'disabled') {
            status = 'Disabled';
        } else if (projectStatus === 'pending' || projectStatus === 'in-review' || projectStatus === 'in_review' || approvalStatus === 'pending') {
            status = 'In Review';
        } else {
            status = 'Draft';
        }

        // Handle tags - API returns array
        let tagsArray: string[] = [];
        if (Array.isArray(apiProject.tags)) {
            tagsArray = apiProject.tags;
        } else if (typeof apiProject.tags === 'string') {
            tagsArray = apiProject.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }

        // Handle project ID - could be projectId or id
        const projectId = apiProject.projectId || apiProject.id || '';

        return {
            id: projectId,
            name: apiProject.title || apiProject.name || 'Untitled Project',
            domain: `${(apiProject.title || apiProject.name || 'project').toLowerCase().replace(/\s+/g, '-')}.com`,
            description: apiProject.description || '',
            logo: apiProject.thumbnailUrl || apiProject.logo || 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
            tags: tagsArray,
            status: status,
            sales: apiProject.purchasesCount || apiProject.sales || 0,
            price: typeof apiProject.price === 'number' ? apiProject.price : parseFloat(String(apiProject.price || '0')),
            category: apiProject.category || 'Uncategorized',
            adminApprovalStatus: apiProject.adminApprovalStatus
        };
    };

    // Fetch projects from API and calculate stats
    const fetchProjects = async () => {
        if (!userId) {
            setIsLoadingProjects(false);
            return;
        }

        setIsLoadingProjects(true);
        setProjectsError(null);

        try {
            // First, try to fetch projects from the seller projects endpoint
            const response = await fetch(`${GET_PROJECTS_ENDPOINT}?sellerId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            console.log('Fetched projects data:', data);

            let apiProjects: ProjectDetails[] = [];

            if (data.success && data.projects && Array.isArray(data.projects)) {
                // Use projects from the seller endpoint
                apiProjects = data.projects;
            } else {
                // Fallback: Try to fetch from user details endpoint
                console.log('Seller endpoint returned no projects, trying user details endpoint...');
                // This would require the user details endpoint to return projects
                // For now, we'll work with what we have
            }

            if (apiProjects.length > 0) {
                // Fetch detailed information for each project to get updated sales data
                const projectsWithDetails = await Promise.all(
                    apiProjects.map(async (project) => {
                        try {
                            const projectId = project.projectId || project.id;
                            if (projectId) {
                                const projectDetail = await fetchProjectDetails(projectId);
                                if (projectDetail) {
                                    return {
                                        ...project,
                                        purchasesCount: projectDetail.purchasesCount || project.purchasesCount || 0,
                                        adminApprovalStatus: projectDetail.adminApprovalStatus || project.adminApprovalStatus,
                                        status: projectDetail.status || project.status,
                                        price: projectDetail.price || project.price,
                                        description: projectDetail.description || project.description,
                                        thumbnailUrl: projectDetail.thumbnailUrl || project.thumbnailUrl,
                                    };
                                }
                            }
                            return project;
                        } catch (error) {
                            console.error(`Error fetching details for project ${project.projectId || project.id}:`, error);
                            return project;
                        }
                    })
                );

                const mappedProjects = projectsWithDetails.map(mapApiProjectToComponent);
                console.log('Mapped projects for display:', mappedProjects);
                console.log('Number of projects to display:', mappedProjects.length);
                setUploadedProjects(mappedProjects);
                
                // Calculate stats
                let activatedCount = 0;
                let rejectedCount = 0;
                let disabledCount = 0;
                let totalSold = 0;
                let totalRev = 0;
                
                mappedProjects.forEach(project => {
                    // Count by status
                    if (project.status === 'Approved') {
                        activatedCount++;
                    } else if (project.status === 'Rejected') {
                        rejectedCount++;
                    } else if (project.status === 'Disabled') {
                        disabledCount++;
                    }
                    
                    // Calculate sales and revenue
                    const sales = project.sales || 0;
                    totalSold += sales;
                    totalRev += sales * project.price;
                });
                
                setStats({
                    activatedProjects: activatedCount,
                    rejectedProjects: rejectedCount,
                    disabledProjects: disabledCount,
                    totalProjectsSold: totalSold,
                    totalRevenue: totalRev
                });
            } else {
                console.log('No projects found for seller');
                setUploadedProjects([]);
                setStats({
                    activatedProjects: 0,
                    rejectedProjects: 0,
                    disabledProjects: 0,
                    totalProjectsSold: 0,
                    totalRevenue: 0
                });
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjectsError('Failed to load projects. Please refresh the page.');
            // Keep existing projects on error
        } finally {
            setIsLoadingProjects(false);
        }
    };

    // Fetch projects on component mount and when userId changes
    useEffect(() => {
        fetchProjects();
    }, [userId]);

    const MAX_IMAGES = 5;

    const addImages = (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const validImages = fileArray.filter(file => file.type.startsWith('image/'));
        
        if (validImages.length === 0) return;

        // Limit total images
        const remainingSlots = MAX_IMAGES - imageFiles.length;
        const filesToAdd = validImages.slice(0, remainingSlots);

        if (filesToAdd.length > 0) {
            setImageFiles(prev => [...prev, ...filesToAdd]);
            const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addImages(e.target.files);
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            // Revoke the object URL to prevent memory leaks
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            addImages(files);
        }
    };

    // Image reordering handlers - reorder in place as you drag
    const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedImageIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Use a minimal drag image
        const dragImage = document.createElement('div');
        dragImage.style.width = '1px';
        dragImage.style.height = '1px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleImageDragEnd = () => {
        setDraggedImageIndex(null);
        setDragOverIndex(null);
    };

    const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedImageIndex === null || draggedImageIndex === index) return;
        
        // Reorder images in real-time as you drag over
        setDragOverIndex(index);
        
        // Perform the reorder immediately
        const newFiles = [...imageFiles];
        const newPreviews = [...imagePreviews];
        
        const [draggedFile] = newFiles.splice(draggedImageIndex, 1);
        const [draggedPreview] = newPreviews.splice(draggedImageIndex, 1);
        
        newFiles.splice(index, 0, draggedFile);
        newPreviews.splice(index, 0, draggedPreview);
        
        setImageFiles(newFiles);
        setImagePreviews(newPreviews);
        setDraggedImageIndex(index); // Update dragged index to new position
    };

    const handleImageDragLeaveItem = () => {
        // Don't reset dragOverIndex here to prevent flickering
    };

    const handleImageDropOnItem = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Reordering already happened in dragOver, just cleanup
        setDraggedImageIndex(null);
        setDragOverIndex(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitSuccess(false);

        if (!userId || !userEmail) {
            setSubmitError('You must be logged in to upload a project');
            return;
        }

        if (!isPremium && uploadedProjects.length >= MAX_FREE_PROJECTS) {
            setShowPremiumModal(true);
            return;
        }

        // Validate required fields
        if (!formData.title || !formData.category || !formData.description || !formData.tags || !formData.price) {
            setSubmitError('Please fill in all required fields');
            return;
        }

        if (imageFiles.length === 0) {
            setSubmitError('Please upload at least one project image');
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare request body matching Lambda function expectations
            const requestBody = {
                sellerId: userId,
                sellerEmail: userEmail,
                title: formData.title.trim(),
                category: formData.category.trim(),
                description: formData.description.trim(),
                tags: formData.tags.trim(),
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                youtubeVideoUrl: formData.youtubeVideoUrl.trim() || undefined,
                documentationUrl: formData.documentationUrl.trim() || undefined
            };

            // Remove undefined values
            Object.keys(requestBody).forEach(key => {
                if (requestBody[key as keyof typeof requestBody] === undefined) {
                    delete requestBody[key as keyof typeof requestBody];
                }
            });

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.success) {
                setSubmitSuccess(true);
                // Reset form
                setFormData({
                    title: '',
                    category: '',
                    description: '',
                    tags: '',
                    price: '',
                    originalPrice: '',
                    youtubeVideoUrl: '',
                    documentationUrl: ''
                });
                // Revoke object URLs to prevent memory leaks
                imagePreviews.forEach(url => URL.revokeObjectURL(url));
                setImageFiles([]);
                setImagePreviews([]);
                
                // Refresh projects list to get the latest from API
                await fetchProjects();
                
                // Hide form after 2 seconds
                setTimeout(() => {
                    setShowUploadForm(false);
                    setSubmitSuccess(false);
                }, 2000);
            } else {
                setSubmitError(data.error?.message || 'Failed to upload project. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setSubmitError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUploadClick = () => {
        if (!isPremium && uploadedProjects.length >= MAX_FREE_PROJECTS) {
            setShowPremiumModal(true);
        } else {
            setShowUploadForm(true);
        }
    };



    return (
        <div className="mt-8 space-y-8">
            {/* Stats */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Activated Projects" value={stats.activatedProjects.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-gradient-to-br from-green-500 to-green-600" />
                <StatCard title="Rejected Projects" value={stats.rejectedProjects.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-gradient-to-br from-red-500 to-red-600" />
                <StatCard title="Disabled Projects" value={stats.disabledProjects.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} colorClass="bg-gradient-to-br from-gray-500 to-gray-600" />
                <StatCard title="Total Projects Sold" value={stats.totalProjectsSold.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} colorClass="bg-gradient-to-br from-blue-500 to-blue-600" />
                <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} colorClass="bg-gradient-to-br from-purple-500 to-purple-600" />
            </div>

            {/* Uploaded Projects Grid (shown by default) */}
            {!showUploadForm && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">My Uploaded Projects</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {uploadedProjects.length} of {MAX_FREE_PROJECTS} projects uploaded
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* View Toggle Buttons */}
                            <div className="flex items-center bg-orange-50 rounded-lg p-1 border border-orange-200">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all duration-200 ${
                                        viewMode === 'grid'
                                            ? 'bg-orange-500 text-white shadow-sm'
                                            : 'text-gray-600 hover:text-orange-600'
                                    }`}
                                    title="Grid View"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-md transition-all duration-200 ${
                                        viewMode === 'table'
                                            ? 'bg-orange-500 text-white shadow-sm'
                                            : 'text-gray-600 hover:text-orange-600'
                                    }`}
                                    title="Table View"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                onClick={handleUploadClick}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-white transition-all shadow-md hover:shadow-lg"
                            >
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Upload Project
                            </button>
                        </div>
                    </div>

                    {isLoadingProjects ? (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                            <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">Loading projects...</p>
                        </div>
                    ) : projectsError ? (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                            <p className="text-red-500 text-lg font-medium mb-2">{projectsError}</p>
                            <button
                                onClick={fetchProjects}
                                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : uploadedProjects.length > 0 ? (
                        <>
                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {uploadedProjects.map((project) => (
                                        <ProjectDashboardCard
                                            key={project.id}
                                            name={project.name}
                                            domain={project.domain}
                                            description={project.description}
                                            logo={project.logo}
                                            tags={project.tags}
                                            status={project.status}
                                            sales={project.sales}
                                            price={project.price}
                                            category={project.category}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Table View */}
                            {viewMode === 'table' && (
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Project Title
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Sales
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Price
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {uploadedProjects.map((project) => (
                                                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                                            <p className="text-sm text-gray-500">{project.category}</p>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                                project.status === 'Live' || project.status === 'Approved'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : project.status === 'In Review'
                                                                    ? 'bg-orange-100 text-orange-800'
                                                                    : project.status === 'Rejected'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : project.status === 'Disabled'
                                                                    ? 'bg-gray-200 text-gray-700'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {project.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {project.sales}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                                                            ${project.price.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <button className="p-2 text-blue-600 hover:bg-gray-100 rounded-md transition-colors" title="Edit">
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                                                                    </svg>
                                                                </button>
                                                                <button className="p-2 text-red-600 hover:bg-gray-100 rounded-md transition-colors" title="Delete">
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">No projects uploaded yet</p>
                            <p className="text-gray-400 text-sm mt-2">Click "Upload Project" to get started</p>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Form (shown when Upload Project is clicked) */}
            {showUploadForm && (
                <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Upload New Project</h2>
                        <button
                            type="button"
                            onClick={() => {
                                setShowUploadForm(false);
                                setSubmitError(null);
                                setSubmitSuccess(false);
                            }}
                            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Error Message */}
                    {submitError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{submitError}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {submitSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600">Project uploaded successfully! Submitting for review...</p>
                        </div>
                    )}

                <SectionCard title="Project Details" step={1}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            id="title" 
                            label="Project Title" 
                            placeholder="e.g., E-commerce Platform" 
                            required 
                            value={formData.title}
                            onChange={handleInputChange}
                        />
                        <InputField 
                            id="category" 
                            label="Category" 
                            placeholder="e.g., Web Development" 
                            required 
                            value={formData.category}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="mt-6">
                        <TextArea 
                            id="description" 
                            label="Description" 
                            placeholder="Describe your project in detail..." 
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>
                     <div className="mt-6">
                        <InputField 
                            id="tags" 
                            label="Tags" 
                            placeholder="e.g., React, Node.js, API (comma-separated)" 
                            value={formData.tags}
                            onChange={handleInputChange}
                        />
                    </div>
                </SectionCard>

                <SectionCard title="Pricing & Media" step={2}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            id="price" 
                            label="Price (USD)" 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 49.99" 
                            required 
                            value={formData.price}
                            onChange={handleInputChange}
                        />
                        <InputField 
                            id="originalPrice" 
                            label="Original Price (USD) - Optional" 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 59.99 (for discount)" 
                            value={formData.originalPrice}
                            onChange={handleInputChange}
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <InputField 
                            id="youtubeVideoUrl" 
                            label="YouTube Video URL" 
                            placeholder="https://youtube.com/watch?v=..." 
                            value={formData.youtubeVideoUrl}
                            onChange={handleInputChange}
                        />
                        <InputField 
                            id="documentationUrl" 
                            label="Documentation URL" 
                            placeholder="https://docs.example.com" 
                            value={formData.documentationUrl}
                            onChange={handleInputChange}
                        />
                    </div>
                </SectionCard>

                 <SectionCard title="Uploads" step={3}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Images <span className="text-gray-400 font-normal">({imagePreviews.length}/{MAX_IMAGES})</span>
                        </label>
                        
                        {/* Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                                isDragging 
                                    ? 'border-orange-500 bg-orange-50' 
                                    : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
                            } ${imageFiles.length >= MAX_IMAGES ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="space-y-2 text-center">
                                <svg className={`mx-auto h-12 w-12 ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label htmlFor="image-upload" className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none">
                                        <span>Click to upload</span>
                                        <input 
                                            id="image-upload" 
                                            name="image-upload" 
                                            type="file" 
                                            className="sr-only" 
                                            onChange={handleImageChange} 
                                            accept="image/*"
                                            multiple
                                            disabled={imageFiles.length >= MAX_IMAGES}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each • Max {MAX_IMAGES} images</p>
                            </div>
                        </div>

                        {/* Image Previews Grid */}
                        {imagePreviews.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div 
                                        key={preview} 
                                        className={`relative group cursor-grab active:cursor-grabbing transition-transform duration-150 ease-out ${
                                            draggedImageIndex === index ? 'z-10 scale-105 shadow-xl' : ''
                                        }`}
                                        draggable
                                        onDragStart={(e) => handleImageDragStart(e, index)}
                                        onDragEnd={handleImageDragEnd}
                                        onDragOver={(e) => handleImageDragOver(e, index)}
                                        onDragLeave={handleImageDragLeaveItem}
                                        onDrop={(e) => handleImageDropOnItem(e)}
                                    >
                                        <div className={`aspect-square rounded-lg overflow-hidden border-2 bg-gray-100 transition-all ${
                                            draggedImageIndex === index ? 'border-orange-500 ring-2 ring-orange-300 shadow-lg' : 'border-gray-200'
                                        }`}>
                                            <img 
                                                src={preview} 
                                                alt={`Preview ${index + 1}`} 
                                                className="w-full h-full object-cover pointer-events-none select-none"
                                            />
                                        </div>
                                        {/* Drag handle indicator */}
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-black/50 text-white rounded flex items-center justify-center transition-opacity ${
                                            draggedImageIndex !== null ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                                        }`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                                            </svg>
                                        </div>
                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md transition-opacity hover:bg-red-600 z-10 ${
                                                draggedImageIndex !== null ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        {/* First image badge */}
                                        {index === 0 && (
                                            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded shadow">
                                                Thumbnail
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {imagePreviews.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                                The first image will be used as the project thumbnail. Drag images to reorder.
                            </p>
                        )}
                    </div>
                </SectionCard>

                <div className="flex justify-end gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={() => {
                                setShowUploadForm(false);
                                setSubmitError(null);
                                setSubmitSuccess(false);
                            }}
                            disabled={isSubmitting}
                            className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            disabled={isSubmitting}
                            className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save as Draft
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                'Submit for Review'
                            )}
                        </button>
                </div>
            </form>
            )}

            {/* Premium Modal */}
            {showPremiumModal && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowPremiumModal(false)}
                    >
                        <div 
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowPremiumModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="text-center mb-6">
                                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h3>
                                <p className="text-gray-600">
                                    You've reached the limit of {MAX_FREE_PROJECTS} free projects. Upgrade to Premium to upload unlimited projects!
                                </p>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Premium Benefits:</h4>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Unlimited project uploads
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Priority support
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Advanced analytics
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Featured project placement
                                    </li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPremiumModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Maybe Later
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPremiumModal(false);
                                        navigateTo('home');
                                        // Scroll to pricing section after navigation
                                        setTimeout(() => {
                                            const pricingSection = document.getElementById('pricing');
                                            if (pricingSection) {
                                                pricingSection.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }, 100);
                                    }}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    Buy Premium
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SellerDashboard;