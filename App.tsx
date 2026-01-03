import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedProjects from './components/FeaturedProjects';
import Faqs from './components/Faqs';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import Stats from './components/Stats';
import Referral from './components/Referral';
import Pricing from './components/Pricing';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import AdminDashboard from './components/admin/AdminDashboard';
import Categories from './components/Categories';
import TopSellers from './components/TopSellers';
import Testimonials from './components/Testimonials';
import SellerSuccessStories from './components/SellerSuccessStories';
import WhatCanYouSell from './components/WhatCanYouSell';
import SellerCta from './components/SellerCta';
import BuyerSellerToggle from './components/BuyerSellerToggle';
import { CallToAction } from './components/ui/cta-3';

type Theme = 'light' | 'dark';
type Page = 'home' | 'auth' | 'dashboard' | 'admin';
type UserRole = 'user' | 'admin';

interface PremiumContextType {
    isPremium: boolean;
    credits: number;
    setCredits: (credits: number) => void;
    setIsPremium: (isPremium: boolean) => void;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

interface NavigationContextType {
  page: Page;
  navigateTo: (page: Page) => void;
}

interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  userRole: UserRole | null;
  login: (userId: string, email: string, role?: UserRole) => void;
  logout: () => void;
}

export const PremiumContext = createContext<PremiumContextType | undefined>(undefined);
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const usePremium = (): PremiumContextType => {
    const context = useContext(PremiumContext);
    if (!context) {
        throw new Error('usePremium must be used within a PremiumProvider');
    }
    return context;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const PremiumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isPremium, setIsPremiumState] = useState<boolean>(() => {
        const stored = localStorage.getItem('isPremium');
        return stored === 'true';
    });
    
    const [credits, setCreditsState] = useState<number>(() => {
        const stored = localStorage.getItem('premiumCredits');
        return stored ? parseInt(stored, 10) : 0;
    });

    const setIsPremium = (premium: boolean) => {
        setIsPremiumState(premium);
        localStorage.setItem('isPremium', premium.toString());
        if (premium && credits === 0) {
            setCreditsState(100);
            localStorage.setItem('premiumCredits', '100');
        }
    };

    const setCredits = (newCredits: number) => {
        setCreditsState(newCredits);
        localStorage.setItem('premiumCredits', newCredits.toString());
    };

    return (
        <PremiumContext.Provider value={{ isPremium, credits, setCredits, setIsPremium }}>
            {children}
        </PremiumContext.Provider>
    );
};

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const AppContent: React.FC = () => {
  const { page } = useNavigation();
  const { isLoggedIn, userRole } = useAuth();

  switch (page) {
    case 'auth':
      return <AuthPage />;
    case 'admin':
      return isLoggedIn && userRole === 'admin' ? <AdminDashboard /> : <AuthPage />;
    case 'dashboard':
      return isLoggedIn ? <DashboardPage /> : <AuthPage />;
    case 'home':
    default:
      return (
        <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-300">
          <Header />
          <main>
            <Hero />
            <Stats />
            <Categories />
            <BuyerSellerToggle />
            <TopSellers />
            <FeaturedProjects />
            <WhatCanYouSell />
            <SellerSuccessStories />
            <Testimonials />
            <SellerCta />
            <Referral />
            <Pricing />
            <Faqs />
            <div className="py-12 px-4">
              <CallToAction />
            </div>
            <CtaSection />
          </main>
          <Footer />
        </div>
      );
  }
};

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const [page, setPage] = useState<Page>(() => {
    const stored = localStorage.getItem('currentPage');
    return (stored as Page) || 'home';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    const storedAuth = localStorage.getItem('authSession');
    
    if (storedAuth === 'true' && storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        if (userData.userId && userData.email) {
          const role = userData.email === 'saimanee@gmail.com' ? 'admin' : (userData.role || 'user');
          setUserId(userData.userId);
          setUserEmail(userData.email);
          setUserRole(role);
          setIsLoggedIn(true);
          
          // Navigate to appropriate page based on role
          if (role === 'admin') {
            setPage('admin');
          } else {
            setPage('dashboard');
          }
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
        // Clear invalid data
        localStorage.removeItem('userData');
        localStorage.removeItem('authSession');
      }
    }
  }, []);

  const navigateTo = (targetPage: Page) => {
    setPage(targetPage);
    localStorage.setItem('currentPage', targetPage);
    window.scrollTo(0, 0);
  };
  
  const login = (id: string, email: string, role: UserRole = 'user') => {
    setUserId(id);
    setUserEmail(email);
    setUserRole(role);
    setIsLoggedIn(true);
    
    // Store auth session in localStorage
    localStorage.setItem('authSession', 'true');
    
    if (role === 'admin') {
      navigateTo('admin');
    } else {
      navigateTo('dashboard');
    }
  };

  const logout = () => {
    setUserId(null);
    setUserEmail(null);
    setUserRole(null);
    setIsLoggedIn(false);
    
    // Clear auth data from localStorage
    localStorage.removeItem('userData');
    localStorage.removeItem('authSession');
    localStorage.removeItem('currentPage');
    
    navigateTo('home');
  };

  return (
    <ThemeProvider>
      <PremiumProvider>
        <AuthContext.Provider value={{ isLoggedIn, userId, userEmail, userRole, login, logout }}>
          <NavigationContext.Provider value={{ page, navigateTo }}>
            <AppContent />
          </NavigationContext.Provider>
        </AuthContext.Provider>
      </PremiumProvider>
    </ThemeProvider>
  );
};

export default App;
