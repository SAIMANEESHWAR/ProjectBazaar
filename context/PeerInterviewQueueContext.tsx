import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { PeerWaitlistEntry } from '../types/peerInterviewQueue';

export type { PeerConnectionOffer, PeerWaitlistEntry } from '../types/peerInterviewQueue';

interface PeerInterviewQueueContextValue {
  waitlist: PeerWaitlistEntry[];
  setWaitlist: React.Dispatch<React.SetStateAction<PeerWaitlistEntry[]>>;
}

const PeerInterviewQueueContext = createContext<PeerInterviewQueueContextValue | undefined>(undefined);

export const PeerInterviewQueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [waitlist, setWaitlist] = useState<PeerWaitlistEntry[]>(() => []);

  return (
    <PeerInterviewQueueContext.Provider value={{ waitlist, setWaitlist }}>{children}</PeerInterviewQueueContext.Provider>
  );
};

export const usePeerInterviewQueue = (): PeerInterviewQueueContextValue => {
  const ctx = useContext(PeerInterviewQueueContext);
  if (!ctx) {
    throw new Error('usePeerInterviewQueue must be used within PeerInterviewQueueProvider');
  }
  return ctx;
};
