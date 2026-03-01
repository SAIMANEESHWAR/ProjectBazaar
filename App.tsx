import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { DashboardProvider } from './context/DashboardContext';
import Header from './components/Header';
import Hero from './components/Hero';
import FlickeringFooter from './components/ui/flickering-footer';
import ProblemsSection from './components/ProblemsSection';
import PlatformCardsSection from './components/sections/PlatformCardsSection';
import UniSystemSection from './components/sections/UniSystemSection';
import CurriculumSection from './components/sections/CurriculumSection';
import LanguagesSkillsSection from './components/sections/LanguagesSkillsSection';
import ResultsGridSection from './components/sections/ResultsGridSection';
import TestimonialsSection from './components/sections/TestimonialsSection';
import InstructorSection from './components/sections/InstructorSection';
import FAQSection from './components/sections/FAQSection';
import FinalCTASection from './components/sections/FinalCTASection';
import HackathonCarouselSection from './components/sections/HackathonCarouselSection';
import InterviewPrepHowItWorks from './components/sections/InterviewPrepHowItWorks';
import AuthPage from './components/AuthPage';
import TopSellers from './components/TopSellers';
import DashboardPage from './components/DashboardPage';
import SellerDashboardPage from './components/SellerDashboardPage';
import AdminDashboard from './components/admin/AdminDashboard';
import NotFound from './components/NotFound';
import FAQWithSpiral from './components/ui/faq-section';
import BrowseProjects from './components/BrowseProjects';
import FreelancerProfilePage from './components/FreelancerProfilePage';
import DashboardLayoutWrapper from './components/DashboardLayoutWrapper';
import BuildPortfolioPage from './components/BuildPortfolioPage';
import { ResumeBuilderPage } from './components/resume-builder';
import MockAssessmentPage from './components/MockAssessmentPage';
import CodingInterviewQuestionsPage from './components/CodingInterviewQuestionsPage';
import { SocketProvider } from './context/SocketContext';

type Theme = 'light' | 'dark';
type Page = 'home' | 'auth' | 'dashboard' | 'seller' | 'admin' | 'faq' | 'browseProjects' | 'freelancerProfile' | 'buildPortfolio' | 'buildResume' | 'mockAssessment' | 'mockLeaderboard' | 'mockAchievements' | 'mockDailyChallenge' | 'mockHistory' | 'codingQuestions' | 'notFound';
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
  isLanding: boolean;
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

const LANDING_THEME_KEY = 'landingTheme';

/** Pages that use the landing page theme (dark/light). All other pages (dashboard, auth, etc.) always use light. */
const LANDING_PAGES: Page[] = ['home', 'faq'];

const ThemeProvider: React.FC<{ children: ReactNode; page: Page }> = ({ children, page }) => {
  const isLanding = LANDING_PAGES.includes(page);
  const [landingTheme, setLandingTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem(LANDING_THEME_KEY) as Theme) || 'dark';
  });

  // Apply theme only on landing pages; force light on dashboard/auth/admin etc.
  useEffect(() => {
    if (isLanding) {
      if (landingTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isLanding, landingTheme]);

  const toggleTheme = () => {
    setLandingTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(LANDING_THEME_KEY, next);
      return next;
    });
  };

  // Expose effective theme: on landing use landingTheme, elsewhere always 'light'
  const theme = isLanding ? landingTheme : 'light';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLanding }}>
      {children}
    </ThemeContext.Provider>
  );
};

const AppContent: React.FC = () => {
  const { page } = useNavigation();
  const { isLoggedIn, userRole } = useAuth();

  // Scroll to top when navigating to a new page (sidebar / route change)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  switch (page) {
    case 'auth':
      return <AuthPage />;
    case 'admin':
      return isLoggedIn && userRole === 'admin' ? <AdminDashboard /> : <AuthPage />;
    case 'dashboard':
      return isLoggedIn ? <DashboardPage /> : <AuthPage />;
    case 'seller':
      return isLoggedIn ? <SellerDashboardPage /> : <AuthPage />;
    case 'faq':
      return (
        <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-300">
          <Header />
          <FAQWithSpiral />
        </div>
      );
    case 'browseProjects':
      return <BrowseProjects />;
    case 'freelancerProfile':
      return (
        <DashboardLayoutWrapper>
          <FreelancerProfilePage />
        </DashboardLayoutWrapper>
      );
    case 'buildPortfolio':
      return <BuildPortfolioPage />;
    case 'buildResume':
      return <ResumeBuilderPage />;
    case 'mockAssessment':
      return <MockAssessmentPage initialView="list" />;
    case 'mockLeaderboard':
      return <MockAssessmentPage initialView="leaderboard" />;
    case 'mockAchievements':
      return <MockAssessmentPage initialView="achievements" />;
    case 'mockDailyChallenge':
      return <MockAssessmentPage initialView="daily-challenge" />;
    case 'mockHistory':
      return <MockAssessmentPage initialView="history" />;
    case 'codingQuestions':
      return <CodingInterviewQuestionsPage />;
    case 'notFound':
      return <NotFound />;
    case 'home':
    default:
      return (
        <div className="min-h-screen overflow-x-hidden transition-colors duration-300 font-sans bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
          <Header />
          <main className="min-h-screen bg-white dark:bg-[#0a0a0a] font-sans">
            <Hero />
            <InterviewPrepHowItWorks />
            <ProblemsSection />
            <PlatformCardsSection />
            <UniSystemSection />
            <CurriculumSection />
            <LanguagesSkillsSection />
            <HackathonCarouselSection />
            <ResultsGridSection />
            <TestimonialsSection />
            <TopSellers />
            <InstructorSection />
            <FAQSection />
            <FinalCTASection />
          </main>
          <FlickeringFooter />
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

  // Handle URL-based routing and 404 detection
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash.replace('#', '');
      const searchParams = new URLSearchParams(window.location.search);
      const route = searchParams.get('page') || hash || path;

      // Define valid routes (exact matches only)
      const validRoutes: Record<string, Page> = {
        '/': 'home',
        '/home': 'home',
        '/auth': 'auth',
        '/login': 'auth',
        '/dashboard': 'dashboard',
        '/seller': 'seller',
        '/admin': 'admin',
        '/faq': 'faq',
        '/browse-projects': 'browseProjects',
        '/freelancer': 'freelancerProfile',
        '/build-portfolio': 'buildPortfolio',
        '/build-resume': 'buildResume',
        '/resume-builder': 'buildResume',
        '/mock-assessment': 'mockAssessment',
        '/mock-interview': 'mockAssessment',
        '/mock-assessment/leaderboard': 'mockLeaderboard',
        '/mock-assessment/achievements': 'mockAchievements',
        '/mock-assessment/daily-challenge': 'mockDailyChallenge',
        '/mock-assessment/history': 'mockHistory',
        '/coding-questions': 'codingQuestions',
        '/coding-interview-questions': 'codingQuestions',
        '/404': 'notFound',
        'home': 'home',
        'auth': 'auth',
        'login': 'auth',
        'dashboard': 'dashboard',
        'seller': 'seller',
        'admin': 'admin',
        'faq': 'faq',
        'browseProjects': 'browseProjects',
        'freelancerProfile': 'freelancerProfile',
        'buildPortfolio': 'buildPortfolio',
        'buildResume': 'buildResume',
        'mockAssessment': 'mockAssessment',
        'mockLeaderboard': 'mockLeaderboard',
        'mockAchievements': 'mockAchievements',
        'mockDailyChallenge': 'mockDailyChallenge',
        'mockHistory': 'mockHistory',
        'codingQuestions': 'codingQuestions',
        'notFound': 'notFound',
      };

      // Extract base path (remove query params, hash, and trailing slashes)
      const normalizedPath = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
      const normalizedRoute = route.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

      // Check if it's a static asset (should be handled by server, but check anyway)
      const isStaticAsset = normalizedPath.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|map)$/i) ||
        normalizedPath.startsWith('/static') ||
        normalizedPath.startsWith('/assets') ||
        normalizedPath.startsWith('/_next') ||
        normalizedPath.startsWith('/api');

      // Don't interfere with static assets
      if (isStaticAsset) {
        return;
      }

      // Check if route is valid (exact match)
      const targetPage = validRoutes[normalizedRoute] || validRoutes[normalizedPath];

      if (targetPage) {
        // Special handling for 404 page - always show it regardless of auth
        if (targetPage === 'notFound') {
          setPage('notFound');
          localStorage.setItem('currentPage', 'notFound');
          return;
        }

        // Check auth requirements for protected routes
        const storedAuth = localStorage.getItem('authSession');

        if ((targetPage === 'admin' || targetPage === 'dashboard' || targetPage === 'seller') && storedAuth !== 'true') {
          setPage('auth');
          localStorage.setItem('currentPage', 'auth');
          return;
        }

        setPage(targetPage);
        localStorage.setItem('currentPage', targetPage);
      } else {
        // Invalid route - show 404 for any invalid path
        setPage('notFound');
        localStorage.setItem('currentPage', 'notFound');
        // Update URL to /404 for invalid routes
        if (normalizedPath !== '/404') {
          window.history.replaceState({ page: 'notFound' }, '', '/404');
        }
      }
    };

    // Initial route check
    handleRoute();

    // Listen for URL changes
    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);

    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, []);

  // Restore auth state from localStorage on mount (only once)
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

          // Only auto-navigate if we're on home page or auth page
          // Don't override 404 pages - they should stay as 404
          if (page === 'home' || page === 'auth') {
            if (role === 'admin') {
              setPage('admin');
            } else {
              setPage('dashboard');
            }
          }
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
        // Clear invalid data
        localStorage.removeItem('userData');
        localStorage.removeItem('authSession');
      }
    }
  }, []); // Run only once on mount, not on every page change

  const navigateTo = (targetPage: Page) => {
    setPage(targetPage);
    localStorage.setItem('currentPage', targetPage);

    // Update URL without full page reload
    const pageMap: Record<Page, string> = {
      'home': '/',
      'auth': '/auth',
      'dashboard': '/dashboard',
      'seller': '/seller',
      'admin': '/admin',
      'faq': '/faq',
      'browseProjects': '/browse-projects',
      'freelancerProfile': '/freelancer',
      'buildPortfolio': '/build-portfolio',
      'buildResume': '/build-resume',
      'mockAssessment': '/mock-assessment',
      'mockLeaderboard': '/mock-assessment/leaderboard',
      'mockAchievements': '/mock-assessment/achievements',
      'mockDailyChallenge': '/mock-assessment/daily-challenge',
      'mockHistory': '/mock-assessment/history',
      'codingQuestions': '/coding-questions',
      'notFound': '/404'
    };

    const url = pageMap[targetPage] || '/';
    // Use replaceState for 404 to avoid cluttering history, pushState for others
    if (targetPage === 'notFound') {
      window.history.replaceState({ page: 'notFound' }, '', url);
    } else {
      window.history.pushState({ page: targetPage }, '', url);
    }
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
    <>
      <ThemeProvider page={page}>
        <PremiumProvider>
          <DashboardProvider>
            <AuthContext.Provider value={{ isLoggedIn, userId, userEmail, userRole, login, logout }}>
              <SocketProvider>
                <NavigationContext.Provider value={{ page, navigateTo }}>
                  <AppContent />
                </NavigationContext.Provider>
              </SocketProvider>
            </AuthContext.Provider>
          </DashboardProvider>
        </PremiumProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
