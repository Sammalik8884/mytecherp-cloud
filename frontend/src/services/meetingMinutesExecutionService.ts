import { apiClient } from './apiClient';

export interface MeetingMinutesExecutionAttendeeDto {
    id?: number;
    employeeIdStr: string;
    employeeName: string;
    employeeStatus: string;
}

export interface MeetingMinutesExecutionAttachmentDto {
    id: number;
    fileName: string;
    fileUrl: string;
}

export interface MeetingMinutesExecutionDto {
    id: number;
    siteId?: number;
    tenantId: number;
    meetingTitle: string;
    meetingDate: string;
    timeFrom: string;
    timeTo: string;
    location: string;
    organizer: string;
    meetingType: string;
    agenda: string;
    discussionPoints: string;
    decisionsMade: string;
    actionItems: string;
    closingNotes: string;
    createdAt: string;
    createdByUserName: string;
    attendees: MeetingMinutesExecutionAttendeeDto[];
    attachments: MeetingMinutesExecutionAttachmentDto[];
}

export interface CreateMeetingMinutesExecutionDto {
    siteId?: number;
    meetingTitle: string;
    meetingDate: string;
    timeFrom: string;
    timeTo: string;
    location: string;
    organizer: string;
    meetingType: string;
    agenda: string;
    discussionPoints: string;
    decisionsMade: string;
    actionItems: string;
    closingNotes: string;
    attendeesJson: string; // JSON string array of attendees
    attachments?: File[];
}

const meetingMinutesExecutionService = {
    getMeetingById: async (id: number): Promise<MeetingMinutesExecutionDto> => {
        const response = await apiClient.get(`/MeetingMinutesExecution/${id}`);
        return response.data;
    },

    getMeetingsBySiteId: async (siteId: number): Promise<MeetingMinutesExecutionDto[]> => {
        const response = await apiClient.get(`/MeetingMinutesExecution/site/${siteId}`);
        return response.data;
    },

    getAllMeetings: async (): Promise<MeetingMinutesExecutionDto[]> => {
        const response = await apiClient.get('/MeetingMinutesExecution');
        return response.data;
    },

    createMeeting: async (dto: CreateMeetingMinutesExecutionDto): Promise<MeetingMinutesExecutionDto> => {
        const formData = new FormData();
        
        if (dto.siteId) formData.append('siteId', dto.siteId.toString());
        formData.append('meetingTitle', dto.meetingTitle);
        formData.append('meetingDate', dto.meetingDate);
        formData.append('timeFrom', dto.timeFrom);
        formData.append('timeTo', dto.timeTo);
        formData.append('location', dto.location);
        formData.append('organizer', dto.organizer);
        formData.append('meetingType', dto.meetingType);
        formData.append('agenda', dto.agenda);
        formData.append('discussionPoints', dto.discussionPoints);
        formData.append('decisionsMade', dto.decisionsMade);
        formData.append('actionItems', dto.actionItems);
        formData.append('closingNotes', dto.closingNotes);
        formData.append('attendeesJson', dto.attendeesJson);
        
        if (dto.attachments && dto.attachments.length > 0) {
            Array.from(dto.attachments).forEach((file) => {
                formData.append('attachments', file);
            });
        }

        const response = await apiClient.post('/MeetingMinutesExecution', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    updateMeeting: async (id: number, dto: CreateMeetingMinutesExecutionDto): Promise<MeetingMinutesExecutionDto> => {
        const formData = new FormData();
        
        if (dto.siteId) formData.append('siteId', dto.siteId.toString());
        formData.append('meetingTitle', dto.meetingTitle);
        formData.append('meetingDate', dto.meetingDate);
        formData.append('timeFrom', dto.timeFrom);
        formData.append('timeTo', dto.timeTo);
        formData.append('location', dto.location);
        formData.append('organizer', dto.organizer);
        formData.append('meetingType', dto.meetingType);
        formData.append('agenda', dto.agenda);
        formData.append('discussionPoints', dto.discussionPoints);
        formData.append('decisionsMade', dto.decisionsMade);
        formData.append('actionItems', dto.actionItems);
        formData.append('closingNotes', dto.closingNotes);
        formData.append('attendeesJson', dto.attendeesJson);
        
        if (dto.attachments && dto.attachments.length > 0) {
            Array.from(dto.attachments).forEach((file) => {
                formData.append('attachments', file);
            });
        }

        const response = await apiClient.put(`/MeetingMinutesExecution/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deleteMeeting: async (id: number): Promise<void> => {
        await apiClient.delete(`/MeetingMinutesExecution/${id}`);
    }
};

export default meetingMinutesExecutionService;
