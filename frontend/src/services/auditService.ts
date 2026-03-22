import { apiClient } from "./apiClient";
import { AuditLogDto } from "../types/system";

export const auditService = {
    getQuotationHistory: async (id: number): Promise<AuditLogDto[]> => {
        try {
            const response = await apiClient.get<AuditLogDto[]>(`/Audit/quotation/${id}`);
            return response.data;
        } catch (error: any) {
            // gracefully fail and return empty array if quotation not found or has no history
            if (error.response?.status === 404) return [];
            throw error;
        }
    },
    getRecentLogs: async (entityName?: string): Promise<AuditLogDto[]> => {
        try {
            const url = entityName ? `/Audit/recent?entityName=${entityName}` : `/Audit/recent`;
            const response = await apiClient.get<AuditLogDto[]>(url);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) return [];
            throw error;
        }
    }
};
