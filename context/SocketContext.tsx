import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../App';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    emit: (event: string, data: any) => void;
    subscribe: (event: string, callback: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Replace with your actual socket server URL
const SOCKET_URL = 'https://projectbazaarsocketserver.onrender.com';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { userId } = useAuth();

    useEffect(() => {
        if (!userId) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Initialize socket connection
        const newSocket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket'],
            reconnection: true,
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [userId]);

    const emit = (event: string, data: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        } else {
            console.warn('Socket not connected. Cannot emit event:', event);
        }
    };

    const subscribe = (event: string, callback: (data: any) => void) => {
        if (!socket) return () => { };

        socket.on(event, callback);
        return () => {
            socket.off(event, callback);
        };
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, emit, subscribe }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
