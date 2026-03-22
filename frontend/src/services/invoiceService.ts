import { apiClient } from './apiClient';
import { InvoiceDto } from '../types/finance';

export const invoiceService = {
    getAll: async (): Promise<InvoiceDto[]> => {
        const response = await apiClient.get<InvoiceDto[]>("/Invoice");
        return response.data;
    },

    getById: async (id: number): Promise<InvoiceDto> => {
        const response = await apiClient.get<InvoiceDto>(`/Invoice/${id}`);
        return response.data;
    },

    generateFromQuote: async (quotationId: number): Promise<InvoiceDto> => {
        const response = await apiClient.post<InvoiceDto>(`/Invoice/from-quote/${quotationId}`);
        return response.data;
    },

    generateFromJob: async (workOrderId: number): Promise<{ message: string; invoiceId: number }> => {
        const response = await apiClient.post<{ message: string; invoiceId: number }>(`/Invoice/generate-from-job/${workOrderId}`);
        return response.data;
    },

    markAsIssued: async (id: number): Promise<any> => {
        // Assuming hitting an endpoint to update status, or similar
        const response = await apiClient.put<any>(`/Invoice/${id}/status`, 1, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    markAsPaid: async (id: number): Promise<any> => {
        const response = await apiClient.put<any>(`/Invoice/${id}/status`, 2, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    createCustom: async (dto: any): Promise<{ message: string, invoiceId: number, invoiceNumber: string }> => {
        const response = await apiClient.post('/Invoice/custom', dto);
        return response.data;
    },

    downloadPdf: async (id: number): Promise<Blob> => {
        const response = await apiClient.get(`/Invoice/${id}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    }
};
