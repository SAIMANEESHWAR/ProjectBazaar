import React from 'react';
import { useAuth, useTheme } from '../App';

const LogoIcon: React.FC<{className?: string}> = ({className}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14.293 3.293L12 1.00001L3.29297 9.70704C3.10547 9.89454 3.00006 10.149 3.00006 10.414V20C3.00006 20.552 3.44806 21 4.00006 21H12V13H14V21H20C20.552 21 21 20.552 21 20V10.414C21 10.149 20.8946 9.89452 20.7071 9.70702L14.293 3.293Z" fill="url(#paint0_linear_sidebar)"/>
    <defs>
      <linearGradient id="paint0_linear_sidebar" x1="3" y1="1" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6"/>
        <stop offset="1" stopColor="#9333EA"/>
      </linearGradient>
    </defs>
  </svg>
);

const navItems = [
    { name: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { name: 'My Projects', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
    { name: 'Purchases', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { name: 'Earnings', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { name: 'Analytics', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg> },
    { name: 'Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

const Sidebar: React.FC = () => {
    const { userEmail, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="w-64 bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800 px-4">
                <div className="flex items-center gap-2">
                    <LogoIcon />
                    <span className="text-lg font-bold">ProjectBazaar</span>
                </div>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item, index) => (
                    <a
                        key={item.name}
                        href="#"
                        className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            index === 0
                                ? 'bg-gray-200/70 dark:bg-gray-800/50 text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/30'
                        }`}
                    >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                    </a>
                ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">User</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail ?? 'user@example.com'}</p>
                    </div>
                    <button onClick={logout} className="ml-2 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
