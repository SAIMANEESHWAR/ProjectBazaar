import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../App';
import { useSocket } from '../context/SocketContext';
import { useMessagesUnread } from '../context/MessagesUnreadContext';
import {
    getUserInteractions,
    getSentInteractions,
    getConversation,
    sendFreelancerMessage,
    updateInteractionStatus,
    type Interaction,
} from '../services/freelancerInteractionsApi';
import { GET_USER_DETAILS_ENDPOINT } from '../services/buyerApi';
import { playMessageSent, playMessageReceived } from '../utils/sounds';
import {
    MessageCircle,
    MoreVertical,
    SendHorizontal,
    Check,
    CircleDot,
    MessageSquare,
} from 'lucide-react';

interface ConversationMeta {
    otherUserId: string;
    otherUserName: string;
    otherUserImage: string | null;
    lastMessage: string;
    lastAt: string;
    unreadCount: number;
}

const resolveUser = async (userId: string): Promise<{ name: string; image: string | null }> => {
    try {
        const res = await fetch(GET_USER_DETAILS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        const user = data.data || data.user || data;
        if (user) {
            const img = user.profilePictureUrl ?? user.profilePicture ?? user.profileImage ?? user.avatar ?? user.photoURL ?? null;
            return { name: user.fullName || user.name || user.email?.split('@')[0] || 'User', image: img || null };
        }
    } catch {
        // ignore
    }
    return { name: 'Unknown User', image: null };
};

const ChatRoom: React.FC = () => {
    const { userId } = useAuth();
    const { subscribe, isConnected } = useSocket();
    const { refreshUnread } = useMessagesUnread();

    const [conversations, setConversations] = useState<ConversationMeta[]>([]);
    const [invitations, setInvitations] = useState<Interaction[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Interaction[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUserMeta, setCurrentUserMeta] = useState<{ name: string; image: string | null }>({ name: '', image: null });
    const threadEndRef = useRef<HTMLDivElement>(null);
    const selectedNameRef = useRef<string>('');

    const loadConversations = useCallback(async () => {
        if (!userId) return;
        setLoadingList(true);
        try {
            const [received, sent] = await Promise.all([
                getUserInteractions(userId),
                getSentInteractions(userId),
            ]);
            const invitationsList = (received.interactions || []).filter((i) => i.type === 'invitation');
            setInvitations(invitationsList);

            const messageInteractions = [
                ...(received.interactions || []).filter((i) => i.type === 'message'),
                ...(sent.interactions || []).filter((i) => i.type === 'message'),
            ];
            const byOther: Record<string, { last: Interaction; unread: number }> = {};
            for (const m of messageInteractions) {
                const other = m.senderId === userId ? m.receiverId! : m.senderId;
                const existing = byOther[other];
                const isIncoming = m.receiverId === userId;
                const unread = isIncoming && (m.status === 'unread' || !m.status) ? 1 : 0;
                if (!existing || new Date(m.createdAt).getTime() > new Date(existing.last.createdAt).getTime()) {
                    byOther[other] = { last: m, unread: existing ? existing.unread + unread : unread };
                } else if (isIncoming && (m.status === 'unread' || !m.status)) {
                    byOther[other].unread += 1;
                }
            }
            const list: ConversationMeta[] = await Promise.all(
                Object.entries(byOther).map(async ([otherUserId, { last, unread }]) => {
                    const { name, image } = await resolveUser(otherUserId);
                    return {
                        otherUserId,
                        otherUserName: name,
                        otherUserImage: image,
                        lastMessage: last.content || '',
                        lastAt: last.createdAt,
                        unreadCount: unread,
                    };
                })
            );
            list.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
            setConversations(list);
        } catch (e) {
            console.error('Failed to load conversations', e);
        } finally {
            setLoadingList(false);
            refreshUnread();
        }
    }, [userId, refreshUnread]);

    useEffect(() => {
        loadConversations();
        if (userId) {
            resolveUser(userId).then(setCurrentUserMeta);
        }
    }, [loadConversations, userId]);

    useEffect(() => {
        if (!userId) return;
        const unsub = subscribe('new_message', (data: { senderId?: string; message?: string; interactionId?: string; timestamp?: string }) => {
            const senderId = data.senderId;
            if (!senderId || senderId === userId) return;
            const content = data.message ?? '';
            const createdAt = data.timestamp ?? new Date().toISOString();
            if (selectedId === senderId) {
                setMessages((prev) => [
                    ...prev,
                    {
                        interactionId: data.interactionId || `live-${Date.now()}`,
                        type: 'message',
                        senderId,
                        receiverId: userId,
                        content,
                        status: 'unread',
                        createdAt,
                    } as Interaction,
                ]);
            }
            setConversations((prev) => {
                const idx = prev.findIndex((c) => c.otherUserId === senderId);
                if (idx === -1) {
                    return [
                        { otherUserId: senderId, otherUserName: 'Unknown', otherUserImage: null, lastMessage: content, lastAt: createdAt, unreadCount: selectedId === senderId ? 0 : 1 },
                        ...prev,
                    ];
                }
                const next = [...prev];
                next[idx] = {
                    ...next[idx],
                    lastMessage: content,
                    lastAt: createdAt,
                    unreadCount: selectedId === senderId ? next[idx].unreadCount : next[idx].unreadCount + 1,
                };
                next.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
                return next;
            });
            refreshUnread();
            playMessageReceived();
        });
        return unsub;
    }, [userId, selectedId, subscribe, refreshUnread]);

    const openConversation = useCallback(
        async (otherUserId: string) => {
            if (!userId) return;
            setSelectedId(otherUserId);
            const meta = conversations.find((c) => c.otherUserId === otherUserId);
            selectedNameRef.current = meta?.otherUserName ?? 'User';
            setLoadingThread(true);
            try {
                const { messages: thread } = await getConversation(userId, otherUserId);
                setMessages(thread);
                const unreadIds = thread.filter((m) => m.senderId === otherUserId && (m.status === 'unread' || !m.status)).map((m) => m.interactionId);
                for (const id of unreadIds) {
                    await updateInteractionStatus(id, 'read');
                }
                setConversations((prev) =>
                    prev.map((c) => (c.otherUserId === otherUserId ? { ...c, unreadCount: 0 } : c))
                );
                refreshUnread();
            } catch (e) {
                console.error('Failed to load conversation', e);
            } finally {
                setLoadingThread(false);
            }
        },
        [userId, conversations, refreshUnread]
    );

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !selectedId || !replyText.trim() || sending) return;
        setSending(true);
        try {
            await sendFreelancerMessage(userId, selectedId, replyText.trim());
            const newMsg: Interaction = {
                interactionId: `temp-${Date.now()}`,
                type: 'message',
                senderId: userId,
                receiverId: selectedId,
                content: replyText.trim(),
                status: 'read',
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, newMsg]);
            setReplyText('');
            setConversations((prev) => {
                const next = prev.map((c) =>
                    c.otherUserId === selectedId
                        ? { ...c, lastMessage: replyText.trim(), lastAt: newMsg.createdAt }
                        : c
                );
                next.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
                return next;
            });
            playMessageSent();
        } catch (err) {
            console.error('Send failed', err);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!userId) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-lg overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[420px]">
            <div className="flex flex-1 min-h-0">
                {/* Conversation list */}
                <div className="w-80 border-r border-gray-200/80 flex flex-col bg-gradient-to-b from-gray-50 to-white">
                    <div className="p-5 border-b border-gray-200/80 bg-white/90 backdrop-blur-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="p-0.5 rounded-xl bg-orange-50 overflow-hidden">
                                <img src="/badge_logo/chat_logo.webp" alt="Chat Logo" className="w-9 h-9 object-contain" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                                {invitations.length > 0 && (
                                    <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loadingList ? (
                            <div className="flex justify-center py-12">
                                <div className="w-9 h-9 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : conversations.length === 0 && invitations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                                    <MessageCircle className="w-7 h-7" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">No conversations yet</p>
                                <p className="text-xs mt-1 text-gray-400">Message someone from a project or freelancer profile</p>
                            </div>
                        ) : (
                            <ul className="p-2 space-y-0.5">
                                {conversations.map((c) => (
                                    <li key={c.otherUserId}>
                                        <button
                                            type="button"
                                            onClick={() => openConversation(c.otherUserId)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${selectedId === c.otherUserId ? 'bg-orange-500/10 ring-1 ring-orange-500/20' : 'hover:bg-gray-100/80'}`}
                                        >
                                            <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                                                {c.otherUserImage ? (
                                                    <img src={c.otherUserImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="flex items-center justify-center w-full h-full text-orange-600 font-semibold text-lg">
                                                        {(c.otherUserName || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                                {c.unreadCount > 0 && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                                                        {c.unreadCount > 9 ? '9+' : c.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium text-gray-900 truncate block">{c.otherUserName}</span>
                                                <p className="text-sm text-gray-500 truncate">{c.lastMessage || 'No messages yet'}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Thread */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
                    {selectedId ? (
                        <>
                            {/* Chat header with icons */}
                            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                                        {conversations.find((c) => c.otherUserId === selectedId)?.otherUserImage ? (
                                            <img
                                                src={conversations.find((c) => c.otherUserId === selectedId)!.otherUserImage!}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="flex items-center justify-center w-full h-full text-orange-600 font-semibold text-lg">
                                                {(selectedNameRef.current || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {(conversations.find((c) => c.otherUserId === selectedId)?.otherUserName ?? selectedNameRef.current) || 'User'}
                                        </p>
                                        {isConnected ? (
                                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                <CircleDot className="w-3.5 h-3.5 fill-current" />
                                                Online
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-400">Offline</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button type="button" className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" title="More options">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 custom-scrollbar">
                                {loadingThread ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-9 h-9 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const isMe = m.senderId === userId;
                                        const otherUser = conversations.find(c => c.otherUserId === selectedId);

                                        return (
                                            <div
                                                key={m.interactionId}
                                                className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                {/* Avatar */}
                                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1 border border-gray-100 shadow-sm bg-orange-50 flex items-center justify-center">
                                                    {isMe ? (
                                                        currentUserMeta.image ? (
                                                            <img src={currentUserMeta.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-orange-600">{(currentUserMeta.name || 'U').charAt(0).toUpperCase()}</span>
                                                        )
                                                    ) : (
                                                        otherUser?.otherUserImage ? (
                                                            <img src={otherUser.otherUserImage} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-orange-600">{(otherUser?.otherUserName || 'U').charAt(0).toUpperCase()}</span>
                                                        )
                                                    )}
                                                </div>

                                                {/* Bubble Wrapper */}
                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                                    <div
                                                        className={`group rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-none'
                                                            : 'bg-white text-gray-900 rounded-bl-none border border-gray-200/80'
                                                            }`}
                                                    >
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                                                        <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                                                            <span className="text-[10px]">
                                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isMe && <Check className="w-3.5 h-3.5 opacity-80" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={threadEndRef} />
                            </div>
                            {/* Input with icons */}
                            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200/80">
                                <div className="flex items-center gap-2 rounded-2xl bg-gray-100/80 border border-gray-200/80 focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-500/50 transition-all px-3 py-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-gray-400 min-w-0"
                                        minLength={1}
                                        maxLength={5000}
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !replyText.trim()}
                                        className="p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
                                        title="Send"
                                    >
                                        {sending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <SendHorizontal className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 bg-gradient-to-b from-gray-50/50 to-white">
                            <div className="text-center px-8">
                                <div className="mx-auto w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 mb-5">
                                    <MessageCircle className="w-10 h-10" />
                                </div>
                                <p className="text-base font-medium text-gray-600">Select a conversation</p>
                                <p className="text-sm mt-1 text-gray-400">or start a new one from a project or profile</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
