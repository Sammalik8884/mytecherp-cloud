import { apiClient as api } from '../services/apiClient';

export interface ApplicationFormAttachmentDto {
    id: number;
    fileName: string;
    fileUrl: string;
}

export interface ApplicationFormDto {
    id: number;
    applicantName: string;
    designation: string;
    applicationDate: string;
    employeeCode: string;
    phoneNumber: string;
    employeeType: string;
    subject: string;
    description: string;
    status: string;
    directorRemarks?: string;
    ceoRemarks?: string;
    rejectionRemarks?: string;
    createdAt: string;
    attachments: ApplicationFormAttachmentDto[];
}

export const applicationFormApi = {
    getAll: async () => {
        const response = await api.get('/ApplicationForm');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/ApplicationForm/${id}`);
        return response.data;
    },

    create: async (formData: FormData) => {
        const response = await api.post('/ApplicationForm', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateStatus: async (id: number, data: { status: string; remarks: string }) => {
        const response = await api.put(`/ApplicationForm/${id}/status`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/ApplicationForm/${id}`);
    }
};
