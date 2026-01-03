import React from 'react';
import { useNavigation } from '../App';
import { RotatingStats } from './ui/animated-counter';

// Floating Avatar Component
const FloatingAvatar: React.FC<{
  src: string;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  className?: string;
}> = ({ src, size = 'md', delay = 0, className = '' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={`absolute rounded-full overflow-hidden border-2 border-white/20 shadow-xl ${sizeClasses[size]} ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <img src={src} alt="Specialist" className="w-full h-full object-cover" />
    </div>
  );
};

// Floating Icon Component with rotation
const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  delay?: number;
  className?: string;
  rotateDirection?: 'cw' | 'ccw';
}> = ({ icon, delay = 0, className = '', rotateDirection = 'cw' }) => {
  return (
    <div
      className={`absolute w-12 h-12 rounded-xl bg-gray-900/90 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/10 ${className}`}
      style={{
        animation: `floatRotate${rotateDirection === 'cw' ? 'CW' : 'CCW'} 8s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {icon}
    </div>
  );
};

// Company Logo Item
const LogoItem: React.FC<{ icon: React.ReactNode; name: string }> = ({ icon, name }) => (
  <div className="flex items-center gap-3 text-white/50 hover:text-white/70 transition-colors duration-300 px-8 shrink-0">
    {icon}
    <span className="font-semibold tracking-wide text-lg whitespace-nowrap">{name}</span>
  </div>
);

// Company Logo Components with infinite scroll
const CompanyLogos: React.FC = () => {
  const logos = [
    {
      name: 'TechFlow',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      ),
    },
    {
      name: 'InnovateLab',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
    },
    {
      name: 'CodeSphere',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M9 9h6v6H9z"/>
        </svg>
      ),
    },
    {
      name: 'BuildHub',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
    },
    {
      name: 'DevStack',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
        </svg>
      ),
    },
    {
      name: 'Nexus',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
    },
    {
      name: 'CloudSync',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
        </svg>
      ),
    },
    {
      name: 'Quantum',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Gradient masks for smooth fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#1a1025] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#1a1025] to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling container */}
      <div className="flex animate-scroll">
        {/* First set of logos */}
        <div className="flex shrink-0">
          {logos.map((logo, index) => (
            <LogoItem key={`first-${index}`} icon={logo.icon} name={logo.name} />
          ))}
        </div>
        {/* Duplicate set for seamless loop */}
        <div className="flex shrink-0">
          {logos.map((logo, index) => (
            <LogoItem key={`second-${index}`} icon={logo.icon} name={logo.name} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Hero: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#1a1025] via-[#2d1f47] to-[#1a1025]">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Purple glow on left */}
        <div className="absolute -left-40 top-1/4 w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-[150px]" />
        {/* Orange/amber glow on bottom left */}
        <div className="absolute -left-20 bottom-0 w-[400px] h-[400px] bg-amber-500/20 rounded-full blur-[120px]" />
        {/* Subtle purple glow on right */}
        <div className="absolute right-0 top-1/3 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[100px]" />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-extrabold leading-[1.1] tracking-tight mb-6">
              <span className="text-white">Discover. Build.</span>
                    <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">
                        Earn.
                    </span>
                </h1>

            <p className="text-white/70 text-lg md:text-xl max-w-lg mb-10 mx-auto lg:mx-0 leading-relaxed">
                    The ultimate marketplace for projects, ideas, and collaborations. Turn your academic and personal projects into real revenue.
                </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={() => navigateTo('auth')}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                    Explore Projects
                </button>
              <button
                onClick={() => navigateTo('auth')}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300"
              >
                    Become a Seller
                </button>
                </div>

          </div>

          {/* Right Content - Orbital Visualization */}
          <div className="relative h-[500px] lg:h-[600px] flex items-center justify-center">
            {/* Orbital Rings */}
            <div className="absolute w-[280px] h-[280px] md:w-[350px] md:h-[350px] rounded-full border border-white/10" />
            <div className="absolute w-[400px] h-[400px] md:w-[480px] md:h-[480px] rounded-full border border-white/10" />
            <div className="absolute w-[520px] h-[520px] md:w-[600px] md:h-[600px] rounded-full border border-white/5" />

            {/* Center Stats - Animated Counter */}
            <div className="relative z-10 text-center">
              <RotatingStats
                stats={[
                  { value: 100, label: 'Users', suffix: '+' },
                  { value: 1000, label: 'Projects', suffix: '+' },
                  { value: 500, label: 'Freelancers', suffix: '+' },
                  { value: 50, label: 'Categories', suffix: '+' },
                  { value: 20000, label: 'Specialists', suffix: '+' },
                ]}
                rotationInterval={3000}
              />
            </div>

            {/* Floating Avatars - positioned around the orbits */}
            <FloatingAvatar
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
              size="md"
              delay={0}
              className="top-[5%] left-[40%]"
            />
            <FloatingAvatar
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
              size="lg"
              delay={0.5}
              className="top-[20%] right-[5%]"
            />
            <FloatingAvatar
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
              size="md"
              delay={1}
              className="top-[60%] right-[0%]"
            />
            <FloatingAvatar
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
              size="lg"
              delay={1.5}
              className="bottom-[10%] right-[25%]"
            />
            <FloatingAvatar
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
              size="md"
              delay={2}
              className="bottom-[30%] left-[5%]"
            />
            <FloatingAvatar
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
              size="sm"
              delay={2.5}
              className="top-[35%] left-[10%]"
            />

            {/* Floating Icons */}
            <FloatingIcon
              icon={
                <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              }
              delay={0.8}
              rotateDirection="cw"
              className="top-[25%] left-[25%]"
            />
            <FloatingIcon
              icon={
                <svg className="w-6 h-6 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              }
              delay={1.2}
              rotateDirection="ccw"
              className="top-[50%] right-[10%]"
            />
            <FloatingIcon
              icon={
                <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                </svg>
              }
              delay={1.8}
              rotateDirection="cw"
              className="bottom-[20%] left-[15%]"
            />
            <FloatingIcon
              icon={
                <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              }
              delay={2.2}
              rotateDirection="ccw"
              className="top-[10%] right-[20%]"
            />
            </div>
        </div>
      </div>

      {/* Bottom Company Logos */}
      <div className="relative z-10 container mx-auto px-4 pb-12">
        <CompanyLogos />
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        @keyframes floatRotateCW {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(10deg);
          }
          50% {
            transform: translateY(-15px) rotate(0deg);
          }
          75% {
            transform: translateY(-10px) rotate(-10deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
        
        @keyframes floatRotateCCW {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(-10deg);
          }
          50% {
            transform: translateY(-15px) rotate(0deg);
          }
          75% {
            transform: translateY(-10px) rotate(10deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default Hero;
