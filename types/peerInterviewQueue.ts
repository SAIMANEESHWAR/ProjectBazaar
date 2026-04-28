import type { MockWaitlistEntry } from '../data/peerInterviewMockData';

export interface PeerConnectionOffer {
  id: string;
  fromName: string;
  slots: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  meetLink?: string;
  fromUserId?: string;
  requestedAt?: string;
}

export interface PeerWaitlistEntry extends MockWaitlistEntry {
  /** Listing owner — from API; use with profile fetch when you need fresh photo/details. */
  ownerUserId?: string;
  isMine?: boolean;
  practiceMode?: 'peers' | 'friend';
  connections?: PeerConnectionOffer[];
  /** From API; false when listing is closed (e.g. after a match). */
  isPublic?: boolean;
  /**
   * Outbound-only stub when the listing is no longer in the public scan but My requests / History
   * still needs the row. Must not appear on Interview with peer → queue.
   */
  peerQueueExcluded?: boolean;
}
