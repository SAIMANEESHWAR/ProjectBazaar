import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { refreshPeerWaitlist } from '../services/peerInterviewApi';
import type { PeerWaitlistEntry } from '../types/peerInterviewQueue';

export type { PeerConnectionOffer, PeerWaitlistEntry } from '../types/peerInterviewQueue';

interface PeerInterviewQueueContextValue {
  waitlist: PeerWaitlistEntry[];
  setWaitlist: React.Dispatch<React.SetStateAction<PeerWaitlistEntry[]>>;
  refreshWaitlistFromBackend: (userId: string) => Promise<{ ok: boolean; error?: string }>;
  peerWaitlistBackendError: string | null;
}

const PeerInterviewQueueContext = createContext<PeerInterviewQueueContextValue | undefined>(undefined);

export const PeerInterviewQueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [waitlist, setWaitlist] = useState<PeerWaitlistEntry[]>(() => []);
  const [peerWaitlistBackendError, setPeerWaitlistBackendError] = useState<string | null>(null);

  const refreshWaitlistFromBackend = useCallback(async (userId: string) => {
    const r = await refreshPeerWaitlist(userId);
    if (r.error) {
      setPeerWaitlistBackendError(r.error);
      return { ok: false, error: r.error };
    }
    setPeerWaitlistBackendError(null);
    setWaitlist(r.entries);
    return { ok: true };
  }, []);

  return (
    <PeerInterviewQueueContext.Provider
      value={{ waitlist, setWaitlist, refreshWaitlistFromBackend, peerWaitlistBackendError }}
    >
      {children}
    </PeerInterviewQueueContext.Provider>
  );
};

export const usePeerInterviewQueue = (): PeerInterviewQueueContextValue => {
  const ctx = useContext(PeerInterviewQueueContext);
  if (!ctx) {
    throw new Error('usePeerInterviewQueue must be used within PeerInterviewQueueProvider');
  }
  return ctx;
};
