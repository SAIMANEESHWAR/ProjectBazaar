import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { BrowseProjectsContent } from './BrowseProjectsContent';

/**
 * BrowseProjects - Wrapper component that uses BrowseProjectsContent
 * This connects to the real API to fetch bid request projects from DynamoDB
 */
const BrowseProjects: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-300 min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Browse Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find projects that match your skills and start bidding
          </p>
        </div>

        {/* BrowseProjectsContent handles all the project fetching and display */}
        <BrowseProjectsContent />
      </main>

      <Footer />
    </div>
  );
};

export default BrowseProjects;

