import { apiClient } from "../apiClient";
import { EmployeeInfo, CreateEmployeeInfo } from "../../types/hr/employeeInfo";

export const employeeInfoService = {
    getAll: async (search?: string): Promise<EmployeeInfo[]> => {
        const response = await apiClient.get<EmployeeInfo[]>("/EmployeeInfo", { params: { search } });
        return response.data;
    },

    getById: async (id: number): Promise<EmployeeInfo> => {
        const response = await apiClient.get<EmployeeInfo>(`/EmployeeInfo/${id}`);
        return response.data;
    },

    create: async (data: CreateEmployeeInfo): Promise<EmployeeInfo> => {
        const response = await apiClient.post<EmployeeInfo>("/EmployeeInfo", data);
        return response.data;
    },

    update: async (id: number, data: CreateEmployeeInfo): Promise<EmployeeInfo> => {
        const response = await apiClient.put<EmployeeInfo>(`/EmployeeInfo/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/EmployeeInfo/${id}`);
    }
};
