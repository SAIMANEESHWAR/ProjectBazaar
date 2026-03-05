import React from 'react';

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-gray-200" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#ff7a00] animate-spin" />
      </div>
      <p className="text-sm text-gray-400 font-medium">Loading...</p>
    </div>
  </div>
);

export default PageLoader;
