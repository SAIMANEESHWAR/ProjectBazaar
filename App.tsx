import React, { createContext, useState, useContext, useEffect, useRef, ReactNode, Suspense, lazy } from 'react';
import {
  AuthContext,
  NavigationContext,
  useAuth,
  useNavigation,
  type Page,
  type UserRole,
} from './context/appContext';

export type { Page, UserRole } from './context/appContext';
export {
  AuthContext,
  NavigationContext,
  useAuth,
  useNavigation,
} from './context/appContext';
import { SITE_ORIGIN } from './lib/apiConfig';
import { trackPageView } from './lib/analytics';
import { DashboardProvider } from './context/DashboardContext';
import { PeerInterviewQueueProvider } from './context/PeerInterviewQueueContext';
import PeerInterviewBackendSync from './components/PeerInterviewBackendSync';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';
import CookieConsent from './components/CookieConsent';
import SkipNav from './components/SkipNav';
import { ShepherdTourWrapper } from './components/tours/ShepherdTourWrapper';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { clearSubscriptionCookie } from './lib/subscriptionCookie';
import SubscriptionFeatureGate from './components/subscription/SubscriptionFeatureGate';
import type { SubscriptionFeatureId } from './lib/subscriptionFeatures';
import { PremiumProvider, usePremium } from './context/PremiumContext';
export { usePremium, PremiumContext } from './context/PremiumContext';
import { hasPendingPlan, clearPendingPlan } from './lib/pendingPlanStorage';
import SubscriptionCheckoutPage from './components/SubscriptionCheckoutPage';

// -- Eagerly loaded (above the fold on landing page) --
import Header from './components/Header';
import Hero from './components/Hero';

// -- Lazy-loaded route components --
const FlickeringFooter = lazy(() => import('./components/ui/flickering-footer'));
const PlatformCardsSection = lazy(() => import('./components/sections/PlatformCardsSection'));
const LanguagesSkillsSection = lazy(() => import('./components/sections/LanguagesSkillsSection'));
const FAQSection = lazy(() => import('./components/sections/FAQSection'));
const HackathonCarouselSection = lazy(() => import('./components/sections/HackathonCarouselSection'));
const InterviewPrepHowItWorks = lazy(() => import('./components/sections/InterviewPrepHowItWorks'));
const JobPrepSection = lazy(() => import('./components/sections/JobPrepSection'));
const ResumeBuilderHero = lazy(() => import('./components/sections/ResumeBuilderHero'));
const ResumeHeroCard = lazy(() => import('./components/sections/ResumeHeroCard'));
const TopSellers = lazy(() => import('./components/TopSellers'));
const PricingPlansSection = lazy(() => import('./components/sections/PricingPlansSection'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const VerifyEmailPage = lazy(() => import('./components/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));
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
const BlogPage = lazy(() => import('./components/BlogPage'));
const BlogPostPage = lazy(() => import('./components/BlogPostPage'));
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isLanding: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/** Sync legacy isPremium with subscription cookie/API */
const PremiumSubscriptionSync: React.FC = () => {
  const { subscription } = useSubscription();
  const { setIsPremium } = usePremium();

  useEffect(() => {
    const active =
      subscription?.status === 'active' &&
      (!subscription.endDate || new Date(subscription.endDate).getTime() > Date.now());
    setIsPremium(Boolean(active));
  }, [subscription, setIsPremium]);

  return null;
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
  home: 'CodeXCareer — Marketplace for Projects, Ideas & Freelance Collaborations',
  auth: 'Sign In — CodeXCareer',
  dashboard: 'Dashboard — CodeXCareer',
  seller: 'Seller Dashboard — CodeXCareer',
  admin: 'Admin — CodeXCareer',
  faq: 'FAQ — CodeXCareer',
  browseProjects: 'Browse Projects — CodeXCareer',
  freelancerProfile: 'Freelancer Profile — CodeXCareer',
  buildPortfolio: 'Build Portfolio — CodeXCareer',
  buildResume: 'Resume Builder — CodeXCareer',
  mockAssessment: 'Mock Assessments — CodeXCareer',
  mockLeaderboard: 'Leaderboard — Mock Assessments — CodeXCareer',
  mockAchievements: 'Achievements — Mock Assessments — CodeXCareer',
  mockDailyChallenge: 'Daily Challenge — Mock Assessments — CodeXCareer',
  mockHistory: 'Test History — Mock Assessments — CodeXCareer',
  codingQuestions: 'Coding Interview Questions — CodeXCareer',
  liveMockInterview: 'Live AI Mock Interview — CodeXCareer',
  blog: 'Blog — Anayattics',
  blogPost: 'Blog Article — Anayattics',
  privacy: 'Privacy Policy — CodeXCareer',
  terms: 'Terms & Conditions — CodeXCareer',
  notFound: 'Page Not Found — CodeXCareer',
  subscriptionCheckout: 'Checkout — CodeXCareer',
  verifyEmail: 'Verify Email — CodeXCareer',
  forgotPassword: 'Forgot Password — CodeXCareer',
  resetPassword: 'Reset Password — CodeXCareer',
};

const PAGE_META_DESCRIPTIONS: Record<string, string> = {
  home: 'Discover, buy, and sell projects on CodeXCareer. Connect with freelancers, access mock assessments, coding challenges, career guidance, and build production-ready portfolios.',
  faq: 'Frequently asked questions about CodeXCareer — your marketplace for projects, freelancing, and career development.',
  browseProjects: 'Browse and discover projects for sale on CodeXCareer. Find the perfect project to buy or get inspired for your next build.',
  mockAssessment: 'Practice with mock assessments and coding challenges on CodeXCareer. Prepare for technical interviews and track your progress.',
  codingQuestions: 'Sharpen your coding skills with interview-style questions. Practice data structures, algorithms, and problem solving on CodeXCareer.',
  liveMockInterview: 'Walk through a demo live AI mock interview: onboarding, timed session, and sample scored feedback — all with mock data on CodeXCareer.',
  blog: 'Read analytics implementation guides, data strategy insights, and growth measurement best practices from the Anayattics team.',
  blogPost: 'Detailed analytics implementation guide and expert insights from the Anayattics editorial team.',
  privacy: 'Learn how CodeXCareer collects, uses, and protects your personal data. Read our full privacy policy.',
  terms: 'Read the terms and conditions for using CodeXCareer, including marketplace rules, intellectual property, and payment terms.',
};

const DEFAULT_META_DESCRIPTION =
  'CodeXCareer helps you discover projects, prepare for interviews, build portfolios, and grow with practical learning and marketplace tools.';

function updatePageMeta(page: Page) {
  const title = PAGE_TITLES[page] || PAGE_TITLES.home;
  const description = PAGE_META_DESCRIPTIONS[page] || DEFAULT_META_DESCRIPTION;
  const base = SITE_ORIGIN;
  const pageToPath: Record<Page, string> = {
    home: '/',
    auth: '/auth',
    dashboard: '/dashboard',
    seller: '/seller',
    admin: '/admin',
    faq: '/faq',
    browseProjects: '/browse-projects',
    freelancerProfile: '/freelancer',
    buildPortfolio: '/build-portfolio',
    buildResume: '/build-resume',
    mockAssessment: '/mock-assessment',
    mockLeaderboard: '/mock-assessment/leaderboard',
    mockAchievements: '/mock-assessment/achievements',
    mockDailyChallenge: '/mock-assessment/daily-challenge',
    mockHistory: '/mock-assessment/history',
    codingQuestions: '/coding-questions',
    liveMockInterview: '/live-mock-interview',
    blog: '/blog',
    blogPost: window.location.pathname.startsWith('/blog/') ? window.location.pathname : '/blog',
    privacy: '/privacy',
    terms: '/terms',
    notFound: '/404',
    subscriptionCheckout: '/subscription/checkout',
    verifyEmail: '/verify-email',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  };
  const path = pageToPath[page] || '/';
  const absoluteUrl = `${base}${path}`;

  document.title = title;

  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) {
    descEl.setAttribute('content', description);
  }

  const ogTitleEl = document.querySelector('meta[property="og:title"]');
  if (ogTitleEl) ogTitleEl.setAttribute('content', title);

  const ogDescEl = document.querySelector('meta[property="og:description"]');
  if (ogDescEl) ogDescEl.setAttribute('content', description);

  const ogUrlEl = document.querySelector('meta[property="og:url"]');
  if (ogUrlEl) ogUrlEl.setAttribute('content', absoluteUrl);

  const twitterTitleEl = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitleEl) twitterTitleEl.setAttribute('content', title);

  const twitterDescEl = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescEl) twitterDescEl.setAttribute('content', description);

  const twitterUrlEl = document.querySelector('meta[name="twitter:url"]');
  if (twitterUrlEl) twitterUrlEl.setAttribute('content', absoluteUrl);

  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) {
    canonicalEl.setAttribute('href', absoluteUrl);
  }
}

const SubscriptionFeatureGateWrapper: React.FC<{
  featureId: SubscriptionFeatureId;
  children: React.ReactNode;
}> = ({ featureId, children }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <SubscriptionFeatureGate featureId={featureId}>{children}</SubscriptionFeatureGate>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { page } = useNavigation();
  const { isLoggedIn, userRole } = useAuth();
  const mainRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const [blogSlug, setBlogSlug] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    updatePageMeta(page);
    trackPageView(window.location.pathname, document.title);
    if (page === 'blogPost') {
      const path = window.location.pathname.replace(/\/+$/, '');
      const match = path.match(/^\/blog\/([^/]+)$/);
      setBlogSlug(match ? decodeURIComponent(match[1]) : null);
    } else {
      setBlogSlug(null);
    }

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
      case 'verifyEmail':
        return <VerifyEmailPage />;
      case 'forgotPassword':
        return <ForgotPasswordPage />;
      case 'resetPassword':
        return <ResetPasswordPage />;
      case 'subscriptionCheckout':
        return <SubscriptionCheckoutPage />;
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
        return (
          <SubscriptionFeatureGateWrapper featureId="portfolio">
            <BuildPortfolioPage />
          </SubscriptionFeatureGateWrapper>
        );
      case 'buildResume':
        return (
          <SubscriptionFeatureGateWrapper featureId="resume-builder">
            <ResumeBuilderPage />
          </SubscriptionFeatureGateWrapper>
        );
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
        return (
          <SubscriptionFeatureGateWrapper featureId="coding">
            <CodingInterviewQuestionsPage />
          </SubscriptionFeatureGateWrapper>
        );
      case 'liveMockInterview':
        return (
          <SubscriptionFeatureGateWrapper featureId="live-ai">
            <LiveMockInterviewPage />
          </SubscriptionFeatureGateWrapper>
        );
      case 'blog':
        return <BlogPage />;
      case 'blogPost':
        return <BlogPostPage slug={blogSlug} />;
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
              <JobPrepSection />
              <ResumeBuilderHero />
              <ResumeHeroCard />
              <InterviewPrepHowItWorks />
              <PlatformCardsSection />
              <LanguagesSkillsSection />
              <HackathonCarouselSection />
              <TopSellers />
              <PricingPlansSection />
              <FAQSection />
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
        '/blog': 'blog',
        '/privacy': 'privacy',
        '/privacy-policy': 'privacy',
        '/terms': 'terms',
        '/terms-and-conditions': 'terms',
        '/subscription/checkout': 'subscriptionCheckout',
        '/verify-email': 'verifyEmail',
        '/forgot-password': 'forgotPassword',
        '/reset-password': 'resetPassword',
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
        'blog': 'blog',
        'blogPost': 'blogPost',
        'privacy': 'privacy',
        'terms': 'terms',
        'notFound': 'notFound',
        'subscriptionCheckout': 'subscriptionCheckout',
        'verifyEmail': 'verifyEmail',
        'forgotPassword': 'forgotPassword',
        'resetPassword': 'resetPassword',
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

      if (/^\/blog\/[^/]+$/.test(normalizedPath)) {
        setPage('blogPost');
        localStorage.setItem('currentPage', 'blogPost');
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

        if (
          (targetPage === 'admin' ||
            targetPage === 'dashboard' ||
            targetPage === 'seller' ||
            targetPage === 'subscriptionCheckout') &&
          storedAuth !== 'true'
        ) {
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
          const currentPage = localStorage.getItem('currentPage') as Page | null;
          const stayOnCurrentPage =
            currentPage === 'subscriptionCheckout' ||
            currentPage === 'resetPassword' ||
            currentPage === 'verifyEmail' ||
            currentPage === 'forgotPassword' ||
            hasPendingPlan();

          if ((page === 'home' || page === 'auth') && !stayOnCurrentPage) {
            if (role === 'admin') {
              setPage('admin');
            } else if (hasPendingPlan()) {
              setPage('subscriptionCheckout');
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
      'blog': '/blog',
      'blogPost': '/blog',
      'privacy': '/privacy',
        'terms': '/terms',
        'notFound': '/404',
        'subscriptionCheckout': '/subscription/checkout',
        'verifyEmail': '/verify-email',
        'forgotPassword': '/forgot-password',
        'resetPassword': '/reset-password',
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
    } else if (hasPendingPlan()) {
      navigateTo('subscriptionCheckout');
    } else {
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
    localStorage.removeItem('oauthIdToken');
    localStorage.removeItem('currentPage');
    clearSubscriptionCookie();
    clearPendingPlan();
    sessionStorage.clear();

    navigateTo('home');
  };

  return (
    <>
      <ThemeProvider page={page}>
        <PremiumProvider>
          <DashboardProvider>
            <PeerInterviewQueueProvider>
              <AuthContext.Provider value={{ isLoggedIn, userId, userEmail, userRole, login, logout }}>
                <SubscriptionProvider>
                  <PremiumSubscriptionSync />
                  <PeerInterviewBackendSync />
                  <SocketProvider>
                    <NavigationContext.Provider value={{ page, navigateTo }}>
                      <ShepherdTourWrapper>
                        <AppContent />
                      </ShepherdTourWrapper>
                      <CookieConsent />
                    </NavigationContext.Provider>
                  </SocketProvider>
                </SubscriptionProvider>
              </AuthContext.Provider>
            </PeerInterviewQueueProvider>
          </DashboardProvider>
        </PremiumProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
