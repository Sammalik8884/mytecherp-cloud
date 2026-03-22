import { apiClient } from "./apiClient";
import { WorkOrderDto, CreateWorkOrderDto, UpdateWorkOrderDto, CompleteJobRequest, ChecklistResultDto, UpdateChecklistDto } from "../types/field";

export const workOrderService = {
    getAll: async (): Promise<WorkOrderDto[]> => {
        const response = await apiClient.get<WorkOrderDto[]>("/WorkOrders?pageNumber=1&pageSize=1000");
        return response.data;
    },

    getById: async (id: number): Promise<WorkOrderDto> => {
        const response = await apiClient.get<WorkOrderDto>(`/WorkOrders/${id}`);
        return response.data;
    },

    create: async (data: CreateWorkOrderDto): Promise<WorkOrderDto> => {
        const response = await apiClient.post<WorkOrderDto>("/WorkOrders", data);
        return response.data;
    },

    update: async (id: number, data: UpdateWorkOrderDto): Promise<any> => {
        const response = await apiClient.put<any>(`/WorkOrders/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<any> => {
        const response = await apiClient.delete<any>(`/WorkOrders/${id}`);
        return response.data;
    },

    getMyJobs: async (): Promise<WorkOrderDto[]> => {
        const response = await apiClient.get<WorkOrderDto[]>("/WorkOrders/my-jobs");
        return response.data;
    },

    assignTechnician: async (id: number, technicianId: string): Promise<any> => {
        const response = await apiClient.put<any>(`/WorkOrders/${id}/assign`, { technicianId });
        return response.data;
    },

    initialize: async (id: number): Promise<any> => {
        const response = await apiClient.post<any>(`/WorkOrders/${id}/initialize`);
        return response.data;
    },

    completeJob: async (id: number, request: CompleteJobRequest): Promise<any> => {
        const response = await apiClient.post<any>(`/WorkOrders/${id}/complete`, request);
        return response.data;
    },

    approveJob: async (id: number, isApproved: boolean): Promise<any> => {
        const response = await apiClient.post<any>(`/WorkOrders/${id}/approve`, isApproved);
        return response.data;
    },

    createFromQuote: async (quoteId: number): Promise<any> => {
        const response = await apiClient.post<any>("/WorkOrders/create-from-quote", { quoteId: quoteId, scheduledDate: new Date().toISOString() });
        return response.data;
    },

    getChecklist: async (id: number): Promise<ChecklistResultDto[]> => {
        const response = await apiClient.get<ChecklistResultDto[]>(`/WorkOrders/${id}/checklist`);
        return response.data;
    },

    submitChecklist: async (id: number, answers: UpdateChecklistDto[]): Promise<any> => {
        const response = await apiClient.put<any>(`/WorkOrders/${id}/checklist`, answers);
        return response.data;
    },

    uploadEvidence: async (id: number, formData: FormData): Promise<any> => {
        const response = await apiClient.post<any>(`/WorkOrders/${id}/evidence`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};
