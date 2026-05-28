import { apiClient } from './apiClient';

export interface MomAttendeeDto {
    id?: number;
    employeeIdStr: string;
    employeeName: string;
    employeeStatus: string;
}

export interface MomAttachmentDto {
    id: number;
    fileName: string;
    fileUrl: string;
    downloadUrl: string;
}

export interface MomMeetingDto {
    id: number;
    siteId?: number;
    siteName?: string;
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
    attendees: MomAttendeeDto[];
    attachments: MomAttachmentDto[];
}

export interface CreateMomMeetingDto {
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
    files?: File[];
}

const momMeetingService = {
    getMeetingById: async (id: number): Promise<MomMeetingDto> => {
        const response = await apiClient.get(`/MomMeeting/${id}`);
        return response.data;
    },

    getMeetingsBySiteId: async (siteId: number): Promise<MomMeetingDto[]> => {
        const response = await apiClient.get(`/MomMeeting/site/${siteId}`);
        return response.data;
    },

    getAllMeetings: async (): Promise<MomMeetingDto[]> => {
        const response = await apiClient.get('/MomMeeting');
        return response.data;
    },

    createMeeting: async (dto: CreateMomMeetingDto): Promise<MomMeetingDto> => {
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
        
        if (dto.files && dto.files.length > 0) {
            Array.from(dto.files).forEach((file) => {
                formData.append('files', file);
            });
        }

        const response = await apiClient.post('/MomMeeting', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deleteMeeting: async (id: number): Promise<void> => {
        await apiClient.delete(`/MomMeeting/${id}`);
    }
};

export default momMeetingService;
