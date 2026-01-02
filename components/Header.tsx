import React, { useState, useEffect } from 'react';
import { useTheme, useNavigation, useAuth } from '../App';
import { NavBar } from './ui/tubelight-navbar';

const LogoIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.293 3.293L12 1.00001L3.29297 9.70704C3.10547 9.89454 3.00006 10.149 3.00006 10.414V20C3.00006 20.552 3.44806 21 4.00006 21H12V13H14V21H20C20.552 21 21 20.552 21 20V10.414C21 10.149 20.8946 9.89452 20.7071 9.70702L14.293 3.293Z" fill="url(#paint0_linear_1_2)"/>
    <defs>
      <linearGradient id="paint0_linear_1_2" x1="3" y1="1" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316"/>
        <stop offset="1" stopColor="#EA580C"/>
      </linearGradient>
    </defs>
  </svg>
);

const SunIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
);

const MoonIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
);

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { navigateTo } = useNavigation();
  const { isLoggedIn, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [activeNavTab, setActiveNavTab] = useState('Projects');

  const navLinks = [
    { name: 'Projects', url: '#projects', onClick: () => {
      const element = document.getElementById('projects');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
    { name: 'Freelancers', url: '#freelancers', onClick: () => {
      const element = document.getElementById('freelancers');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
    { name: 'Pricing', url: '#pricing', onClick: () => {
      const element = document.getElementById('pricing');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
    { name: 'FAQs', url: '#faqs', onClick: () => {
      const element = document.getElementById('faqs');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4' : 'py-6'}`}>
      <div className={`container mx-auto px-4 transition-all duration-300 max-w-6xl`}>
        <div className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${isScrolled ? 'bg-white/50 backdrop-blur-lg border border-gray-200' : 'bg-transparent'}`}>
            <button onClick={() => navigateTo('home')} className="flex items-center gap-2" aria-label="Go to homepage">
                <LogoIcon />
                <span className="text-xl font-bold text-gray-900">ProjectBazaar</span>
            </button>

            <nav className="hidden md:flex items-center">
                <NavBar 
                  items={navLinks}
                  activeTab={activeNavTab}
                  onTabChange={setActiveNavTab}
                />
            </nav>

            <div className="hidden md:flex items-center">
                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors duration-200 mr-4" aria-label="Toggle theme">
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
                {isLoggedIn ? (
                    <>
                        <button onClick={() => navigateTo('dashboard')} className="text-gray-600 hover:text-gray-900 transition-colors duration-200 mr-6">Dashboard</button>
                        <button onClick={logout} className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-2 px-5 rounded-full hover:opacity-90 transition-opacity duration-200">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => navigateTo('auth')} className="text-gray-600 hover:text-gray-900 transition-colors duration-200 mr-6">Login</button>
                        <button onClick={() => navigateTo('auth')} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2 px-5 rounded-full hover:opacity-90 transition-opacity duration-200">
                            Sign Up
                        </button>
                    </>
                )}
            </div>
            
            <div className="md:hidden flex items-center">
                 <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors duration-200 mr-2" aria-label="Toggle theme">
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
                <button onClick={() => setIsOpen(!isOpen)} className="text-gray-800 focus:outline-none" aria-label="Open menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                </svg>
                </button>
            </div>
        </div>

        {isOpen && (
            <div className="md:hidden mt-2 bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-gray-200">
            <nav className="flex flex-col items-center gap-4">
                {navLinks.map((link) => (
                <button 
                  key={link.name} 
                  onClick={() => {
                    link.onClick?.();
                    setIsOpen(false);
                    setActiveNavTab(link.name);
                  }}
                  className={`text-gray-600 hover:text-gray-900 transition-colors duration-200 py-2 ${
                    activeNavTab === link.name ? 'text-primary font-semibold' : ''
                  }`}
                >
                    {link.name}
                </button>
                ))}
                {isLoggedIn ? (
                    <>
                        <button onClick={() => { navigateTo('dashboard'); setIsOpen(false); }} className="text-gray-600 hover:text-gray-900 transition-colors duration-200 py-2">Dashboard</button>
                        <button onClick={() => { logout(); setIsOpen(false); }} className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-2 px-6 rounded-full w-full">
                            Logout
                        </button>
                    </>
                ) : (
                     <>
                        <button onClick={() => { navigateTo('auth'); setIsOpen(false); }} className="text-gray-600 hover:text-gray-900 transition-colors duration-200 py-2">Login</button>
                        <button onClick={() => { navigateTo('auth'); setIsOpen(false); }} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2 px-6 rounded-full w-full">
                            Sign Up
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