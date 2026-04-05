import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Inbox,
  Layers,
  Link2,
  MessageCircle,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { useAuth, useNavigation } from '../App';
import { useDashboard } from '../context/DashboardContext';
import { usePeerInterviewQueue } from '../context/PeerInterviewQueueContext';
import {
  labelForPeerCategory,
  PEER_EXPERIENCE_LEVEL_OPTIONS,
  PEER_TIMEZONE_REGION_OPTIONS,
  type PeerExperienceLevelId,
  type PeerInterviewCategoryId,
  type PeerTimezoneRegionId,
} from '../data/peerInterviewMockData';
import {
  acceptPeerInterviewConnection,
  formatPeerRequestedAt,
} from '../utils/peerInterviewQueueActions';
import type { PeerConnectionOffer } from '../types/peerInterviewQueue';

type IncomingRow = PeerConnectionOffer & { listingId: string; listingTitle: string };

function regionShort(id: PeerTimezoneRegionId | undefined): string {
  if (!id) return '—';
  return PEER_TIMEZONE_REGION_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function experienceShort(id: PeerExperienceLevelId | undefined): string {
  if (!id) return '—';
  return PEER_EXPERIENCE_LEVEL_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

const thBase =
  'px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/60';
const tdBase =
  'px-3 py-3 text-xs text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800/80 align-top';

/** Matches PeerInterviewSection / peer queue shell */
const PAGE_SURFACE =
  'relative w-full min-w-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-gray-950 dark:via-slate-950 dark:to-gray-950 rounded-3xl border border-gray-200/90 dark:border-gray-800 shadow-sm overflow-hidden';

const PeerInterviewRequestsDashboard: React.FC<{ toggleSidebar?: () => void }> = ({ toggleSidebar }) => {
  const { userId } = useAuth();
  const { setActiveView } = useDashboard();
  const { navigateTo } = useNavigation();
  const { waitlist, setWaitlist, refreshWaitlistFromBackend, peerWaitlistBackendError } =
    usePeerInterviewQueue();

  const [membersModalListingId, setMembersModalListingId] = useState<string | null>(null);

  const modalListing = useMemo(
    () => (membersModalListingId ? waitlist.find((w) => w.id === membersModalListingId) ?? null : null),
    [membersModalListingId, waitlist],
  );

  const modalConnections = useMemo(() => {
    if (!modalListing) return [];
    return modalListing.connections ?? [];
  }, [modalListing]);

  const modalConnectionStats = useMemo(() => {
    const pending = modalConnections.filter((c) => c.status === 'pending').length;
    const accepted = modalConnections.filter((c) => c.status === 'accepted').length;
    return { total: modalConnections.length, pending, accepted };
  }, [modalConnections]);

  useEffect(() => {
    if (!membersModalListingId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMembersModalListingId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [membersModalListingId]);

  const handleNavigateToPeerChat = useCallback(
    (otherUserId: string) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('bazaar_open_chat_user_id', otherUserId);
      }
      setActiveView('messages');
      navigateTo('dashboard');
    },
    [setActiveView, navigateTo],
  );

  const incomingRequests = useMemo(() => {
    const rows: IncomingRow[] = [];
    for (const w of waitlist) {
      if (!w.isMine) continue;
      const listingTitle = w.practiceGoal ?? w.displayName;
      for (const c of w.connections ?? []) {
        rows.push({ ...c, listingId: w.id, listingTitle });
      }
    }
    rows.sort(
      (a, b) => new Date(b.requestedAt ?? 0).getTime() - new Date(a.requestedAt ?? 0).getTime(),
    );
    return rows;
  }, [waitlist]);

  const myListings = useMemo(() => waitlist.filter((w) => w.isMine), [waitlist]);

  const stats = useMemo(() => {
    const pending = incomingRequests.filter((r) => r.status === 'pending').length;
    const accepted = incomingRequests.filter((r) => r.status === 'accepted').length;
    const totalSlots = incomingRequests.reduce((acc, r) => acc + r.slots.length, 0);
    return {
      total: incomingRequests.length,
      pending,
      accepted,
      listings: myListings.length,
      totalSlots,
    };
  }, [incomingRequests, myListings.length]);

  const onAccept = (listingId: string, connectionId: string) => {
    void acceptPeerInterviewConnection(
      waitlist,
      setWaitlist,
      listingId,
      connectionId,
      userId,
      handleNavigateToPeerChat,
    );
  };

  const openChat = (otherUserId: string | undefined) => {
    if (otherUserId) handleNavigateToPeerChat(otherUserId);
  };

  const closeMembersModal = () => setMembersModalListingId(null);

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto px-0 sm:px-2 lg:px-4 pb-10">
      <div className={PAGE_SURFACE}>
        <div className="sticky top-0 z-10 border-b border-gray-200/80 dark:border-gray-800 bg-gradient-to-b from-white via-slate-50/95 to-slate-50/90 dark:from-gray-950 dark:via-slate-950 dark:to-slate-950 backdrop-blur-sm">
          <div className="px-4 sm:px-5 pt-3 pb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {toggleSidebar && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open menu"
              >
                <Layers className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#f97316] dark:hover:text-orange-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 shrink-0 opacity-80" strokeWidth={2} />
              Back to dashboard
            </button>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={() => setActiveView('live-mock-interview')}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#f97316] dark:hover:text-orange-400 transition-colors sm:ml-0"
            >
              Interview with peer
            </button>
          </div>

          {peerWaitlistBackendError && userId && (
            <div className="px-4 sm:px-5 pb-3">
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 px-3 py-2.5 flex flex-wrap items-center gap-2 justify-between">
                <p className="text-xs text-amber-900 dark:text-amber-100 leading-snug min-w-0 flex-1">
                  Peer queue sync: {peerWaitlistBackendError}. Create a DynamoDB table{' '}
                  <code className="text-[10px] bg-white/60 dark:bg-black/20 px-1 rounded">PeerInterview</code> (pk/sk
                  strings) and set Lambda env{' '}
                  <code className="text-[10px] bg-white/60 dark:bg-black/20 px-1 rounded">PEER_INTERVIEW_TABLE</code>.
                </p>
                <button
                  type="button"
                  onClick={() => void refreshWaitlistFromBackend(userId)}
                  className="shrink-0 text-xs font-bold text-amber-900 dark:text-amber-100 underline hover:no-underline"
                >
                  Retry load
                </button>
              </div>
            </div>
          )}

          <div className="px-4 sm:px-5 pt-2 pb-4">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/90 dark:border-orange-800/80 bg-orange-50/90 dark:bg-orange-950/35 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-800 dark:text-orange-200">
                    <Inbox className="w-3 h-3" />
                    My requests
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Peer connection inbox
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-1 max-w-2xl">
                  Same queue as <span className="font-semibold text-gray-800 dark:text-gray-200">Interview with peer</span>
                  — see who reached out, when, and accept to unlock Meet and Messages.
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-5 pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Incoming', value: stats.total, sub: 'Total requests', icon: Inbox },
                { label: 'Awaiting you', value: stats.pending, sub: 'Your decision', icon: Clock },
                { label: 'Accepted', value: stats.accepted, sub: 'Unlocked', icon: CheckCircle2 },
                { label: 'Listings', value: stats.listings, sub: `${stats.totalSlots} slot lines`, icon: Users },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 sm:px-4 sm:py-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {card.label}
                    </span>
                    <card.icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" strokeWidth={2} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums text-gray-900 dark:text-white leading-none">
                    {card.value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">
                    {card.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-5 sm:py-6">
          <div className="w-full max-w-none space-y-3">
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#f97316]" strokeWidth={2} />
              Your listings &amp; connects
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
              One row per <span className="font-semibold text-gray-700 dark:text-gray-300">your listing</span>.{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">View members</span> when someone connects;{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">Peer queue</span> returns to Live interview →
              Peer. Accept first, then Chat and Meet unlock per member.
            </p>
            <div className="rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden ring-1 ring-orange-100/60 dark:ring-orange-950/40">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={thBase}>Your listing</th>
                      <th className={thBase}>Track</th>
                      <th className={`${thBase} text-center w-[5rem]`}>Connects</th>
                      <th className={`${thBase} min-w-[10rem]`}>Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myListings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center align-middle">
                          <Inbox className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" strokeWidth={1.5} />
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">No listings yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
                            Schedule a peer listing from Live interview → Peer. Connects show here; use View members to pick
                            who to accept.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveView('live-mock-interview')}
                            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f97316] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold px-4 py-2.5 shadow-md shadow-orange-500/20"
                          >
                            Go to peer queue
                          </button>
                        </td>
                      </tr>
                    ) : (
                      myListings.map((w) => {
                        const title = w.practiceGoal ?? w.displayName;
                        const cat = w.category;
                        const n = w.connections?.length ?? 0;
                        return (
                          <tr
                            key={w.id}
                            className="hover:bg-orange-50/40 dark:hover:bg-orange-950/10 transition-colors border-b border-gray-100 dark:border-gray-800/80"
                          >
                            <td className={tdBase}>
                              <div className="min-w-[8rem] max-w-[18rem]">
                                <p className="font-semibold text-gray-900 dark:text-white leading-snug">{title}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                  {regionShort(w.timezoneRegion)} · {experienceShort(w.experienceLevel)}
                                  {w.roleTitle ? ` · ${w.roleTitle}` : ''}
                                </p>
                              </div>
                            </td>
                            <td className={tdBase}>
                              {cat ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-200 border border-orange-100 dark:border-orange-900/50 whitespace-nowrap">
                                  {labelForPeerCategory(cat as PeerInterviewCategoryId)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className={`${tdBase} text-center`}>
                              <span className="inline-flex min-w-[1.75rem] justify-center rounded-lg bg-gray-100 dark:bg-gray-800 px-2 py-1 text-[11px] font-bold tabular-nums text-gray-900 dark:text-white">
                                {n}
                              </span>
                            </td>
                            <td className={tdBase}>
                              {n > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setMembersModalListingId(w.id)}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/90 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 px-3 py-2 text-[11px] font-bold hover:bg-orange-100/80 dark:hover:bg-orange-950/45 transition-colors"
                                >
                                  <Users className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                  View members
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActiveView('live-mock-interview')}
                                  className="inline-flex justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                                >
                                  Peer queue
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalListing && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="members-modal-title"
          onClick={closeMembersModal}
        >
          <div
            className="w-full sm:max-w-3xl max-h-[min(90dvh,720px)] sm:rounded-2xl rounded-t-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="min-w-0">
                <h2 id="members-modal-title" className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  Connected members
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {modalListing.practiceGoal ?? modalListing.displayName}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80 px-2 py-1 text-[10px] font-bold tabular-nums text-gray-700 dark:text-gray-200">
                    <Users className="w-3 h-3 text-[#f97316]" strokeWidth={2} />
                    {modalConnectionStats.total} in list · {modalConnectionStats.pending} pending ·{' '}
                    {modalConnectionStats.accepted} accepted
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                  Accept first to generate the meet link and unlock Chat for that member.
                </p>
              </div>
              <button
                type="button"
                onClick={closeMembersModal}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-3 sm:px-4 py-3">
              {modalConnections.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10 px-4 leading-relaxed">
                  No one has connected yet — stay visible in the peer queue from Live interview → Peer.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full min-w-[480px] sm:min-w-[560px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/90 dark:bg-gray-800/60">
                        <th className={thBase} scope="col">
                          Member
                        </th>
                        <th className={thBase} scope="col">
                          Requested
                        </th>
                        <th className={`${thBase} min-w-[11rem]`} scope="col">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalConnections.map((c) => {
                        const initials = c.fromName
                          .split(/\s+/)
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();
                        const canAccept = c.status === 'pending';
                        const canChat = c.status === 'accepted' && !!c.fromUserId;
                        const showPostAcceptActions = c.status === 'accepted';
                        return (
                          <tr
                            key={c.id}
                            className="border-b border-gray-100 dark:border-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                          >
                            <td className="px-3 py-3 align-middle">
                              <div className="flex items-center gap-2.5 min-w-0 max-w-[14rem]">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-slate-700 dark:text-white text-[10px] font-bold shrink-0">
                                  {initials}
                                </div>
                                <p className="font-semibold text-gray-900 dark:text-white leading-snug min-w-0">
                                  {c.fromName}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle whitespace-nowrap text-gray-600 dark:text-gray-300">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
                                {formatPeerRequestedAt(c.requestedAt)}
                              </span>
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {c.status === 'pending' && (
                                  <button
                                    type="button"
                                    disabled={!canAccept}
                                    title={`Accept ${c.fromName} — meet link and chat appear after.`}
                                    onClick={() => {
                                      if (modalListing && canAccept) {
                                        void onAccept(modalListing.id, c.id);
                                      }
                                    }}
                                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide hover:bg-gray-800 dark:hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                    Accept
                                  </button>
                                )}
                                {showPostAcceptActions && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={!canChat}
                                      title={
                                        !c.fromUserId
                                          ? 'No user id for chat.'
                                          : `Chat with ${c.fromName}`
                                      }
                                      onClick={() => openChat(c.fromUserId)}
                                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/90 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 px-2.5 py-1.5 text-[10px] font-bold hover:bg-orange-100/80 dark:hover:bg-orange-950/45 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                      Chat
                                    </button>
                                    {c.meetLink ? (
                                      <a
                                        href={c.meetLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                      >
                                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                                        Meet
                                      </a>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
                                        Meet link pending…
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-3 sm:px-5 flex flex-wrap gap-2 justify-end bg-gray-50/80 dark:bg-gray-900/80">
              <button
                type="button"
                onClick={closeMembersModal}
                className="inline-flex justify-center rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerInterviewRequestsDashboard;
