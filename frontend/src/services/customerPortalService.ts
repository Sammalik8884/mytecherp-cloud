import { apiClient } from "./apiClient";
import { InvoiceDto } from "../types/finance";
import { PaymentRequestDto, PaymentResponseDto } from "../types/finance";

export const customerPortalService = {
    /** Returns all invoices for the currently authenticated customer */
    getMyInvoices: async (): Promise<InvoiceDto[]> => {
        const response = await apiClient.get<InvoiceDto[]>("/Invoice/my");
        return response.data;
    },

    /** Returns full detail of a specific invoice (authenticated, ownership enforced by backend) */
    getInvoiceById: async (id: number): Promise<InvoiceDto> => {
        const response = await apiClient.get<InvoiceDto>(`/Invoice/${id}`);
        return response.data;
    },

    /** Download/view invoice PDF as a Blob */
    downloadPdf: async (id: number): Promise<Blob> => {
        const response = await apiClient.get(`/Invoice/${id}/pdf`, { responseType: "blob" });
        return response.data;
    },

    /** Initiate Stripe payment for an invoice */
    payInvoice: async (request: PaymentRequestDto): Promise<PaymentResponseDto> => {
        const response = await apiClient.post<PaymentResponseDto>("/Payment/initiate", request);
        return response.data;
    }
};
