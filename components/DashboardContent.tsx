import React, { useState } from 'react';
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
}

const DashboardContent: React.FC<DashboardContentProps> = ({ dashboardMode, setDashboardMode, activeView }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [buyerProjectView, setBuyerProjectView] = useState<'all' | 'activated' | 'disabled'>('all');

    const filteredProjects = buyerProjects.filter(project => {
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
                            <>
                                {filteredProjects.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {filteredProjects.map((project) => (
                                            <BuyerProjectCard key={project.id} project={project} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <p className="text-gray-500 dark:text-gray-400">No projects found for "{searchQuery}"</p>
                                    </div>
                                )}
                            </>
                        )}
                        {buyerProjectView === 'activated' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                            <div className="text-center py-16 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400">You have no disabled projects.</p>
                            </div>
                        )}
                    </div>
                );
            case 'purchases':
                return <PurchasesPage />;
            case 'wishlist':
                return <WishlistPage allProjects={buyerProjects} />;
            case 'analytics':
                return <BuyerAnalyticsPage />;
            case 'settings':
                return <SettingsPage />;
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
            case 'settings':
                return <SettingsPage />;
            default:
                return null;
        }
    };

    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-black">
            <div className="container mx-auto px-6 py-8">
                <DashboardHeader 
                    dashboardMode={dashboardMode} 
                    setDashboardMode={setDashboardMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeView={activeView}
                    buyerProjectView={buyerProjectView}
                    setBuyerProjectView={setBuyerProjectView}
                />
                
                {dashboardMode === 'buyer' ? renderBuyerContent() : renderSellerContent()}
            </div>
        </main>
    );
};

export default DashboardContent;