
import React from 'react';
import { useNavigation } from '../App';

const HeroIllustration: React.FC = () => (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <defs>
            <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
        </defs>
        {/* Base shapes */}
        <rect x="40" y="80" width="432" height="352" rx="20" className="fill-gray-100" />
        <path d="M40 100 Q 40 80 60 80 H 452 Q 472 80 472 100 V 120 H 40 Z" className="fill-gray-200" />
        <circle cx="60" cy="100" r="6" className="fill-red-400" />
        <circle cx="80" cy="100" r="6" className="fill-yellow-400" />
        <circle cx="100" cy="100" r="6" className="fill-green-400" />

        {/* Floating UI elements */}
        <g transform="translate(-20, 20) rotate(-15, 150, 280)">
             <rect x="100" y="250" width="120" height="80" rx="10" className="fill-white" strokeWidth="2" stroke="url(#illustration-gradient)" />
             <path d="M115 270 h 70" className="stroke-gray-300" strokeWidth="6" strokeLinecap="round" />
             <path d="M115 285 h 40" className="stroke-gray-300" strokeWidth="6" strokeLinecap="round" />
             <circle cx="180" cy="305" r="15" fill="url(#illustration-gradient)" />
        </g>
       
        <g transform="translate(30, -20) rotate(10, 380, 220)">
            <rect x="320" y="180" width="100" height="120" rx="10" className="fill-white shadow-lg" strokeWidth="2" stroke="url(#illustration-gradient)" />
            <circle cx="370" cy="205" r="20" className="fill-gray-100" />
            <path d="M370 205 L 370 205 M360 235 h 20 l -10 20 Z" fill="url(#illustration-gradient)" />
        </g>

         <g transform="translate(0, 10) rotate(5, 256, 256)">
            <rect x="180" y="150" width="150" height="220" rx="15" className="fill-white shadow-2xl" strokeWidth="3" stroke="url(#illustration-gradient)" />
            <path d="M195 170 h 120" stroke="url(#illustration-gradient)" strokeWidth="8" strokeLinecap="round" />
            <path d="M195 190 h 80" className="stroke-gray-300" strokeWidth="6" strokeLinecap="round" />
            <path d="M195 210 h 100" className="stroke-gray-300" strokeWidth="6" strokeLinecap="round" />
             <rect x="195" y="240" width="120" height="100" rx="5" className="fill-gray-100" />
        </g>
    </svg>
);


const Hero: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-white dark:bg-[#0a0a0a]"></div>
        <div 
          className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/2 bg-gradient-to-tr from-orange-600 via-orange-500 to-orange-600 opacity-10 animate-[spin_30s_linear_infinite]"
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-4">
                    Discover. Build.
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                        Earn.
                    </span>
                </h1>
                <p className="max-w-xl text-lg md:text-xl text-gray-600 mb-8 mx-auto md:mx-0">
                    The ultimate marketplace for projects, ideas, and collaborations. Turn your academic and personal projects into real revenue.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <button onClick={() => navigateTo('auth')} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-8 rounded-full hover:opacity-90 transition-opacity duration-300 transform hover:scale-105">
                    Explore Projects
                </button>
                <button onClick={() => navigateTo('auth')} className="w-full sm:w-auto bg-gray-200/80 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-200:bg-gray-700/80 transition-all duration-300">
                    Become a Seller
                </button>
                </div>
            </div>
            <div className="px-4 md:px-0">
                <HeroIllustration />
            </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
