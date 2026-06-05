import React, { useState, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import { useAuth } from '../App';
import { usePremium } from '../context/PremiumContext';
import PremiumUpsellModal from './PremiumUpsellModal';
import { MessagesUnreadProvider } from '../context/MessagesUnreadContext';
import { JobHuntShellProvider } from '../context/JobHuntShellContext';
import { cachedFetchUserData, cachedFetchUserProfile, likeProject, unlikeProject, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, CartItem, invalidateUserCache } from '../services/buyerApi';
import { useSocket } from '../context/SocketContext';
import {
    CODEXCAREER_BRAND_NAME,
    CODEXCAREER_LOGO_SRC,
} from '../lib/brandAssets';

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
        const userData = await cachedFetchUserData(userId);
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
            if (userId) invalidateUserCache(userId);
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
            const userData = await cachedFetchUserData(userId);
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
            if (result.success) {
                invalidateUserCache(userId);
            } else {
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
            if (result.success) {
                invalidateUserCache(userId);
            } else {
                console.error('Failed to remove from cart:', result.error || 'Unknown error');
                await loadCart();
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

type ToastVariant = 'welcome' | 'notification';

interface ToastProps {
    variant?: ToastVariant;
    message: string;
    userName?: string;
    isVisible: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
    variant = 'notification',
    message,
    userName,
    isVisible,
    onClose,
}) => {
    useEffect(() => {
        if (!isVisible) return;
        const timer = setTimeout(onClose, variant === 'welcome' ? 5000 : 4000);
        return () => clearTimeout(timer);
    }, [isVisible, onClose, variant]);

    if (!isVisible) return null;

    const isWelcome = variant === 'welcome';

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-4 sm:right-6 z-[60] animate-dashboard-toast-in"
        >
            <div
                className={`relative overflow-hidden rounded-2xl border bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(15,23,42,0.12)] ${
                    isWelcome ? 'border-orange-100 min-w-[320px] max-w-[380px]' : 'border-gray-200 min-w-[280px] max-w-md'
                }`}
            >
                <div
                    className={`absolute left-0 top-0 h-full w-1 ${
                        isWelcome ? 'bg-gradient-to-b from-[#ff7a1a] to-[#FF6B00]' : 'bg-gradient-to-b from-sky-400 to-blue-500'
                    }`}
                    aria-hidden
                />

                <div className="flex items-start gap-3 px-4 py-4 pl-5">
                    {isWelcome ? (
                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50/80 p-1.5">
                            <img
                                src={CODEXCAREER_LOGO_SRC}
                                alt=""
                                className="h-full w-full object-contain"
                                aria-hidden
                            />
                        </div>
                    ) : (
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                    )}

                    <div className="min-w-0 flex-1 pr-1">
                        {isWelcome ? (
                            <>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF6B00]">
                                    Welcome back
                                </p>
                                <p className="mt-1 truncate text-base font-semibold text-gray-900">
                                    {userName || message.replace(/^Welcome,\s*/i, '').replace(/!$/, '')}
                                </p>
                                <p className="mt-1 text-sm leading-snug text-gray-500">
                                    Your {CODEXCAREER_BRAND_NAME} dashboard is ready — pick up where you left off.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm font-medium leading-snug text-gray-800">{message}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Dismiss notification"
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const PREMIUM_UPSELL_SESSION_KEY = 'premiumUpsellShown';
const PREMIUM_UPSELL_DELAY_MS = 30_000;

const DashboardPage: React.FC = () => {
    const { userId, userEmail } = useAuth();
    const { isPremium } = usePremium();
    const { subscribe } = useSocket();
    // Local UI state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showWelcomeToast, setShowWelcomeToast] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const [jobToastMessage, setJobToastMessage] = useState('');
    const [showJobToast, setShowJobToast] = useState(false);
    const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);

    useEffect(() => {
        const unsub = subscribe('new_job', (data: { title?: string; company?: string; message?: string }) => {
            const msg = data.message || `New Job: ${data.title || 'Job'} at ${data.company || 'a company'}`;
            setJobToastMessage(msg);
            setShowJobToast(true);
        });
        return unsub;
    }, [subscribe]);



    // Fetch user name and show welcome toast on mount
    useEffect(() => {
        const showWelcomeMessage = async () => {
            // Check if we've already shown the welcome message in this session
            const hasShownWelcome = sessionStorage.getItem('welcomeShown');
            if (hasShownWelcome || !userId) {
                return;
            }

            try {
                const user = await cachedFetchUserProfile(userId);

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

    useEffect(() => {
        if (!userId || isPremium) {
            setShowPremiumUpsell(false);
            return;
        }
        if (sessionStorage.getItem(PREMIUM_UPSELL_SESSION_KEY) === 'true') {
            return;
        }

        const timer = window.setTimeout(() => {
            setShowPremiumUpsell(true);
            sessionStorage.setItem(PREMIUM_UPSELL_SESSION_KEY, 'true');
        }, PREMIUM_UPSELL_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [userId, isPremium]);

    return (
        <WishlistProvider userId={userId}>
            <CartProvider userId={userId}>
                <MessagesUnreadProvider userId={userId}>
                <JobHuntShellProvider>
                <div className={`flex h-screen bg-white text-gray-900 font-sans transition-colors duration-300 relative`}>
                    <Toast
                        variant="welcome"
                        message={`Welcome, ${userName}!`}
                        userName={userName}
                        isVisible={showWelcomeToast}
                        onClose={() => setShowWelcomeToast(false)}
                    />
                    <Toast
                        variant="notification"
                        message={jobToastMessage}
                        isVisible={showJobToast}
                        onClose={() => setShowJobToast(false)}
                    />
                    <PremiumUpsellModal
                        isOpen={showPremiumUpsell}
                        onClose={() => setShowPremiumUpsell(false)}
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
                </JobHuntShellProvider>
                </MessagesUnreadProvider>
            </CartProvider>
        </WishlistProvider>
    );
};

export default DashboardPage;