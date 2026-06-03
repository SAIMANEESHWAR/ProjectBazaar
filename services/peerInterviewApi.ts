import type { PeerInterviewCategoryId } from '../data/peerInterviewMockData';
import type { PeerConnectionOffer, PeerWaitlistEntry } from '../types/peerInterviewQueue';
import { cachedFetchUserProfile } from './buyerApi';

export const PEER_INTERVIEW_API_URL =
  import.meta.env.VITE_PEER_INTERVIEW_API_URL ||
  'https://3moxuvhor9.execute-api.ap-south-2.amazonaws.com/default/Peer_to_peer_Interview';

const VALID_CATEGORIES: PeerInterviewCategoryId[] = [
  'pm',
  'dsa',
  'system-design',
  'behavioral',
  'sql',
  'dsml',
  'frontend',
];

function coerceCategory(c: unknown): PeerInterviewCategoryId {
  if (typeof c === 'string' && (VALID_CATEGORIES as string[]).includes(c)) {
    return c as PeerInterviewCategoryId;
  }
  return 'behavioral';
}

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

/**
 * Settings → profile picture is stored as `profilePictureUrl` (S3) on Get_user_Details_by_his_Id.
 * Aligns with ChatRoom and Sidebar resolution order.
 */
export function extractProfilePhotoUrl(profile: unknown): string | undefined {
  if (!profile || typeof profile !== 'object') return undefined;
  const p = profile as Record<string, unknown>;
  const candidates = [
    p.profilePictureUrl,
    p.profilePicture,
    p.profileImage,
    p.avatarUrl,
    p.avatarURL,
    p.avatar,
    p.photoURL,
    p.picture,
    p.imageUrl,
  ];
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const u = c.trim();
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  }
  return undefined;
}

export type PeerInterviewApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  body?: T;
  error?: string;
};

/** POST JSON to peer Lambda; always sends x-user-id. */
export async function postPeerInterview<T = unknown>(
  userId: string,
  payload: Record<string, unknown>,
): Promise<PeerInterviewApiResult<T>> {
  if (!PEER_INTERVIEW_API_URL) {
    return { ok: false, status: 0, error: 'VITE_PEER_INTERVIEW_API_URL not set' };
  }
  try {
    const res = await fetch(PEER_INTERVIEW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ ...payload, userId: payload.userId ?? userId }),
    });
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return { ok: false, status: res.status, error: text || res.statusText };
    }
    if (!res.ok || json.success === false) {
      const err =
        (typeof json.error === 'string' && json.error) ||
        (typeof json.message === 'string' && json.message) ||
        `HTTP ${res.status}`;
      return { ok: false, status: res.status, body: json as T, error: err };
    }
    return { ok: true, status: res.status, body: json as T };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, error: msg };
  }
}

function mapConnectionStatus(row: Record<string, unknown>): PeerConnectionOffer['status'] {
  const s = String(row.status ?? '').toLowerCase();
  if (s === 'accepted') return 'accepted';
  if (s === 'rejected') return 'rejected';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'pending';
}

function mapConnection(row: Record<string, unknown>): PeerConnectionOffer {
  const slots = Array.isArray(row.slots) ? (row.slots as unknown[]).map(String) : [];
  return {
    id: String(row.connectionId ?? row.id ?? ''),
    fromName: String(row.fromName ?? ''),
    slots,
    status: mapConnectionStatus(row),
    meetLink: typeof row.meetLink === 'string' ? row.meetLink : undefined,
    fromUserId: typeof row.fromUserId === 'string' ? row.fromUserId : undefined,
    requestedAt: typeof row.requestedAt === 'string' ? row.requestedAt : undefined,
  };
}

/** Outbound row (MY_OUTGOING) → same shape as a connection for merging onto a public listing card. */
function mapOutboundToOffer(row: Record<string, unknown>, viewerId: string): PeerConnectionOffer {
  const slots = Array.isArray(row.slots) ? (row.slots as unknown[]).map(String) : [];
  return {
    id: String(row.connectionId ?? row.id ?? ''),
    fromName: String(row.fromName ?? 'You'),
    slots,
    status: mapConnectionStatus(row),
    meetLink: typeof row.meetLink === 'string' ? row.meetLink : undefined,
    fromUserId: viewerId,
    requestedAt: typeof row.requestedAt === 'string' ? row.requestedAt : undefined,
  };
}

async function fetchMyOutgoingRows(userId: string): Promise<Record<string, unknown>[]> {
  const res = await postPeerInterview<ListPayload>(userId, {
    action: 'MY_OUTGOING_REQUESTS',
    userId,
  });
  if (!res.ok) return [];
  const rows = (res.body?.data as unknown[]) ?? [];
  return rows.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object');
}

function mergeOutgoingOntoEntries(
  entries: PeerWaitlistEntry[],
  viewerId: string,
  outgoingRows: Record<string, unknown>[],
): PeerWaitlistEntry[] {
  const byListing = new Map<string, PeerConnectionOffer[]>();
  for (const raw of outgoingRows) {
    const lid = typeof raw.listingId === 'string' ? raw.listingId : '';
    if (!lid) continue;
    const offer = mapOutboundToOffer(raw, viewerId);
    if (!offer.id) continue;
    if (!byListing.has(lid)) byListing.set(lid, []);
    byListing.get(lid)!.push(offer);
  }
  const mapped = entries.map((e) => {
    if (e.isMine) return e;
    const extra = byListing.get(e.id);
    if (!extra?.length) return e;
    const existing = e.connections ?? [];
    const seen = new Set(existing.map((c) => c.id));
    const merged = [...existing];
    for (const o of extra) {
      if (!seen.has(o.id)) {
        merged.push(o);
        seen.add(o.id);
      }
    }
    return { ...e, connections: merged };
  });
  const seenListingIds = new Set(mapped.map((e) => e.id));
  for (const raw of outgoingRows) {
    const lid = typeof raw.listingId === 'string' ? raw.listingId : '';
    if (!lid || seenListingIds.has(lid)) continue;
    const conn = mapOutboundToOffer(raw, viewerId);
    if (!conn.id) continue;
    const displayName =
      typeof raw.ownerName === 'string' && raw.ownerName.trim() ? raw.ownerName : 'Peer';
    const listingTitle =
      typeof raw.listingTitle === 'string' && raw.listingTitle.trim()
        ? raw.listingTitle
        : `Request to ${displayName}`;
    mapped.push({
      id: lid,
      displayName,
      category: 'behavioral',
      skills: 'Peer request',
      waitingSince:
        typeof conn.requestedAt === 'string' && conn.requestedAt
          ? `Requested ${conn.requestedAt.slice(0, 10)}`
          : 'Requested',
      isMine: false,
      practiceMode: 'peers',
      practiceGoal: listingTitle,
      connections: [conn],
      ownerUserId: typeof raw.ownerUserId === 'string' ? raw.ownerUserId : undefined,
      isPublic: false,
      peerQueueExcluded: true,
    });
    seenListingIds.add(lid);
  }
  return mapped;
}

function mapListingRow(
  row: Record<string, unknown>,
  isMine: boolean,
  connections: PeerConnectionOffer[],
): PeerWaitlistEntry {
  const listingId = String(row.listingId ?? row.id ?? '');
  const displayName = String(row.displayName ?? 'Peer');
  const created = typeof row.createdAt === 'string' ? row.createdAt : '';
  return {
    id: listingId,
    displayName,
    category: coerceCategory(row.category),
    skills: String(row.skills ?? ''),
    waitingSince: created ? `Listed ${created.slice(0, 10)}` : 'In queue',
    isPublic: typeof row.isPublic === 'boolean' ? row.isPublic : true,
    experienceLevel: row.experienceLevel as PeerWaitlistEntry['experienceLevel'],
    timezoneRegion: row.timezoneRegion as PeerWaitlistEntry['timezoneRegion'],
    techTags: Array.isArray(row.techTags) ? (row.techTags as string[]) : undefined,
    availabilityWindows: Array.isArray(row.availabilityWindows)
      ? (row.availabilityWindows as string[])
      : undefined,
    practiceGoal: typeof row.practiceGoal === 'string' ? row.practiceGoal : undefined,
    roleTitle: typeof row.roleTitle === 'string' ? row.roleTitle : undefined,
    orgOrContext: typeof row.orgOrContext === 'string' ? row.orgOrContext : undefined,
    queueIntent: typeof row.queueIntent === 'string' ? row.queueIntent : undefined,
    bio: typeof row.bio === 'string' ? row.bio : undefined,
    mockInterviewRounds: Array.isArray(row.mockInterviewRounds)
      ? (row.mockInterviewRounds as string[])
      : undefined,
    preferredLanguages: Array.isArray(row.preferredLanguages)
      ? (row.preferredLanguages as string[])
      : ['English'],
    isMine,
    practiceMode: row.practiceMode === 'friend' ? 'friend' : 'peers',
    connections,
    ownerUserId: typeof row.ownerUserId === 'string' ? row.ownerUserId : undefined,
    avatarUrl:
      typeof row.avatarUrl === 'string'
        ? row.avatarUrl
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=256&background=0f172a&color=ffffff&bold=true`,
  };
}

type ListPayload = { success?: boolean; data?: unknown[] };

function avatarLooksPlaceholder(url: string | undefined): boolean {
  const u = (url ?? '').trim();
  return !u || u.includes('ui-avatars.com/api');
}

function ownerIdForProfileFetch(e: PeerWaitlistEntry, viewerId: string): string | null {
  if (e.isMine) return viewerId;
  return e.ownerUserId ?? null;
}

/** Fill avatarUrl from Get_user_Details (e.g. profilePictureUrl) when Dynamo/listing has no real image. */
async function enrichListingAvatarsFromProfiles(
  entries: PeerWaitlistEntry[],
  viewerId: string,
): Promise<PeerWaitlistEntry[]> {
  const byUid = new Map<string, PeerWaitlistEntry[]>();
  for (const e of entries) {
    if (!avatarLooksPlaceholder(e.avatarUrl)) continue;
    const uid = ownerIdForProfileFetch(e, viewerId);
    if (!uid) continue;
    if (!byUid.has(uid)) byUid.set(uid, []);
    byUid.get(uid)!.push(e);
  }
  if (byUid.size === 0) return entries;

  const photoByUid = new Map<string, string>();
  await Promise.all(
    [...byUid.keys()].map(async (uid) => {
      try {
        const prof = await cachedFetchUserProfile(uid);
        const url = extractProfilePhotoUrl(prof);
        if (url) photoByUid.set(uid, url);
      } catch {
        /* ignore */
      }
    }),
  );
  if (photoByUid.size === 0) return entries;

  return entries.map((e) => {
    if (!avatarLooksPlaceholder(e.avatarUrl)) return e;
    const uid = ownerIdForProfileFetch(e, viewerId);
    if (!uid) return e;
    const url = photoByUid.get(uid);
    if (!url) return e;
    return { ...e, avatarUrl: url };
  });
}

/** Load my listings (with connections) + public listings from DynamoDB via Lambda. */
export async function refreshPeerWaitlist(userId: string): Promise<{
  entries: PeerWaitlistEntry[];
  error?: string;
}> {
  const mineRes = await postPeerInterview<ListPayload>(userId, {
    action: 'LIST_MY_LISTINGS',
    userId,
  });
  if (!mineRes.ok) {
    return { entries: [], error: mineRes.error };
  }

  const mineRows = (mineRes.body?.data as unknown[]) ?? [];
  const entries: PeerWaitlistEntry[] = [];

  for (const raw of mineRows) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const lid = String(row.listingId ?? '');
    if (!lid) continue;

    const connRes = await postPeerInterview<ListPayload>(userId, {
      action: 'LIST_CONNECTIONS',
      listingId: lid,
      userId,
    });
    const connRows = connRes.ok ? ((connRes.body?.data as unknown[]) ?? []) : [];
    const connections = connRows
      .filter((c): c is Record<string, unknown> => c != null && typeof c === 'object')
      .map((c) => mapConnection(c));

    entries.push(mapListingRow(row, true, connections));
  }

  const pubRes = await postPeerInterview<ListPayload>(userId, {
    action: 'LIST_PUBLIC_LISTINGS',
    userId,
  });
  if (pubRes.ok) {
    const pubRows = (pubRes.body?.data as unknown[]) ?? [];
    const mineIds = new Set(entries.map((e) => e.id));
    for (const raw of pubRows) {
      if (!raw || typeof raw !== 'object') continue;
      const row = raw as Record<string, unknown>;
      const lid = String(row.listingId ?? '');
      if (!lid || mineIds.has(lid)) continue;
      if (String(row.ownerUserId ?? '') === userId) continue;
      entries.push(mapListingRow(row, false, []));
    }
  }

  const enriched = await enrichListingAvatarsFromProfiles(entries, userId);
  const outgoingRows = await fetchMyOutgoingRows(userId);
  const withOutgoing = mergeOutgoingOntoEntries(enriched, userId, outgoingRows);
  return { entries: withOutgoing };
}

type MutationPayload = { success?: boolean; data?: Record<string, unknown> };

export async function createPeerConnection(
  userId: string,
  listingId: string,
  opts: { fromName: string; slots: string[] },
): Promise<{ ok: boolean; error?: string; connectionId?: string }> {
  const slots = opts.slots.map((s) => s.trim()).filter(Boolean);
  if (!slots.length) {
    return { ok: false, error: 'Select or enter at least one time slot' };
  }
  const res = await postPeerInterview<MutationPayload>(userId, {
    action: 'CREATE_CONNECTION',
    listingId,
    fromName: opts.fromName,
    slots,
  });
  if (!res.ok) return { ok: false, error: res.error };
  const data = res.body?.data;
  const cid =
    data && typeof data.connectionId === 'string' ? data.connectionId : undefined;
  return { ok: true, connectionId: cid };
}

export async function patchPeerConnection(
  userId: string,
  listingId: string,
  connectionId: string,
  body: { status: 'accept' | 'reject' | 'cancel'; meetLink?: string },
): Promise<{ ok: boolean; error?: string; meetLink?: string }> {
  const res = await postPeerInterview<MutationPayload>(userId, {
    action: 'UPDATE_CONNECTION',
    listingId,
    connectionId,
    status: body.status,
    ...(body.meetLink ? { meetLink: body.meetLink } : {}),
  });
  if (!res.ok) return { ok: false, error: res.error };
  const data = res.body?.data;
  const ml = data && typeof data.meetLink === 'string' ? data.meetLink : undefined;
  return { ok: true, meetLink: ml };
}

export async function updatePeerListing(
  userId: string,
  listingId: string,
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const res = await postPeerInterview<MutationPayload>(userId, {
    action: 'UPDATE_LISTING',
    listingId,
    ...patch,
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
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
  const profilePhoto = extractProfilePhotoUrl(profile);

  const displayName =
    profileName != null ? `${profileName} (you)` : (entry.displayName ?? `${userId.slice(0, 8)} (you)`);

  const avatarUrl = entry.avatarUrl?.trim() || profilePhoto;

  return {
    action: 'CREATE_LISTING',
    ownerUserId: userId,
    listingId: entry.id,
    displayName,
    ...(avatarUrl ? { avatarUrl } : {}),
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

export async function syncPeerListingToBackend(
  userId: string,
  entry: PeerWaitlistEntry & { id: string },
): Promise<{ ok: boolean; error?: string }> {
  const body = await buildCreateListingPayload(userId, entry);
  const res = await postPeerInterview(userId, body);
  if (!res.ok) {
    console.error('Peer interview API sync failed', res.status, res.error);
    return { ok: false, error: res.error };
  }
  return { ok: true };
}

/** Quick health check: list my listings (empty array = OK if table exists). */
export async function testPeerInterviewApi(userId: string): Promise<{
  ok: boolean;
  listingCount?: number;
  error?: string;
}> {
  const r = await postPeerInterview<ListPayload>(userId, { action: 'LIST_MY_LISTINGS', userId });
  if (!r.ok) {
    return { ok: false, error: r.error };
  }
  const n = ((r.body?.data as unknown[]) ?? []).length;
  return { ok: true, listingCount: n };
}
