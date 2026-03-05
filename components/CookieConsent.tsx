import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../App';
import { initSentry } from '../lib/analytics';

const COOKIE_CONSENT_KEY = 'cookieConsent';

type ConsentLevel = 'all' | 'necessary' | null;

function getStoredConsent(): ConsentLevel {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === 'all' || stored === 'necessary') return stored;
  } catch {
    // localStorage may not be available
  }
  return null;
}

function storeConsent(level: ConsentLevel) {
  try {
    if (level) localStorage.setItem(COOKIE_CONSENT_KEY, level);
  } catch {
    // silently fail
  }
}

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = useCallback((level: ConsentLevel) => {
    storeConsent(level);
    if (level === 'all') {
      initSentry();
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Main banner */}
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#ff7a00]">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="8" r="1" fill="currentColor"/>
                <circle cx="14" cy="14" r="1.5" fill="currentColor"/>
                <circle cx="9" cy="15" r="1" fill="currentColor"/>
                <circle cx="11" cy="11" r="0.75" fill="currentColor"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">We value your privacy</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies and similar technologies to improve your experience, analyze usage, and assist in
                error monitoring. Some are essential for the site to function; others help us improve.{' '}
                <button
                  onClick={() => navigateTo('privacy')}
                  className="text-[#ff7a00] hover:underline font-medium"
                >
                  Learn more
                </button>
              </p>
            </div>
          </div>

          {/* Detail toggle */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Strictly Necessary</p>
                  <p className="text-gray-500 text-xs mt-0.5">Login sessions, cart, payment processing</p>
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">Always on</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Functional</p>
                  <p className="text-gray-500 text-xs mt-0.5">Theme preference, real-time messaging</p>
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">Always on</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-gray-500 text-xs mt-0.5">Sentry error tracking and performance monitoring</p>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => accept('all')}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#ff7a00] hover:bg-[#e86e00] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={() => accept('necessary')}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Necessary Only
            </button>
            <button
              onClick={() => setShowDetails((d) => !d)}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors py-2"
            >
              {showDetails ? 'Hide details' : 'Cookie details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
