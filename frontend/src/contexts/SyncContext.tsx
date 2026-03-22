import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getSyncQueue, addToSyncQueue, SyncQueueItem } from '../services/db';
import { processSyncQueue } from '../services/syncManager';

interface SyncContextType {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    forceSync: () => Promise<void>;
    enqueueSyncItem: (item: SyncQueueItem) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState<boolean>(true); // default to true, updated in effect
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        refreshPendingCount();
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            forceSync(); 
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const refreshPendingCount = async () => {
        try {
            const items = await getSyncQueue();
            setPendingCount(items.length);
        } catch (e) {
            console.error("Error reading queue:", e);
        }
    };

    const enqueueSyncItem = async (item: SyncQueueItem) => {
        await addToSyncQueue(item);
        refreshPendingCount();
        
        if (navigator.onLine) {
            forceSync();
        }
    };

    const forceSync = async () => {
        if (!navigator.onLine || isSyncing) return;
        
        setIsSyncing(true);
        try {
            await processSyncQueue();
        } finally {
            await refreshPendingCount();
            setIsSyncing(false);
        }
    };

    return (
        <SyncContext.Provider value={{ isOnline, pendingCount, isSyncing, forceSync, enqueueSyncItem }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
};
