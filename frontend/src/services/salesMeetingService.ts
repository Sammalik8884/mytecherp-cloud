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
    const response = await api.get('/SalesMeetings');
    return response.data;
};

export const createMeeting = async (data: CreateSalesMeetingReminderDto): Promise<{message: string}> => {
    const response = await api.post('/SalesMeetings', data);
    return response.data;
};

export const updateMeeting = async (id: number, data: CreateSalesMeetingReminderDto): Promise<{message: string}> => {
    const response = await api.put(`/SalesMeetings/${id}`, data);
    return response.data;
};

export const deleteMeeting = async (id: number): Promise<{message: string}> => {
    const response = await api.delete(`/SalesMeetings/${id}`);
    return response.data;
};

export const getPendingAlerts = async (): Promise<SalesMeetingReminderDto[]> => {
    const response = await api.get('/SalesMeetings/pending-alerts');
    return response.data;
};

export const acknowledgePopup = async (id: number): Promise<{message: string}> => {
    const response = await api.post(`/SalesMeetings/${id}/acknowledge-popup`);
    return response.data;
};
