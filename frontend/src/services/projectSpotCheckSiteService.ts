import { apiClient } from './apiClient';

export interface ProjectSpotCheckSiteItem {
    id?: number;
    itemText: string;
    isYes: boolean;
    isNA: boolean;
    comments?: string;
}

export interface ProjectSpotCheckSite {
    id: number;
    siteId: number;
    siteName?: string;
    createdAt: string;
    items: ProjectSpotCheckSiteItem[];
    uploadedFiles?: string;
}

export interface CreateProjectSpotCheckSiteData {
    siteId: number;
    items: ProjectSpotCheckSiteItem[];
    uploadedFiles?: string;
}

export const projectSpotCheckSiteService = {
    getAll: async () => {
        const response = await apiClient.get('/ProjectSpotCheckSite');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get(`/ProjectSpotCheckSite/${id}`);
        return response.data;
    },

    create: async (data: CreateProjectSpotCheckSiteData) => {
        const response = await apiClient.post('/ProjectSpotCheckSite', data);
        return response.data;
    },

    update: async (id: number, data: CreateProjectSpotCheckSiteData) => {
        const response = await apiClient.put(`/ProjectSpotCheckSite/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await apiClient.delete(`/ProjectSpotCheckSite/${id}`);
        return response.data;
    }
};
