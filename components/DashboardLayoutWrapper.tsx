import React, { useState, ReactNode } from 'react';
import { useAuth, useNavigation } from '../App';
import Sidebar from './Sidebar';
import type { DashboardView } from './DashboardPage';
import { WishlistProvider, CartProvider } from './DashboardPage';

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

/**
 * Wraps a page (e.g. FreelancerProfilePage) with the same sidebar layout as the dashboard
 * so the sidebar is visible. Sidebar uses DashboardContext so Buyer/Seller mode is
 * maintained across all components.
 */
const DashboardLayoutWrapper: React.FC<DashboardLayoutWrapperProps> = ({ children }) => {
  const { userId } = useAuth();
  const { navigateTo } = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const handleNavClick = (_view: DashboardView) => {
    navigateTo('dashboard');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  return (
    <WishlistProvider userId={userId}>
      <CartProvider userId={userId}>
        <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 relative">
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden
            />
          )}
          <Sidebar
            activeView="dashboard"
            setActiveView={handleNavClick}
            isOpen={isSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            onClose={() => setIsSidebarOpen(false)}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onCollapseToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex-shrink-0 flex items-center gap-2 h-14 px-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </CartProvider>
    </WishlistProvider>
  );
};

export default DashboardLayoutWrapper;
