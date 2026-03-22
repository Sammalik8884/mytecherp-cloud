import { apiClient } from "./apiClient";
import { CategoryDto, CreateCategoryDto } from "../types/category";

export const categoryService = {
    getAll: async (): Promise<CategoryDto[]> => {
        const response = await apiClient.get<CategoryDto[]>("/Categories");
        return response.data;
    },

    create: async (data: CreateCategoryDto): Promise<{ message: string; id: number }> => {
        const response = await apiClient.post<{ message: string; id: number }>("/Categories", data);
        return response.data;
    },

    update: async (id: number, data: CreateCategoryDto): Promise<{ message: string }> => {
        const response = await apiClient.put<{ message: string }>(`/Categories/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/Categories/${id}`);
        return response.data;
    }
};
