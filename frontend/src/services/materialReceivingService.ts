import apiClient from './apiClient';

export interface MaterialReceivingItemDto {
    id?: number;
    itemName: string;
    locationValue: string;
    received: string;
    remarks: string;
}

export interface MaterialReceivingFormDto {
    id: number;
    siteId?: number;
    siteName?: string;
    location?: string;
    createdAt: string;
    createdByUserName: string;
    items: MaterialReceivingItemDto[];
}

export interface CreateMaterialReceivingFormDto {
    siteId?: number;
    location?: string;
    items: MaterialReceivingItemDto[];
}

export const materialReceivingService = {
    getFormById: async (id: number): Promise<MaterialReceivingFormDto> => {
        const response = await apiClient.get(`/MaterialReceiving/${id}`);
        return response.data;
    },

    getFormsBySiteId: async (siteId: number): Promise<MaterialReceivingFormDto[]> => {
        const response = await apiClient.get(`/MaterialReceiving/site/${siteId}`);
        return response.data;
    },

    getFormsByLocation: async (location: string): Promise<MaterialReceivingFormDto[]> => {
        const response = await apiClient.get(`/MaterialReceiving/location/${location}`);
        return response.data;
    },

    createForm: async (data: CreateMaterialReceivingFormDto): Promise<MaterialReceivingFormDto> => {
        const response = await apiClient.post('/MaterialReceiving', data);
        return response.data;
    }
};
