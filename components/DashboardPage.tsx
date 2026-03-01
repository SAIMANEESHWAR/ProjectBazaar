import React, { useState, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import { useAuth } from '../App';
import { MessagesUnreadProvider } from '../context/MessagesUnreadContext';
import { fetchUserData, likeProject, unlikeProject, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, CartItem } from '../services/buyerApi';

const GET_USER_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';

// Re-export DashboardView for compatibility
export type { DashboardView } from '../context/DashboardContext';

interface WishlistContextType {
    wishlist: string[];
    toggleWishlist: (projectId: string) => void;
    isInWishlist: (projectId: string) => boolean;
    refreshWishlist: () => Promise<void>;
    isLoading: boolean;
}
// ... (keep context definitions)

// Default wishlist context value (allows BuyerProjectCard to work outside DashboardPage)
const defaultWishlistContext: WishlistContextType = {
    wishlist: [],
    toggleWishlist: () => { },
    isInWishlist: () => false,
    refreshWishlist: async () => { },
    isLoading: false,
};

export const WishlistContext = createContext<WishlistContextType>(defaultWishlistContext);

export const useWishlist = (): WishlistContextType => {
    return useContext(WishlistContext);
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
    addToCart: () => { },
    removeFromCart: () => { },
    isInCart: () => false,
    cartCount: 0,
    refreshCart: async () => { },
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
        try {
            const userData = await fetchUserData(userId);
            if (userData && userData.cart) {
                // Handle both string[] and CartItem[] formats
                const cartData = Array.isArray(userData.cart) ? userData.cart : [];
                const cartIds = cartData.map(item => 
                    typeof item === 'string' ? item : item.projectId
                );
                const cartItemsData = cartData.map(item => 
                    typeof item === 'string' 
                        ? { projectId: item, addedAt: new Date().toISOString() }
                        : item
                );
                setCartItems(cartItemsData);
                setCart(cartIds);
            } else {
                setCart([]);
                setCartItems([]);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            setCart([]);
            setCartItems([]);
        } finally {
            setIsLoading(false);
        }
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
                console.error('Failed to add to cart:', result.error || 'Unknown error');
            }
        } catch (error) {
            // Revert on error
            setCart(prev => prev.filter(id => id !== projectId));
            setCartItems(prev => prev.filter(item => item.projectId !== projectId));
            console.error('Error adding to cart:', error);
            throw error; // Re-throw to allow caller to handle
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
                console.error('Failed to remove from cart:', result.error || 'Unknown error');
                await loadCart(); // Use loadCart to properly handle data format
            }
        } catch (error) {
            // Revert on error - reload from API
            console.error('Error removing from cart:', error);
            await loadCart(); // Use loadCart to properly handle data format
            throw error; // Re-throw to allow caller to handle
        }
    };

    const isInCart = (projectId: string) => cart.includes(projectId);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, isInCart, cartCount: cart.length, refreshCart, isLoading }}>
            {children}
        </CartContext.Provider>
    );
};

// Toast Component
interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000); // Auto-dismiss after 4 seconds

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div
            className="fixed top-4 right-4 z-50 transition-all duration-300 ease-out"
            style={{
                animation: 'slideInRight 0.3s ease-out',
            }}
        >
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md">
                <div className="flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const { userId, userEmail } = useAuth();
    // Local UI state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [showWelcomeToast, setShowWelcomeToast] = useState(false);
    const [userName, setUserName] = useState<string>('');



    // Fetch user name and show welcome toast on mount
    useEffect(() => {
        const showWelcomeMessage = async () => {
            // Check if we've already shown the welcome message in this session
            const hasShownWelcome = sessionStorage.getItem('welcomeShown');
            if (hasShownWelcome || !userId) {
                return;
            }

            try {
                // Fetch user details to get name
                const response = await fetch(GET_USER_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                });

                const data = await response.json();
                const user = data.data || data.user || data;

                if (user) {
                    const name = user.fullName || user.name || userEmail?.split('@')[0] || 'User';
                    setUserName(name);
                    setShowWelcomeToast(true);
                    // Mark as shown in this session
                    sessionStorage.setItem('welcomeShown', 'true');
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
                // Still show welcome with email if fetch fails
                const name = userEmail?.split('@')[0] || 'User';
                setUserName(name);
                setShowWelcomeToast(true);
                sessionStorage.setItem('welcomeShown', 'true');
            }
        };

        showWelcomeMessage();
    }, [userId, userEmail]);

    return (
        <WishlistProvider userId={userId}>
            <CartProvider userId={userId}>
                <MessagesUnreadProvider userId={userId}>
                <div className={`flex h-screen bg-white text-gray-900 font-sans transition-colors duration-300 relative`}>
                    {/* Welcome Toast */}
                    <Toast
                        message={`Welcome, ${userName}!`}
                        isVisible={showWelcomeToast}
                        onClose={() => setShowWelcomeToast(false)}
                    />
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

                    <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
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

export default DashboardPage;