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
import {
  FREE_USE_LIMIT,
  isTrialGatedFeature,
  TRIAL_FEATURES,
  type SubscriptionFeatureId,
} from '../lib/subscriptionFeatures';
import {
  getActiveSubscription,
  getFeatureEntitlements,
  subscriptionRecordToCookie,
  type FeatureEntitlement,
} from '../services/subscriptionApi';

interface FeatureUsageInfo {
  used: number;
  remaining: number;
  limit: number;
  source: FeatureEntitlement['source'];
}

interface SubscriptionContextValue {
  subscription: SubscriptionCookiePayload | null;
  isLoading: boolean;
  entitlements: Record<string, FeatureEntitlement>;
  /** Plan includes this feature (subscription entitlement). */
  hasFeature: (featureId: SubscriptionFeatureId | string) => boolean;
  /** Can access feature now (always-free, plan, or trial remaining). */
  canUseFeature: (featureId: SubscriptionFeatureId | string) => boolean;
  getFeatureUsage: (featureId: SubscriptionFeatureId | string) => FeatureUsageInfo;
  refreshSubscription: () => Promise<void>;
  refreshEntitlements: () => Promise<void>;
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
  const [entitlements, setEntitlements] = useState<Record<string, FeatureEntitlement>>({});
  const [isLoading, setIsLoading] = useState(false);

  const applySubscription = useCallback((payload: SubscriptionCookiePayload) => {
    setSubscriptionCookie(payload);
    setSubscription(payload);
  }, []);

  const clearSubscription = useCallback(() => {
    clearSubscriptionCookie();
    setSubscription(null);
    setEntitlements({});
  }, []);

  const refreshEntitlements = useCallback(async () => {
    if (!userId) {
      setEntitlements({});
      return;
    }
    const data = await getFeatureEntitlements(userId);
    const merged: Record<string, FeatureEntitlement> = { ...data };
    for (const fid of TRIAL_FEATURES) {
      if (!merged[fid]) {
        merged[fid] = {
          featureId: fid,
          used: 0,
          limit: FREE_USE_LIMIT,
          remaining: FREE_USE_LIMIT,
          allowed: true,
          source: 'trial',
        };
      }
    }
    setEntitlements(merged);
  }, [userId]);

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
          await refreshEntitlements();
          return;
        }
      }
      clearSubscriptionCookie();
      setSubscription(null);
      await refreshEntitlements();
    } finally {
      setIsLoading(false);
    }
  }, [userId, applySubscription, refreshEntitlements]);

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

  const getFeatureUsage = useCallback(
    (featureId: SubscriptionFeatureId | string): FeatureUsageInfo => {
      const ent = entitlements[featureId];
      if (ent) {
        return {
          used: ent.used,
          remaining: ent.remaining,
          limit: ent.limit,
          source: ent.source,
        };
      }
      if (hasFeature(featureId)) {
        return { used: 0, remaining: FREE_USE_LIMIT, limit: FREE_USE_LIMIT, source: 'plan' };
      }
      return { used: 0, remaining: FREE_USE_LIMIT, limit: FREE_USE_LIMIT, source: 'trial' };
    },
    [entitlements, hasFeature]
  );

  const canUseFeature = useCallback(
    (featureId: SubscriptionFeatureId | string) => {
      if (!isLoggedIn) return false;
      if (hasFeature(featureId)) return true;
      const ent = entitlements[featureId];
      if (ent) {
        if (ent.allowed) return true;
        if (ent.source === 'trial' && ent.remaining > 0) return true;
        return false;
      }
      // Entitlements still loading, API unavailable, or legacy payload missing this feature —
      // grant trial uses (same default as getFeatureUsage below).
      return isTrialGatedFeature(featureId);
    },
    [entitlements, hasFeature, isLoggedIn]
  );

  const value = useMemo(
    () => ({
      subscription,
      isLoading,
      entitlements,
      hasFeature,
      canUseFeature,
      getFeatureUsage,
      refreshSubscription,
      refreshEntitlements,
      applySubscription,
      clearSubscription,
    }),
    [
      subscription,
      isLoading,
      entitlements,
      hasFeature,
      canUseFeature,
      getFeatureUsage,
      refreshSubscription,
      refreshEntitlements,
      applySubscription,
      clearSubscription,
    ]
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
