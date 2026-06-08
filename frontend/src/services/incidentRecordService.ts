import { apiClient } from './apiClient';

export interface IncidentRecordItem {
    id?: number;
    date: string | null;
    descriptionOfIncident: string;
    toWhom: string;
    department: string;
    correctiveAction: string;
    remarks: string;
}

export interface IncidentRecord {
    id: number;
    siteId: number;
    siteName: string;
    doc: string;
    issue: string;
    issueDate: string;
    items: IncidentRecordItem[];
    createdAt: string;
}

export interface CreateIncidentRecordDto {
    siteId: number;
    doc: string;
    issue: string;
    issueDate: string;
    items: Omit<IncidentRecordItem, 'id'>[];
}

export const incidentRecordService = {
    getAll: async () => {
        const response = await apiClient.get<IncidentRecord[]>('/IncidentRecord');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<IncidentRecord>(`/IncidentRecord/${id}`);
        return response.data;
    },

    create: async (data: CreateIncidentRecordDto) => {
        const response = await apiClient.post<IncidentRecord>('/IncidentRecord', data);
        return response.data;
    },

    update: async (id: number, data: CreateIncidentRecordDto) => {
        const response = await apiClient.put<IncidentRecord>(`/IncidentRecord/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await apiClient.delete(`/IncidentRecord/${id}`);
        return response.data;
    }
};
