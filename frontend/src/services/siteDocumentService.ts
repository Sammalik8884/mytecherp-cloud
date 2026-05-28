import { apiClient } from './apiClient';

export interface SiteDocumentDto {
    id: number;
    siteId: number;
    siteName: string;
    documentType: string;
    customerId?: number;
    customerName?: string;
    secondaryCustomerId?: number;
    secondaryCustomerName?: string;
    fileName: string;
    fileUrl: string;
    downloadUrl: string;
    createdAt: string;
    uploadedByUserId: string;
}

export const siteDocumentService = {
    getDocumentsBySiteId: async (siteId: number): Promise<SiteDocumentDto[]> => {
        const response = await apiClient.get<SiteDocumentDto[]>(`/sitedocument/site/${siteId}`);
        return response.data;
    },

    getAllDocuments: async (): Promise<SiteDocumentDto[]> => {
        const response = await apiClient.get<SiteDocumentDto[]>('/sitedocument');
        return response.data;
    },

    uploadDocuments: async (siteId: number, documentType: string, customerId: number | undefined, secondaryCustomerId: number | undefined, files: File[]): Promise<SiteDocumentDto[]> => {
        const formData = new FormData();
        formData.append('siteId', siteId.toString());
        formData.append('documentType', documentType);
        if (customerId) formData.append('customerId', customerId.toString());
        if (secondaryCustomerId) formData.append('secondaryCustomerId', secondaryCustomerId.toString());
        
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await apiClient.post<SiteDocumentDto[]>('/sitedocument/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteDocument: async (id: number): Promise<void> => {
        await apiClient.delete(`/sitedocument/${id}`);
    }
};
