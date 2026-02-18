import React, { useState, useEffect } from 'react';
import { useNavigation, useAuth, useTheme } from '../App';
import { Sun, Moon } from 'lucide-react';

const LogoIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#logo-gradient)" />
    <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <defs>
      <linearGradient id="logo-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6"/>
        <stop offset="1" stopColor="#6D28D9"/>
      </linearGradient>
    </defs>
  </svg>
);

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { navigateTo } = useNavigation();
  const { isLoggedIn, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // On scroll: navbar "comes close" from both sides (horizontal margin shrinks)
  const isScrolled = scrollY > 20;
  const barMargin = isScrolled ? 'mx-4' : 'mx-8';
  const barMaxWidth = isScrolled ? 'max-w-5xl' : 'max-w-6xl';

  interface NavLink {
    name: string;
    onClick?: () => void;
    highlight?: boolean;
  }

  const navLinks: NavLink[] = [
    { name: 'Projects', onClick: () => {
      const element = document.getElementById('projects');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
    { name: 'Browse', onClick: () => navigateTo('browseFreelancers') },
    { name: 'Solutions', onClick: () => {
      const element = document.getElementById('how-it-works');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
    { name: 'Pricing', onClick: () => {
      const element = document.getElementById('pricing');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
    { name: 'FAQs', onClick: () => navigateTo('faq') },
  ];

  const isDark = theme === 'dark';
  const glassBar =
    'rounded-2xl backdrop-blur-xl border shadow-lg transition-all duration-300 ease-out ' +
    (isDark
      ? 'bg-gray-900/60 border-white/10'
      : 'bg-white/70 border-black/5');

  const linkClass = isDark
    ? 'text-white/80 hover:text-white'
    : 'text-gray-700 hover:text-gray-900';
  const ctaClass = isDark
    ? 'bg-white text-gray-900 hover:bg-gray-100'
    : 'bg-gray-900 text-white hover:bg-gray-800';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-4 px-2 sm:px-4 pointer-events-none">
      <div
        className={`pointer-events-auto mx-auto ${barMargin} ${barMaxWidth} flex items-center justify-between py-3 px-5 sm:px-6 ${glassBar}`}
      >
        {/* Logo */}
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-3 shrink-0"
          aria-label="Go to homepage"
        >
          <LogoIcon />
          <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ProjectBazaar
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={link.onClick}
              className={`transition-colors duration-200 font-medium ${linkClass}`}
            >
              {link.name}
            </button>
          ))}
        </nav>

        {/* Desktop: Theme toggle + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isLoggedIn ? (
            <>
              <button
                onClick={() => navigateTo('dashboard')}
                className={`font-medium transition-colors duration-200 ${linkClass}`}
              >
                Dashboard
              </button>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-2.5 px-5 rounded-full hover:opacity-90 transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigateTo('auth')}
                className={`font-medium transition-colors duration-200 ${linkClass}`}
              >
                Log In
              </button>
              <button
                onClick={() => navigateTo('auth')}
                className={`font-semibold py-2.5 px-5 rounded-full transition-all duration-200 ${ctaClass}`}
              >
                Join Now
              </button>
            </>
          )}
        </div>

        {/* Mobile: Theme + Menu toggle */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${isDark ? 'text-white/80' : 'text-gray-600'}`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg focus:outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu - glassy */}
      {isOpen && (
        <div
          className={`md:hidden mt-3 mx-4 max-w-6xl rounded-2xl p-6 border shadow-xl backdrop-blur-xl ${isDark ? 'bg-gray-900/90 border-white/10' : 'bg-white/90 border-black/5'}`}
        >
          <nav className="flex flex-col items-center gap-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  link.onClick?.();
                  setIsOpen(false);
                }}
                className={`font-medium py-2 transition-colors ${linkClass}`}
              >
                {link.name}
              </button>
            ))}
            <div className={`w-full h-px my-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => { navigateTo('dashboard'); setIsOpen(false); }}
                  className={`font-medium py-2 ${linkClass}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-full"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { navigateTo('auth'); setIsOpen(false); }}
                  className={`font-medium py-2 ${linkClass}`}
                >
                  Log In
                </button>
                <button
                  onClick={() => { navigateTo('auth'); setIsOpen(false); }}
                  className={`w-full font-semibold py-3 px-6 rounded-full ${ctaClass}`}
                >
                  Join Now
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
