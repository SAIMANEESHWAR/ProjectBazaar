import React from 'react';

const SkipNav: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#ff7a00] focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#ff7a00]"
    onClick={(e) => {
      e.preventDefault();
      const target = document.getElementById('main-content');
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }}
  >
    Skip to main content
  </a>
);

export default SkipNav;
