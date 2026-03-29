import React, { createContext, useState, useContext, useEffect, useRef, ReactNode, Suspense, lazy } from 'react';
import { DashboardProvider } from './context/DashboardContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';
import CookieConsent from './components/CookieConsent';
import SkipNav from './components/SkipNav';

// -- Eagerly loaded (above the fold on landing page) --
import Header from './components/Header';
import Hero from './components/Hero';

// -- Lazy-loaded route components --
const FlickeringFooter = lazy(() => import('./components/ui/flickering-footer'));
const ProblemsSection = lazy(() => import('./components/ProblemsSection'));
const PlatformCardsSection = lazy(() => import('./components/sections/PlatformCardsSection'));
const LanguagesSkillsSection = lazy(() => import('./components/sections/LanguagesSkillsSection'));
const InstructorSection = lazy(() => import('./components/sections/InstructorSection'));
const FAQSection = lazy(() => import('./components/sections/FAQSection'));
const FinalCTASection = lazy(() => import('./components/sections/FinalCTASection'));
const HackathonCarouselSection = lazy(() => import('./components/sections/HackathonCarouselSection'));
const InterviewPrepHowItWorks = lazy(() => import('./components/sections/InterviewPrepHowItWorks'));
const TopSellers = lazy(() => import('./components/TopSellers'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const SellerDashboardPage = lazy(() => import('./components/SellerDashboardPage'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const NotFound = lazy(() => import('./components/NotFound'));
const FAQWithSpiral = lazy(() => import('./components/ui/faq-section'));
const BrowseProjects = lazy(() => import('./components/BrowseProjects'));
const FreelancerProfilePage = lazy(() => import('./components/FreelancerProfilePage'));
const DashboardLayoutWrapper = lazy(() => import('./components/DashboardLayoutWrapper'));
const BuildPortfolioPage = lazy(() => import('./components/BuildPortfolioPage'));
const MockAssessmentPage = lazy(() => import('./components/MockAssessmentPage'));
const CodingInterviewQuestionsPage = lazy(() => import('./components/CodingInterviewQuestionsPage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('./components/TermsAndConditionsPage'));
const ResumeBuilderPage = lazy(() => import('./components/resume-builder').then(m => ({ default: m.ResumeBuilderPage })));
const LiveMockInterviewPage = lazy(() => import('./components/LiveMockInterviewPage'));

type Theme = 'light' | 'dark';
type Page = 'home' | 'auth' | 'dashboard' | 'seller' | 'admin' | 'faq' | 'browseProjects' | 'freelancerProfile' | 'buildPortfolio' | 'buildResume' | 'mockAssessment' | 'mockLeaderboard' | 'mockAchievements' | 'mockDailyChallenge' | 'mockHistory' | 'codingQuestions' | 'liveMockInterview' | 'privacy' | 'terms' | 'notFound';
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

const PAGE_TITLES: Record<Page, string> = {
  home: 'Project Bazaar — Marketplace for Projects, Ideas & Freelance Collaborations',
  auth: 'Sign In — Project Bazaar',
  dashboard: 'Dashboard — Project Bazaar',
  seller: 'Seller Dashboard — Project Bazaar',
  admin: 'Admin — Project Bazaar',
  faq: 'FAQ — Project Bazaar',
  browseProjects: 'Browse Projects — Project Bazaar',
  freelancerProfile: 'Freelancer Profile — Project Bazaar',
  buildPortfolio: 'Build Portfolio — Project Bazaar',
  buildResume: 'Resume Builder — Project Bazaar',
  mockAssessment: 'Mock Assessments — Project Bazaar',
  mockLeaderboard: 'Leaderboard — Mock Assessments — Project Bazaar',
  mockAchievements: 'Achievements — Mock Assessments — Project Bazaar',
  mockDailyChallenge: 'Daily Challenge — Mock Assessments — Project Bazaar',
  mockHistory: 'Test History — Mock Assessments — Project Bazaar',
  codingQuestions: 'Coding Interview Questions — Project Bazaar',
  liveMockInterview: 'Live AI Mock Interview — Project Bazaar',
  privacy: 'Privacy Policy — Project Bazaar',
  terms: 'Terms & Conditions — Project Bazaar',
  notFound: 'Page Not Found — Project Bazaar',
};

const PAGE_META_DESCRIPTIONS: Record<string, string> = {
  home: 'Discover, buy, and sell projects on Project Bazaar. Connect with freelancers, access mock assessments, coding challenges, career guidance, and build production-ready portfolios.',
  faq: 'Frequently asked questions about Project Bazaar — your marketplace for projects, freelancing, and career development.',
  browseProjects: 'Browse and discover projects for sale on Project Bazaar. Find the perfect project to buy or get inspired for your next build.',
  mockAssessment: 'Practice with mock assessments and coding challenges on Project Bazaar. Prepare for technical interviews and track your progress.',
  codingQuestions: 'Sharpen your coding skills with interview-style questions. Practice data structures, algorithms, and problem solving on Project Bazaar.',
  liveMockInterview: 'Walk through a demo live AI mock interview: onboarding, timed session, and sample scored feedback — all with mock data on Project Bazaar.',
  privacy: 'Learn how Project Bazaar collects, uses, and protects your personal data. Read our full privacy policy.',
  terms: 'Read the terms and conditions for using Project Bazaar, including marketplace rules, intellectual property, and payment terms.',
};

function updatePageMeta(page: Page) {
  document.title = PAGE_TITLES[page] || PAGE_TITLES.home;

  const descEl = document.querySelector('meta[name="description"]');
  const desc = PAGE_META_DESCRIPTIONS[page];
  if (descEl && desc) {
    descEl.setAttribute('content', desc);
  }

  const ogTitleEl = document.querySelector('meta[property="og:title"]');
  if (ogTitleEl) ogTitleEl.setAttribute('content', PAGE_TITLES[page] || PAGE_TITLES.home);

  const ogDescEl = document.querySelector('meta[property="og:description"]');
  if (ogDescEl && desc) ogDescEl.setAttribute('content', desc);

  const twitterTitleEl = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitleEl) twitterTitleEl.setAttribute('content', PAGE_TITLES[page] || PAGE_TITLES.home);

  const twitterDescEl = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescEl && desc) twitterDescEl.setAttribute('content', desc);

  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) {
    const base = 'https://projectbazaar.in';
    const pageToPath: Record<string, string> = {
      home: '/', auth: '/auth', faq: '/faq', browseProjects: '/browse-projects',
      mockAssessment: '/mock-assessment', codingQuestions: '/coding-questions',
      liveMockInterview: '/live-mock-interview', privacy: '/privacy', terms: '/terms',
    };
    const path = pageToPath[page] || '/';
    canonicalEl.setAttribute('href', `${base}${path}`);
  }
}

const AppContent: React.FC = () => {
  const { page } = useNavigation();
  const { isLoggedIn, userRole } = useAuth();
  const mainRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    updatePageMeta(page);

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Move focus to main content region on route change for screen readers
    requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true });
    });
  }, [page]);

  const renderPage = () => {
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
      case 'liveMockInterview':
        return <LiveMockInterviewPage />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsAndConditionsPage />;
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
              <LanguagesSkillsSection />
              <HackathonCarouselSection />
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

  return (
    <ErrorBoundary>
      <SkipNav />
      <div
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="outline-none"
        role="main"
        aria-live="polite"
      >
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
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
        '/live-mock-interview': 'liveMockInterview',
        '/privacy': 'privacy',
        '/privacy-policy': 'privacy',
        '/terms': 'terms',
        '/terms-and-conditions': 'terms',
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
        'liveMockInterview': 'liveMockInterview',
        'privacy': 'privacy',
        'terms': 'terms',
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
          const role: UserRole = userData.role === 'admin' ? 'admin' : 'user';
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
      'liveMockInterview': '/live-mock-interview',
      'privacy': '/privacy',
      'terms': '/terms',
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
      // Ensure buyer dashboard is shown after login (handled in dashboard via justLoggedIn)
      sessionStorage.setItem('justLoggedIn', 'true');
      navigateTo('dashboard');
    }
  };

  const logout = () => {
    setUserId(null);
    setUserEmail(null);
    setUserRole(null);
    setIsLoggedIn(false);

    // Clear auth and session data
    localStorage.removeItem('userData');
    localStorage.removeItem('authSession');
    localStorage.removeItem('currentPage');
    sessionStorage.clear();

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
                  <CookieConsent />
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
