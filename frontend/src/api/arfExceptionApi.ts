import { apiClient } from "../services/apiClient";

export interface ArfExceptionRequestDto {
    id: number;
    employeeEmail: string;
    requestedAmount: number;
    reason: string;
    status: string;
    munawarComment?: string;
    isUsed: boolean;
    createdAt: string;
    updatedAt?: string;
}

export const arfExceptionApi = {
    create: (data: { employeeEmail: string; requestedAmount: number; reason: string }) => 
        apiClient.post<ArfExceptionRequestDto>("/ArfExceptions", data),
    
    approve: (id: number, data: { isApproved: boolean; comment: string }) => 
        apiClient.post<ArfExceptionRequestDto>(`/ArfExceptions/${id}/approve`, data),
    
    getAll: () => 
        apiClient.get<ArfExceptionRequestDto[]>("/ArfExceptions/all"),
    
    getMyRequests: () => 
        apiClient.get<ArfExceptionRequestDto[]>("/ArfExceptions/my")
};
