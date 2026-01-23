import React, { useState, useEffect } from 'react';
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
    // Sidebar closed by default on mobile, open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024; // lg breakpoint
        }
        return true;
    });

    const handleNavClick = (view: AdminView) => {
        setActiveView(view);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    // Handle window resize to adjust sidebar state
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                // On desktop, ensure sidebar is open
                if (!isSidebarOpen) {
                    setIsSidebarOpen(true);
                }
            } else {
                // On mobile, close sidebar if it was open
                if (isSidebarOpen) {
                    setIsSidebarOpen(false);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    return (
        <div className={`flex h-screen bg-white text-gray-900 font-sans transition-colors duration-300 relative overflow-hidden`}>
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            
            <AdminSidebar 
                activeView={activeView}
                setActiveView={handleNavClick}
                isOpen={isSidebarOpen}
                isCollapsed={false}
                onClose={() => setIsSidebarOpen(false)}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
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

