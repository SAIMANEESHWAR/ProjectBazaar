import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import type { DashboardView } from './DashboardPage';
import { useCart } from './DashboardPage';

const GET_USER_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';

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

const DashboardIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ProjectsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const PurchasesIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const EarningsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const AnalyticsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const SettingsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const WishlistIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const CartIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const PayoutsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const HelpCenterIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CoursesIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const HackathonsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const PortfolioIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const ResumeIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CareerGuidanceIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const MockAssessmentIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const CodingQuestionsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const PostProjectIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const buyerNavItems = [
    { name: 'Dashboard', view: 'dashboard' as DashboardView, icon: DashboardIcon },
    { name: 'Career Guidance', view: 'career-guidance' as DashboardView, icon: CareerGuidanceIcon },
    { name: 'Mock Assessment', view: 'mock-assessment' as DashboardView, icon: MockAssessmentIcon },
    { name: 'Coding Questions', view: 'coding-questions' as DashboardView, icon: CodingQuestionsIcon },
    { name: 'Build Portfolio', view: 'build-portfolio' as DashboardView, icon: PortfolioIcon },
    { name: 'AI Resume Builder', view: 'build-resume' as DashboardView, icon: ResumeIcon },
    { name: 'Purchases', view: 'purchases' as DashboardView, icon: PurchasesIcon },
    { name: 'Wishlist', view: 'wishlist' as DashboardView, icon: WishlistIcon },
    { name: 'Cart', view: 'cart' as DashboardView, icon: CartIcon },
    { name: 'Hackathons', view: 'hackathons' as DashboardView, icon: HackathonsIcon },
    { name: 'Courses', view: 'courses' as DashboardView, icon: CoursesIcon },
    { name: 'Analytics', view: 'analytics' as DashboardView, icon: AnalyticsIcon },
    { name: 'Help Center', view: 'help-center' as DashboardView, icon: HelpCenterIcon },
    { name: 'Settings', view: 'settings' as DashboardView, icon: SettingsIcon },
];

const sellerNavItems = [
    { name: 'Dashboard', view: 'dashboard' as DashboardView, icon: DashboardIcon },
    { name: 'Post Project', view: 'post-project' as DashboardView, icon: PostProjectIcon },
    { name: 'My Projects', view: 'my-projects' as DashboardView, icon: ProjectsIcon },
    { name: 'My Courses', view: 'my-courses' as DashboardView, icon: CoursesIcon },
    { name: 'Earnings', view: 'earnings' as DashboardView, icon: EarningsIcon },
    { name: 'Payouts', view: 'payouts' as DashboardView, icon: PayoutsIcon },
    { name: 'Analytics', view: 'analytics' as DashboardView, icon: AnalyticsIcon },
    { name: 'Help Center', view: 'help-center' as DashboardView, icon: HelpCenterIcon },
    { name: 'Settings', view: 'settings' as DashboardView, icon: SettingsIcon },
];

interface SidebarProps {
    dashboardMode: 'buyer' | 'seller';
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggle: () => void;
    onCollapseToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ dashboardMode, activeView, setActiveView, isOpen, isCollapsed, onCollapseToggle }) => {
    const { userEmail, userId, logout } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
    const [userFullName, setUserFullName] = useState<string>('');
    
    // Always call the hook (React rules), but only use cartCount in buyer mode
    const cart = useCart();
    const cartCount = dashboardMode === 'buyer' ? cart.cartCount : 0;

    const navItems = dashboardMode === 'buyer' ? buyerNavItems : sellerNavItems;

    // Fetch user profile to get profile image
    useEffect(() => {
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

        fetchUserProfile();
    }, [userId]);
    
    // When collapsed and hovered, show expanded version
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
                            <span className="text-lg font-bold whitespace-nowrap">ProjectBazaar</span>
                        </div>
                    )}
                    {!isExpanded && (
                        <div className="flex items-center justify-center">
                            <LogoIcon />
                        </div>
                    )}
                </div>
                <nav className={`flex-1 ${isExpanded ? 'px-4' : 'px-2'} py-4 space-y-2 overflow-y-auto`}>
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => {
                                setActiveView(item.view);
                                // If collapsed and not hovered, expand on click
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
                                {item.view === 'cart' && cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </div>
                            {isExpanded && (
                                <span className="ml-3 whitespace-nowrap flex items-center gap-2">
                                    {item.name}
                                    {item.view === 'cart' && cartCount > 0 && (
                                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {cartCount}
                                        </span>
                                    )}
                                </span>
                            )}
                            {/* Tooltip for collapsed state */}
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
                        <button 
                            onClick={() => setActiveView('settings')}
                            className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                {userProfileImage ? (
                                    <img 
                                        src={userProfileImage} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>{userFullName ? userFullName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </div>
                            {userProfileImage && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                        </button>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{userFullName || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail ?? 'user@example.com'}</p>
                        </div>
                        <button 
                            onClick={logout} 
                            className="ml-2 p-2 rounded-full text-gray-500 hover:bg-orange-100 flex-shrink-0 relative group"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                                Logout
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <button 
                            onClick={() => setActiveView('settings')}
                            className="relative cursor-pointer hover:opacity-80 transition-opacity group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                {userProfileImage ? (
                                    <img 
                                        src={userProfileImage} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>{userFullName ? userFullName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </div>
                            {userProfileImage && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                            <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                                Settings
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                        </button>
                        <button 
                            onClick={logout} 
                            className="p-2 rounded-full text-gray-500 hover:bg-orange-100 relative group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                                Logout
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default Sidebar;
