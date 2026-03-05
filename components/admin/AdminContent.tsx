import React, { useState, useEffect, useRef } from 'react';
import type { AdminView } from './AdminDashboard';
import ProjectManagementPage from './ProjectManagementPage';
import FraudManagementPage from './FraudManagementPage';
import UserManagementPage from './UserManagementPage';
import RevenueAnalyticsPage from './RevenueAnalyticsPage';
import PayoutSystemsPage from './PayoutSystemsPage';
import AdminUserProfilePage from './AdminUserProfilePage';
import AdminProjectDetailsPage from './AdminProjectDetailsPage';
import AdminReportDetailsPage from './AdminReportDetailsPage';
import CoursesManagementPage from './CoursesManagementPage';
import CodingQuestionsManagementPage from './CodingQuestionsManagementPage';
import MockAssessmentsManagementPage from './MockAssessmentsManagementPage';
import CareerContentManagementPage from './CareerContentManagementPage';
import RoadmapManagementPage from './RoadmapManagementPage';
import PlacementPrepManagementPage from './PlacementPrepManagementPage';
import PrepContentManagementPage from './PrepContentManagementPage';
import type { BuyerProject } from '../BuyerProjectCard';

import PreparationHub from '../preparation/PreparationHub';
import PrepInterviewQuestionsPage from '../preparation/PrepInterviewQuestionsPage';
import PrepDSAProblemsPage from '../preparation/PrepDSAProblemsPage';
import PrepQuizzesPage from '../preparation/PrepQuizzesPage';
import PrepColdDMsPage from '../preparation/PrepColdDMsPage';
import PrepCollectionsPage from '../preparation/PrepCollectionsPage';
import PrepMassRecruitmentPage from '../preparation/PrepMassRecruitmentPage';
import PrepJobPortalsPage from '../preparation/PrepJobPortalsPage';
import PrepHandwrittenNotesPage from '../preparation/PrepHandwrittenNotesPage';
import PrepRoadmapsPage from '../preparation/PrepRoadmapsPage';
import PrepPositionResourcesPage from '../preparation/PrepPositionResourcesPage';
import PrepSystemDesignPage from '../preparation/PrepSystemDesignPage';
import PrepFundamentalsPage from '../preparation/PrepFundamentalsPage';
import PrepActivityPage from '../preparation/PrepActivityPage';

interface AdminProject extends BuyerProject {
    status: 'pending' | 'in-review' | 'active' | 'disabled' | 'rejected';
    uploadedDate: string;
    sellerId: string;
    sellerName: string;
    sellerEmail: string;
    likes?: number;
    purchases?: number;
    demoVideoUrl?: string;
    features?: string[];
    supportInfo?: string;
    images?: string[];
    githubUrl?: string;
    liveDemoUrl?: string;
    documentationUrl?: string;
    originalPrice?: number;
    discount?: number;
}

interface AdminContentProps {
    activeView: AdminView;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setActiveView: (view: AdminView) => void;
}

const AdminContent: React.FC<AdminContentProps> = ({ activeView, toggleSidebar, setActiveView }) => {
    const contentScrollRef = useRef<HTMLDivElement>(null);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);

    // Scroll content to top when sidebar view changes
    useEffect(() => {
        contentScrollRef.current?.scrollTo(0, 0);
    }, [activeView]);
    const [userProjects, setUserProjects] = useState<AdminProject[]>([]);
    const [selectedProject, setSelectedProject] = useState<AdminProject | null>(null);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [allProjects, setAllProjects] = useState<AdminProject[]>([]);

    const viewTitles: Record<AdminView, string> = {
        'project-management': 'Project Management',
        'fraud-management': 'Fraud Management',
        'user-management': 'User Management',
        'revenue-analytics': 'Revenue Analytics',
        'payout-systems': 'Payout Systems',
        'courses': 'Courses Management',
        'coding-questions': 'Coding Interview Questions',
        'mock-assessments': 'Mock Assessments Management',
        'career-guidance': 'Career Guidance Content',
        'roadmap-management': 'Roadmap Management',
        'placement-prep': 'Placement Preparation Management',
        'prep-content': 'Preparation Content Management',
        'user-profile': selectedUser ? `${selectedUser.name}'s Profile` : 'User Profile',
        'admin-project-details': selectedProject ? `Project: ${selectedProject.title}` : 'Project Details',
        'admin-report-details': 'Report Details',
        'prep-mode': 'Preparation Mode',
    };

    const handleViewUser = (user: { id: string; name: string; email: string }) => {
        // Mock data - in real app, fetch from API
        const mockProjects: AdminProject[] = [
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
                status: 'active',
                uploadedDate: '2024-11-15',
                sellerId: user.id,
                sellerName: user.name,
                sellerEmail: user.email,
            },
            {
                id: 'proj-2',
                imageUrl: 'https://images.unsplash.com/photo-1611162617213-6d22e4f13374?q=80&w=1974&auto=format&fit=crop',
                category: 'Mobile App',
                title: 'Social Media App',
                description: 'Feature-rich social media app clone using React Native and Firebase.',
                tags: ['React Native', 'Firebase'],
                price: 59.99,
                hasDocumentation: true,
                hasExecutionVideo: true,
                status: 'pending',
                uploadedDate: '2024-11-16',
                sellerId: user.id,
                sellerName: user.name,
                sellerEmail: user.email,
            },
            {
                id: 'proj-3',
                imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
                category: 'Web Development',
                title: 'Portfolio Template',
                description: 'A sleek, modern, and responsive portfolio template for developers and designers.',
                tags: ['HTML5', 'CSS3', 'JavaScript'],
                price: 29.99,
                hasDocumentation: true,
                hasExecutionVideo: false,
                status: 'in-review',
                uploadedDate: '2024-11-17',
                sellerId: user.id,
                sellerName: user.name,
                sellerEmail: user.email,
            },
        ];
        setSelectedUser(user);
        setUserProjects(mockProjects);
        setActiveView('user-profile');
    };

    const handleProjectStatusChange = (projectId: string, newStatus: AdminProject['status']) => {
        setUserProjects(userProjects.map((p: AdminProject) =>
            p.id === projectId ? { ...p, status: newStatus } : p
        ));
        setAllProjects(allProjects.map((p: AdminProject) =>
            p.id === projectId ? { ...p, status: newStatus } : p
        ));
        if (selectedProject && selectedProject.id === projectId) {
            setSelectedProject({ ...selectedProject, status: newStatus });
        }
    };

    const handleViewProjectDetails = (project: AdminProject) => {
        // Extend project with additional details if needed
        const extendedProject: AdminProject = {
            ...project,
            likes: project.likes || Math.floor(Math.random() * 500) + 50,
            purchases: project.purchases || Math.floor(Math.random() * 200) + 10,
            demoVideoUrl: project.demoVideoUrl || undefined,
            features: project.features || [
                'Real-time collaboration',
                'Live code editing',
                'Integrated chat system',
                'Drawing/paint board',
                'Multiple user support',
                'Code sharing capabilities'
            ],
            images: project.images && project.images.length > 0
                ? project.images
                : [project.imageUrl],
            githubUrl: project.githubUrl || `https://github.com/${project.sellerName.toLowerCase().replace(' ', '-')}/${project.title.toLowerCase().replace(' ', '-')}`,
            liveDemoUrl: project.liveDemoUrl || `https://${project.title.toLowerCase().replace(' ', '-')}.demo.com`,
            documentationUrl: project.documentationUrl || `https://docs.${project.title.toLowerCase().replace(' ', '-')}.com`,
            supportInfo: project.supportInfo || 'For any questions or support regarding this project, please contact the seller directly through their profile or email.',
        };
        setSelectedProject(extendedProject);
        setActiveView('admin-project-details');
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                        aria-label="Toggle sidebar"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{viewTitles[activeView]}</h1>
                </div>
            </div>

            {/* Content */}
            <div ref={contentScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
                {activeView === 'project-management' && (
                    <ProjectManagementPage
                        onViewUser={handleViewUser}
                        onViewProjectDetails={handleViewProjectDetails}
                    />
                )}
                {activeView === 'admin-project-details' && selectedProject && (
                    <AdminProjectDetailsPage
                        project={selectedProject}
                        onBack={() => setActiveView('project-management')}
                        onStatusChange={handleProjectStatusChange}
                        onViewUser={handleViewUser}
                    />
                )}
                {activeView === 'user-profile' && selectedUser && (
                    <AdminUserProfilePage
                        user={{
                            ...selectedUser,
                            rating: 4.8,
                            totalSales: 631,
                            projectsCount: userProjects.length,
                            joinDate: '2020-01-15',
                        }}
                        userProjects={userProjects}
                        onBack={() => setActiveView('project-management')}
                        onProjectStatusChange={handleProjectStatusChange}
                    />
                )}
                {activeView === 'fraud-management' && (
                    <FraudManagementPage
                        onViewReport={(report) => {
                            setSelectedReport(report);
                            setActiveView('admin-report-details');
                        }}
                    />
                )}
                {activeView === 'admin-report-details' && selectedReport && (
                    <AdminReportDetailsPage
                        report={selectedReport}
                        onBack={() => {
                            setSelectedReport(null);
                            setActiveView('fraud-management');
                        }}
                        onStatusUpdate={(reportId, status, comment) => {
                            // Update report status (local state update)
                            // In production, this should call an API
                            console.log('Status update:', { reportId, status, comment });
                        }}
                        onReportUpdated={() => {
                            // Refresh reports list by going back and navigating again
                            // This will trigger a re-fetch in FraudManagementPage
                            setActiveView('fraud-management');
                            setTimeout(() => {
                                // The FraudManagementPage will refetch on mount
                            }, 100);
                        }}
                    />
                )}
                {activeView === 'user-management' && (
                    <UserManagementPage
                        onViewUser={handleViewUser}
                    />
                )}
                {activeView === 'revenue-analytics' && <RevenueAnalyticsPage />}
                {activeView === 'payout-systems' && <PayoutSystemsPage />}
                {activeView === 'courses' && <CoursesManagementPage />}
                {activeView === 'coding-questions' && <CodingQuestionsManagementPage />}
                {activeView === 'mock-assessments' && <MockAssessmentsManagementPage />}
                {activeView === 'career-guidance' && <CareerContentManagementPage />}
                {activeView === 'roadmap-management' && <RoadmapManagementPage />}
                {activeView === 'placement-prep' && <PlacementPrepManagementPage />}
                {activeView === 'prep-content' && <PrepContentManagementPage />}
                {activeView === 'prep-mode' && <AdminPrepModeView />}
            </div>
        </div>
    );
};

type PrepSubView =
    | 'hub' | 'interview' | 'dsa' | 'quizzes' | 'cold-dms' | 'collections'
    | 'mass-recruitment' | 'job-portals' | 'notes' | 'roadmaps' | 'position-resources'
    | 'hld' | 'lld' | 'oops' | 'language' | 'activity';

const prepNavItems: { label: string; key: PrepSubView; icon: JSX.Element }[] = [
    { label: 'Hub', key: 'hub', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { label: 'Interview Questions', key: 'interview', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'DSA Problems', key: 'dsa', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
    { label: 'Role Wise', key: 'position-resources', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138c.158.69.49 1.331.806 1.946a3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
    { label: 'Company Wise', key: 'mass-recruitment', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: 'HLD', key: 'hld', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'LLD', key: 'lld', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
    { label: 'OOPs', key: 'oops', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg> },
    { label: 'Language', key: 'language', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
    { label: 'Quizzes', key: 'quizzes', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
    { label: 'Notes', key: 'notes', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
    { label: 'Job Portals', key: 'job-portals', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { label: 'Roadmaps', key: 'roadmaps', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
    { label: 'Cold DMs', key: 'cold-dms', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { label: 'Activity', key: 'activity', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
];

const AdminPrepModeView: React.FC = () => {
    const [activeSubView, setActiveSubView] = useState<PrepSubView>('hub');

    const renderContent = () => {
        switch (activeSubView) {
            case 'hub': return <PreparationHub onNavigate={(view) => {
                const mapping: Record<string, PrepSubView> = {
                    'prep-interview-questions': 'interview', 'prep-dsa': 'dsa',
                    'prep-quizzes': 'quizzes', 'prep-cold-dms': 'cold-dms',
                    'prep-collections': 'collections', 'prep-mass-recruitment': 'mass-recruitment',
                    'prep-job-portals': 'job-portals', 'prep-notes': 'notes',
                    'prep-roadmaps': 'roadmaps', 'prep-position-resources': 'position-resources',
                    'prep-system-design': 'hld', 'prep-hld': 'hld', 'prep-lld': 'lld',
                    'prep-fundamentals': 'oops', 'prep-oops': 'oops', 'prep-language': 'language',
                    'prep-activity': 'activity',
                };
                setActiveSubView(mapping[view] ?? 'hub');
            }} />;
            case 'interview': return <PrepInterviewQuestionsPage />;
            case 'dsa': return <PrepDSAProblemsPage />;
            case 'quizzes': return <PrepQuizzesPage />;
            case 'cold-dms': return <PrepColdDMsPage />;
            case 'collections': return <PrepCollectionsPage />;
            case 'mass-recruitment': return <PrepMassRecruitmentPage />;
            case 'job-portals': return <PrepJobPortalsPage />;
            case 'notes': return <PrepHandwrittenNotesPage />;
            case 'roadmaps': return <PrepRoadmapsPage />;
            case 'position-resources': return <PrepPositionResourcesPage />;
            case 'hld': return <PrepSystemDesignPage designTab="hld" />;
            case 'lld': return <PrepSystemDesignPage designTab="lld" />;
            case 'oops': return <PrepFundamentalsPage section="oops" />;
            case 'language': return <PrepFundamentalsPage section="language" />;
            case 'activity': return <PrepActivityPage />;
            default: return <PreparationHub onNavigate={() => setActiveSubView('hub')} />;
        }
    };

    return (
        <div>
            {/* Sub-navigation */}
            <div className="mb-6 -mt-2 overflow-x-auto scrollbar-hide">
                <div className="flex gap-1.5 min-w-max pb-1">
                    {prepNavItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActiveSubView(item.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                                activeSubView === item.key
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prep content */}
            {renderContent()}
        </div>
    );
};

export default AdminContent;

