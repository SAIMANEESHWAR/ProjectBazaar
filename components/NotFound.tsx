import React, { useState, useEffect } from 'react';
import { useNavigation } from '../App';
import Lottie from 'lottie-react';

const NotFound: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [animationData, setAnimationData] = useState<any>(null);
  const [animationError, setAnimationError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Try multiple methods to load the Lottie animation
    const loadAnimation = async () => {
      try {
        // Method 1: Try dynamic import first (works with bundlers like webpack/vite)
        try {
          const imported = await import('../lottiefiles/Error 404.json');
          const data = imported.default || imported;
          if (data && typeof data === 'object') {
            setAnimationData(data);
            setIsLoading(false);
            return;
          }
        } catch (importError) {
          // Dynamic import not supported or failed, try other methods
          console.log('Dynamic import not available, trying fetch...');
        }

        // Method 2: Try fetching from public/lottiefiles (if in public folder)
        const fetchPaths = [
          '/lottiefiles/Error 404.json',
          '/lottiefiles/Error%20404.json',
          './lottiefiles/Error 404.json',
          './lottiefiles/Error%20404.json',
          '../lottiefiles/Error 404.json',
        ];

        for (const fetchPath of fetchPaths) {
          try {
            const response = await fetch(fetchPath);
            if (response.ok) {
              const data = await response.json();
              if (data && typeof data === 'object') {
                setAnimationData(data);
                setIsLoading(false);
                return;
              }
            }
          } catch (fetchError) {
            // Try next path
            continue;
          }
        }

        // If all methods fail, show error
        console.warn('Could not load 404 Lottie animation, using fallback');
        setAnimationError(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading 404 animation:', error);
        setAnimationError(true);
        setIsLoading(false);
      }
    };

    loadAnimation();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Lottie Animation */}
        {!animationError && (
          <div className="mb-12 flex justify-center">
            <div className="w-full max-w-xl h-[420px] md:h-[560px]">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : animationData ? (
                <Lottie 
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : null}
            </div>
          </div>
        )}
        
        {/* Fallback 404 Illustration */}
        {animationError && (
          <div className="mb-12 flex justify-center">
            <div className="w-full max-w-md">
              <svg viewBox="0 0 400 300" className="w-full h-auto">
                <circle cx="200" cy="150" r="100" fill="#EF4444" opacity="0.1"/>
                <text x="200" y="160" textAnchor="middle" fontSize="120" fontWeight="bold" fill="#EF4444" fontFamily="Arial">
                  404
                </text>
                <circle cx="150" cy="120" r="8" fill="#EF4444"/>
                <circle cx="250" cy="120" r="8" fill="#EF4444"/>
                <path d="M 160 180 Q 200 200 240 180" stroke="#EF4444" strokeWidth="4" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigateTo('home')}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Homepage
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </button>
          <button
            onClick={() => window.history.back()}
            className="group relative px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

