import { apiClient as api } from './apiClient';

export interface CreateSalesMeetingReminderDto {
    siteName: string;
    meetingDate: string;
    isTimeIncluded: boolean;
}

export interface SalesMeetingReminderDto {
    id: number;
    salesmanUserId: string;
    salesmanName: string;
    siteName: string;
    meetingDate: string;
    isTimeIncluded: boolean;
    isNotified: boolean;
    isPopupAcknowledged: boolean;
    createdAt: string;
}

export const getMeetings = async (): Promise<SalesMeetingReminderDto[]> => {
    const response = await api.get('/api/SalesMeetings');
    return response.data;
};

export const createMeeting = async (data: CreateSalesMeetingReminderDto): Promise<{message: string}> => {
    const response = await api.post('/api/SalesMeetings', data);
    return response.data;
};

export const getPendingAlerts = async (): Promise<SalesMeetingReminderDto[]> => {
    const response = await api.get('/api/SalesMeetings/pending-alerts');
    return response.data;
};

export const acknowledgePopup = async (id: number): Promise<{message: string}> => {
    const response = await api.post(`/api/SalesMeetings/${id}/acknowledge-popup`);
    return response.data;
};
