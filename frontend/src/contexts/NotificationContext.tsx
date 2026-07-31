import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../auth/AuthContext';
import { notificationApi, NotificationDto } from '../api/notificationApi';
import toast from 'react-hot-toast';
import { apiClient } from '../services/apiClient';

interface NotificationContextType {
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { isAuthenticated } = useAuth();
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            const data = await notificationApi.getUnread();
            setUnreadCount(data.length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            
            const token = localStorage.getItem('token');
            const baseUrl = apiClient.defaults.baseURL || "http://localhost:5269/api";
            const hubUrl = baseUrl.replace('/api', '') + '/hubs/sync';
            
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => token || ''
                })
                .withAutomaticReconnect()
                .build();

            setConnection(newConnection);
        } else {
            if (connection) {
                connection.stop();
                setConnection(null);
            }
        }
        
        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, [isAuthenticated]);

    useEffect(() => {
        if (connection && isAuthenticated) {
            connection.start()
                .then(() => {
                    console.log('Connected to Notification Hub');
                    connection.on('SyncCompleted', async (entityType: string, affectedServerIds: number[]) => {
                        if (entityType === 'Notification') {
                            try {
                                const unread = await notificationApi.getUnread();
                                setUnreadCount(unread.length);
                                
                                const newNotifs = unread.filter((n: NotificationDto) => affectedServerIds.includes(n.id));
                                newNotifs.forEach((n: NotificationDto) => {
                                    toast.success(`New Notification: ${n.title}`, {
                                        position: 'bottom-right',
                                        duration: 5000,
                                        icon: '🔔',
                                    });
                                });
                            } catch (err) {
                                console.error('Failed to process new notification', err);
                            }
                        }
                    });
                })
                .catch(e => console.log('Connection failed: ', e));
        }
    }, [connection, isAuthenticated]);

    return (
        <NotificationContext.Provider value={{ unreadCount, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
