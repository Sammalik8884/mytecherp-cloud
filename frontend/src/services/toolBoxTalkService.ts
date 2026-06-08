import { apiClient } from './apiClient';

export interface ToolBoxTalkAttendeeDto {
    id: number;
    toolBoxTalkId: number;
    employeeName: string;
    status: string;
    createdAt?: string;
}

export interface ToolBoxTalkDto {
    id: number;
    documentNo: string;
    formNo: string;
    date: string;
    time: string;
    siteId: number;
    siteName?: string;
    tbtPerformedBy: string;
    subject: string;
    jobSupervisorName: string;
    qehsName: string;
    projectManagerName: string;
    selectedTopics: string;
    attendees: ToolBoxTalkAttendeeDto[];
    createdAt?: string;
    updatedAt?: string;
}

export const toolBoxTalkService = {
    getAll: async (): Promise<ToolBoxTalkDto[]> => {
        const response = await apiClient.get('/ToolBoxTalk');
        return response.data;
    },

    getById: async (id: number): Promise<ToolBoxTalkDto> => {
        const response = await apiClient.get(`/ToolBoxTalk/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<ToolBoxTalkDto> => {
        const response = await apiClient.post('/ToolBoxTalk', data);
        return response.data;
    },

    update: async (id: number, data: any): Promise<void> => {
        await apiClient.put(`/ToolBoxTalk/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/ToolBoxTalk/${id}`);
    },

    updateAttendee: async (attendeeId: number, data: any): Promise<void> => {
        await apiClient.put(`/ToolBoxTalk/attendee/${attendeeId}`, data);
    },

    deleteAttendee: async (attendeeId: number): Promise<void> => {
        await apiClient.delete(`/ToolBoxTalk/attendee/${attendeeId}`);
    }
};
