import { apiClient } from "./apiClient";

export interface GlobalSearchDto {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    path: string;
}

export const searchService = {
    search: async (query: string): Promise<GlobalSearchDto[]> => {
        if (!query.trim()) return [];
        const response = await apiClient.get<GlobalSearchDto[]>(`/Search?q=${encodeURIComponent(query)}`);
        return response.data;
    }
};
