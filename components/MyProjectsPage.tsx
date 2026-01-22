import React, { useState, useMemo, useEffect } from 'react';
import ProjectDashboardCard from './ProjectDashboardCard';
import { useAuth } from '../App';
import { fetchProjectDetails } from '../services/buyerApi';

interface SellerProject {
    id: string;
    title: string;
    status: 'Live' | 'In Review' | 'Draft' | 'Approved' | 'Rejected' | 'Disabled';
    sales: number;
    price: number;
    category: string;
    thumbnailUrl?: string;
    description?: string;
    viewsCount?: number;
    likesCount?: number;
    adminApprovalStatus?: string;
}

const GET_PROJECTS_ENDPOINT = 'https://qosmi6luq0.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Seller';
const UPDATE_PROJECT_ENDPOINT = 'https://dihvjwfsk0.execute-api.ap-south-2.amazonaws.com/default/Update_projectDetils_and_likescounts_by_projectId';

const ALLOWED_CATEGORIES = [
    'Web Development',
    'Mobile App',
    'Data Science',
    'UI/UX Design',
    'Game Development',
    'DevOps'
];

type SortOption = 'none' | 'alphabetical' | 'reverse-alphabetical' | 'price-high-low' | 'price-low-high' | 'sales-high-low' | 'sales-low-high';

type ViewMode = 'grid' | 'table';

const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-3 py-1.5 text-xs font-semibold rounded-full inline-flex items-center gap-1.5";
    const statusClasses: Record<string, string> = {
        'Live': 'bg-green-100 text-green-800 border border-green-200',
        'Approved': 'bg-green-100 text-green-800 border border-green-200',
        'In Review': 'bg-orange-100 text-orange-800 border border-orange-200',
        'Draft': 'bg-gray-100 text-gray-800 border border-gray-200',
        'Rejected': 'bg-red-100 text-red-800 border border-red-200',
        'Disabled': 'bg-gray-200 text-gray-700 border border-gray-300',
    };
    
    const statusIcons: Record<string, React.ReactNode> = {
        'Live': <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
        'Approved': <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
        'In Review': <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
        'Draft': <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>,
        'Rejected': <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
        'Disabled': <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" /></svg>,
    };
    
    return (
        <span className={`${baseClasses} ${statusClasses[status] || statusClasses['Draft']}`}>
            {statusIcons[status]}
            {status}
        </span>
    );
}

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


const MyProjectsPage: React.FC = () => {
    const { userId } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [projects, setProjects] = useState<SellerProject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'Live' | 'In Review' | 'Draft'>('all');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 9000]);
    const [sortOption, setSortOption] = useState<SortOption>('none');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [editingProject, setEditingProject] = useState<SellerProject | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [projectFiles, setProjectFiles] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);

    // Function to map API project to component format
    const mapApiProjectToComponent = (apiProject: any): SellerProject => {
        // Map status from API to component format
        let status: 'Live' | 'In Review' | 'Draft' = 'Draft';
        const apiStatus = apiProject.status?.toLowerCase();
        if (apiStatus === 'active') {
            status = 'Live';
        } else if (apiStatus === 'pending' || apiStatus === 'in-review' || apiStatus === 'in_review') {
            status = 'In Review';
        } else if (apiStatus === 'disabled' || apiStatus === 'rejected') {
            status = 'Draft';
        }

        // Map status based on adminApprovalStatus
        let finalStatus: 'Live' | 'In Review' | 'Draft' | 'Approved' | 'Rejected' | 'Disabled' = status;
        const approvalStatus = apiProject.adminApprovalStatus?.toLowerCase();
        if (approvalStatus === 'approved') {
            finalStatus = 'Approved';
        } else if (approvalStatus === 'rejected') {
            finalStatus = 'Rejected';
        } else if (approvalStatus === 'disabled') {
            finalStatus = 'Disabled';
        }

        return {
            id: apiProject.projectId || apiProject.id,
            title: apiProject.title || apiProject.name || 'Untitled Project',
            status: finalStatus,
            sales: apiProject.purchasesCount || apiProject.sales || 0,
            price: typeof apiProject.price === 'number' ? apiProject.price : parseFloat(apiProject.price || '0'),
            category: apiProject.category || 'Uncategorized',
            thumbnailUrl: apiProject.thumbnailUrl,
            description: apiProject.description,
            viewsCount: apiProject.viewsCount || 0,
            likesCount: apiProject.likesCount || 0,
            adminApprovalStatus: apiProject.adminApprovalStatus
        };
    };

    // Fetch projects from API
    const fetchProjects = async () => {
        if (!userId) {
            setIsLoadingProjects(false);
            return;
        }

        setIsLoadingProjects(true);
        setProjectsError(null);

        try {
            const response = await fetch(`${GET_PROJECTS_ENDPOINT}?sellerId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            console.log('Fetched projects data:', data);

            if (data.success && data.projects) {
                // API returns projects array directly in response
                const apiProjects = Array.isArray(data.projects) ? data.projects : [];
                console.log('API projects received:', apiProjects);
                console.log('Number of projects:', apiProjects.length);
                
                // Fetch detailed information for each project to get updated stats
                const projectsWithDetails = await Promise.all(
                    apiProjects.map(async (project: any) => {
                        try {
                            const projectId = project.projectId || project.id;
                            if (projectId) {
                                const projectDetail = await fetchProjectDetails(projectId);
                                if (projectDetail) {
                                    return {
                                        ...project,
                                        viewsCount: projectDetail.viewsCount || project.viewsCount || 0,
                                        likesCount: projectDetail.likesCount || project.likesCount || 0,
                                        purchasesCount: projectDetail.purchasesCount || project.purchasesCount || 0,
                                        adminApprovalStatus: projectDetail.adminApprovalStatus || project.adminApprovalStatus,
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
                console.log('Mapped projects:', mappedProjects);
                console.log('Setting projects state with', mappedProjects.length, 'projects');
                setProjects(mappedProjects);
            } else {
                console.log('No projects found or API error. Response:', data);
                setProjects([]);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjectsError('Failed to load projects. Please refresh the page.');
            setProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    // Fetch projects on component mount and when userId changes
    useEffect(() => {
        if (userId) {
            fetchProjects();
            // Reset all filters when fetching new projects
            setSelectedCategories([]);
            setSearchQuery('');
            setSelectedStatus('all');
            setPriceRange([0, 9000]);
        }
    }, [userId]);

    // Get unique categories
    const categories = useMemo(() => {
        return Array.from(new Set(projects.map(p => p.category)));
    }, [projects]);

    // Filter and sort projects
    const filteredAndSortedProjects = useMemo(() => {
        console.log('Filtering projects. Total projects:', projects.length);
        console.log('Current filters - Status:', selectedStatus, 'Categories:', selectedCategories, 'Price Range:', priceRange);
        
        let filtered = projects.filter(project => {
            // Search filter
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query || 
                project.title.toLowerCase().includes(query) ||
                project.category.toLowerCase().includes(query);

            // Status filter
            const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;

            // Category filter
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(project.category);

            // Price range filter
            const matchesPrice = project.price >= priceRange[0] && project.price <= priceRange[1];

            const matches = matchesSearch && matchesStatus && matchesCategory && matchesPrice;
            if (!matches && projects.length > 0) {
                console.log('Project filtered out:', project.title, {
                    matchesSearch,
                    matchesStatus,
                    matchesCategory,
                    matchesPrice,
                    price: project.price,
                    priceRange
                });
            }
            return matches;
        });
        
        console.log('Filtered projects count:', filtered.length);

        // Sort
        if (sortOption !== 'none') {
            filtered = [...filtered].sort((a, b) => {
                switch (sortOption) {
                    case 'alphabetical':
                        return a.title.localeCompare(b.title);
                    case 'reverse-alphabetical':
                        return b.title.localeCompare(a.title);
                    case 'price-high-low':
                        return b.price - a.price;
                    case 'price-low-high':
                        return a.price - b.price;
                    case 'sales-high-low':
                        return b.sales - a.sales;
                    case 'sales-low-high':
                        return a.sales - b.sales;
                    default:
                        return 0;
                }
            });
        }

        return filtered;
    }, [projects, searchQuery, selectedStatus, selectedCategories, priceRange, sortOption]);

    const handleDelete = async (id: string) => {
        // TODO: Call delete API endpoint when available
        // For now, just remove from local state
        setProjects(prev => prev.filter(p => p.id !== id));
        setDeleteConfirmId(null);
        // Optionally refresh the list
        // await fetchProjects();
    };

    const handleEdit = async (project: SellerProject) => {
        setEditingProject(project);
        setSaveError(null);
        setSaveSuccess(false);
        
        // Fetch full project details
        try {
            const projectDetails = await fetchProjectDetails(project.id);
            if (projectDetails) {
                // Convert tags array to comma-separated string if needed
                const tagsString = Array.isArray(projectDetails.tags) 
                    ? projectDetails.tags.join(', ') 
                    : (projectDetails.tags || '');
                
                setEditFormData({
                    title: projectDetails.title || project.title,
                    category: projectDetails.category || project.category,
                    price: projectDetails.price || project.price,
                    description: projectDetails.description || project.description || '',
                    tags: tagsString,
                    originalPrice: projectDetails.originalPrice || '',
                    youtubeVideoUrl: projectDetails.youtubeVideoUrl || '',
                    documentationUrl: projectDetails.documentationUrl || '',
                });
                setThumbnailPreview(projectDetails.thumbnailUrl || project.thumbnailUrl || null);
            } else {
                // Fallback to basic data if API fails
                setEditFormData({
                    title: project.title,
                    category: project.category,
                    price: project.price,
                    description: project.description || '',
                    tags: '',
                    originalPrice: '',
                    youtubeVideoUrl: '',
                    documentationUrl: '',
                });
                setThumbnailPreview(project.thumbnailUrl || null);
            }
        } catch (error) {
            console.error('Error fetching project details:', error);
            // Fallback to basic data
            setEditFormData({
                title: project.title,
                category: project.category,
                price: project.price,
                description: project.description || '',
                tags: '',
                originalPrice: '',
                youtubeVideoUrl: '',
                documentationUrl: '',
            });
            setThumbnailPreview(project.thumbnailUrl || null);
        }
        
        setThumbnailFile(null);
        setProjectFiles(null);
    };

    // Upload file to S3
    // Note: This is a placeholder - you may need to use a presigned URL endpoint or direct S3 upload
    // For now, we'll handle file uploads separately if needed
    // @ts-ignore - Function kept for future S3 upload implementation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const uploadFileToS3 = async (_file: File, _projectId: string, _fileType: 'thumbnail' | 'projectFiles'): Promise<string | null> => {
        try {
            // TODO: Implement actual S3 upload
            // Option 1: Use presigned URL from backend
            // Option 2: Use direct S3 upload with credentials
            // Option 3: Use existing upload endpoint if it supports updates
            
            // For now, we'll skip file uploads in edit mode and only update text fields
            // Files can be updated separately through a dedicated file update endpoint
            console.log(`File upload for ${_fileType} would go here`);
            return null;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
    };

    const handleSaveEdit = async () => {
        if (!editingProject || !userId) {
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const updates: any = {};

            // Note: File uploads (thumbnail and projectFiles) may need to be handled separately
            // through a dedicated file update endpoint. The current update endpoint focuses on text fields.
            // If files are selected, you may want to show a message or handle them separately.
            
            if (thumbnailFile || projectFiles) {
                // TODO: Implement file upload to S3
                // For now, we'll proceed with text field updates
                // Files can be updated through a separate file update flow if needed
                console.log('File uploads detected - handle separately if needed');
            }

            // Prepare updates object
            if (editFormData.title) updates.title = editFormData.title;
            if (editFormData.description) updates.description = editFormData.description;
            if (editFormData.category) updates.category = editFormData.category;
            if (editFormData.tags) {
                // Convert tags to array or comma-separated string as needed
                updates.tags = Array.isArray(editFormData.tags) 
                    ? editFormData.tags 
                    : editFormData.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
            if (editFormData.price !== undefined && editFormData.price !== null) {
                updates.price = parseFloat(editFormData.price);
            }
            if (editFormData.originalPrice) {
                updates.originalPrice = parseFloat(editFormData.originalPrice);
            }
            if (editFormData.youtubeVideoUrl) updates.youtubeVideoUrl = editFormData.youtubeVideoUrl;
            if (editFormData.documentationUrl) updates.documentationUrl = editFormData.documentationUrl;
            // Note: status is immutable and cannot be changed by seller

            // Call update API
            const response = await fetch(UPDATE_PROJECT_ENDPOINT, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: editingProject.id,
                    sellerId: userId,
                    updates: updates
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to update project' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setSaveSuccess(true);
                // Refresh projects list
                await fetchProjects();
                // Close modal after a short delay
                setTimeout(() => {
                    setEditingProject(null);
                    setEditFormData({});
                    setThumbnailFile(null);
                    setProjectFiles(null);
                    setThumbnailPreview(null);
                    setSaveSuccess(false);
                }, 1500);
            } else {
                setSaveError(data.message || 'Failed to update project');
            }
        } catch (error) {
            console.error('Error saving project:', error);
            setSaveError('An error occurred while saving. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const sortOptions = [
        { value: 'none' as SortOption, label: 'No Sorting' },
        { value: 'alphabetical' as SortOption, label: 'Alphabetical', subtext: 'A → Z' },
        { value: 'reverse-alphabetical' as SortOption, label: 'Reverse Alphabetical', subtext: 'Z → A' },
        { value: 'price-high-low' as SortOption, label: 'Price', subtext: 'High → Low' },
        { value: 'price-low-high' as SortOption, label: 'Price', subtext: 'Low → High' },
        { value: 'sales-high-low' as SortOption, label: 'Sales', subtext: 'High → Low' },
        { value: 'sales-low-high' as SortOption, label: 'Sales', subtext: 'Low → High' },
    ];

    return (
        <div className="mt-8">
            {/* Header with View Toggle */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
                        {!isLoadingProjects && projects.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                {projects.length} project{projects.length !== 1 ? 's' : ''} total
                                {filteredAndSortedProjects.length !== projects.length && (
                                    <span className="ml-2">
                                        ({filteredAndSortedProjects.length} shown)
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                    {!isLoadingProjects && (
                        <button
                            onClick={fetchProjects}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Refresh projects"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>
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
            </div>

            {/* Filters Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'Live' | 'In Review' | 'Draft')}
                        >
                            <option value="all">All Status</option>
                            <option value="Live">Live</option>
                            <option value="In Review">In Review</option>
                            <option value="Draft">Draft</option>
                        </select>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Price Range: ${priceRange[0]} - ${priceRange[1]}</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="9000"
                                value={priceRange[0]}
                                onChange={(e) => setPriceRange([Math.max(0, parseInt(e.target.value) || 0), priceRange[1]])}
                                className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="number"
                                min="0"
                                max="9000"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], Math.min(9000, parseInt(e.target.value) || 9000)])}
                                className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div>

                    {/* Sort By */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg transition-colors ${
                                isSortDropdownOpen
                                    ? 'border-orange-500 bg-white'
                                    : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <span className="text-sm font-medium text-gray-700">Sort by</span>
                            <svg className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {isSortDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsSortDropdownOpen(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                    <div className="py-1">
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setSortOption(option.value);
                                                    setIsSortDropdownOpen(false);
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center">
                                                    {sortOption === option.value && (
                                                        <svg className="h-5 w-5 mr-2 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    )}
                                                    {sortOption !== option.value && (
                                                        <div className="w-5 mr-2"></div>
                                                    )}
                                                    <span className="text-sm text-gray-700">{option.label}</span>
                                                </div>
                                                {option.subtext && (
                                                    <span className="text-xs text-gray-500">{option.subtext}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Category Filters */}
                {categories.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categories:</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => toggleCategory(category)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        selectedCategories.includes(category)
                                            ? 'bg-orange-500 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Clear Filters */}
                {(searchQuery || selectedStatus !== 'all' || selectedCategories.length > 0 || priceRange[1] < 9000) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedStatus('all');
                                setSelectedCategories([]);
                                setPriceRange([0, 9000]);
                            }}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
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
            ) : (
                <>
                    {/* Grid View */}
                    {viewMode === 'grid' && (
                        <>
                            {filteredAndSortedProjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredAndSortedProjects.map((project) => (
                                        <ProjectDashboardCard
                                            key={project.id}
                                            name={project.title}
                                            domain={`${project.title.toLowerCase().replace(/\s+/g, '-')}.com`}
                                            description={project.description || `${project.title} - ${project.category}`}
                                            logo={project.thumbnailUrl || "https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop"}
                                            tags={[project.category]}
                                            status={project.status}
                                            sales={project.sales}
                                            price={project.price}
                                            category={project.category}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-500 text-lg font-medium">
                                        {projects.length === 0 
                                            ? 'No projects uploaded yet' 
                                            : 'No projects match your filters'}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        {projects.length === 0 
                                            ? 'Upload your first project to get started' 
                                            : 'Try adjusting your filters or clear all filters'}
                                    </p>
                                    {projects.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSelectedStatus('all');
                                                setSelectedCategories([]);
                                                setPriceRange([0, 9000]);
                                            }}
                                            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <>
                            {filteredAndSortedProjects.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <span>Project</span>
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Sales</th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Views</th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Likes</th>
                                            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredAndSortedProjects.map((project: SellerProject) => (
                                            <tr 
                                                key={project.id} 
                                                className="hover:bg-orange-50/50 transition-all duration-200 group border-b border-gray-100 last:border-0"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-orange-300 transition-colors bg-gray-50">
                                                            {project.thumbnailUrl ? (
                                                                <img 
                                                                    src={project.thumbnailUrl} 
                                                                    alt={project.title}
                                                                    className="h-full w-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                                                                {project.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-500">{project.category}</span>
                                                                {project.description && (
                                                                    <>
                                                                        <span className="text-gray-300">•</span>
                                                                        <span className="text-xs text-gray-400 truncate max-w-xs">
                                                                            {project.description.length > 50 
                                                                                ? `${project.description.substring(0, 50)}...` 
                                                                                : project.description}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={project.status} />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-semibold text-gray-900">{project.sales}</span>
                                                        <span className="text-xs text-gray-500">sales</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-semibold text-gray-900">{project.viewsCount?.toLocaleString() || 0}</span>
                                                        <span className="text-xs text-gray-500">views</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-semibold text-gray-900">{project.likesCount?.toLocaleString() || 0}</span>
                                                        <span className="text-xs text-gray-500">likes</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-base font-bold text-gray-900">₹{project.price.toFixed(2)}</span>
                                                        {project.sales > 0 && (
                                                            <span className="text-xs text-green-600 font-medium">
                                                                ₹{(project.price * project.sales).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} revenue
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleEdit(project)}
                                                            className="p-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 border border-transparent hover:border-blue-200" 
                                                            title="Edit Project"
                                                        >
                                                            <EditIcon />
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeleteConfirmId(project.id)}
                                                            className="p-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 border border-transparent hover:border-red-200" 
                                                            title="Delete Project"
                                                        >
                                                            <DeleteIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Table Footer with Summary */}
                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-gray-600">
                                        Showing <span className="font-semibold text-gray-900">{filteredAndSortedProjects.length}</span> of <span className="font-semibold text-gray-900">{projects.length}</span> projects
                                    </div>
                                    <div className="flex items-center gap-6 text-gray-600">
                                        <div>
                                            <span className="font-semibold text-gray-900">{projects.reduce((sum, p) => sum + p.sales, 0)}</span> total sales
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-900">₹{projects.reduce((sum, p) => sum + (p.price * p.sales), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> total revenue
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">
                                {projects.length === 0 
                                    ? 'No projects uploaded yet' 
                                    : 'No projects match your filters'}
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                {projects.length === 0 
                                    ? 'Upload your first project to get started' 
                                    : 'Try adjusting your filters or clear all filters'}
                            </p>
                            {projects.length > 0 && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedStatus('all');
                                        setSelectedCategories([]);
                                        setPriceRange([0, 9000]);
                                    }}
                                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}
                        </>
                    )}
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setDeleteConfirmId(null)}
                    >
                        <div 
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Project</h3>
                                <p className="text-gray-600">
                                    Are you sure you want to delete this project? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirmId)}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Edit Project Modal */}
            {editingProject && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            setEditingProject(null);
                            setEditFormData({});
                        }}
                    >
                        <div 
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => {
                                    setEditingProject(null);
                                    setEditFormData({});
                                }}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Project</h3>

                            {saveError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{saveError}</p>
                                </div>
                            )}

                            {saveSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-600">Project updated successfully!</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        value={editFormData.title || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        value={editFormData.description || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                        value={editFormData.category || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {ALLOWED_CATEGORIES.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated) *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., React, Node.js, MongoDB"
                                        value={editFormData.tags || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max="10000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            value={editFormData.price || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Original Price ($) - Optional</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            value={editFormData.originalPrice || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, originalPrice: e.target.value })}
                                            placeholder="For discount"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video URL</label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={editFormData.youtubeVideoUrl || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, youtubeVideoUrl: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Documentation URL</label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="https://docs.example.com"
                                        value={editFormData.documentationUrl || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, documentationUrl: e.target.value })}
                                    />
                                </div>

                                {/* File Uploads */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Thumbnail</label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                            {thumbnailPreview ? (
                                                <div className="text-center">
                                                    <img src={thumbnailPreview} alt="Preview" className="h-32 w-auto object-cover rounded-md mx-auto mb-2" />
                                                    <label htmlFor="thumbnail-upload-edit" className="cursor-pointer text-sm text-orange-600 hover:text-orange-700 font-medium">
                                                        Change Image
                                                    </label>
                                                    <input
                                                        id="thumbnail-upload-edit"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                const file = e.target.files[0];
                                                                setThumbnailFile(file);
                                                                setThumbnailPreview(URL.createObjectURL(file));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-1 text-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <div className="flex text-sm text-gray-600">
                                                        <label htmlFor="thumbnail-upload-edit" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500">
                                                            <span>Upload a file</span>
                                                            <input
                                                                id="thumbnail-upload-edit"
                                                                type="file"
                                                                accept="image/*"
                                                                className="sr-only"
                                                                onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        const file = e.target.files[0];
                                                                        setThumbnailFile(file);
                                                                        setThumbnailPreview(URL.createObjectURL(file));
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                        <p className="pl-1">or drag and drop</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Files (.zip)</label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                            <div className="space-y-1 text-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                <div className="flex text-sm text-gray-600">
                                                    <label htmlFor="project-files-upload-edit" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500">
                                                        <span>Upload files</span>
                                                        <input
                                                            id="project-files-upload-edit"
                                                            type="file"
                                                            accept=".zip"
                                                            className="sr-only"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setProjectFiles(e.target.files[0]);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">ZIP file up to 50MB</p>
                                                {projectFiles && (
                                                    <p className="text-xs text-green-600 mt-2">✓ {projectFiles.name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setEditingProject(null);
                                        setEditFormData({});
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MyProjectsPage;