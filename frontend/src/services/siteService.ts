import { apiClient } from "./apiClient";
import { SiteDto, CreateSiteDto } from "../types/site";

export const siteService = {
    getAll: async (): Promise<SiteDto[]> => {
        const response = await apiClient.get<SiteDto[]>("/Sites");
        return response.data;
    },

    getById: async (id: number): Promise<SiteDto> => {
        const response = await apiClient.get<SiteDto>(`/Sites/${id}`);
        return response.data;
    },

    create: async (data: CreateSiteDto): Promise<{ message: string; id: number }> => {
        const response = await apiClient.post<{ message: string; id: number }>("/Sites", data);
        return response.data;
    },

    update: async (id: number, data: CreateSiteDto): Promise<{ message: string }> => {
        const response = await apiClient.put<{ message: string }>(`/Sites/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/Sites/${id}`);
        return response.data;
    }
};
