import { apiClient } from '../services/apiClient';

export interface ChequeDto {
    id: number;
    chequeNumber: string;
    initialAmount: number;
    releasedAmount: number;
    remainingBalance: number;
    pictureUrl: string;
    isActive: boolean;
    createdAt: string;
}

export const chequeApi = {
    getAll: async (): Promise<ChequeDto[]> => {
        const res = await apiClient.get('/cheques');
        return res.data;
    },
    create: async (data: any): Promise<ChequeDto> => {
        const res = await apiClient.post('/cheques', data);
        return res.data;
    },
    update: async (id: number, data: any): Promise<ChequeDto> => {
        const res = await apiClient.put(`/cheques/${id}`, data);
        return res.data;
    },
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/cheques/${id}`);
    },
    uploadPicture: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post('/cheques/upload-picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data.url;
    }
};
