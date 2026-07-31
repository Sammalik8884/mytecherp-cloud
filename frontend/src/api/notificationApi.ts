import { apiClient } from "../services/apiClient";

export interface NotificationDto {
    id: number;
    title: string;
    message: string;
    type: string;
    targetId?: number;
    isRead: boolean;
    createdAt: string;
}

export const notificationApi = {
    getUnread: async (): Promise<NotificationDto[]> => {
        const response = await apiClient.get<NotificationDto[]>("/Notifications/unread");
        return response.data;
    },
    
    getAll: async (limit: number = 50): Promise<NotificationDto[]> => {
        const response = await apiClient.get<NotificationDto[]>(`/Notifications/all?limit=${limit}`);
        return response.data;
    },
    
    getUnreadCount: async (): Promise<{ count: number }> => {
        const response = await apiClient.get<{ count: number }>("/Notifications/count");
        return response.data;
    },
    
    markAsRead: async (id: number): Promise<void> => {
        await apiClient.put(`/Notifications/${id}/read`);
    },
    
    markAllAsRead: async (): Promise<void> => {
        await apiClient.put("/Notifications/read-all");
    }
};
