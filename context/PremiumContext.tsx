import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface PremiumContextType {
  isPremium: boolean;
  credits: number;
  setCredits: (credits: number) => void;
  setIsPremium: (isPremium: boolean) => void;
}

export const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export const PremiumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremiumState] = useState<boolean>(() => {
    const stored = localStorage.getItem('isPremium');
    return stored === 'true';
  });

  const [credits, setCreditsState] = useState<number>(() => {
    const stored = localStorage.getItem('premiumCredits');
    return stored ? parseInt(stored, 10) : 0;
  });

  const setIsPremium = (premium: boolean) => {
    setIsPremiumState(premium);
    localStorage.setItem('isPremium', premium.toString());
    if (premium && credits === 0) {
      setCreditsState(100);
      localStorage.setItem('premiumCredits', '100');
    }
  };

  const setCredits = (newCredits: number) => {
    setCreditsState(newCredits);
    localStorage.setItem('premiumCredits', newCredits.toString());
  };

  return (
    <PremiumContext.Provider value={{ isPremium, credits, setCredits, setIsPremium }}>
      {children}
    </PremiumContext.Provider>
  );
};
