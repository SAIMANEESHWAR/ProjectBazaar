import type { PeerWaitlistEntry } from '../types/peerInterviewQueue';
import { cachedFetchUserProfile } from './buyerApi';

const PEER_INTERVIEW_API_URL =
  import.meta.env.VITE_PEER_INTERVIEW_API_URL ||
  'https://3moxuvhor9.execute-api.ap-south-2.amazonaws.com/default/Peer_to_peer_Interview';

function pickProfileName(profile: Record<string, unknown> | null): string | undefined {
  if (!profile) return undefined;
  const n = profile.name ?? profile.displayName ?? profile.fullName;
  return typeof n === 'string' && n.trim() ? n.trim() : undefined;
}

function pickProfileBio(profile: Record<string, unknown> | null): string | undefined {
  if (!profile) return undefined;
  const b = profile.bio ?? profile.about ?? profile.summary;
  return typeof b === 'string' && b.trim() ? b.trim() : undefined;
}

/** Maps local waitlist entry + optional Users-table profile to Lambda CREATE_LISTING body. */
export async function buildCreateListingPayload(
  userId: string,
  entry: PeerWaitlistEntry & { id: string },
): Promise<Record<string, unknown>> {
  let profile: Record<string, unknown> | null = null;
  try {
    const raw = await cachedFetchUserProfile(userId);
    profile = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  } catch {
    profile = null;
  }

  const profileName = pickProfileName(profile);
  const profileBio = pickProfileBio(profile);

  const displayName =
    profileName != null ? `${profileName} (you)` : (entry.displayName ?? `${userId.slice(0, 8)} (you)`);

  return {
    action: 'CREATE_LISTING',
    ownerUserId: userId,
    listingId: entry.id,
    displayName,
    practiceGoal: entry.practiceGoal,
    category: entry.category,
    skills: entry.skills,
    experienceLevel: entry.experienceLevel,
    timezoneRegion: entry.timezoneRegion,
    practiceMode: entry.practiceMode ?? 'peers',
    roleTitle: entry.roleTitle,
    orgOrContext: entry.orgOrContext,
    techTags: entry.techTags ?? [],
    availabilityWindows: entry.availabilityWindows ?? [],
    queueIntent: entry.queueIntent,
    bio: entry.bio && entry.bio.length > 0 ? entry.bio : profileBio ?? entry.bio,
    isPublic: entry.practiceMode !== 'friend',
  };
}

/**
 * Persists a listing to Peer_to_peer_Interview Lambda (DynamoDB).
 * Requires table `PeerInterview` (pk/sk) in the same region as the API unless env overrides.
 */
export async function syncPeerListingToBackend(
  userId: string,
  entry: PeerWaitlistEntry & { id: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!PEER_INTERVIEW_API_URL) {
    return { ok: false, error: 'VITE_PEER_INTERVIEW_API_URL not set' };
  }
  const body = await buildCreateListingPayload(userId, entry);
  try {
    const res = await fetch(PEER_INTERVIEW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: { success?: boolean; error?: string } = {};
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      data = { error: text || res.statusText };
    }
    if (!res.ok || data.success === false) {
      console.error('Peer interview API sync failed', res.status, data);
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Peer interview API sync error', e);
    return { ok: false, error: msg };
  }
}
