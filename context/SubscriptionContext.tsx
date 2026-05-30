import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './appContext';
import {
  clearSubscriptionCookie,
  getSubscriptionFromCookie,
  setSubscriptionCookie,
  type SubscriptionCookiePayload,
} from '../lib/subscriptionCookie';
import type { SubscriptionFeatureId } from '../lib/subscriptionFeatures';
import {
  getActiveSubscription,
  subscriptionRecordToCookie,
} from '../services/subscriptionApi';

interface SubscriptionContextValue {
  subscription: SubscriptionCookiePayload | null;
  isLoading: boolean;
  hasFeature: (featureId: SubscriptionFeatureId | string) => boolean;
  refreshSubscription: () => Promise<void>;
  applySubscription: (payload: SubscriptionCookiePayload) => void;
  clearSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoggedIn, userId } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionCookiePayload | null>(() =>
    getSubscriptionFromCookie()
  );
  const [isLoading, setIsLoading] = useState(false);

  const applySubscription = useCallback((payload: SubscriptionCookiePayload) => {
    setSubscriptionCookie(payload);
    setSubscription(payload);
  }, []);

  const clearSubscription = useCallback(() => {
    clearSubscriptionCookie();
    setSubscription(null);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!userId) {
      clearSubscription();
      return;
    }
    setIsLoading(true);
    try {
      const record = await getActiveSubscription(userId);
      if (record && record.status === 'active') {
        const end = record.endDate ? new Date(record.endDate).getTime() : null;
        const expired = end !== null && !Number.isNaN(end) && end < Date.now();
        if (!expired) {
          applySubscription(subscriptionRecordToCookie(record));
          return;
        }
      }
      clearSubscription();
    } finally {
      setIsLoading(false);
    }
  }, [userId, applySubscription, clearSubscription]);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      clearSubscription();
      return;
    }
    const cached = getSubscriptionFromCookie();
    if (cached?.status === 'active') {
      setSubscription(cached);
    }
    void refreshSubscription();
  }, [isLoggedIn, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFeature = useCallback(
    (featureId: SubscriptionFeatureId | string) => {
      if (!subscription || subscription.status !== 'active') return false;
      if (subscription.endDate) {
        const end = new Date(subscription.endDate).getTime();
        if (!Number.isNaN(end) && end < Date.now()) return false;
      }
      return subscription.enabledFeatures.includes(featureId);
    },
    [subscription]
  );

  const value = useMemo(
    () => ({
      subscription,
      isLoading,
      hasFeature,
      refreshSubscription,
      applySubscription,
      clearSubscription,
    }),
    [subscription, isLoading, hasFeature, refreshSubscription, applySubscription, clearSubscription]
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
};

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
}
