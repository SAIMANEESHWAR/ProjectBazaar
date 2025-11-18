import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import FeaturedProjects from './components/FeaturedProjects';
import Faqs from './components/Faqs';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import Stats from './components/Stats';
import Referral from './components/Referral';
import Pricing from './components/Pricing';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';

// --- Theme Context ---
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
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
// --- End Theme Context ---

// --- Navigation Context ---
type Page = 'home' | 'auth' | 'dashboard';
interface NavigationContextType {
  page: Page;
  navigateTo: (page: Page) => void;
}
export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// --- Auth Context ---
interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AppContent: React.FC = () => {
  const { page } = useNavigation();
  const { isLoggedIn } = useAuth();

  switch (page) {
    case 'auth':
      return <AuthPage />;
    case 'dashboard':
      return isLoggedIn ? <DashboardPage /> : <AuthPage />;
    case 'home':
    default:
      return (
        <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 overflow-x-hidden transition-colors duration-300">
          <Header />
          <main>
            <Hero />
            <Stats />
            <HowItWorks />
            <Referral />
            <FeaturedProjects />
            <Pricing />
            <Faqs />
            <CtaSection />
          </main>
          <Footer />
        </div>
      );
  }
};

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const navigateTo = (targetPage: Page) => {
    setPage(targetPage);
    window.scrollTo(0, 0);
  };
  
  const login = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    navigateTo('dashboard');
  };

  const logout = () => {
    setUserEmail(null);
    setIsLoggedIn(false);
    navigateTo('home');
  };

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ isLoggedIn, userEmail, login, logout }}>
        <NavigationContext.Provider value={{ page, navigateTo }}>
          <AppContent />
        </NavigationContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

export default App;
