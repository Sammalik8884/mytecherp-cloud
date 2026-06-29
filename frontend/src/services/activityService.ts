import { apiClient as api } from './apiClient';

export interface ActivityDto {
    id: number;
    entityName: string;
    entityId: number;
    action: string;
    userId: string;
    userName: string;
    timestamp: string;
    details?: string;
    oldValue?: string;
    newValue?: string;
}

export interface ActivityStatsDto {
    activitiesByDate: Record<string, number>;
    activitiesByAction: Record<string, number>;
    totalActivities: number;
}

export const activityService = {
    getActivities: async (userId?: string, startDate?: string, endDate?: string, page = 1, pageSize = 50) => {
        let url = `/Activity?page=${page}&pageSize=${pageSize}`;
        if (userId) url += `&userId=${userId}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        const res = await api.get<{ data: ActivityDto[]; totalCount: number; page: number; pageSize: number }>(url);
        return res.data;
    },

    getActivityStats: async (userId?: string, startDate?: string, endDate?: string) => {
        let url = `/Activity/stats?`;
        if (userId) url += `&userId=${userId}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        const res = await api.get<ActivityStatsDto>(url);
        return res.data;
    }
};
