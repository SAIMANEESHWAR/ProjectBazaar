import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { fetchUserData } from '../services/buyerApi';
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
import HelpCenterPage from './HelpCenterPage';

const GET_ALL_PROJECTS_ENDPOINT = 'https://vwqfgtwerj.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Admin_Buyer';
const GET_USER_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';

interface ApiProject {
    projectId: string;
    title: string;
    description: string;
    price: number;
    category: string;
    tags: string[];
    thumbnailUrl: string;
    sellerId: string;
    sellerEmail: string;
    status: string;
    adminApproved?: boolean;
    adminApprovalStatus?: string; // "approved" | "rejected" | "disabled"
    uploadedAt: string;
    documentationUrl?: string;
    youtubeVideoUrl?: string;
    purchasesCount?: number;
    likesCount?: number;
    viewsCount?: number;
}

interface ApiResponse {
    success: boolean;
    count: number;
    projects: ApiProject[];
}

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
    dashboardMode: 'buyer' | 'seller';
    setDashboardMode: (mode: 'buyer' | 'seller') => void;
    activeView: DashboardView;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setActiveView: (view: DashboardView) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ dashboardMode, setDashboardMode, activeView, isSidebarOpen, toggleSidebar, setActiveView }) => {
    const { userId } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [buyerProjectView, setBuyerProjectView] = useState<'all' | 'activated' | 'disabled'>('all');
    const [projects, setProjects] = useState<BuyerProject[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<BuyerProject[]>([]);
    const [projectSellerMap, setProjectSellerMap] = useState<Map<string, { sellerId: string; sellerEmail: string; sellerProfilePicture?: string; sellerName?: string }>>(new Map());
    const [sellerProfileCache, setSellerProfileCache] = useState<Map<string, { profilePicture?: string; fullName?: string }>>(new Map());
    const [selectedProject, setSelectedProject] = useState<BuyerProject | null>(null);
    const [selectedSeller, setSelectedSeller] = useState<any>(null);
    const [previousView, setPreviousView] = useState<DashboardView>('dashboard');
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);

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
            isPremium: false, // API doesn't provide this, can be updated later
            hasDocumentation: !!apiProject.documentationUrl,
            hasExecutionVideo: !!apiProject.youtubeVideoUrl,
        };
    };

    // Fetch projects from API
    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        setProjectsError(null);
        
        try {
            // Fetch user data to get purchased project IDs
            let purchasedProjectIds: string[] = [];
            if (userId) {
                const userData = await fetchUserData(userId);
                if (userData && userData.purchases) {
                    purchasedProjectIds = userData.purchases.map((p: any) => p.projectId);
                }
            }

            const response = await fetch(GET_ALL_PROJECTS_ENDPOINT);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch projects: ${response.statusText}`);
            }
            
            const data: ApiResponse = await response.json();
            
            if (data.success && data.projects) {
                // Filter projects: Only show approved projects, exclude user's own projects, and exclude purchased projects
                const filteredApiProjects = data.projects.filter((apiProject: ApiProject) => {
                    // Check if project is approved
                    const isApproved = 
                        apiProject.adminApprovalStatus === 'approved' || 
                        apiProject.status === 'approved' ||
                        (apiProject.adminApproved === true && (apiProject.status === 'active' || apiProject.status === 'live'));
                    
                    // Check if project is not owned by current user
                    const isNotOwnProject = userId ? apiProject.sellerId !== userId : true;
                    
                    // Check if project is not already purchased
                    const isNotPurchased = !purchasedProjectIds.includes(apiProject.projectId);
                    
                    return isApproved && isNotOwnProject && isNotPurchased;
                });
                
                // Map filtered projects from API
                const mappedProjects = filteredApiProjects.map(mapApiProjectToComponent);
                
                // Create a map of projectId to sellerId and sellerEmail for later use
                const sellerMap = new Map<string, { sellerId: string; sellerEmail: string }>();
                filteredApiProjects.forEach((apiProject) => {
                    if (apiProject.projectId && apiProject.sellerId) {
                        sellerMap.set(apiProject.projectId, {
                            sellerId: apiProject.sellerId,
                            sellerEmail: apiProject.sellerEmail || ''
                        });
                    }
                });
                setProjectSellerMap(sellerMap);
                
                setProjects(mappedProjects);
                setFilteredProjects(mappedProjects);
                console.log('Fetched projects for buyer:', mappedProjects.length);
                console.log('Total projects from API:', data.projects.length);
                console.log('Approved projects (excluding own and purchased):', filteredApiProjects.length);
                console.log('Purchased projects filtered out:', purchasedProjectIds.length);
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setProjectsError(err instanceof Error ? err.message : 'Failed to fetch projects');
            // Keep empty array on error
            setProjects([]);
            setFilteredProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    // Fetch projects on component mount (only for buyer mode)
    useEffect(() => {
        if (dashboardMode === 'buyer') {
            fetchProjects();
        }
    }, [dashboardMode]);

    // Function to fetch seller profile picture
    const fetchSellerProfile = async (sellerId: string) => {
        // Check if already cached
        if (sellerProfileCache.has(sellerId)) {
            return sellerProfileCache.get(sellerId);
        }
        
        try {
            const response = await fetch(GET_USER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: sellerId }),
            });
            
            const data = await response.json();
            const user = data.data || data.user || data;
            
            if (user && data.success !== false) {
                const profile = {
                    profilePicture: user.profilePictureUrl || undefined,
                    fullName: user.fullName || user.name || undefined,
                };
                
                // Cache the result
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
    
    const renderBuyerContent = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                     <div className="mt-8">
                        {buyerProjectView === 'all' && (
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Filters Sidebar */}
                                <div className="lg:w-80 flex-shrink-0">
                                    <DashboardFilters 
                                        projects={projects} 
                                        onFilterChange={setFilteredProjects}
                                    />
                                </div>

                                {/* Projects Grid */}
                                <div className="flex-1">
                                    {/* Loading State */}
                                    {isLoadingProjects && (
                                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
                                            <p className="text-gray-600 font-medium">Loading projects...</p>
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
                                            <div className="mb-4 text-sm text-gray-600">
                                                Showing <span className="font-semibold text-gray-900">{searchFilteredProjects.length}</span> project{searchFilteredProjects.length !== 1 ? 's' : ''}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                                {searchFilteredProjects.map((project) => (
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
                                        </>
                                    ) : !isLoadingProjects && !projectsError ? (
                                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
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
                        onViewDetails={(proj) => {
                            setPreviousView('wishlist');
                            setSelectedProject(proj);
                            setActiveView('project-details');
                        }}
                    />
                );
            case 'cart':
                return <CartPage allProjects={projects} />;
            case 'analytics':
                return <BuyerAnalyticsPage />;
            case 'help-center':
                return <HelpCenterPage />;
            case 'settings':
                return <SettingsPage />;
            case 'project-details':
                if (!selectedProject) return null;
                // Get seller info from map
                const sellerInfo = projectSellerMap.get(selectedProject.id);
                // Get cached seller profile
                const cachedSellerProfile = sellerInfo?.sellerId ? sellerProfileCache.get(sellerInfo.sellerId) : undefined;
                // Extend project with additional details
                const extendedProject = {
                    ...selectedProject,
                    likes: Math.floor(Math.random() * 500) + 50,
                    purchases: Math.floor(Math.random() * 200) + 10,
                    seller: {
                        id: sellerInfo?.sellerId || '',
                        name: cachedSellerProfile?.fullName || sellerInfo?.sellerEmail?.split('@')[0] || 'Seller',
                        email: sellerInfo?.sellerEmail || 'seller@example.com',
                        avatar: cachedSellerProfile?.profilePicture || '',
                        rating: 4.8,
                        totalSales: Math.floor(Math.random() * 1000) + 100,
                    },
                    originalPrice: selectedProject.price * 1.1,
                    discount: 4,
                    promoCode: '444555',
                    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    features: [
                        'Real-time collaboration',
                        'Live code editing',
                        'Integrated chat system',
                        'Drawing/paint board',
                        'Multiple user support',
                        'Code sharing capabilities'
                    ],
                    supportInfo: 'For any questions or support regarding this project, please contact the seller directly through their profile or email.',
                    images: [
                        selectedProject.imageUrl,
                        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
                    ],
                };
                return (
                    <ProjectDetailsPage
                        project={extendedProject}
                        onBack={() => setActiveView(previousView)}
                        onViewSeller={(seller) => {
                            setPreviousView('project-details');
                            setSelectedSeller(seller);
                            setActiveView('seller-profile');
                        }}
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
            case 'my-projects':
                return <MyProjectsPage />;
            case 'earnings':
                return <EarningsPage />;
            case 'payouts':
                return <PayoutsPage />;
            case 'analytics':
                return <SellerAnalyticsPage />;
            case 'help-center':
                return <HelpCenterPage />;
            case 'settings':
                return <SettingsPage />;
            default:
                return null;
        }
    };

    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
            {activeView === 'help-center' ? (
                dashboardMode === 'buyer' ? renderBuyerContent() : renderSellerContent()
            ) : (
                <div className="container mx-auto px-6 py-8">
                    {activeView !== 'project-details' && activeView !== 'seller-profile' && (
                        <DashboardHeader 
                            dashboardMode={dashboardMode} 
                            setDashboardMode={setDashboardMode}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            activeView={activeView}
                            buyerProjectView={buyerProjectView}
                            setBuyerProjectView={setBuyerProjectView}
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                        />
                    )}
                    
                    {dashboardMode === 'buyer' ? renderBuyerContent() : renderSellerContent()}
                </div>
            )}
        </main>
    );
};

export default DashboardContent;