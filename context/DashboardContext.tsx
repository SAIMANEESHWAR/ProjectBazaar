
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the available dashboard modes
export type DashboardMode = 'buyer' | 'seller' | 'preparation';

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
    | 'purchases'
    | 'my-bids'
    | 'prep-hub'
    | 'prep-interview-questions'
    | 'prep-dsa'
    | 'prep-quizzes'
    | 'prep-cold-dms'
    | 'prep-collections'
    | 'prep-mass-recruitment'
    | 'prep-job-portals'
    | 'prep-notes'
    | 'prep-roadmaps'
    | 'prep-position-resources'
    | 'prep-activity';

export type BrowseView = 'all' | 'freelancers' | 'projects';

interface DashboardContextType {
    dashboardMode: DashboardMode;
    activeView: DashboardView;
    browseView: BrowseView;
    setDashboardMode: (mode: DashboardMode) => void;
    setActiveView: (view: DashboardView) => void;
    setBrowseView: (view: BrowseView) => void;
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

    const [browseView, setBrowseViewState] = useState<BrowseView>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('browseView');
            if (saved === 'freelancers' || saved === 'projects' || saved === 'all') {
                return saved as BrowseView;
            }
        }
        return 'all';
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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('browseView', browseView);
        }
    }, [browseView]);

    const setDashboardMode = (mode: DashboardMode) => {
        setDashboardModeState(mode);
        if (mode === 'preparation') {
            setActiveViewState('prep-hub');
        } else {
            setActiveViewState('dashboard');
        }
    };

    const setActiveView = (view: DashboardView) => {
        setActiveViewState(view);
    };

    const setBrowseView = (view: BrowseView) => {
        setBrowseViewState(view);
    };

    const toggleDashboardMode = () => {
        if (dashboardMode === 'preparation') {
            setDashboardMode('buyer');
        } else {
            setDashboardMode(dashboardMode === 'buyer' ? 'seller' : 'buyer');
        }
    };

    return (
        <DashboardContext.Provider
            value={{
                dashboardMode,
                activeView,
                browseView,
                setDashboardMode,
                setActiveView,
                setBrowseView,
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
