import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminContent from './AdminContent';

export type AdminView =
    | 'project-management'
    | 'fraud-management'
    | 'user-management'
    | 'revenue-analytics'
    | 'payout-systems'
    | 'courses'
    | 'coding-questions'
    | 'mock-assessments'
    | 'career-guidance'
    | 'roadmap-management'
    | 'user-profile'
    | 'admin-project-details'
    | 'admin-report-details';

const AdminDashboard: React.FC = () => {
    const [activeView, setActiveView] = useState<AdminView>('project-management');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const handleNavClick = (view: AdminView) => {
        setActiveView(view);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className={`flex h-screen bg-white text-gray-900 font-sans transition-colors duration-300 relative`}>
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            
            <AdminSidebar 
                activeView={activeView}
                setActiveView={handleNavClick}
                isOpen={isSidebarOpen}
                isCollapsed={isSidebarCollapsed}
                onClose={() => setIsSidebarOpen(false)}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onCollapseToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminContent 
                    activeView={activeView}
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    setActiveView={setActiveView}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;

