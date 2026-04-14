import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getUserInteractions } from '../services/freelancerInteractionsApi';

interface MessagesUnreadContextType {
    unreadMessageCount: number;
    refreshUnread: () => Promise<void>;
}

const MessagesUnreadContext = createContext<MessagesUnreadContextType | undefined>(undefined);

export const MessagesUnreadProvider: React.FC<{ children: ReactNode; userId: string | null }> = ({ children, userId }) => {
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    const refreshUnread = useCallback(async () => {
        if (!userId) {
            setUnreadMessageCount(0);
            return;
        }
        try {
            const { interactions } = await getUserInteractions(userId);
            const count = interactions.filter(
                (i) => i.type === 'message' && (i.status === 'unread' || !i.status)
            ).length;
            setUnreadMessageCount(count);
        } catch {
            setUnreadMessageCount(0);
        }
    }, [userId]);

    React.useEffect(() => {
        refreshUnread();
    }, [refreshUnread]);

    return (
        <MessagesUnreadContext.Provider value={{ unreadMessageCount, refreshUnread }}>
            {children}
        </MessagesUnreadContext.Provider>
    );
};

export const useMessagesUnread = () => {
    const context = useContext(MessagesUnreadContext);
    if (context === undefined) {
        throw new Error('useMessagesUnread must be used within a MessagesUnreadProvider');
    }
    return context;
};
