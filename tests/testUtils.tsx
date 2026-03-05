import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import {
  NavigationContext,
  AuthContext,
  ThemeContext,
  PremiumContext,
} from '../App';

interface WrapperOptions {
  navigateTo?: (page: string) => void;
  isLoggedIn?: boolean;
  userId?: string;
  userEmail?: string;
  userRole?: 'user' | 'admin' | null;
}

export function createWrapper(opts: WrapperOptions = {}) {
  const navigateTo = opts.navigateTo ?? vi.fn();
  const isLoggedIn = opts.isLoggedIn ?? false;
  const userId = opts.userId ?? null;
  const userEmail = opts.userEmail ?? null;
  const userRole = opts.userRole ?? null;

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn(), isLanding: false }}>
        <AuthContext.Provider
          value={{
            isLoggedIn,
            userId,
            userEmail,
            userRole,
            login: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <NavigationContext.Provider value={{ page: 'home' as any, navigateTo: navigateTo as any }}>
            <PremiumContext.Provider value={{ isPremium: false, credits: 0, setCredits: vi.fn(), setIsPremium: vi.fn() }}>
              {children}
            </PremiumContext.Provider>
          </NavigationContext.Provider>
        </AuthContext.Provider>
      </ThemeContext.Provider>
    );
  };
}

export function renderWithProviders(ui: React.ReactElement, opts: WrapperOptions = {}, renderOptions?: RenderOptions) {
  const Wrapper = createWrapper(opts);
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
