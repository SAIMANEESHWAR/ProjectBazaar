import React, { useState, useEffect } from 'react';
import { useNavigation, useAuth } from '../App';

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
  const [isScrolled, setIsScrolled] = useState(false);
  const { navigateTo } = useNavigation();
  const { isLoggedIn, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { name: 'Browse', onClick: () => {
      navigateTo('browseFreelancers');
    }},
    { name: 'Solutions', onClick: () => {
      const element = document.getElementById('how-it-works');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
    { name: 'Pricing', onClick: () => {
      const element = document.getElementById('pricing');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
    { name: 'FAQs', onClick: () => {
      navigateTo('faq');
    }},
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4">
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between py-3 px-6 rounded-2xl transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#1a1025]/90 backdrop-blur-xl border border-white/10 shadow-xl' 
            : 'bg-transparent'
        }`}>
          {/* Logo */}
          <button onClick={() => navigateTo('home')} className="flex items-center gap-3" aria-label="Go to homepage">
                <LogoIcon />
            <span className="text-xl font-bold text-white">ProjectBazaar</span>
            </button>

          {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={link.onClick}
                className="text-white/70 hover:text-white transition-colors duration-200 font-medium"
              >
                {link.name}
              </button>
                ))}
            </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={() => navigateTo('dashboard')} 
                  className="text-white/70 hover:text-white transition-colors duration-200 font-medium"
                >
                  Dashboard
                </button>
                <button 
                  onClick={logout} 
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-2.5 px-6 rounded-full hover:opacity-90 transition-all duration-200"
                >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                <button 
                  onClick={() => navigateTo('auth')} 
                  className="text-white/70 hover:text-white transition-colors duration-200 font-medium flex items-center gap-2"
                >
                  Log In
                </button>
                <button 
                  onClick={() => navigateTo('auth')} 
                  className="bg-[#1e1e2f] hover:bg-[#2a2a3f] border border-white/20 text-white font-semibold py-2.5 px-6 rounded-full transition-all duration-200 shadow-lg"
                >
                  Join Now
                        </button>
                    </>
                )}
            </div>
            
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-white focus:outline-none p-2" 
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
                </svg>
                </button>
            </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-3 bg-[#1a1025]/95 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
            <nav className="flex flex-col items-center gap-4">
                {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => {
                    link.onClick?.();
                    setIsOpen(false);
                  }}
                  className={`transition-colors duration-200 font-medium py-2 ${
                    link.highlight
                      ? 'text-violet-400'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.name}
                  {link.highlight && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-violet-500/20 text-violet-400 rounded">NEW</span>
                  )}
                </button>
                ))}
              <div className="w-full h-px bg-white/10 my-2" />
                {isLoggedIn ? (
                    <>
                  <button 
                    onClick={() => { navigateTo('dashboard'); setIsOpen(false); }} 
                    className="text-white/70 hover:text-white transition-colors duration-200 font-medium py-2"
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
                    className="text-white/70 hover:text-white transition-colors duration-200 font-medium py-2"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => { navigateTo('auth'); setIsOpen(false); }} 
                    className="w-full bg-[#1e1e2f] hover:bg-[#2a2a3f] border border-white/20 text-white font-semibold py-3 px-6 rounded-full"
                  >
                    Join Now
                        </button>
                    </>
                )}
            </nav>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;
