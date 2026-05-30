import { apiClient as api } from './apiClient';

export interface ProjectTechnicalHandoverAttachmentDto {
    id: number;
    fileName: string;
    fileUrl: string;
}

export interface ProjectTechnicalHandoverDto {
    id: number;
    siteId: number;
    siteName: string;
    tenantId: number;
    customerId?: number;
    customerName?: string;
    secondaryCustomerId?: number;
    secondaryCustomerName?: string;
    createdByUserName: string;
    createdAt: string;
    attachments: ProjectTechnicalHandoverAttachmentDto[];
}

export const projectTechnicalHandoverService = {
    getAll: async (): Promise<ProjectTechnicalHandoverDto[]> => {
        const response = await api.get('/ProjectTechnicalHandover');
        return response.data;
    },

    getBySiteId: async (siteId: number): Promise<ProjectTechnicalHandoverDto[]> => {
        const response = await api.get(`/ProjectTechnicalHandover/site/${siteId}`);
        return response.data;
    },

    getById: async (id: number): Promise<ProjectTechnicalHandoverDto> => {
        const response = await api.get(`/ProjectTechnicalHandover/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<ProjectTechnicalHandoverDto> => {
        const formData = new FormData();
        formData.append('SiteId', data.siteId);
        if (data.customerId) formData.append('CustomerId', data.customerId);
        if (data.secondaryCustomerId) formData.append('SecondaryCustomerId', data.secondaryCustomerId);
        
        if (data.attachments) {
            Array.from(data.attachments as FileList | File[]).forEach((file: any) => {
                formData.append('Attachments', file);
            });
        }

        const response = await api.post('/ProjectTechnicalHandover', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    update: async (id: number, data: any): Promise<ProjectTechnicalHandoverDto> => {
        const formData = new FormData();
        formData.append('SiteId', data.siteId);
        if (data.customerId) formData.append('CustomerId', data.customerId);
        if (data.secondaryCustomerId) formData.append('SecondaryCustomerId', data.secondaryCustomerId);
        
        if (data.attachments) {
            Array.from(data.attachments as FileList | File[]).forEach((file: any) => {
                formData.append('Attachments', file);
            });
        }

        const response = await api.put(`/ProjectTechnicalHandover/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/ProjectTechnicalHandover/${id}`);
    }
};

export default projectTechnicalHandoverService;
