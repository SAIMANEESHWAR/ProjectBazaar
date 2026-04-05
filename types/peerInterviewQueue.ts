import type { MockWaitlistEntry } from '../data/peerInterviewMockData';

export interface PeerConnectionOffer {
  id: string;
  fromName: string;
  slots: string[];
  status: 'pending' | 'accepted';
  meetLink?: string;
  fromUserId?: string;
  requestedAt?: string;
}

export interface PeerWaitlistEntry extends MockWaitlistEntry {
  isMine?: boolean;
  practiceMode?: 'peers' | 'friend';
  connections?: PeerConnectionOffer[];
}
