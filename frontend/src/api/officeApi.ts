import { apiClient } from "../services/apiClient";

export interface OfficeDto {
    id: number;
    name: string;
    city: string;
    address: string;
}

export interface CreateOfficeDto {
    name: string;
    city: string;
    address: string;
}

export const officeApi = {
    getAll: async () => {
        const response = await apiClient.get<OfficeDto[]>("/Offices");
        return response.data;
    },
    getById: async (id: number) => {
        const response = await apiClient.get<OfficeDto>(`/Offices/${id}`);
        return response.data;
    },
    create: async (data: CreateOfficeDto) => {
        const response = await apiClient.post<OfficeDto>("/Offices", data);
        return response.data;
    },
    update: async (id: number, data: CreateOfficeDto) => {
        const response = await apiClient.put<OfficeDto>(`/Offices/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/Offices/${id}`);
        return response.data;
    }
};
