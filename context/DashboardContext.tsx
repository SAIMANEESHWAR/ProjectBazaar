
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the available dashboard modes
export type DashboardMode = 'buyer' | 'seller';

// Define the available views (keep in sync with DashboardPage/Sidebar)
// This is a superset of views for both buyer and seller dashboards
export type DashboardView =
    | 'dashboard'
    | 'projects'
    | 'messages'
    | 'freelancers'
    | 'settings'
    | 'analytics'
    | 'profile-settings'
    | 'post-project'
    | 'my-projects'
    | 'my-courses'
    | 'earnings'
    | 'payouts'
    | 'help-center'
    | 'career-guidance'
    | 'mock-assessment'
    | 'coding-questions'
    | 'build-portfolio'
    | 'build-resume'
    | 'hackathons'
    | 'courses'
    | 'cart'
    | 'wishlist'
    | 'notifications'
    | 'project-details'
    | 'course-details'
    | 'freelancer-profile'
    | 'seller-profile'
    | 'edit-project'
    | 'purchases'; // Add any missing views here

interface DashboardContextType {
    dashboardMode: DashboardMode;
    activeView: DashboardView;
    setDashboardMode: (mode: DashboardMode) => void;
    setActiveView: (view: DashboardView) => void;
    toggleDashboardMode: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize state from localStorage if available, otherwise default
    const [dashboardMode, setDashboardModeState] = useState<DashboardMode>(() => {
        if (typeof window !== 'undefined') {
            const storedMode = localStorage.getItem('dashboardMode');
            return (storedMode as DashboardMode) || 'buyer';
        }
        return 'buyer';
    });

    const [activeView, setActiveViewState] = useState<DashboardView>(() => {
        if (typeof window !== 'undefined') {
            const storedView = localStorage.getItem('activeView');
            return (storedView as DashboardView) || 'dashboard';
        }
        return 'dashboard';
    });

    // Persist state changes to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dashboardMode', dashboardMode);
        }
    }, [dashboardMode]);

    // Views that require runtime data and should not be persisted across reloads
    const ephemeralViews: DashboardView[] = ['project-details', 'course-details', 'seller-profile'];

    useEffect(() => {
        if (typeof window !== 'undefined' && !ephemeralViews.includes(activeView)) {
            localStorage.setItem('activeView', activeView);
        }
    }, [activeView]);

    const setDashboardMode = (mode: DashboardMode) => {
        setDashboardModeState(mode);
        // When switching modes, reset active view to dashboard if needed, or keep last visited view for that mode if we want to be fancy.
        // For now, let's just default to 'dashboard' when switching modes unless we want to persist per-mode views.
        // However, the requirement is mainly about persisting the current state.
        // If the user was deep in a view that doesn't exist in the other mode, we should reset.
        // But let's keep it simple: switching mode often implies going to the landing of that mode.
        setActiveViewState('dashboard');
    };

    const setActiveView = (view: DashboardView) => {
        setActiveViewState(view);
    };

    const toggleDashboardMode = () => {
        setDashboardMode(dashboardMode === 'buyer' ? 'seller' : 'buyer');
    };

    return (
        <DashboardContext.Provider
            value={{
                dashboardMode,
                activeView,
                setDashboardMode,
                setActiveView,
                toggleDashboardMode,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
