import React, { useState, useEffect, useMemo } from 'react';
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
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
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
    required?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextArea: React.FC<TextAreaProps> = ({ id, label, placeholder, rows = 4, value, required = false, onChange }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
            id={id}
            placeholder={placeholder}
            rows={rows}
            value={value}
            required={required}
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
    adminComment?: string;
    adminAction?: string;
}

const MAX_FREE_PROJECTS = 5;
const API_ENDPOINT = 'https://qh71ruloa8.execute-api.ap-south-2.amazonaws.com/default/Upload_project_from_buyer';
const GET_PROJECTS_ENDPOINT = 'https://qosmi6luq0.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Seller';
const GET_USER_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';
const GET_REPORTS_ENDPOINT = 'https://0en59tzhoa.execute-api.ap-south-2.amazonaws.com/default/Get_ReportDetails_by_sellerid_buyerId_ReportId';
const ADMIN_APPROVAL_ENDPOINT = 'https://wt58x2f09d.execute-api.ap-south-2.amazonaws.com/default/Admin_approved_or_rejected';
const MAX_IMAGE_SIZE_MB = 10;

type ViewMode = 'grid' | 'table';

const SellerDashboard: React.FC = () => {
    const { navigateTo } = useNavigation();
    const { isPremium } = usePremium();
    const { userId, userEmail } = useAuth();
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    
    // User profile state
    const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
    const [userFullName, setUserFullName] = useState<string>('');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'In Review' | 'Approved' | 'Rejected' | 'Disabled'>('all');
    const [isDragging, setIsDragging] = useState(false);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    const [, setDragOverIndex] = useState<number | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        price: '',
        originalPrice: '',
        youtubeVideoUrl: '',
        githubUrl: ''
    });
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    
    // Resource links state
    type ResourceType = 'ppt' | 'documentation' | 'executionVideo' | 'researchPaper';
    const [selectedResources, setSelectedResources] = useState<ResourceType[]>([]);
    const [resourceUrls, setResourceUrls] = useState<Record<ResourceType, string>>({
        ppt: '',
        documentation: '',
        executionVideo: '',
        researchPaper: ''
    });
    
    // Custom resource links
    interface CustomResource {
        id: string;
        label: string;
        url: string;
    }
    const [customResources, setCustomResources] = useState<CustomResource[]>([]);
    
    const resourceOptions: { key: ResourceType; label: string; placeholder: string; icon: React.ReactNode; color: string }[] = [
        { 
            key: 'ppt', 
            label: 'PPT / Presentation', 
            placeholder: 'https://docs.google.com/presentation/...',
            color: 'bg-orange-100 text-orange-600 border-orange-200',
            icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        },
        { 
            key: 'documentation', 
            label: 'Documentation', 
            placeholder: 'https://docs.example.com',
            color: 'bg-blue-100 text-blue-600 border-blue-200',
            icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        },
        { 
            key: 'executionVideo', 
            label: 'Execution Video', 
            placeholder: 'https://youtube.com/watch?v=...',
            color: 'bg-red-100 text-red-600 border-red-200',
            icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        { 
            key: 'researchPaper', 
            label: 'Research Paper', 
            placeholder: 'https://arxiv.org/...',
            color: 'bg-purple-100 text-purple-600 border-purple-200',
            icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        }
    ];

    const toggleResource = (resource: ResourceType) => {
        setSelectedResources(prev => {
            if (prev.includes(resource)) {
                setResourceUrls(urls => ({ ...urls, [resource]: '' }));
                return prev.filter(r => r !== resource);
            } else {
                return [...prev, resource];
            }
        });
    };

    const handleResourceUrlChange = (resource: ResourceType, value: string) => {
        setResourceUrls(prev => ({ ...prev, [resource]: value }));
    };

    const addCustomResource = () => {
        const newId = `custom-${Date.now()}`;
        setCustomResources(prev => [...prev, { id: newId, label: '', url: '' }]);
    };

    const updateCustomResource = (id: string, field: 'label' | 'url', value: string) => {
        setCustomResources(prev => 
            prev.map(r => r.id === id ? { ...r, [field]: value } : r)
        );
    };

    const removeCustomResource = (id: string) => {
        setCustomResources(prev => prev.filter(r => r.id !== id));
    };
    
    // GitHub validation state
    const [isValidatingGithub, setIsValidatingGithub] = useState(false);
    const [githubValidationError, setGithubValidationError] = useState<string | null>(null);
    const [githubValidated, setGithubValidated] = useState(false);
    
    // File state
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    
    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isDraftSave, setIsDraftSave] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

    // Upload single image to S3 and return the URL
    const uploadImageToS3 = async (file: File, index: number): Promise<string> => {
        // Validate file size
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            throw new Error(`Image ${index + 1} exceeds ${MAX_IMAGE_SIZE_MB}MB limit`);
        }

        setUploadProgress(`Uploading image ${index + 1}...`);

        // 1. Get presigned URL from Lambda
        const presignRes = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getPresignedUrl',
                sellerId: userId,
                fileName: `project-${Date.now()}-${index}-${file.name}`,
                fileType: file.type,
            }),
        });

        const presignData = await presignRes.json();
        console.log('Presign response:', presignData);

        if (!presignData.success || !presignData.uploadUrl) {
            throw new Error('Failed to get upload URL for image');
        }

        const { uploadUrl, fileUrl } = presignData;
        
        console.log('Uploading to S3 URL:', uploadUrl);

        // 2. Upload image directly to S3
        // The presigned URL was signed WITH Content-Type, so we MUST send it
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    console.log('S3 Upload response:', xhr.status, xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
                    }
                }
            };
            
            xhr.onerror = function() {
                console.error('XHR error:', xhr.status, xhr.statusText);
                reject(new Error('Network error during upload'));
            };
            // Presigned URL is NOT signed with Content-Type (browser-safe upload)

            
            xhr.open('PUT', uploadUrl);
            xhr.send(file);
        });

        return fileUrl;
    };
    const [uploadedProjects, setUploadedProjects] = useState<UploadedProject[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);
    
    // Stats state
    const [stats, setStats] = useState({
        activatedProjects: 0,
        rejectedProjects: 0,
        disabledProjects: 0,
        draftProjects: 0,
        inReviewProjects: 0,
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
        // Explicitly check for draft status first
        if (projectStatus === 'draft') {
            status = 'Draft';
        } else if (approvalStatus === 'approved' || (approvalStatus === undefined && projectStatus === 'active')) {
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

    // Fetch reports by sellerId
    const fetchReports = async (sellerId: string): Promise<Map<string, { adminComment?: string; adminAction?: string; status: string }>> => {
        const reportsMap = new Map();
        try {
            const response = await fetch(`${GET_REPORTS_ENDPOINT}?role=seller&sellerId=${sellerId}`);
            const data = await response.json();
            
            if (data.success && data.data && Array.isArray(data.data)) {
                data.data.forEach((report: any) => {
                    // Only include reports that are not in pending status
                    if (report.status && report.status.toLowerCase() !== 'pending' && report.status.toLowerCase() !== 'under_review') {
                        reportsMap.set(report.projectId, {
                            adminComment: report.adminComment,
                            adminAction: report.adminAction,
                            status: report.status
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
        return reportsMap;
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
            // Fetch reports first
            const reportsMap = await fetchReports(userId);
            
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

                const mappedProjects = projectsWithDetails.map(project => {
                    const mapped = mapApiProjectToComponent(project);
                    // Add report data if available
                    const reportData = reportsMap.get(mapped.id);
                    if (reportData) {
                        mapped.adminComment = reportData.adminComment;
                        mapped.adminAction = reportData.adminAction;
                    }
                    return mapped;
                });
                console.log('Mapped projects for display:', mappedProjects);
                console.log('Number of projects to display:', mappedProjects.length);
                setUploadedProjects(mappedProjects);
                
                // Calculate stats
                let activatedCount = 0;
                let rejectedCount = 0;
                let disabledCount = 0;
                let draftCount = 0;
                let inReviewCount = 0;
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
                    } else if (project.status === 'Draft') {
                        draftCount++;
                    } else if (project.status === 'In Review') {
                        inReviewCount++;
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
                    draftProjects: draftCount,
                    inReviewProjects: inReviewCount,
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
                    draftProjects: 0,
                    inReviewProjects: 0,
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

    // Fetch user profile to get profile image
    const fetchUserProfile = async () => {
        if (!userId) return;
        
        try {
            const response = await fetch(GET_USER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            
            const data = await response.json();
            const user = data.data || data.user || data;
            
            if (user && data.success !== false) {
                setUserProfileImage(user.profilePictureUrl || null);
                setUserFullName(user.fullName || user.name || '');
            }
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
        }
    };

    // Check for pre-filled gitUrl and project name from navigation (e.g., from Settings page)
    useEffect(() => {
        const prefillGitUrl = localStorage.getItem('prefillGitUrl');
        const prefillProjectName = localStorage.getItem('prefillProjectName');
        
        if (prefillGitUrl || prefillProjectName) {
            // Pre-fill the gitUrl and project name in the form
            setFormData(prev => ({
                ...prev,
                githubUrl: prefillGitUrl || prev.githubUrl,
                title: prefillProjectName || prev.title,
            }));
            // Show the upload form
            setShowUploadForm(true);
            // Clear the localStorage values
            if (prefillGitUrl) localStorage.removeItem('prefillGitUrl');
            if (prefillProjectName) localStorage.removeItem('prefillProjectName');
        }
    }, []);

    // Fetch projects and user profile on component mount and when userId changes
    useEffect(() => {
        fetchProjects();
        fetchUserProfile();
    }, [userId]);

    const MAX_IMAGES = 5;
    const MIN_IMAGES = 2;
    
    // Validation function to check if all required fields are filled
    const isFormValid = useMemo(() => {
        const hasTitle = formData.title.trim() !== '';
        const hasCategory = formData.category.trim() !== '';
        const hasDescription = formData.description.trim() !== '';
        const hasTags = tags.length >= 1;
        const hasPrice = formData.price.trim() !== '' && !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) > 0;
        const hasYoutubeUrl = formData.youtubeVideoUrl.trim() !== '';
        const hasGithubUrl = formData.githubUrl.trim() !== '' && githubValidated;
        const hasValidImages = imageFiles.length >= MIN_IMAGES && imageFiles.length <= MAX_IMAGES;
        
        return hasTitle && hasCategory && hasDescription && hasTags && hasPrice && hasYoutubeUrl && hasGithubUrl && hasValidImages;
    }, [formData, tags, githubValidated, imageFiles.length]);

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

    // Tag handling
    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
            // Remove last tag when backspace is pressed on empty input
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const trimmedTag = tagInput.trim().replace(/,/g, '');
        if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
            setTags(prev => [...prev, trimmedTag]);
            setTagInput('');
        }
    };

    const removeTag = (index: number) => {
        setTags(prev => prev.filter((_, i) => i !== index));
    };

    // GitHub URL validation - check if it's a public repository
    const parseGithubUrl = (url: string): { owner: string; repo: string } | null => {
        // Match various GitHub URL formats
        const patterns = [
            /github\.com\/([^\/]+)\/([^\/\?#]+)/,  // https://github.com/owner/repo
            /github\.com:([^\/]+)\/([^\/\?#]+)/,   // git@github.com:owner/repo
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return { 
                    owner: match[1], 
                    repo: match[2].replace(/\.git$/, '') 
                };
            }
        }
        return null;
    };

    const validateGithubUrl = async () => {
        const url = formData.githubUrl.trim();
        
        if (!url) {
            setGithubValidationError(null);
            setGithubValidated(false);
            return;
        }

        const parsed = parseGithubUrl(url);
        if (!parsed) {
            setGithubValidationError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)');
            setGithubValidated(false);
            return;
        }

        setIsValidatingGithub(true);
        setGithubValidationError(null);

        try {
            const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.private === false) {
                    setGithubValidated(true);
                    setGithubValidationError(null);
                } else {
                    setGithubValidated(false);
                    setGithubValidationError('This repository is private. Please upload a public GitHub repository URL.');
                }
            } else if (response.status === 404) {
                setGithubValidated(false);
                setGithubValidationError('Repository not found. Please upload a public GitHub repository URL.');
            } else {
                setGithubValidated(false);
                setGithubValidationError('Unable to verify repository. Please check the URL and try again.');
            }
        } catch (error) {
            console.error('GitHub validation error:', error);
            setGithubValidated(false);
            setGithubValidationError('Unable to verify repository. Please check your connection and try again.');
        } finally {
            setIsValidatingGithub(false);
        }
    };

    // Reset GitHub validation when URL changes
    const handleGithubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, githubUrl: e.target.value }));
        setGithubValidated(false);
        setGithubValidationError(null);
    };

    const handleSaveDraft = async () => {
        setSubmitError(null);
        setSubmitSuccess(false);
        setIsDraftSave(true);

        if (!userId || !userEmail) {
            setSubmitError('You must be logged in to save a project');
            return;
        }

        // Allow unlimited uploads if user has profile image or is premium
        if (!isPremium && !userProfileImage && uploadedProjects.length >= MAX_FREE_PROJECTS) {
            setShowPremiumModal(true);
            return;
        }

        // For drafts, only title is required
        if (!formData.title.trim()) {
            setSubmitError('Please enter a project title to save as draft');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress('Saving draft...');

        try {
            // Upload images if any are provided (optional for drafts)
            // Start with existing image URLs (from draft) that are already uploaded
            const imageUrls: string[] = imagePreviews.filter(url => url.startsWith('http')); // Keep existing URLs
            
            if (imageFiles.length > 0) {
                setUploadProgress(`Uploading ${imageFiles.length} image(s) to cloud...`);
                for (let i = 0; i < imageFiles.length; i++) {
                    try {
                        const imageUrl = await uploadImageToS3(imageFiles[i], i);
                        imageUrls.push(imageUrl);
                    } catch (uploadError) {
                        console.error(`Failed to upload image ${i + 1}:`, uploadError);
                        // For drafts, continue even if image upload fails
                    }
                }
            }

            setUploadProgress('Saving draft...');

            // Prepare request body for draft
            const requestBody: any = {
                sellerId: userId,
                sellerEmail: userEmail,
                isDraft: true,
                title: formData.title.trim(),
                category: formData.category.trim() || undefined,
                description: formData.description.trim() || undefined,
                tags: tags.length > 0 ? tags.join(', ') : undefined,
                price: formData.price.trim() ? parseFloat(formData.price) : undefined,
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                githubUrl: formData.githubUrl.trim() || undefined,
                youtubeVideoUrl: formData.youtubeVideoUrl.trim() || undefined,
                thumbnailUrl: imageUrls[0] || undefined,
                imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                pptUrl: resourceUrls.ppt.trim() || undefined,
                documentationUrl: resourceUrls.documentation.trim() || undefined,
                executionVideoUrl: resourceUrls.executionVideo.trim() || undefined,
                researchPaperUrl: resourceUrls.researchPaper.trim() || undefined,
                customResources: customResources.filter(r => r.label.trim() && r.url.trim()).map(r => ({
                    label: r.label.trim(),
                    url: r.url.trim()
                }))
            };

            // If editing existing draft, include projectId
            if (editingProjectId) {
                requestBody.projectId = editingProjectId;
            }

            // Remove undefined/empty values
            Object.keys(requestBody).forEach(key => {
                const value = requestBody[key as keyof typeof requestBody];
                if (value === undefined || (Array.isArray(value) && value.length === 0)) {
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
                // Don't reset form for drafts - user might want to continue editing
                // Refresh projects list to show the draft
                await fetchProjects();
                
                // Show success message
                setTimeout(() => {
                    setSubmitSuccess(false);
                }, 3000);
            } else {
                setSubmitError(data.error?.message || 'Failed to save draft. Please try again.');
            }
        } catch (error) {
            console.error('Draft save error:', error);
            if (error instanceof Error) {
                setSubmitError(error.message);
            } else {
                setSubmitError('Network error. Please check your connection and try again.');
            }
        } finally {
            setIsSubmitting(false);
            setUploadProgress('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitSuccess(false);
        setIsDraftSave(false);

        if (!userId || !userEmail) {
            setSubmitError('You must be logged in to upload a project');
            return;
        }

        // Allow unlimited uploads if user has profile image or is premium
        if (!isPremium && !userProfileImage && uploadedProjects.length >= MAX_FREE_PROJECTS) {
            setShowPremiumModal(true);
            return;
        }

        // Validate required fields
        if (!formData.title.trim()) {
            setSubmitError('Please enter a project title');
            return;
        }

        if (!formData.category.trim()) {
            setSubmitError('Please enter a category');
            return;
        }

        if (!formData.description.trim()) {
            setSubmitError('Please enter a project description');
            return;
        }

        if (!formData.price.trim()) {
            setSubmitError('Please enter a price');
            return;
        }

        if (tags.length === 0) {
            setSubmitError('Please add at least one tag');
            return;
        }

        if (imageFiles.length < 2) {
            setSubmitError('Please upload at least 2 project images');
            return;
        }

        // YouTube Demo Video URL is mandatory
        if (!formData.youtubeVideoUrl.trim()) {
            setSubmitError('Please enter a YouTube demo video URL');
            return;
        }

        // GitHub URL is mandatory and must be verified
        if (!formData.githubUrl.trim()) {
            setSubmitError('Please enter a GitHub repository URL');
            return;
        }

        if (!githubValidated) {
            setSubmitError('Please verify your GitHub URL by clicking the "Verify" button');
            return;
        }

        if (githubValidationError) {
            setSubmitError('Please fix the GitHub URL error before submitting');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress('Preparing upload...');

        try {
            // 1. Upload all images to S3 first
            // Start with existing image URLs (from draft) that are already uploaded
            const imageUrls: string[] = imagePreviews.filter(url => url.startsWith('http')); // Keep existing URLs
            
            if (imageFiles.length > 0) {
                setUploadProgress(`Uploading ${imageFiles.length} image(s) to cloud...`);
                for (let i = 0; i < imageFiles.length; i++) {
                    try {
                        const imageUrl = await uploadImageToS3(imageFiles[i], i);
                        imageUrls.push(imageUrl);
                    } catch (uploadError) {
                        console.error(`Failed to upload image ${i + 1}:`, uploadError);
                        throw new Error(`Failed to upload image ${i + 1}. Please try again.`);
                    }
                }
            }

            setUploadProgress('Submitting project...');

            // 2. Prepare request body with S3 image URLs
            const requestBody: any = {
                sellerId: userId,
                sellerEmail: userEmail,
                isDraft: false, // Explicitly set to false for submission
                title: formData.title.trim(),
                category: formData.category.trim(),
                description: formData.description.trim(),
                tags: tags.join(', '),
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                githubUrl: formData.githubUrl.trim() || undefined,
                youtubeVideoUrl: formData.youtubeVideoUrl.trim() || undefined,
                // Image URLs from S3
                thumbnailUrl: imageUrls[0], // First image is the thumbnail
                imageUrls: imageUrls, // All images including thumbnail
                // Resource links
                pptUrl: resourceUrls.ppt.trim() || undefined,
                documentationUrl: resourceUrls.documentation.trim() || undefined,
                executionVideoUrl: resourceUrls.executionVideo.trim() || undefined,
                researchPaperUrl: resourceUrls.researchPaper.trim() || undefined,
                // Custom resources - filter out empty ones
                customResources: customResources.filter(r => r.label.trim() && r.url.trim()).map(r => ({
                    label: r.label.trim(),
                    url: r.url.trim()
                }))
            };

            // If editing existing draft, include projectId
            if (editingProjectId) {
                requestBody.projectId = editingProjectId;
            }

            // Remove undefined/empty values
            Object.keys(requestBody).forEach(key => {
                const value = requestBody[key as keyof typeof requestBody];
                if (value === undefined || (Array.isArray(value) && value.length === 0)) {
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
                resetForm();
                
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
            if (error instanceof Error) {
                setSubmitError(error.message);
            } else {
            setSubmitError('Network error. Please check your connection and try again.');
            }
        } finally {
            setIsSubmitting(false);
            setUploadProgress('');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            category: '',
            description: '',
            price: '',
            originalPrice: '',
            youtubeVideoUrl: '',
            githubUrl: ''
        });
        setTags([]);
        setTagInput('');
        setSelectedResources([]);
        setResourceUrls({
            ppt: '',
            documentation: '',
            executionVideo: '',
            researchPaper: ''
        });
        setCustomResources([]);
        setGithubValidated(false);
        setGithubValidationError(null);
        // Revoke object URLs to prevent memory leaks
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);
        setSubmitError(null);
        setSubmitSuccess(false);
        setEditingProjectId(null);
    };

    const handleUploadClick = () => {
        // Allow unlimited uploads if user has profile image or is premium
        if (!isPremium && !userProfileImage && uploadedProjects.length >= MAX_FREE_PROJECTS) {
            setShowPremiumModal(true);
        } else {
            // Reset form when starting new upload
            resetForm();
            setShowUploadForm(true);
        }
    };

    const loadDraftProject = async (projectId: string) => {
        try {
            setIsLoadingProjects(true);
            // Fetch full project details
            const projectDetails = await fetchProjectDetails(projectId);
            
            if (!projectDetails) {
                setSubmitError('Failed to load draft project');
                return;
            }

            // Type assertion to access additional fields that may exist in API response
            const projectData = projectDetails as any;

            // Check if it's a draft
            if (projectData.status?.toLowerCase() !== 'draft') {
                setSubmitError('Only draft projects can be edited');
                return;
            }

            // Set editing project ID
            setEditingProjectId(projectId);

            // Load form data
            setFormData({
                title: projectData.title || '',
                category: projectData.category || '',
                description: projectData.description || '',
                price: projectData.price?.toString() || '',
                originalPrice: projectData.originalPrice?.toString() || '',
                youtubeVideoUrl: projectData.youtubeVideoUrl || '',
                githubUrl: projectData.githubUrl || ''
            });

            // Load tags
            if (projectData.tags) {
                const tagsArray = Array.isArray(projectData.tags) 
                    ? projectData.tags 
                    : (typeof projectData.tags === 'string' 
                        ? projectData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                        : []);
                setTags(tagsArray);
            }

            // Load resource URLs
            if (projectData.resources) {
                const resources = projectData.resources;
                const selected: ResourceType[] = [];
                const urls: Record<ResourceType, string> = {
                    ppt: '',
                    documentation: '',
                    executionVideo: '',
                    researchPaper: ''
                };

                if (resources.pptUrl) {
                    selected.push('ppt');
                    urls.ppt = resources.pptUrl;
                }
                if (resources.documentationUrl) {
                    selected.push('documentation');
                    urls.documentation = resources.documentationUrl;
                }
                if (resources.executionVideoUrl) {
                    selected.push('executionVideo');
                    urls.executionVideo = resources.executionVideoUrl;
                }
                if (resources.researchPaperUrl) {
                    selected.push('researchPaper');
                    urls.researchPaper = resources.researchPaperUrl;
                }

                setSelectedResources(selected);
                setResourceUrls(urls);

                // Load custom resources
                if (resources.customResources && Array.isArray(resources.customResources)) {
                    setCustomResources(resources.customResources.map((r: any, index: number) => ({
                        id: `custom-${Date.now()}-${index}`,
                        label: r.label || '',
                        url: r.url || ''
                    })));
                }
            }

            // Load images
            if (projectData.images && Array.isArray(projectData.images) && projectData.images.length > 0) {
                // For existing images, we'll use the URLs directly as previews
                // Note: We can't convert URLs back to File objects, so we'll just show them as previews
                setImagePreviews(projectData.images);
                // Set imageFiles as empty since we can't recreate File objects from URLs
                setImageFiles([]);
            }

            // If GitHub URL exists, validate it
            if (projectData.githubUrl) {
                setGithubValidated(true);
                setGithubValidationError(null);
            }

            // Show upload form
            setShowUploadForm(true);
            setSubmitError(null);
        } catch (error) {
            console.error('Error loading draft project:', error);
            setSubmitError('Failed to load draft project. Please try again.');
        } finally {
            setIsLoadingProjects(false);
        }
    };

    // Handle project status toggle (Active/Disabled)
    const handleToggleProjectStatus = async (projectId: string, isActive: boolean) => {
        try {
            const response = await fetch(ADMIN_APPROVAL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: projectId,
                    adminApprovalStatus: isActive ? 'approved' : 'disabled'
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update project status: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Update local state immediately for better UX
                setUploadedProjects(prevProjects => 
                    prevProjects.map(p => {
                        if (p.id === projectId) {
                            return {
                                ...p,
                                status: isActive ? 'Approved' : 'Disabled' as const
                            };
                        }
                        return p;
                    })
                );
                
                // Refresh projects list to ensure data consistency with backend
                setTimeout(() => {
                    fetchProjects();
                }, 500);
            } else {
                const errorMessage = data.error?.message || data.message || 'Failed to update project status';
                setSubmitError(errorMessage);
                setTimeout(() => setSubmitError(null), 5000);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error updating project status:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update project status. Please try again.';
            setSubmitError(errorMessage);
            setTimeout(() => setSubmitError(null), 5000);
            throw error; // Re-throw to let the component handle it
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
                        <div className="flex items-center gap-4">
                            {/* User Profile Image */}
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center overflow-hidden border-3 border-orange-200 shadow-lg">
                                    {userProfileImage ? (
                                        <img 
                                            src={userProfileImage} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white text-xl font-bold">
                                            {userFullName ? userFullName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    )}
                                </div>
                                {userProfileImage && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">My Uploaded Projects</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {userProfileImage ? (
                                        <>
                                            <span className="text-green-600 font-medium">{uploadedProjects.length} projects</span>
                                            <span className="text-gray-400 mx-1">•</span>
                                            <span className="text-orange-600">Unlimited uploads unlocked</span>
                                        </>
                                    ) : (
                                        <>
                                            {uploadedProjects.length} of {MAX_FREE_PROJECTS} projects uploaded
                                            <span className="text-orange-500 ml-2 text-xs">(Add profile photo for unlimited)</span>
                                        </>
                                    )}
                                </p>
                            </div>
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

                    {/* Error Message (shown when form is closed) */}
                    {submitError && !showUploadForm && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-600">{submitError}</p>
                            </div>
                            <button
                                onClick={() => setSubmitError(null)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

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
                            {/* Status Filter - Improved UI */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    <label className="text-sm font-semibold text-gray-700">Filter by Status</label>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* All Projects Filter */}
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            statusFilter === 'all'
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:from-orange-600 hover:to-orange-700'
                                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                        <span>All</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            statusFilter === 'all'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {uploadedProjects.length}
                                        </span>
                                    </button>

                                    {/* Draft Filter */}
                                    <button
                                        onClick={() => setStatusFilter('Draft')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            statusFilter === 'Draft'
                                                ? 'bg-gray-700 text-white shadow-md hover:bg-gray-800'
                                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Drafts</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            statusFilter === 'Draft'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {stats.draftProjects}
                                        </span>
                                    </button>

                                    {/* In Review Filter */}
                                    <button
                                        onClick={() => setStatusFilter('In Review')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            statusFilter === 'In Review'
                                                ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>In Review</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            statusFilter === 'In Review'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {stats.inReviewProjects}
                                        </span>
                                    </button>

                                    {/* Approved Filter */}
                                    <button
                                        onClick={() => setStatusFilter('Approved')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            statusFilter === 'Approved'
                                                ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:bg-green-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Approved</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            statusFilter === 'Approved'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {stats.activatedProjects}
                                        </span>
                                    </button>

                                    {/* Rejected Filter */}
                                    <button
                                        onClick={() => setStatusFilter('Rejected')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            statusFilter === 'Rejected'
                                                ? 'bg-red-500 text-white shadow-md hover:bg-red-600'
                                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Rejected</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            statusFilter === 'Rejected'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {stats.rejectedProjects}
                                        </span>
                                    </button>

                                    {/* Disabled Filter */}
                                    <button
                                        onClick={() => setStatusFilter('Disabled')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            statusFilter === 'Disabled'
                                                ? 'bg-gray-500 text-white shadow-md hover:bg-gray-600'
                                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        <span>Disabled</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            statusFilter === 'Disabled'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {stats.disabledProjects}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Filtered Projects */}
                            {(() => {
                                const filteredProjects = statusFilter === 'all' 
                                    ? uploadedProjects 
                                    : uploadedProjects.filter(p => p.status === statusFilter);
                                
                                if (filteredProjects.length === 0) {
                                    return (
                                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                                            <p className="text-gray-500 text-lg font-medium">
                                                No {statusFilter === 'all' ? '' : statusFilter.toLowerCase()} projects found.
                                            </p>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <>
                                        {/* Grid View */}
                                        {viewMode === 'grid' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filteredProjects.map((project) => (
                                                    <div
                                                        key={project.id}
                                                        onClick={() => {
                                                            if (project.status === 'Draft') {
                                                                loadDraftProject(project.id);
                                                            }
                                                        }}
                                                        className={project.status === 'Draft' ? 'cursor-pointer' : ''}
                                                    >
                                                        <ProjectDashboardCard
                                                            name={project.name}
                                                            domain={project.domain}
                                                            description={project.description}
                                                            logo={project.logo}
                                                            tags={project.tags}
                                                            status={project.status}
                                                            sales={project.sales}
                                                            price={project.price}
                                                            category={project.category}
                                                            adminComment={project.adminComment}
                                                            adminAction={project.adminAction}
                                                            projectId={project.id}
                                                            onToggleStatus={handleToggleProjectStatus}
                                                        />
                                                    </div>
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
                                                {(() => {
                                                    const filteredProjects = statusFilter === 'all' 
                                                        ? uploadedProjects 
                                                        : uploadedProjects.filter(p => p.status === statusFilter);
                                                    
                                                    if (filteredProjects.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                                    No {statusFilter === 'all' ? '' : statusFilter.toLowerCase()} projects found.
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                    
                                                    return filteredProjects.map((project) => (
                                                        <tr 
                                                            key={project.id} 
                                                            className={`hover:bg-gray-50 transition-colors ${project.status === 'Draft' ? 'cursor-pointer' : ''}`}
                                                            onClick={() => {
                                                                if (project.status === 'Draft') {
                                                                    loadDraftProject(project.id);
                                                                }
                                                            }}
                                                        >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                                            <p className="text-sm text-gray-500">{project.category}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="space-y-2">
                                                                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
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
                                                                {project.adminComment && (
                                                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                                        {project.adminAction && (
                                                                            <div className="mb-1">
                                                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                                    {project.adminAction === 'project_disabled' ? 'Project Disabled' : 
                                                                                     project.adminAction === 'first_warning' ? 'First Warning' : 
                                                                                     project.adminAction === 'other_action' ? 'Admin Action' : 
                                                                                     project.adminAction}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <p className="text-xs text-gray-700 font-medium mb-1">Admin Message:</p>
                                                                        <p className="text-xs text-gray-600 leading-relaxed">{project.adminComment}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {project.sales}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                                                            ₹{project.price.toFixed(2)}
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
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                                        </>
                                    );
                                })()}
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
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingProjectId ? 'Edit Draft Project' : 'Upload New Project'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setShowUploadForm(false);
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
                            <p className="text-sm text-green-600">
                                {isDraftSave ? 'Draft saved successfully! You can continue editing or submit for review when ready.' : 'Project uploaded successfully! Submitting for review...'}
                            </p>
                        </div>
                    )}

                    {/* Required fields note */}
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="text-red-500">*</span> indicates required fields
                    </div>

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
                            required
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>
                     <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">({tags.length}/10)</span>
                        </label>
                        <div className={`w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all ${tags.length >= 10 ? 'opacity-75' : ''}`}>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, index) => (
                                    <span 
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full border border-orange-200"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(index)}
                                            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-orange-200 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                                {tags.length < 10 && (
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagInputKeyDown}
                                        onBlur={() => { if (tagInput.trim()) addTag(); }}
                                        placeholder={tags.length === 0 ? "Type a tag and press Enter..." : "Add more..."}
                                        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 py-1"
                                    />
                                )}
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Press Enter or comma to add a tag. Backspace to remove the last tag. <span className="text-orange-600 font-medium">At least 1 tag required.</span></p>
                    </div>
                </SectionCard>

                <SectionCard title="Pricing & Media" step={2}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            id="price" 
                            label="Price (INR)" 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 49.99" 
                            required 
                            value={formData.price}
                            onChange={handleInputChange}
                        />
                        <InputField 
                            id="originalPrice" 
                            label="Original Price (INR) - Optional" 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 59.99 (for discount)" 
                            value={formData.originalPrice}
                            onChange={handleInputChange}
                        />
                    </div>
                     <div className="mt-6">
                        <InputField 
                            id="youtubeVideoUrl" 
                            label="YouTube Demo Video URL" 
                            placeholder="https://youtube.com/watch?v=..." 
                            required
                            value={formData.youtubeVideoUrl}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    {/* Resource Links - Improved UI */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Resource Links
                            <span className="text-gray-400 font-normal ml-1">(optional - add supporting materials)</span>
                        </label>
                        
                        {/* Resource type chips to select */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {resourceOptions.map((option) => {
                                const isSelected = selectedResources.includes(option.key);
                                return (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => toggleResource(option.key)}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-medium text-sm transition-all ${
                                            isSelected 
                                                ? option.color + ' shadow-sm' 
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                                        }`}
                                    >
                                        {option.icon}
                                        {option.label}
                                        {isSelected && (
                                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                            {/* Add Custom button */}
                            <button
                                type="button"
                                onClick={addCustomResource}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 font-medium text-sm transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Custom
                            </button>
                        </div>
                        
                        {/* URL inputs for selected resources */}
                        {(selectedResources.length > 0 || customResources.length > 0) && (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                {/* Predefined resources */}
                                {selectedResources.map((resourceKey) => {
                                    const option = resourceOptions.find(o => o.key === resourceKey)!;
                                    return (
                                        <div key={resourceKey} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${option.color}`}>
                                                    {option.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-gray-700 mb-1">{option.label}</div>
                                                    <input
                                                        type="url"
                                                        value={resourceUrls[resourceKey]}
                                                        onChange={(e) => handleResourceUrlChange(resourceKey, e.target.value)}
                                                        placeholder={option.placeholder}
                                                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm"
                        />
                    </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleResource(resourceKey)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                                                    title="Remove"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Custom resources */}
                                {customResources.map((resource) => (
                                    <div key={resource.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600 border border-green-200 flex-shrink-0">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                        </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    value={resource.label}
                                                    onChange={(e) => updateCustomResource(resource.id, 'label', e.target.value)}
                                                    placeholder="Resource name (e.g., Figma Design, API Docs)"
                                                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm font-medium"
                                                />
                                                <input
                                                    type="url"
                                                    value={resource.url}
                                                    onChange={(e) => updateCustomResource(resource.id, 'url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCustomResource(resource.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                    </div>
                                )}
                        
                        {selectedResources.length === 0 && customResources.length === 0 && (
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center border border-dashed border-gray-200">
                                Click on resource types above to add links, or use "Add Custom" for other resources
                            </p>
                                )}
                            </div>
                    
                    {/* GitHub URL with validation */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project GitHub URL <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal ml-1">(must be public repository)</span>
                        </label>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                        </div>
                                <input
                                    type="url"
                                    value={formData.githubUrl}
                                    onChange={handleGithubUrlChange}
                                    placeholder="https://github.com/username/repository"
                                    className={`w-full pl-10 pr-10 py-2 rounded-lg bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 ${
                                        githubValidationError 
                                            ? 'border-red-300 bg-red-50' 
                                            : githubValidated 
                                                ? 'border-green-300 bg-green-50' 
                                                : 'border-gray-200'
                                    }`}
                                />
                                {/* Status icon */}
                                {formData.githubUrl && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        {isValidatingGithub ? (
                                            <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : githubValidated ? (
                                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : githubValidationError ? (
                                            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={validateGithubUrl}
                                disabled={!formData.githubUrl.trim() || isValidatingGithub}
                                className="px-4 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isValidatingGithub ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify'
                                )}
                            </button>
                        </div>
                        {/* Validation feedback */}
                        {githubValidationError && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {githubValidationError}
                            </p>
                        )}
                        {githubValidated && (
                            <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Public repository verified successfully!
                            </p>
                        )}
                    </div>
                </SectionCard>

                 <SectionCard title="Uploads" step={3}>
                         <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Images <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">({imagePreviews.length}/{MAX_IMAGES})</span>
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
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each • Min 2, Max {MAX_IMAGES} images</p>
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
                            onClick={handleSaveDraft}
                            disabled={isSubmitting || !formData.title.trim()}
                            className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save as Draft
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !isFormValid}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[180px] justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm">{uploadProgress || 'Submitting...'}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Submit for Review
                                </>
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
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlock Unlimited Uploads</h3>
                                <p className="text-gray-600">
                                    You've reached the limit of {MAX_FREE_PROJECTS} free projects. Add a profile photo or upgrade to Premium to upload unlimited projects!
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

                            {/* Quick Option: Add Profile Photo */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-green-800">Free Option</p>
                                        <p className="text-sm text-green-600">Add a profile photo to unlock unlimited uploads</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowPremiumModal(false);
                                        // Navigate to settings to add profile photo
                                        const settingsTab = document.querySelector('[data-tab="settings"]');
                                        if (settingsTab) {
                                            (settingsTab as HTMLElement).click();
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Add Profile Photo (Free)
                                </button>
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
                    </div>
                </>
            )}
        </div>
    );
};

export default SellerDashboard;