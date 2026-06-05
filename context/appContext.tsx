import { createContext, useContext } from 'react';

export type Page =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'seller'
  | 'admin'
  | 'faq'
  | 'browseProjects'
  | 'freelancerProfile'
  | 'buildPortfolio'
  | 'buildResume'
  | 'mockAssessment'
  | 'mockLeaderboard'
  | 'mockAchievements'
  | 'mockDailyChallenge'
  | 'mockHistory'
  | 'codingQuestions'
  | 'liveMockInterview'
  | 'blog'
  | 'blogPost'
  | 'privacy'
  | 'terms'
  | 'notFound'
  | 'subscriptionCheckout'
  | 'verifyEmail';

export type UserRole = 'user' | 'admin';

export interface NavigationContextType {
  page: Page;
  navigateTo: (page: Page) => void;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  userRole: UserRole | null;
  login: (userId: string, email: string, role?: UserRole) => void;
  logout: () => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
