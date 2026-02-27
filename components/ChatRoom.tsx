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
    }, [loadConversations]);

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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[420px]">
            <div className="flex flex-1 min-h-0">
                {/* Conversation list */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                        {invitations.length > 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                                {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loadingList ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : conversations.length === 0 && invitations.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">
                                No conversations yet. Message someone from a project or freelancer profile.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {conversations.map((c) => (
                                    <li key={c.otherUserId}>
                                        <button
                                            type="button"
                                            onClick={() => openConversation(c.otherUserId)}
                                            className={`w-full flex items-center gap-3 p-4 text-left hover:bg-orange-50 transition-colors ${selectedId === c.otherUserId ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex-shrink-0 overflow-hidden border border-orange-200">
                                                {c.otherUserImage ? (
                                                    <img src={c.otherUserImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="flex items-center justify-center w-full h-full text-orange-600 font-semibold">
                                                        {(c.otherUserName || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium text-gray-900 truncate">{c.otherUserName}</span>
                                                    {c.unreadCount > 0 && (
                                                        <span className="flex-shrink-0 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                                                            {c.unreadCount > 99 ? '99+' : c.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
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
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {selectedId ? (
                        <>
                            <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex-shrink-0 overflow-hidden border border-orange-200">
                                    {conversations.find((c) => c.otherUserId === selectedId)?.otherUserImage ? (
                                        <img
                                            src={conversations.find((c) => c.otherUserId === selectedId)!.otherUserImage!}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex items-center justify-center w-full h-full text-orange-600 font-semibold">
                                            {(selectedNameRef.current || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span className="font-semibold text-gray-900">
                                    {(conversations.find((c) => c.otherUserId === selectedId)?.otherUserName ?? selectedNameRef.current) || 'User'}
                                </span>
                                {isConnected && (
                                    <span className="text-xs text-green-600 font-medium">Online</span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {loadingThread ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const isMe = m.senderId === userId;
                                        return (
                                            <div
                                                key={m.interactionId}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-900'}`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-orange-100' : 'text-gray-500'}`}>
                                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={threadEndRef} />
                            </div>
                            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        minLength={1}
                                        maxLength={5000}
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !replyText.trim()}
                                        className="px-5 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {sending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Send'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="mt-2 text-sm">Select a conversation or start a new one</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
