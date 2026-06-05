import type { Page } from '../context/appContext';

/** URL path → app page. Keep in sync with email links in login_handler.py */
export const PATH_TO_PAGE: Record<string, Page> = {
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
  // Legacy ?page= / hash aliases
  home: 'home',
  auth: 'auth',
  login: 'auth',
  dashboard: 'dashboard',
  seller: 'seller',
  admin: 'admin',
  faq: 'faq',
  browseProjects: 'browseProjects',
  freelancerProfile: 'freelancerProfile',
  buildPortfolio: 'buildPortfolio',
  buildResume: 'buildResume',
  mockAssessment: 'mockAssessment',
  mockLeaderboard: 'mockLeaderboard',
  mockAchievements: 'mockAchievements',
  mockDailyChallenge: 'mockDailyChallenge',
  mockHistory: 'mockHistory',
  codingQuestions: 'codingQuestions',
  liveMockInterview: 'liveMockInterview',
  blog: 'blog',
  blogPost: 'blogPost',
  privacy: 'privacy',
  terms: 'terms',
  notFound: 'notFound',
  subscriptionCheckout: 'subscriptionCheckout',
  verifyEmail: 'verifyEmail',
  forgotPassword: 'forgotPassword',
  resetPassword: 'resetPassword',
};

export const PAGE_TO_PATH: Record<Page, string> = {
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
  blogPost: '/blog',
  privacy: '/privacy',
  terms: '/terms',
  notFound: '/404',
  subscriptionCheckout: '/subscription/checkout',
  verifyEmail: '/verify-email',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
};

export function normalizePath(path: string): string {
  return path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
}

/** Resolve page from browser path (or explicit path for tests). */
export function resolvePageFromPath(pathname?: string): Page | null {
  const normalized = normalizePath(pathname ?? window.location.pathname);
  if (/^\/blog\/[^/]+$/.test(normalized)) return 'blogPost';
  return PATH_TO_PAGE[normalized] ?? null;
}

/** Pages opened from email links — must not be overridden by auth redirect. */
export const EMAIL_FLOW_PAGES: Page[] = [
  'verifyEmail',
  'forgotPassword',
  'resetPassword',
];

export function getInitialPage(): Page {
  const fromUrl = resolvePageFromPath();
  if (fromUrl) {
    localStorage.setItem('currentPage', fromUrl);
    return fromUrl;
  }
  const stored = localStorage.getItem('currentPage') as Page | null;
  return stored || 'home';
}
