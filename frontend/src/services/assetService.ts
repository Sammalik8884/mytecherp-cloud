import { apiClient } from "./apiClient";
import { AssetDto, CreateAssetDto, UpdateAssetDto } from "../types/field";

export const assetService = {
    getAll: async (siteId?: number): Promise<AssetDto[]> => {
        const url = siteId ? `/Assets/site/${siteId}` : "/Assets";
        const response = await apiClient.get<AssetDto[]>(url);
        return response.data;
    },

    getById: async (id: number): Promise<AssetDto> => {
        const response = await apiClient.get<AssetDto>(`/Assets/${id}`);
        return response.data;
    },

    create: async (data: CreateAssetDto): Promise<any> => {
        const response = await apiClient.post<any>("/Assets", data);
        return response.data;
    },

    update: async (id: number, data: UpdateAssetDto): Promise<any> => {
        const response = await apiClient.put<any>(`/Assets/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<any> => {
        const response = await apiClient.delete<any>(`/Assets/${id}`);
        return response.data;
    },

    import: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post<any>("/Assets/import", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    }
};
