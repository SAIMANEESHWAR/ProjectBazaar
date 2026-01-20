import React from 'react';
import { useAuth } from '../../App';
import type { AdminView } from './AdminDashboard';

const LogoIcon: React.FC<{className?: string}> = ({className}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14.293 3.293L12 1.00001L3.29297 9.70704C3.10547 9.89454 3.00006 10.149 3.00006 10.414V20C3.00006 20.552 3.44806 21 4.00006 21H12V13H14V21H20C20.552 21 21 20.552 21 20V10.414C21 10.149 20.8946 9.89452 20.7071 9.70702L14.293 3.293Z" fill="url(#paint0_linear_sidebar)"/>
    <defs>
      <linearGradient id="paint0_linear_sidebar" x1="3" y1="1" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316"/>
        <stop offset="1" stopColor="#EA580C"/>
      </linearGradient>
    </defs>
  </svg>
);

const ProjectManagementIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const FraudManagementIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const UserManagementIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const RevenueAnalyticsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const PayoutSystemsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const CoursesIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const CodingQuestionsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const CareerGuidanceIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const adminNavItems = [
    { name: 'Project Management', view: 'project-management' as AdminView, icon: ProjectManagementIcon },
    { name: 'Fraud Management', view: 'fraud-management' as AdminView, icon: FraudManagementIcon },
    { name: 'User Management', view: 'user-management' as AdminView, icon: UserManagementIcon },
    { name: 'Revenue Analytics', view: 'revenue-analytics' as AdminView, icon: RevenueAnalyticsIcon },
    { name: 'Payout Systems', view: 'payout-systems' as AdminView, icon: PayoutSystemsIcon },
    { name: 'Courses', view: 'courses' as AdminView, icon: CoursesIcon },
    { name: 'Coding Questions', view: 'coding-questions' as AdminView, icon: CodingQuestionsIcon },
    { name: 'Career Guidance', view: 'career-guidance' as AdminView, icon: CareerGuidanceIcon },
];

interface AdminSidebarProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggle: () => void;
    onCollapseToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeView, setActiveView, isOpen, isCollapsed, onCollapseToggle }) => {
    const { userEmail, logout } = useAuth();
    const [isHovered, setIsHovered] = React.useState(false);

    const isExpanded = isOpen && (!isCollapsed || isHovered);
    const sidebarWidth = isExpanded ? 'w-64' : 'w-16';

    return (
        <>
            <div 
                className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-sm ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } ${sidebarWidth} ${isCollapsed && isHovered ? 'shadow-xl z-[60]' : ''}`}
                onMouseEnter={() => {
                    if (isCollapsed && isOpen) {
                        setIsHovered(true);
                    }
                }}
                onMouseLeave={() => {
                    if (isCollapsed) {
                        setIsHovered(false);
                    }
                }}
            >
                {/* Header with logo */}
                <div className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} h-16 border-b border-gray-200 ${isExpanded ? 'px-4' : 'px-2'}`}>
                    {isExpanded && (
                        <div className="flex items-center gap-2">
                            <LogoIcon />
                            <span className="text-lg font-bold whitespace-nowrap">Admin Panel</span>
                        </div>
                    )}
                    {!isExpanded && (
                        <div className="flex items-center justify-center">
                            <LogoIcon />
                        </div>
                    )}
                </div>
                <nav className={`flex-1 ${isExpanded ? 'px-4' : 'px-2'} py-4 space-y-2 overflow-y-auto`}>
                    {adminNavItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => {
                                setActiveView(item.view);
                                if (isCollapsed && !isHovered) {
                                    onCollapseToggle();
                                }
                            }}
                            className={`w-full flex items-center ${isExpanded ? 'px-4' : 'px-2 justify-center'} py-2.5 text-sm font-medium rounded-lg transition-colors relative group ${
                                activeView === item.view
                                    ? 'bg-orange-500 text-white'
                                    : 'text-gray-600 hover:bg-orange-50'
                            }`}
                        >
                            <div className="flex-shrink-0 relative">
                                {item.icon}
                            </div>
                            {isExpanded && (
                                <span className="ml-3 whitespace-nowrap">
                                    {item.name}
                                </span>
                            )}
                            {!isExpanded && (
                                <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                                    {item.name}
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                </div>
                            )}
                        </button>
                    ))}
                </nav>
            <div className={`${isExpanded ? 'px-4' : 'px-2'} py-4 border-t border-gray-200`}>
                {isExpanded ? (
                    <div className="flex items-center p-2 bg-orange-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">Admin</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail ?? 'admin@example.com'}</p>
                        </div>
                        <button onClick={logout} className="ml-2 p-2 rounded-full text-gray-500 hover:bg-orange-100 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                            {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <button 
                            onClick={logout} 
                            className="p-2 rounded-full text-gray-500 hover:bg-orange-100"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default AdminSidebar;

