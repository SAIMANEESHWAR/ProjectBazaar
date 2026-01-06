import React, { useState, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import { useAuth } from '../App';
import { fetchUserData, likeProject, unlikeProject, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, CartItem } from '../services/buyerApi';

export type DashboardView = 'dashboard' | 'purchases' | 'wishlist' | 'cart' | 'analytics' | 'settings' | 'my-projects' | 'earnings' | 'payouts' | 'project-details' | 'seller-profile' | 'help-center' | 'courses' | 'course-details';

interface WishlistContextType {
    wishlist: string[];
    toggleWishlist: (projectId: string) => void;
    isInWishlist: (projectId: string) => boolean;
    refreshWishlist: () => Promise<void>;
    isLoading: boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

interface CartContextType {
    cart: string[];
    addToCart: (projectId: string) => void;
    removeFromCart: (projectId: string) => void;
    isInCart: (projectId: string) => boolean;
    cartCount: number;
    refreshCart: () => Promise<void>;
    isLoading: boolean;
}

// Default cart context value
const defaultCartContext: CartContextType = {
    cart: [],
    addToCart: () => {},
    removeFromCart: () => {},
    isInCart: () => false,
    cartCount: 0,
    refreshCart: async () => {},
    isLoading: false,
};

export const CartContext = createContext<CartContextType>(defaultCartContext);

export const useCart = (): CartContextType => {
    return useContext(CartContext);
};


export const WishlistProvider: React.FC<{ children: ReactNode; userId: string | null }> = ({ children, userId }) => {
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Function to load wishlist from API
    const loadWishlist = useCallback(async () => {
        if (!userId) {
            setWishlist([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const userData = await fetchUserData(userId);
        if (userData && userData.wishlist) {
            setWishlist(userData.wishlist);
        } else {
            setWishlist([]);
        }
        setIsLoading(false);
    }, [userId]);

    // Fetch wishlist from API on mount and when userId changes
    useEffect(() => {
        loadWishlist();
    }, [loadWishlist]);

    const refreshWishlist = useCallback(async () => {
        await loadWishlist();
    }, [loadWishlist]);

    const toggleWishlist = async (projectId: string) => {
        if (!userId) return;

        const isLiked = wishlist.includes(projectId);
        
        // Optimistic update
        setWishlist(prev => 
            isLiked
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );

        // Sync with API
        try {
            if (isLiked) {
                await unlikeProject(userId, projectId);
            } else {
                await likeProject(userId, projectId);
            }
        } catch (error) {
            // Revert on error
            setWishlist(prev => 
                isLiked
                    ? [...prev, projectId]
                    : prev.filter(id => id !== projectId)
            );
            console.error('Error toggling wishlist:', error);
        }
    };

    const isInWishlist = (projectId: string) => wishlist.includes(projectId);

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, refreshWishlist, isLoading }}>
            {children}
        </WishlistContext.Provider>
    )
}

export const CartProvider: React.FC<{ children: ReactNode; userId: string | null }> = ({ children, userId }) => {
    const [cart, setCart] = useState<string[]>([]);
    const [, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Function to load cart from API
    const loadCart = useCallback(async () => {
        if (!userId) {
            setCart([]);
            setCartItems([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const userData = await fetchUserData(userId);
        if (userData && userData.cart) {
            setCartItems(userData.cart);
            setCart(userData.cart.map(item => item.projectId));
        } else {
            setCart([]);
            setCartItems([]);
        }
        setIsLoading(false);
    }, [userId]);

    // Fetch cart from API on mount and when userId changes
    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const refreshCart = useCallback(async () => {
        await loadCart();
    }, [loadCart]);

    const addToCart = async (projectId: string) => {
        if (!userId) return;

        // Check if already in cart
        if (cart.includes(projectId)) {
            return;
        }

        // Optimistic update
        setCart(prev => [...prev, projectId]);
        setCartItems(prev => [...prev, { projectId, addedAt: new Date().toISOString() }]);

        // Sync with API
        try {
            const result = await apiAddToCart(userId, projectId);
            if (!result.success) {
                // Revert on error
                setCart(prev => prev.filter(id => id !== projectId));
                setCartItems(prev => prev.filter(item => item.projectId !== projectId));
            }
        } catch (error) {
            // Revert on error
            setCart(prev => prev.filter(id => id !== projectId));
            setCartItems(prev => prev.filter(item => item.projectId !== projectId));
            console.error('Error adding to cart:', error);
        }
    };

    const removeFromCart = async (projectId: string) => {
        if (!userId) return;

        // Optimistic update
        setCart(prev => prev.filter(id => id !== projectId));
        setCartItems(prev => prev.filter(item => item.projectId !== projectId));

        // Sync with API
        try {
            const result = await apiRemoveFromCart(userId, projectId);
            if (!result.success) {
                // Revert on error - reload from API
                const userData = await fetchUserData(userId);
                if (userData && userData.cart) {
                    setCartItems(userData.cart);
                    setCart(userData.cart.map(item => item.projectId));
                }
            }
        } catch (error) {
            // Revert on error - reload from API
            const userData = await fetchUserData(userId);
            if (userData && userData.cart) {
                setCartItems(userData.cart);
                setCart(userData.cart.map(item => item.projectId));
            }
            console.error('Error removing from cart:', error);
        }
    };

    const isInCart = (projectId: string) => cart.includes(projectId);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, isInCart, cartCount: cart.length, refreshCart, isLoading }}>
            {children}
        </CartContext.Provider>
    );
};

const DashboardPage: React.FC = () => {
    const { userId } = useAuth();
    // Dashboard page defaults to buyer mode
    const [dashboardMode, setDashboardMode] = useState<'buyer' | 'seller'>('buyer');
    const [activeView, setActiveView] = useState<DashboardView>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    // Close sidebar on mobile when clicking a nav item
    const handleNavClick = (view: DashboardView) => {
        setActiveView(view);
        // Close sidebar on mobile after navigation
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    const handleSetDashboardMode = (mode: 'buyer' | 'seller') => {
        setDashboardMode(mode);
        setActiveView('dashboard');
    };

    return (
        <WishlistProvider userId={userId}>
            <CartProvider userId={userId}>
                <div className={`flex h-screen bg-white text-gray-900 font-sans transition-colors duration-300 relative`}>
                {/* Overlay for mobile */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
                
                <Sidebar 
                    dashboardMode={dashboardMode} 
                    activeView={activeView}
                    setActiveView={handleNavClick}
                    isOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onClose={() => setIsSidebarOpen(false)}
                    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onCollapseToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <DashboardContent 
                        dashboardMode={dashboardMode} 
                        setDashboardMode={handleSetDashboardMode}
                        activeView={activeView}
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        setActiveView={setActiveView}
                    />
                </div>
            </div>
            </CartProvider>
        </WishlistProvider>
    );
};

export default DashboardPage;