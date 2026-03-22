import { getSyncQueue, clearSyncQueue } from './db';
import { apiClient } from './apiClient';

export const processSyncQueue = async (): Promise<boolean> => {
    try {
        const queueItems = await getSyncQueue();
        
        if (queueItems.length === 0) {
            return true; // Nothing to sync
        }

        const requestPayload = {
            changes: queueItems.map(item => ({
                entityType: item.entityType,
                localMobileId: item.id,
                serverId: item.serverId || null,
                operation: item.operation,
                mobileUpdatedAt: item.mobileUpdatedAt,
                payload: item.payload
            }))
        };

        const response = await apiClient.post('/Sync/push', requestPayload);
        
        if (response.data) {
             // For an enterprise environment, we simply clear the queue upon a successful 200 OK.
             // Conflicts and Errors persist safely inside the global MS SQL datastore (SyncConflicts table) 
             // where an Admin can triage them on their SyncDashboard.
             await clearSyncQueue();
             return true;
        }
        
        return false;
    } catch (error) {
        console.error("Sync Manager Failed:", error);
        return false;
    }
};
