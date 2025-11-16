import React from 'react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import { useTheme } from '../App';

const DashboardPage: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-200 font-sans transition-colors duration-300`}>
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardContent />
            </div>
        </div>
    );
};

export default DashboardPage;
