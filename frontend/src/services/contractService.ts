import { apiClient } from "./apiClient";
import { ContractDto, CreateContractDto, UpdateContractDto, CreateContractItemDto } from "../types/contract";

export const contractService = {
    getAll: async (): Promise<ContractDto[]> => {
        const response = await apiClient.get<ContractDto[]>("/Contracts");
        return response.data;
    },

    getById: async (id: number): Promise<ContractDto> => {
        const response = await apiClient.get<ContractDto>(`/Contracts/${id}`);
        return response.data;
    },

    create: async (data: CreateContractDto): Promise<{ message: string, id: number }> => {
        const response = await apiClient.post<{ message: string, id: number }>("/Contracts", data);
        return response.data;
    },

    downloadPdf: async (id: number): Promise<Blob> => {
        const response = await apiClient.get(`/Contracts/${id}/pdf`, {
            responseType: "blob",
        });
        return response.data;
    },

    update: async (id: number, data: UpdateContractDto): Promise<void> => {
        await apiClient.put(`/Contracts/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/Contracts/${id}`);
    },

    addAsset: async (data: CreateContractItemDto): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>("/Contracts/add-asset", data);
        return response.data;
    },

    removeAsset: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/Contracts/remove-asset/${id}`);
        return response.data;
    }
};
