import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncQueueItem {
  id: string; // The GUID (LocalMobileId)
  entityType: string;
  operation: 'Create' | 'Update' | 'Delete';
  serverId?: number | null;
  mobileUpdatedAt: string;
  payload: any;
}

interface MyTechDB extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncQueueItem;
  };
}

let dbPromise: Promise<IDBPDatabase<MyTechDB>> | null = null;

export const initDB = () => {
    if (typeof window === 'undefined') return null; // Protect SSR
    
    if (!dbPromise) {
        dbPromise = openDB<MyTechDB>('mytech-sync', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

export const addToSyncQueue = async (item: SyncQueueItem) => {
    const db = await initDB();
    if (db) await db.put('syncQueue', item);
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
    const db = await initDB();
    if (!db) return [];
    return await db.getAll('syncQueue');
};

export const removeFromSyncQueue = async (id: string) => {
    const db = await initDB();
    if (db) await db.delete('syncQueue', id);
};

export const clearSyncQueue = async () => {
    const db = await initDB();
    if (db) await db.clear('syncQueue');
};
