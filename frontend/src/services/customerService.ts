import { apiClient } from "./apiClient";
import { CustomerDto, CreateCustomerDto } from "../types/customer";

export const customerService = {
    getAll: async (): Promise<CustomerDto[]> => {
        const response = await apiClient.get<CustomerDto[]>("/Customers");
        return response.data;
    },

    getById: async (id: number): Promise<CustomerDto> => {
        const response = await apiClient.get<CustomerDto>(`/Customers/${id}`);
        return response.data;
    },

    create: async (data: CreateCustomerDto): Promise<{ message: string; id: number }> => {
        const response = await apiClient.post<{ message: string; id: number }>("/Customers", data);
        return response.data;
    },

    update: async (id: number, data: CreateCustomerDto): Promise<{ message: string }> => {
        const response = await apiClient.put<{ message: string }>(`/Customers/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/Customers/${id}`);
        return response.data;
    }
};
