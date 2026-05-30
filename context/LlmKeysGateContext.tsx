import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth, useNavigation } from '../App';
import { useDashboard } from './DashboardContext';
import ApiKeysRequiredModal, { type ApiKeysModalFeature } from '../components/ApiKeysRequiredModal';
import {
  getLlmKeysStatus,
  hasAnyAtsKeySaved,
  type LlmKeysStatus,
} from '../services/atsService';

type ModalState = {
  feature: ApiKeysModalFeature;
  requiresLogin?: boolean;
};

interface LlmKeysGateContextValue {
  llmKeysStatus: LlmKeysStatus | null;
  refreshLlmKeysStatus: () => Promise<void>;
  /** Open modal without navigating. */
  promptForApiKeys: (feature: ApiKeysModalFeature) => void;
  /** Returns true when logged in and keys exist; otherwise shows modal. */
  ensureAtsKeys: () => Promise<boolean>;
  ensureLiveInterviewKeys: () => Promise<boolean>;
  hasLiveInterviewKeys: boolean;
  hasAtsKeys: boolean;
}

const LlmKeysGateContext = createContext<LlmKeysGateContextValue | undefined>(undefined);

export const LlmKeysGateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoggedIn, userId } = useAuth();
  const { navigateTo } = useNavigation();
  const { setActiveView, setDashboardMode } = useDashboard();
  const [llmKeysStatus, setLlmKeysStatus] = useState<LlmKeysStatus | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  const refreshLlmKeysStatus = useCallback(async () => {
    if (!userId) {
      setLlmKeysStatus(null);
      return;
    }
    try {
      const status = await getLlmKeysStatus(userId);
      setLlmKeysStatus(status);
    } catch {
      setLlmKeysStatus(null);
    }
  }, [userId]);

  useEffect(() => {
    void refreshLlmKeysStatus();
  }, [refreshLlmKeysStatus]);

  const hasAtsKeys = hasAnyAtsKeySaved(llmKeysStatus);
  const hasLiveInterviewKeys = Boolean(
    llmKeysStatus?.hasOpenrouterKey || llmKeysStatus?.hasGroqKey
  );

  const openSettings = useCallback(() => {
    setModal(null);
    if (!isLoggedIn) {
      navigateTo('auth');
      return;
    }
    navigateTo('dashboard');
    setDashboardMode('buyer');
    setActiveView('settings');
  }, [isLoggedIn, navigateTo, setActiveView, setDashboardMode]);

  const promptForApiKeys = useCallback((feature: ApiKeysModalFeature) => {
    if (!isLoggedIn || !userId) {
      setModal({ feature, requiresLogin: true });
      return;
    }
    setModal({ feature });
  }, [isLoggedIn, userId]);

  const loadFreshStatus = useCallback(async (): Promise<LlmKeysStatus | null> => {
    if (!userId) return null;
    try {
      const status = await getLlmKeysStatus(userId);
      setLlmKeysStatus(status);
      return status;
    } catch {
      return null;
    }
  }, [userId]);

  const ensureAtsKeys = useCallback(async (): Promise<boolean> => {
    if (!isLoggedIn || !userId) {
      setModal({ feature: 'ats', requiresLogin: true });
      return false;
    }
    const status = llmKeysStatus?.success ? llmKeysStatus : await loadFreshStatus();
    if (!hasAnyAtsKeySaved(status)) {
      setModal({ feature: 'ats' });
      return false;
    }
    return true;
  }, [isLoggedIn, userId, llmKeysStatus, loadFreshStatus]);

  const ensureLiveInterviewKeys = useCallback(async (): Promise<boolean> => {
    if (!isLoggedIn || !userId) {
      setModal({ feature: 'liveInterview', requiresLogin: true });
      return false;
    }
    const status = llmKeysStatus?.success ? llmKeysStatus : await loadFreshStatus();
    if (!(status?.hasOpenrouterKey || status?.hasGroqKey)) {
      setModal({ feature: 'liveInterview' });
      return false;
    }
    return true;
  }, [isLoggedIn, userId, llmKeysStatus, loadFreshStatus]);

  const value = useMemo(
    () => ({
      llmKeysStatus,
      refreshLlmKeysStatus,
      promptForApiKeys,
      ensureAtsKeys,
      ensureLiveInterviewKeys,
      hasLiveInterviewKeys,
      hasAtsKeys,
    }),
    [
      llmKeysStatus,
      refreshLlmKeysStatus,
      promptForApiKeys,
      ensureAtsKeys,
      ensureLiveInterviewKeys,
      hasLiveInterviewKeys,
      hasAtsKeys,
    ]
  );

  return (
    <LlmKeysGateContext.Provider value={value}>
      {children}
      <ApiKeysRequiredModal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        onGoToSettings={openSettings}
        feature={modal?.feature ?? 'ats'}
        requiresLogin={modal?.requiresLogin}
      />
    </LlmKeysGateContext.Provider>
  );
};

export function useLlmKeysGate(): LlmKeysGateContextValue {
  const ctx = useContext(LlmKeysGateContext);
  if (!ctx) {
    throw new Error('useLlmKeysGate must be used within LlmKeysGateProvider');
  }
  return ctx;
}

/** Safe when provider may be absent (e.g. tests). */
export function useLlmKeysGateOptional(): LlmKeysGateContextValue | null {
  return useContext(LlmKeysGateContext) ?? null;
}

