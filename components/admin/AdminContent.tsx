import React, { useState } from 'react';
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
import type { BuyerProject } from '../BuyerProjectCard';

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
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
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
        'user-profile': selectedUser ? `${selectedUser.name}'s Profile` : 'User Profile',
        'admin-project-details': selectedProject ? `Project: ${selectedProject.title}` : 'Project Details',
        'admin-report-details': 'Report Details',
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
            demoVideoUrl: project.demoVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            features: project.features || [
                'Real-time collaboration',
                'Live code editing',
                'Integrated chat system',
                'Drawing/paint board',
                'Multiple user support',
                'Code sharing capabilities'
            ],
            images: project.images || [
                project.imageUrl,
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
            ],
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
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{viewTitles[activeView]}</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
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
            </div>
        </div>
    );
};

export default AdminContent;

