import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import { useAuth } from '../App';
import { useDashboard } from '../context/DashboardContext';
import { WishlistProvider, CartProvider } from './DashboardPage';
import { MessagesUnreadProvider } from '../context/MessagesUnreadContext';

const SellerDashboardPage: React.FC = () => {
    const { userId } = useAuth();
    const { setDashboardMode } = useDashboard();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    // Keep global Buyer/Seller mode in sync: this page is seller mode.
    // Run only on mount so we don't reset activeView when context re-renders (which would prevent sidebar navigation from working).
    useEffect(() => {
        setDashboardMode('seller');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <WishlistProvider userId={userId}>
            <CartProvider userId={userId}>
                <MessagesUnreadProvider userId={userId}>
                <div className={`flex h-screen bg-white text-gray-900 font-sans transition-colors duration-300 relative`}>
                {/* Overlay for mobile */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
                
                <Sidebar 
                    isOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onClose={() => setIsSidebarOpen(false)}
                    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onCollapseToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <DashboardContent 
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                </div>
            </div>
                </MessagesUnreadProvider>
            </CartProvider>
        </WishlistProvider>
    );
};

export default SellerDashboardPage;

