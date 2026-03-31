import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import SkeletonDashboard from './ui/skeleton-dashboard';
import { useAuth } from '../App';
import { useDashboard } from '../context/DashboardContext';
import noProjectAnimation from '../lottiefiles/no_project_animation.json';
import DashboardHeader from './DashboardHeader';
import BuyerProjectCard from './BuyerProjectCard';
import type { BuyerProject } from './BuyerProjectCard';
import ProjectDashboardCard from './ProjectDashboardCard';
import type { DashboardView } from './DashboardPage';
import BuyerAnalyticsPage from './BuyerAnalyticsPage';
import SettingsPage from './SettingsPage';
import PurchasesPage from './PurchasesPage';
import WishlistPage from './WishlistPage';
import SellerDashboard from './SellerDashboard';
import MyProjectsPage from './MyProjectsPage';
import EarningsPage from './EarningsPage';
import PayoutsPage from './PayoutsPage';
import SellerAnalyticsPage from './SellerAnalyticsPage';
import DashboardFilters from './DashboardFilters';
import ProjectDetailsPage from './ProjectDetailsPage';
import CartPage from './CartPage';
import SellerProfilePage from './SellerProfilePage';
import { BrowseFreelancersContent } from './BrowseFreelancersContent';
import { BrowseProjectsContent } from './BrowseProjectsContent';
import HelpCenterPage from './HelpCenterPage';
import BuyerCoursesPage, { Course } from './BuyerCoursesPage';
import CourseDetailsPage from './CourseDetailsPage';
import HackathonsPage from './HackathonsPage';
import Pagination from './Pagination';
import BuildPortfolioPage from './BuildPortfolioPage';
import { ResumeBuilderPage } from './resume-builder';
import MyCoursesPage from './MyCoursesPage';
import CareerGuidancePage from './CareerGuidancePage';
import MockAssessmentPage from './MockAssessmentPage';
import CodingInterviewQuestionsPage from './CodingInterviewQuestionsPage';
import LiveMockInterviewPage from './LiveMockInterviewPage';
import LiveMockInterviewDashboard from './LiveMockInterviewDashboard';
import PostBidRequestProjectPage from './PostBidRequestProjectPage';
import MyBidsPage from './MyBidsPage';
import ChatRoom from './ChatRoom';
import CompanyPostsPage from './CompanyPostsPage';
import { PurchasedCourse, cachedFetchUserData, cachedFetchAllProjects, cachedFetchUserProfile } from '../services/buyerApi';
import PreparationHub from './preparation/PreparationHub';
import PrepInterviewQuestionsPage from './preparation/PrepInterviewQuestionsPage';
import PrepDSAProblemsPage from './preparation/PrepDSAProblemsPage';
import PrepQuizzesPage from './preparation/PrepQuizzesPage';
import PrepColdDMsPage from './preparation/PrepColdDMsPage';
import PrepCollectionsPage from './preparation/PrepCollectionsPage';
import PrepMassRecruitmentPage from './preparation/PrepMassRecruitmentPage';
import PrepJobPortalsPage from './preparation/PrepJobPortalsPage';
import PrepHandwrittenNotesPage from './preparation/PrepHandwrittenNotesPage';
import PrepRoadmapsPage from './preparation/PrepRoadmapsPage';
import PrepPositionResourcesPage from './preparation/PrepPositionResourcesPage';
import PrepActivityPage from './preparation/PrepActivityPage';
import PrepSystemDesignPage from './preparation/PrepSystemDesignPage';
import PrepFundamentalsPage from './preparation/PrepFundamentalsPage';

interface ApiProject {
    projectId: string;
    title: string;
    description: string;
    price: number;
    category: string;
    tags: string[];
    thumbnailUrl: string;
    images?: string[]; // Backend returns 'images', not 'additionalImages'
    sellerId: string;
    sellerEmail: string;
    status: string;
    likesCount?: number;
    purchasesCount?: number;
    demoVideoUrl?: string;
    adminApproved?: boolean;
    adminApprovalStatus?: string; // "approved" | "rejected" | "disabled"
    uploadedAt: string;
    documentationUrl?: string;
    youtubeVideoUrl?: string;
    viewsCount?: number;
    features?: string[]; // Features array from backend
}

// @ts-ignore - Mock data kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const buyerProjects: BuyerProject[] = [
    {
        id: 'proj-1',
        imageUrl: 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
        category: 'Web Development',
        title: 'E-commerce Platform',
        description: 'A full-stack e-commerce solution built with MERN stack, including payment integration.',
        tags: ['React', 'Node.js', 'MongoDB'],
        price: 49.99,
        isPremium: true,
        hasDocumentation: true,
        hasExecutionVideo: false,
    },
    {
        id: 'proj-2',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-6d22e4f13374?q=80&w=1974&auto=format&fit=crop',
        category: 'Mobile App',
        title: 'Social Media App',
        description: 'Feature-rich social media app clone using React Native and Firebase for a seamless experience.',
        tags: ['React Native', 'Firebase'],
        price: 59.99,
        hasDocumentation: true,
        hasExecutionVideo: true,
    },
    {
        id: 'proj-3',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
        category: 'Data Science',
        title: 'Sales Prediction AI',
        description: 'A machine learning model to predict future sales data with high accuracy using Python.',
        tags: ['Python', 'Scikit-learn', 'Pandas'],
        price: 79.99,
        isPremium: true,
        hasExecutionVideo: true,
    },
    {
        id: 'proj-4',
        imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e546?q=80&w=1974&auto=format&fit=crop',
        category: 'Web Development',
        title: 'Portfolio Template',
        description: 'A sleek, modern, and responsive portfolio template for developers and designers.',
        tags: ['HTML5', 'CSS3', 'JavaScript'],
        price: 19.99,
        hasDocumentation: true,
    },
    {
        id: 'proj-5',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop',
        category: 'DevOps',
        title: 'CI/CD Pipeline Automation',
        description: 'Automate your deployment process with this CI/CD pipeline using Jenkins and Docker.',
        tags: ['Jenkins', 'Docker', 'CI/CD'],
        price: 69.99,
        isPremium: true,
        hasDocumentation: true,
    },
    {
        id: 'proj-6',
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop',
        category: 'UI/UX Design',
        title: 'Fintech App UI Kit',
        description: 'A complete UI kit for a modern fintech application, designed in Figma with reusable components.',
        tags: ['Figma', 'UI Kit', 'Design System'],
        price: 29.99,
        hasExecutionVideo: true,
    },
    {
        id: 'proj-7',
        imageUrl: 'https://images.unsplash.com/photo-1607799279861-4d521203fb8d?q=80&w=2070&auto=format&fit=crop',
        category: 'Game Development',
        title: '2D Platformer Game',
        description: 'An engaging 2D platformer game built with Unity engine and C#. Includes all assets.',
        tags: ['Unity', 'C#', 'Game Design'],
        price: 39.99,
    },
    {
        id: 'proj-8',
        imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=1964&auto=format&fit=crop',
        category: 'Web Application',
        title: 'Task Management Tool',
        description: 'A Kanban-style task management application to organize and track your team\'s workflow.',
        tags: ['Vue.js', 'Firebase', 'TailwindCSS'],
        price: 44.99,
        isPremium: true,
        hasDocumentation: true,
        hasExecutionVideo: true,
    },
];

const activatedProjects = [
    {
        name: 'Zapier',
        domain: 'zapier.com',
        description: 'Automation: No-code tool that connects your CRM to 5,000+ other apps, instantly automating...',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zapier_logo.svg',
        tags: ['Automation', 'No-code', 'Integration'],
    },
    {
        name: 'Slack',
        domain: 'slack.com',
        description: 'A messaging app for businesses that connects people to the information they need.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
        tags: ['Communication', 'Teamwork', 'Productivity'],
    },
    {
        name: 'Figma',
        domain: 'figma.com',
        description: 'The collaborative interface design tool. Create, test, and ship better designs from start to finish.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg',
        tags: ['Design', 'UI/UX', 'Collaboration'],
    },
    {
        name: 'Notion',
        domain: 'notion.so',
        description: 'The all-in-one workspace for your notes, tasks, wikis, and databases.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg',
        tags: ['Productivity', 'Notes', 'Workspace'],
    },
];


interface DashboardContentProps {
    dashboardMode?: 'buyer' | 'seller' | 'preparation';
    setDashboardMode?: (mode: 'buyer' | 'seller') => void;
    activeView?: DashboardView;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setActiveView?: (view: DashboardView) => void;
}

export interface ExtendedProject extends BuyerProject {
    seller: {
        id?: string;
        name: string;
        email: string;
        avatar: string;
        rating: number;
        totalSales: number;
    };
    likes: number;
    purchases: number;
    originalPrice?: number;
    discount?: number;
    promoCode?: string;
    demoVideoUrl?: string;
    features?: string[];
    supportInfo?: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const { userId, userEmail } = useAuth();
    const { dashboardMode, activeView, setActiveView, setDashboardMode, setBrowseView, browseView, prepDarkMode } = useDashboard();
    const mainScrollRef = useRef<HTMLElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // After login, show buyer dashboard with projects view
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (sessionStorage.getItem('justLoggedIn') === 'true') {
            setDashboardMode('buyer');
            setActiveView('dashboard');
            setBrowseView('all');
            sessionStorage.removeItem('justLoggedIn');
        }
    }, [setDashboardMode, setActiveView, setBrowseView]);

    // Live AI Interview is not part of Prep Mode navigation; normalize stale localStorage / deep state.
    useLayoutEffect(() => {
        if (dashboardMode === 'preparation' && activeView === 'live-mock-interview') {
            setActiveView('prep-hub');
        }
    }, [dashboardMode, activeView, setActiveView]);

    // Scroll main content to top when sidebar view changes
    useEffect(() => {
        mainScrollRef.current?.scrollTo(0, 0);
    }, [activeView]);

    // Auto-hide scrollbar effect: show on scroll, hide after idle
    useEffect(() => {
        const mainEl = mainScrollRef.current;
        if (!mainEl) return;

        let scrollTimeout: ReturnType<typeof setTimeout>;

        const handleScroll = () => {
            mainEl.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                mainEl.classList.remove('is-scrolling');
            }, 1000);
        };

        mainEl.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            mainEl.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, []);
    const [buyerProjectView, setBuyerProjectView] = useState<'all' | 'activated' | 'disabled'>('all');
    const [projects, setProjects] = useState<BuyerProject[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<BuyerProject[]>([]);
    const [projectSellerMap, setProjectSellerMap] = useState<Map<string, { sellerId: string; sellerEmail: string; sellerProfilePicture?: string; sellerName?: string }>>(new Map());
    const [sellerProfileCache, setSellerProfileCache] = useState<Map<string, { profilePicture?: string; fullName?: string }>>(new Map());
    const [selectedProject, setSelectedProject] = useState<BuyerProject | null>(null);
    const [selectedSeller, setSelectedSeller] = useState<any>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [previousView, setPreviousView] = useState<DashboardView>('dashboard');
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Map API project to BuyerProject interface
    const mapApiProjectToComponent = (apiProject: ApiProject): BuyerProject => {
        return {
            id: apiProject.projectId,
            imageUrl: apiProject.thumbnailUrl || 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
            category: apiProject.category || 'Uncategorized',
            title: apiProject.title || 'Untitled Project',
            description: apiProject.description || 'No description available',
            tags: apiProject.tags || [],
            price: typeof apiProject.price === 'number' ? apiProject.price : parseFloat(String(apiProject.price || '0')),
            isPremium: false,
            hasDocumentation: !!apiProject.documentationUrl,
            hasExecutionVideo: !!apiProject.youtubeVideoUrl,
            demoVideoUrl: apiProject.youtubeVideoUrl,
            images: apiProject.images,
            features: apiProject.features || [], // Map features from API
            likesCount: apiProject.likesCount || 0,
            purchasesCount: apiProject.purchasesCount || 0,
            sellerEmail: apiProject.sellerEmail || '',
            isOwnProject: userId ? apiProject.sellerId === userId : false,
        };
    };

    // Fetch projects from API (cached + deduplicated)
    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        setProjectsError(null);

        try {
            // Both calls are cached & deduplicated -- if Sidebar or DashboardPage
            // already fetched user data, this returns instantly from cache.
            const [userData, data] = await Promise.all([
                userId ? cachedFetchUserData(userId) : Promise.resolve(null),
                cachedFetchAllProjects(),
            ]);

            const purchasedProjectIds: string[] =
                userData?.purchases?.map((p: any) => p.projectId) ?? [];

            const rawProjects: ApiProject[] = Array.isArray(data.projects)
                ? data.projects
                : Array.isArray(data.data)
                    ? data.data
                    : [];

            if (data.success !== false && rawProjects.length >= 0) {
                const filteredApiProjects = rawProjects.filter((apiProject: ApiProject) => {
                    const status = (apiProject.status || '').toLowerCase();
                    const approvalStatus = (apiProject.adminApprovalStatus || '').toLowerCase();
                    const isApproved =
                        approvalStatus === 'approved' ||
                        status === 'approved' ||
                        status === 'active' ||
                        status === 'live' ||
                        (apiProject.adminApproved === true && (status === 'active' || status === 'live'));

                    const isNotDraft = status !== 'draft';
                    const isNotPurchased = !purchasedProjectIds.includes(apiProject.projectId);

                    return isApproved && isNotDraft && isNotPurchased;
                });

                const mappedProjects = filteredApiProjects.map(mapApiProjectToComponent);

                const sellerMap = new Map<string, { sellerId: string; sellerEmail: string; sellerProfilePicture?: string; sellerName?: string }>();
                filteredApiProjects.forEach((apiProject) => {
                    if (apiProject.projectId && apiProject.sellerId) {
                        sellerMap.set(apiProject.projectId, {
                            sellerId: apiProject.sellerId,
                            sellerEmail: apiProject.sellerEmail || ''
                        });
                    }
                });
                setProjectSellerMap(sellerMap);

                const uniqueSellerIds = Array.from(
                    new Set(filteredApiProjects.map((p) => p.sellerId).filter(Boolean))
                ) as string[];

                const sellerProfiles = new Map<string, { profilePicture?: string; fullName?: string }>();
                await Promise.all(
                    uniqueSellerIds.map(async (sellerId) => {
                        const profile = await fetchSellerProfile(sellerId);
                        if (profile) sellerProfiles.set(sellerId, profile);
                    })
                );

                const enrichedProjects = mappedProjects.map((project) => {
                    const sellerInfo = sellerMap.get(project.id);
                    const profile = sellerInfo?.sellerId ? sellerProfiles.get(sellerInfo.sellerId) : undefined;
                    return {
                        ...project,
                        sellerName: profile?.fullName || undefined,
                        sellerProfilePicture: profile?.profilePicture || undefined,
                    };
                });

                setProjects(enrichedProjects);
                setFilteredProjects(enrichedProjects);
            } else if (data.success === false || (rawProjects.length === 0 && !Array.isArray(data.projects) && !Array.isArray(data.data))) {
                throw new Error(data.message || 'Invalid response format from API');
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setProjectsError(err instanceof Error ? err.message : 'Failed to fetch projects');
            setProjects([]);
            setFilteredProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    // Fetch projects when in buyer mode (and when userId changes so purchased filter is correct after login)
    useEffect(() => {
        if (dashboardMode === 'buyer') {
            fetchProjects();
        }
    }, [dashboardMode, userId]);

    // Fetch seller profile using centralized cache (deduplicates across components)
    const fetchSellerProfile = async (sellerId: string) => {
        if (sellerProfileCache.has(sellerId)) {
            return sellerProfileCache.get(sellerId);
        }

        try {
            const user = await cachedFetchUserProfile(sellerId);
            if (user) {
                const profile = {
                    profilePicture: user.profilePictureUrl || undefined,
                    fullName: user.fullName || user.name || undefined,
                };
                setSellerProfileCache(prev => new Map(prev).set(sellerId, profile));
                return profile;
            }
        } catch (err) {
            console.error('Failed to fetch seller profile:', err);
        }

        return { profilePicture: undefined, fullName: undefined };
    };

    // Fetch seller profile when viewing project details
    useEffect(() => {
        if (activeView === 'project-details' && selectedProject) {
            const sellerInfo = projectSellerMap.get(selectedProject.id);
            if (sellerInfo?.sellerId && !sellerProfileCache.has(sellerInfo.sellerId)) {
                fetchSellerProfile(sellerInfo.sellerId);
            }
        }
    }, [activeView, selectedProject, projectSellerMap]);

    // Apply search filter
    const searchFilteredProjects = filteredProjects.filter(project => {
        const query = searchQuery.toLowerCase();
        return (
            project.title.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query) ||
            project.category.toLowerCase().includes(query) ||
            project.tags.some(tag => tag.toLowerCase().includes(query))
        );
    });

    // Calculate pagination
    const totalPages = Math.ceil(searchFilteredProjects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProjects = searchFilteredProjects.slice(startIndex, endIndex);

    // Reset to page 1 when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filteredProjects.length]);

    const renderBuyerContent = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div className="mt-8">
                        {/* Render content based on browseView */}
                        {browseView === 'freelancers' && <BrowseFreelancersContent />}
                        {browseView === 'projects' && <BrowseProjectsContent />}
                        {(browseView === 'all' || (!browseView && buyerProjectView === 'all')) && (
                            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
                                {/* Filters Sidebar */}
                                <div className="lg:w-72 flex-shrink-0 lg:overflow-y-auto custom-scrollbar pr-2 pb-20">
                                    <DashboardFilters
                                        projects={projects}
                                        onFilterChange={setFilteredProjects}
                                    />
                                </div>

                                {/* Projects Grid */}
                                <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar pr-2">
                                    {/* Loading State - Skeleton Dashboard */}
                                    {isLoadingProjects && (
                                        <div className="space-y-8">
                                            <SkeletonDashboard />
                                        </div>
                                    )}

                                    {/* Error State */}
                                    {projectsError && !isLoadingProjects && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-red-800 font-medium">Error: {projectsError}</p>
                                                <button
                                                    onClick={fetchProjects}
                                                    className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!isLoadingProjects && !projectsError && searchFilteredProjects.length > 0 ? (
                                        <>
                                            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                                Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{searchFilteredProjects.length}</span> project{searchFilteredProjects.length !== 1 ? 's' : ''}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {paginatedProjects.map((project) => (
                                                    <BuyerProjectCard
                                                        key={project.id}
                                                        project={project}
                                                        onViewDetails={(proj) => {
                                                            setPreviousView('dashboard');
                                                            setSelectedProject(proj);
                                                            setActiveView('project-details');
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            {totalPages > 1 && (
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={totalPages}
                                                    onPageChange={setCurrentPage}
                                                    itemsPerPage={itemsPerPage}
                                                    totalItems={searchFilteredProjects.length}
                                                    onItemsPerPageChange={(newItemsPerPage) => {
                                                        setItemsPerPage(newItemsPerPage);
                                                        setCurrentPage(1);
                                                    }}
                                                />
                                            )}
                                        </>
                                    ) : !isLoadingProjects && !projectsError ? (
                                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                                            <div className="mx-auto mb-4 w-full max-w-[380px] h-[280px] flex items-center justify-center">
                                                <Lottie
                                                    animationData={noProjectAnimation}
                                                    loop
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <p className="text-gray-500 text-lg font-medium">No projects found</p>
                                            <p className="text-gray-400 text-sm mt-2">
                                                {searchQuery ? `No projects match "${searchQuery}"` : projects.length === 0 ? 'No projects available at the moment. Please check back later.' : 'Try adjusting your filters'}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                        {buyerProjectView === 'activated' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activatedProjects.map((project) => (
                                    <ProjectDashboardCard
                                        key={project.name}
                                        name={project.name}
                                        domain={project.domain}
                                        description={project.description}
                                        logo={project.logo}
                                        tags={project.tags}
                                    />
                                ))}
                            </div>
                        )}
                        {buyerProjectView === 'disabled' && (
                            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                                <p className="text-gray-500">You have no disabled projects.</p>
                            </div>
                        )}
                    </div>
                );
            case 'purchases':
                return <PurchasesPage />;
            case 'wishlist':
                return (
                    <WishlistPage
                        allProjects={projects}
                        onBack={() => setActiveView('dashboard')}
                        onViewDetails={(proj) => {
                            setPreviousView('wishlist');
                            setSelectedProject(proj);
                            setActiveView('project-details');
                        }}
                    />
                );
            case 'cart':
                return (
                    <CartPage
                        allProjects={projects}
                        onBack={() => setActiveView('dashboard')}
                    />
                );
            case 'messages':
                return <ChatRoom />;
            case 'courses':
                return (
                    <BuyerCoursesPage
                        onViewCourse={(course) => {
                            setPreviousView('courses');
                            setSelectedCourse(course);
                            setActiveView('course-details');
                        }}
                    />
                );
            case 'my-courses':
                return (
                    <MyCoursesPage
                        onViewCourse={(course: PurchasedCourse) => {
                            // Convert PurchasedCourse to Course type for course details
                            const courseForDetails: Course = {
                                courseId: course.courseId,
                                title: course.title,
                                description: course.description,
                                category: course.category,
                                subCategory: course.subCategory,
                                level: course.level,
                                language: course.language,
                                price: course.price,
                                currency: course.currency,
                                isFree: course.isFree,
                                thumbnailUrl: course.thumbnailUrl,
                                promoVideoUrl: course.promoVideoUrl,
                                status: course.status,
                                visibility: course.visibility,
                                likesCount: course.likesCount,
                                purchasesCount: course.purchasesCount,
                                viewsCount: course.viewsCount,
                                createdAt: course.createdAt,
                                updatedAt: course.updatedAt,
                                instructor: course.instructor,
                                content: course.content,
                            };
                            setPreviousView('my-courses');
                            setSelectedCourse(courseForDetails);
                            setActiveView('course-details');
                        }}
                    />
                );
            case 'hackathons':
                return <HackathonsPage toggleSidebar={toggleSidebar} />;
            case 'build-portfolio':
                return <BuildPortfolioPage embedded toggleSidebar={toggleSidebar} />;
            case 'build-resume':
                return <ResumeBuilderPage embedded onBack={() => setActiveView('dashboard')} toggleSidebar={toggleSidebar} onNavigateToSettings={() => setActiveView('settings')} />;
            case 'career-guidance':
                return <CareerGuidancePage toggleSidebar={toggleSidebar} />;
            case 'company-posts':
                return <CompanyPostsPage toggleSidebar={toggleSidebar} />;
            case 'mock-assessment':
                return <MockAssessmentPage embedded toggleSidebar={toggleSidebar} />;
            case 'live-mock-interview':
                return <LiveMockInterviewPage embedded toggleSidebar={toggleSidebar} />;
            case 'live-mock-interview-dashboard':
                return <LiveMockInterviewDashboard />;
            case 'coding-questions':
                return <CodingInterviewQuestionsPage toggleSidebar={toggleSidebar} />;
            case 'course-details':
                if (!selectedCourse) return null;
                return (
                    <CourseDetailsPage
                        course={selectedCourse}
                        onBack={() => setActiveView(previousView)}
                        toggleSidebar={toggleSidebar}
                    />
                );
            case 'analytics':
                return <BuyerAnalyticsPage />;
            case 'help-center':
                return <HelpCenterPage toggleSidebar={toggleSidebar} userEmail={userEmail || ''} />;
            case 'settings':
                return <SettingsPage />;
            case 'project-details':
                if (!selectedProject) {
                    // Redirect to dashboard if project data is lost (e.g. page reload)
                    setTimeout(() => setActiveView('dashboard'), 0);
                    return null;
                }
                const sellerInfo = projectSellerMap.get(selectedProject.id);
                const cachedProfile = sellerInfo?.sellerId ? sellerProfileCache.get(sellerInfo.sellerId) : null;
                const defaultName = selectedProject.sellerEmail ? selectedProject.sellerEmail.split('@')[0] : 'Seller';
                const sellerName = cachedProfile?.fullName || defaultName;

                // Extend project with additional details
                const extendedProject: ExtendedProject = {
                    ...selectedProject,
                    likes: typeof selectedProject.likesCount === 'number' ? selectedProject.likesCount : 0,
                    purchases: typeof selectedProject.purchasesCount === 'number' ? selectedProject.purchasesCount : 0,
                    seller: {
                        id: sellerInfo?.sellerId,
                        name: sellerName,
                        email: selectedProject.sellerEmail || 'seller@example.com',
                        avatar: cachedProfile?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=f97316&color=fff`,
                        rating: 0,
                        totalSales: 0,
                    },
                    demoVideoUrl: selectedProject.demoVideoUrl || (selectedProject.hasExecutionVideo ? '' : undefined),
                    supportInfo: 'For any questions or support regarding this project, please contact the seller directly through their profile or email.',
                    images: selectedProject.images && selectedProject.images.length > 0
                        ? selectedProject.images
                        : [selectedProject.imageUrl],
                };
                return (
                    <ProjectDetailsPage
                        project={extendedProject}
                        onBack={() => setActiveView(previousView === 'project-details' ? 'dashboard' : previousView)}
                        onViewSeller={(seller) => {
                            setPreviousView('project-details');
                            setSelectedSeller(seller);
                            setActiveView('seller-profile');
                        }}
                        toggleSidebar={toggleSidebar}
                    />
                );
            case 'seller-profile':
                if (!selectedSeller) return null;
                // SellerProfilePage will fetch projects from API using seller.id
                return (
                    <SellerProfilePage
                        seller={selectedSeller}
                        onBack={() => setActiveView(previousView)}
                        onViewProjectDetails={(project) => {
                            setPreviousView('seller-profile');
                            setSelectedProject(project);
                            setActiveView('project-details');
                        }}
                        toggleSidebar={toggleSidebar}
                    />
                );
            default:
                return null;
        }
    };

    const renderSellerContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <SellerDashboard />;
            case 'messages':
                return <ChatRoom />;
            case 'post-project':
                return <PostBidRequestProjectPage onBack={() => setActiveView('dashboard')} />;
            case 'my-bids':
                return <MyBidsPage onBack={() => setActiveView('dashboard')} />;
            case 'build-portfolio':
                return <BuildPortfolioPage embedded toggleSidebar={toggleSidebar} />;
            case 'build-resume':
                return <ResumeBuilderPage embedded onBack={() => setActiveView('dashboard')} toggleSidebar={toggleSidebar} onNavigateToSettings={() => setActiveView('settings')} />;
            case 'career-guidance':
                return <CareerGuidancePage toggleSidebar={toggleSidebar} />;
            case 'mock-assessment':
                return <MockAssessmentPage embedded toggleSidebar={toggleSidebar} />;
            case 'live-mock-interview':
                return <LiveMockInterviewPage embedded toggleSidebar={toggleSidebar} />;
            case 'live-mock-interview-dashboard':
                return <LiveMockInterviewDashboard />;
            case 'coding-questions':
                return <CodingInterviewQuestionsPage toggleSidebar={toggleSidebar} />;
            case 'my-projects':
                return <MyProjectsPage />;
            case 'my-courses':
                return (
                    <MyCoursesPage
                        onViewCourse={(course: PurchasedCourse) => {
                            // Convert PurchasedCourse to Course type for course details
                            const courseForDetails: Course = {
                                courseId: course.courseId,
                                title: course.title,
                                description: course.description,
                                category: course.category,
                                subCategory: course.subCategory,
                                level: course.level,
                                language: course.language,
                                price: course.price,
                                currency: course.currency,
                                isFree: course.isFree,
                                thumbnailUrl: course.thumbnailUrl,
                                promoVideoUrl: course.promoVideoUrl,
                                status: course.status,
                                visibility: course.visibility,
                                likesCount: course.likesCount,
                                purchasesCount: course.purchasesCount,
                                viewsCount: course.viewsCount,
                                createdAt: course.createdAt,
                                updatedAt: course.updatedAt,
                                instructor: course.instructor,
                                content: course.content,
                            };
                            setPreviousView('my-courses');
                            setSelectedCourse(courseForDetails);
                            setActiveView('course-details');
                        }}
                    />
                );
            case 'course-details':
                if (!selectedCourse) return null;
                return (
                    <CourseDetailsPage
                        course={selectedCourse}
                        onBack={() => setActiveView(previousView)}
                        isPurchased={true}
                    />
                );
            case 'earnings':
                return <EarningsPage />;
            case 'payouts':
                return <PayoutsPage />;
            case 'analytics':
                return <SellerAnalyticsPage />;
            case 'help-center':
                return <HelpCenterPage toggleSidebar={toggleSidebar} userEmail={userEmail || ''} />;
            case 'settings':
                return <SettingsPage />;
            default:
                return null;
        }
    };

    const renderPreparationContent = () => {
        switch (activeView) {
            case 'prep-hub':
                return <PreparationHub onNavigate={(view) => setActiveView(view as any)} />;
            case 'prep-interview-questions':
                return <PrepInterviewQuestionsPage toggleSidebar={toggleSidebar} />;
            case 'prep-dsa':
                return <PrepDSAProblemsPage toggleSidebar={toggleSidebar} />;
            case 'prep-quizzes':
                return <PrepQuizzesPage toggleSidebar={toggleSidebar} />;
            case 'prep-cold-dms':
                return <PrepColdDMsPage toggleSidebar={toggleSidebar} />;
            case 'prep-collections':
                return <PrepCollectionsPage toggleSidebar={toggleSidebar} />;
            case 'prep-mass-recruitment':
                return <PrepMassRecruitmentPage toggleSidebar={toggleSidebar} />;
            case 'prep-job-portals':
                return <PrepJobPortalsPage toggleSidebar={toggleSidebar} />;
            case 'prep-notes':
                return <PrepHandwrittenNotesPage toggleSidebar={toggleSidebar} />;
            case 'prep-roadmaps':
                return <PrepRoadmapsPage toggleSidebar={toggleSidebar} />;
            case 'prep-position-resources':
                return <PrepPositionResourcesPage toggleSidebar={toggleSidebar} />;
            case 'prep-system-design':
            case 'prep-hld':
                return <PrepSystemDesignPage {...{ designTab: 'hld' as const, toggleSidebar }} />;
            case 'prep-lld':
                return <PrepSystemDesignPage {...{ designTab: 'lld' as const, toggleSidebar }} />;
            case 'prep-fundamentals':
            case 'prep-oops':
                return <PrepFundamentalsPage {...{ section: 'oops' as const, toggleSidebar }} />;
            case 'prep-language':
                return <PrepFundamentalsPage {...{ section: 'language' as const, toggleSidebar }} />;
            case 'prep-activity':
                return <PrepActivityPage toggleSidebar={toggleSidebar} />;
            default:
                return <PreparationHub onNavigate={(view) => setActiveView(view as any)} />;
        }
    };

    const isCodingQuestions = activeView === 'coding-questions';
    const isLiveMockInterview = activeView === 'live-mock-interview';
    const isToolViewWithStickyHeader = isCodingQuestions || isLiveMockInterview;

    const renderModeContent = () => {
        if (dashboardMode === 'preparation') return renderPreparationContent();
        if (dashboardMode === 'buyer') return renderBuyerContent();
        return renderSellerContent();
    };

    const isPreparationMode = dashboardMode === 'preparation';
    const isPrepDark = isPreparationMode && prepDarkMode;

    return (
        <main
            ref={mainScrollRef}
            className={`flex-1 flex flex-col min-h-0 overflow-x-hidden ${isCodingQuestions ? 'overflow-hidden' : 'overflow-y-auto'} ${isPrepDark ? 'bg-black' : 'bg-white'} custom-scrollbar transition-colors duration-500`}
        >
            {isPreparationMode ? (
                <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden animate-fadeIn ${isPrepDark ? 'prep-dark-mode' : ''}`}>
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(12px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }

                        /* ========== Apple-inspired pure black dark theme ========== */
                        .prep-dark-mode {
                            background-color: #000000;
                            color: #f5f5f7;
                        }

                        /* Card & surface backgrounds */
                        .prep-dark-mode .bg-white { background-color: #1c1c1e !important; }
                        .prep-dark-mode .bg-gray-50 { background-color: #111111 !important; }

                        /* Borders */
                        .prep-dark-mode .border-gray-200 { border-color: #2c2c2e !important; }
                        .prep-dark-mode .border-gray-100 { border-color: #1c1c1e !important; }
                        .prep-dark-mode .border-b { border-color: #2c2c2e; }

                        /* Text hierarchy */
                        .prep-dark-mode .text-gray-900 { color: #f5f5f7 !important; }
                        .prep-dark-mode .text-gray-800 { color: #e5e5ea !important; }
                        .prep-dark-mode .text-gray-700 { color: #d1d1d6 !important; }
                        .prep-dark-mode .text-gray-600 { color: #aeaeb2 !important; }
                        .prep-dark-mode .text-gray-500 { color: #8e8e93 !important; }
                        .prep-dark-mode .text-gray-400 { color: #636366 !important; }

                        /* Orange tinted backgrounds */
                        .prep-dark-mode .bg-orange-50 { background-color: rgba(249, 115, 22, 0.08) !important; }
                        .prep-dark-mode .bg-orange-100 { background-color: rgba(249, 115, 22, 0.12) !important; }
                        .prep-dark-mode .border-orange-100 { border-color: rgba(249, 115, 22, 0.2) !important; }
                        .prep-dark-mode .border-orange-200 { border-color: rgba(249, 115, 22, 0.25) !important; }
                        .prep-dark-mode .border-orange-300 { border-color: rgba(249, 115, 22, 0.35) !important; }

                        /* Hover states */
                        .prep-dark-mode .hover\\:bg-gray-50:hover { background-color: #2c2c2e !important; }
                        .prep-dark-mode .hover\\:bg-orange-50:hover { background-color: rgba(249, 115, 22, 0.12) !important; }
                        .prep-dark-mode .hover\\:bg-orange-100:hover { background-color: rgba(249, 115, 22, 0.15) !important; }
                        .prep-dark-mode .hover\\:bg-orange-50\\/30:hover { background-color: rgba(249, 115, 22, 0.08) !important; }
                        .prep-dark-mode .hover\\:border-orange-500:hover { border-color: #f97316 !important; }
                        .prep-dark-mode .hover\\:shadow-md:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important; }
                        .prep-dark-mode .hover\\:bg-gray-100:hover { background-color: #2c2c2e !important; }

                        /* Topic chips */
                        .prep-dark-mode .prep-topic-chip {
                            background-color: #2c2c2e !important;
                            color: #a1a1a6 !important;
                            border: 1px solid #38383a;
                        }

                        /* Badge difficulty colors on dark */
                        .prep-dark-mode .bg-green-100 { background-color: rgba(34, 197, 94, 0.12) !important; }
                        .prep-dark-mode .text-green-700 { color: #4ade80 !important; }
                        .prep-dark-mode .bg-green-50 { background-color: rgba(34, 197, 94, 0.08) !important; }
                        .prep-dark-mode .text-green-600 { color: #22c55e !important; }
                        .prep-dark-mode .bg-yellow-100 { background-color: rgba(234, 179, 8, 0.12) !important; }
                        .prep-dark-mode .text-yellow-700 { color: #fbbf24 !important; }
                        .prep-dark-mode .bg-red-100 { background-color: rgba(239, 68, 68, 0.12) !important; }
                        .prep-dark-mode .text-red-700 { color: #f87171 !important; }

                        /* Additional badge colors */
                        .prep-dark-mode .bg-blue-100 { background-color: rgba(59, 130, 246, 0.12) !important; }
                        .prep-dark-mode .text-blue-700 { color: #60a5fa !important; }
                        .prep-dark-mode .bg-purple-100 { background-color: rgba(168, 85, 247, 0.12) !important; }
                        .prep-dark-mode .text-purple-700 { color: #c084fc !important; }
                        .prep-dark-mode .bg-amber-100 { background-color: rgba(245, 158, 11, 0.12) !important; }
                        .prep-dark-mode .text-amber-700 { color: #fbbf24 !important; }
                        .prep-dark-mode .bg-cyan-100 { background-color: rgba(6, 182, 212, 0.12) !important; }
                        .prep-dark-mode .text-cyan-700 { color: #22d3ee !important; }
                        .prep-dark-mode .bg-indigo-100 { background-color: rgba(99, 102, 241, 0.12) !important; }
                        .prep-dark-mode .text-indigo-700 { color: #818cf8 !important; }
                        .prep-dark-mode .bg-pink-100 { background-color: rgba(236, 72, 153, 0.12) !important; }
                        .prep-dark-mode .text-pink-700 { color: #f472b6 !important; }
                        .prep-dark-mode .bg-orange-100 { background-color: rgba(249, 115, 22, 0.12) !important; }
                        .prep-dark-mode .text-orange-700 { color: #fb923c !important; }

                        /* Inputs & selects */
                        .prep-dark-mode input,
                        .prep-dark-mode select,
                        .prep-dark-mode textarea {
                            background-color: #1c1c1e !important;
                            border-color: #38383a !important;
                            color: #f5f5f7 !important;
                        }
                        .prep-dark-mode input::placeholder,
                        .prep-dark-mode textarea::placeholder {
                            color: #636366 !important;
                        }
                        .prep-dark-mode input:focus,
                        .prep-dark-mode select:focus,
                        .prep-dark-mode textarea:focus {
                            border-color: #f97316 !important;
                            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.25) !important;
                        }

                        /* Table header */
                        .prep-dark-mode thead tr {
                            background-color: #111111 !important;
                        }
                        .prep-dark-mode th {
                            color: #8e8e93 !important;
                        }
                        .prep-dark-mode th:hover {
                            color: #e5e5ea !important;
                        }

                        /* Shadows */
                        .prep-dark-mode .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important; }

                        /* Checkboxes */
                        .prep-dark-mode input[type="checkbox"] {
                            accent-color: #f97316;
                        }

                        /* Scrollbar for dark mode */
                        .prep-dark-mode ::-webkit-scrollbar-track { background: #000000; }
                        .prep-dark-mode ::-webkit-scrollbar-thumb { background: #38383a; border-radius: 4px; }
                        .prep-dark-mode ::-webkit-scrollbar-thumb:hover { background: #48484a; }

                        /* Keep orange buttons vibrant */
                        .prep-dark-mode .bg-orange-500 { background-color: #f97316 !important; }
                        .prep-dark-mode .text-orange-500 { color: #fb923c !important; }
                        .prep-dark-mode .text-orange-600 { color: #f97316 !important; }
                        .prep-dark-mode .bg-orange-500.text-white { color: #ffffff !important; }

                        /* Orange 50 border-b tabs */
                        .prep-dark-mode .border-orange-500 { border-color: #f97316 !important; }
                        .prep-dark-mode .hover\\:border-gray-300:hover { border-color: #48484a !important; }
                        .prep-dark-mode .border-transparent { border-color: transparent !important; }
                        .prep-dark-mode .hover\\:text-gray-700:hover { color: #d1d1d6 !important; }

                        /* Rounded full toggle buttons */
                        .prep-dark-mode .bg-orange-50.text-orange-500,
                        .prep-dark-mode .text-orange-500.bg-orange-50 { background-color: rgba(249, 115, 22, 0.12) !important; }

                        /* Progress ring & SVG */
                        .prep-dark-mode svg path[stroke="#e5e7eb"],
                        .prep-dark-mode svg circle[stroke="#e5e7eb"] { stroke: #2c2c2e; }

                        /* Custom filter dropdowns */
                        .prep-dark-mode .prep-filter-btn {
                            background-color: #1c1c1e !important;
                            border-color: #38383a !important;
                            color: #f5f5f7 !important;
                        }
                        .prep-dark-mode .prep-filter-btn:hover {
                            background-color: #2c2c2e !important;
                        }
                        .prep-dark-mode .prep-filter-btn span { color: #e5e5ea !important; }
                        .prep-dark-mode .prep-filter-btn svg { color: #636366 !important; }
                        .prep-dark-mode .prep-filter-menu {
                            background-color: #1c1c1e !important;
                            border-color: #38383a !important;
                            box-shadow: 0 8px 30px rgba(0,0,0,0.6) !important;
                        }
                        .prep-dark-mode .prep-filter-menu button {
                            color: #e5e5ea !important;
                        }
                        .prep-dark-mode .prep-filter-menu button:hover {
                            background-color: #2c2c2e !important;
                        }
                        .prep-dark-mode .prep-filter-menu .bg-orange-50 {
                            background-color: rgba(249, 115, 22, 0.1) !important;
                        }
                        .prep-dark-mode .prep-filter-menu .text-orange-600 {
                            color: #fb923c !important;
                        }

                        /* Smooth transition on theme change */
                        .prep-dark-mode * { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
                    `}</style>
                    <div
                        className={
                            activeView === 'live-mock-interview'
                                ? 'w-full max-w-none py-8'
                                : 'container mx-auto px-6 py-8'
                        }
                    >
                        {renderModeContent()}
                    </div>
                </div>
            ) : isToolViewWithStickyHeader ? (
                <div
                    className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-8 ${isLiveMockInterview ? 'px-0' : 'px-6'}`}
                >
                    <div className="flex-shrink-0">
                        <DashboardHeader
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            buyerProjectView={buyerProjectView}
                            setBuyerProjectView={setBuyerProjectView}
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                        />
                    </div>
                    {renderModeContent()}
                </div>
            ) : (
                <div className="container mx-auto px-6 py-8">
                    <DashboardHeader
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        buyerProjectView={buyerProjectView}
                        setBuyerProjectView={setBuyerProjectView}
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={toggleSidebar}
                    />
                    {renderModeContent()}
                </div>
            )}
        </main>
    );
};

export default DashboardContent;
