import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getUserInteractions, updateInteractionStatus, sendFreelancerMessage, Interaction } from '../services/freelancerInteractionsApi';
import { GET_USER_DETAILS_ENDPOINT } from '../services/buyerApi';

const FreelancerInbox: React.FC = () => {
    const { userId } = useAuth();

    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Reply Modal State
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [replyTarget, setReplyTarget] = useState<Interaction | null>(null);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchInteractions();
    }, [userId]);

    const fetchInteractions = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { interactions } = await getUserInteractions(userId);
            // Let's resolve the user avatars for all these interactions if they exist
            const EnhancedInteractions = await Promise.all(interactions.map(async (interaction) => {
                let userImage = interaction.senderImage;
                // If we don't have it explicitly saved inside interaction, fetch from DB
                if (!userImage) {
                    try {
                        const res = await fetch(GET_USER_DETAILS_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: interaction.senderId }),
                        });
                        const data = await res.json();
                        const user = data.data || data.user || data;
                        if (user) {
                            userImage = user.profilePictureUrl ?? user.profilePicture ?? user.profileImage ?? user.avatar ?? user.photoURL;
                        }
                    } catch (e) {
                        // disregard
                    }
                }
                return { ...interaction, senderImage: userImage || interaction.senderImage };
            }));
            setInteractions(EnhancedInteractions);
        } catch (err) {
            setError('Failed to load messages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (interactionId: string, status: 'read' | 'accepted' | 'declined') => {
        try {
            await updateInteractionStatus(interactionId, status);
            // Instantly update local state to reflect UI change rapidly
            setInteractions(prev => prev.map(interaction =>
                interaction.interactionId === interactionId ? { ...interaction, status } : interaction
            ));

            if (status === 'accepted') {
                // Future mapping to bidding, for now just show a toast or alert
                alert('You have accepted the bid invitation! You may now navigate to the project to submit your bid.');
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyTarget || !userId || !replyMessage.trim()) return;

        setIsSending(true);
        try {
            await sendFreelancerMessage(userId, replyTarget.senderId, replyMessage);
            // Ensure the message we replied to is marked as read
            if (replyTarget.status === 'unread') {
                await handleStatusUpdate(replyTarget.interactionId, 'read');
            }
            setShowReplyModal(false);
            setReplyMessage('');
            alert('Reply sent successfully!');
        } catch (err) {
            console.error('Failed to send reply', err);
            alert('Failed to send reply');
        } finally {
            setIsSending(false);
        }
    };

    const renderBadge = (interaction: Interaction) => {
        switch (interaction.status) {
            case 'unread':
            case 'pending':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">New</span>;
            case 'read':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Read</span>;
            case 'accepted':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Accepted</span>;
            case 'declined':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Declined</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent" />
            </div>
        );
    }

    const sortedInteractions = [...interactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter out reviews from the Inbox view (reviews belong on the profile)
    const inboxItems = sortedInteractions.filter(i => i.type !== 'review');

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Inbox & Invitations</h2>

            {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

            {inboxItems.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No messages</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You don't have any messages or project invitations yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {inboxItems.map(interaction => (
                        <div
                            key={interaction.interactionId}
                            className={`p-5 rounded-lg border ${interaction.status === 'unread' || interaction.status === 'pending'
                                ? 'border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-900/10'
                                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                } transition-colors`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center overflow-hidden border border-orange-200 dark:border-orange-800 shrink-0">
                                        {interaction.senderImage ? (
                                            <img src={interaction.senderImage} alt={interaction.senderName || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">
                                                {(interaction.senderName || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                                            From: {interaction.senderName || 'Unknown User'}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(interaction.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {interaction.type}
                                    </span>
                                    {renderBadge(interaction)}
                                </div>
                            </div>

                            <div className="mt-4 mb-5 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line ml-13 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                                {interaction.content}
                            </div>

                            <div className="flex items-center gap-3 ml-13 mt-4">
                                {interaction.type === 'message' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setReplyTarget(interaction);
                                                setShowReplyModal(true);
                                            }}
                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition-colors"
                                        >
                                            Reply
                                        </button>
                                        {interaction.status === 'unread' && (
                                            <button
                                                onClick={() => handleStatusUpdate(interaction.interactionId, 'read')}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </>
                                )}

                                {interaction.type === 'invitation' && interaction.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(interaction.interactionId, 'accepted')}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                                        >
                                            Accept Invitation
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(interaction.interactionId, 'declined')}
                                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 text-sm font-medium rounded-md transition-colors"
                                        >
                                            Decline
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && replyTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Reply to {replyTarget.senderName || 'User'}
                            </h3>
                            <button
                                onClick={() => setShowReplyModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSendReply} className="p-6">
                            <div className="mb-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Original Message:</div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 italic border-l-4 border-orange-200 dark:border-orange-800">
                                    {replyTarget.content}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Reply</label>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Type your reply here..."
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-white resize-none"
                                    rows={4}
                                    required
                                    minLength={10}
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReplyModal(false)}
                                    className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    disabled={isSending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending || replyMessage.trim().length < 10}
                                    className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                                >
                                    {isSending ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Send Reply'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FreelancerInbox;
