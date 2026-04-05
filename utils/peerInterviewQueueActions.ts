import type { Dispatch, SetStateAction } from 'react';
import { mockGoogleMeetLink } from '../data/peerInterviewMockData';
import { sendFreelancerMessage } from '../services/freelancerInteractionsApi';
import type { PeerConnectionOffer, PeerWaitlistEntry } from '../types/peerInterviewQueue';

export async function acceptPeerInterviewConnection(
  waitlist: PeerWaitlistEntry[],
  setWaitlist: Dispatch<SetStateAction<PeerWaitlistEntry[]>>,
  requestId: string,
  connectionId: string,
  viewerUserId: string | null,
  onNavigateToPeerChat?: (otherUserId: string) => void,
  /** When false (default), meet link + chat unlock in UI; user opens Messages via Chat. */
  navigateToChatAfterAccept = false,
): Promise<void> {
  const entry = waitlist.find((w) => w.id === requestId);
  const conn = entry?.connections?.find((c) => c.id === connectionId);
  const otherUserId = conn?.fromUserId ?? null;
  const link = mockGoogleMeetLink(`${requestId}-${connectionId}`);

  setWaitlist((prev) =>
    prev.map((w) => {
      if (w.id !== requestId) return w;
      return {
        ...w,
        connections: (w.connections ?? []).map((c) =>
          c.id === connectionId ? { ...c, status: 'accepted' as const, meetLink: link } : c,
        ),
      };
    }),
  );

  if (viewerUserId && otherUserId) {
    try {
      await sendFreelancerMessage(
        viewerUserId,
        otherUserId,
        "Hi — I've accepted your peer interview request on CodeXCareer. Let's coordinate here.",
      );
    } catch (e) {
      console.error('Peer accept: could not send intro message', e);
    }
  }

  if (navigateToChatAfterAccept && otherUserId && onNavigateToPeerChat) {
    onNavigateToPeerChat(otherUserId);
  }
}

export function formatPeerRequestedAt(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function appendPeerConnectionOffer(
  setWaitlist: Dispatch<SetStateAction<PeerWaitlistEntry[]>>,
  targetId: string,
  offer: PeerConnectionOffer,
): void {
  setWaitlist((prev) =>
    prev.map((w) => (w.id === targetId ? { ...w, connections: [...(w.connections ?? []), offer] } : w)),
  );
}
