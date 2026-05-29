import { apiClient } from './apiClient';

export interface ItemProcurementItemDto {
    id: number;
    itemName: string;
    quantity: number;
    remarks: string;
}

export interface ItemProcurementDto {
    id: number;
    siteId: number;
    siteName: string;
    date: string;
    remarks: string;
    createdByUserName: string;
    items: ItemProcurementItemDto[];
}

export interface CreateItemProcurementItemDto {
    itemName: string;
    quantity: number;
    remarks: string;
}

export interface CreateItemProcurementDto {
    siteId: number;
    date: string;
    remarks: string;
    items: CreateItemProcurementItemDto[];
}

export const itemProcurementService = {
    getAll: async (siteId?: number): Promise<ItemProcurementDto[]> => {
        const response = await apiClient.get('/ItemProcurement', {
            params: { siteId }
        });
        return response.data;
    },

    getById: async (id: number): Promise<ItemProcurementDto> => {
        const response = await apiClient.get(`/ItemProcurement/${id}`);
        return response.data;
    },

    create: async (data: CreateItemProcurementDto): Promise<ItemProcurementDto> => {
        const response = await apiClient.post('/ItemProcurement', data);
        return response.data;
    },

    update: async (id: number, data: CreateItemProcurementDto): Promise<ItemProcurementDto> => {
        const response = await apiClient.put(`/ItemProcurement/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/ItemProcurement/${id}`);
    },

    downloadPdf: async (id: number): Promise<void> => {
        const response = await apiClient.get(`/ItemProcurement/${id}/pdf`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ItemProcurement_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    }
};
