import { apiClient } from "./apiClient";
import { WarehouseDto } from "../types/inventory";

export const warehouseService = {
    getAll: async (): Promise<WarehouseDto[]> => {
        const response = await apiClient.get('/Warehouse');
        return response.data;
    },

    getById: async (id: number): Promise<WarehouseDto> => {
        const response = await apiClient.get(`/Warehouse/${id}`);
        return response.data;
    },

    create: async (data: { name: string; location?: string; isMobile?: boolean }): Promise<WarehouseDto> => {
        const response = await apiClient.post('/Warehouse', data);
        return response.data;
    },

    update: async (id: number, data: { name: string; location?: string; isMobile?: boolean }): Promise<any> => {
        const response = await apiClient.put(`/Warehouse/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<any> => {
        const response = await apiClient.delete(`/Warehouse/${id}`);
        return response.data;
    }
};
