import React, { useState, createContext, useContext, ReactNode } from 'react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import { useTheme } from '../App';

export type DashboardView = 'dashboard' | 'purchases' | 'wishlist' | 'analytics' | 'settings' | 'my-projects' | 'earnings' | 'payouts';

interface WishlistContextType {
    wishlist: string[];
    toggleWishlist: (projectId: string) => void;
    isInWishlist: (projectId: string) => boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [wishlist, setWishlist] = useState<string[]>(['proj-1', 'proj-3']);

    const toggleWishlist = (projectId: string) => {
        setWishlist(prev => 
            prev.includes(projectId) 
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const isInWishlist = (projectId: string) => wishlist.includes(projectId);

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    )
}


const DashboardPage: React.FC = () => {
    const { theme } = useTheme();
    const [dashboardMode, setDashboardMode] = useState<'buyer' | 'seller'>('buyer');
    const [activeView, setActiveView] = useState<DashboardView>('dashboard');

    const handleSetDashboardMode = (mode: 'buyer' | 'seller') => {
        setDashboardMode(mode);
        setActiveView('dashboard');
    };

    return (
        <WishlistProvider>
            <div className={`flex h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-200 font-sans transition-colors duration-300`}>
                <Sidebar 
                    dashboardMode={dashboardMode} 
                    activeView={activeView}
                    setActiveView={setActiveView}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <DashboardContent 
                        dashboardMode={dashboardMode} 
                        setDashboardMode={handleSetDashboardMode}
                        activeView={activeView}
                    />
                </div>
            </div>
        </WishlistProvider>
    );
};

export default DashboardPage;