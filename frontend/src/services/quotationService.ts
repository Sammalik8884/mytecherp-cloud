import { apiClient } from './apiClient';

export interface QuotationItemDto {
    id: number;
    productId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    itemType: string;
    serviceName?: string;
    originalPrice: number;
    calculationBreakdown?: string;
}

export interface QuotationDto {
    id: number;
    quoteNumber: string;
    validUntil: string;
    status: string;
    createdAt: string;
    customerId: number;
    customerName: string;
    contactPersonName?: string;
    siteName?: string;
    currency: string;
    subTotal: number;
    gstPercentage: number;
    gstAmount: number;
    incomeTaxPercentage: number;
    incomeTaxAmount: number;
    adjustment: number;
    grandTotal: number;
    quoteMode: string;
    supplyColumnMode: string;
    revisionNumber: number;
    projectCode: string;
    quoteHeadline?: string;
    items: QuotationItemDto[];
}

export interface CreateQuotationItemDto {
    productId?: number | null;
    quantity: number;
    manualCommissionPct?: number;
    itemType: string;
    serviceName?: string;
    servicePrice?: number;
}

export interface CreateQuotationDto {
    customerId: number;
    opportunityId?: number;
    siteId?: number;
    assetId?: number;
    currency: string;
    exchangeRate: number;
    globalCommissionPct: number;
    gstPercentage: number;
    incomeTaxPercentage: number;
    adjustment: number;
    quoteMode: string;
    supplyColumnMode: string;
    costFactorPct?: number;
    importationPct?: number;
    transportationPct?: number;
    profitPct?: number;
    projectCode?: string;
    quoteHeadline?: string;
    items: CreateQuotationItemDto[];
}

export interface QuoteItemMapDto {
    productId: number;
    quantity: number;
    unitPrice: number;
    description: string;
}

export interface ConvertFailureToQuoteDto {
    workOrderId: number;
    failedChecklistIds: number[];
    items: QuoteItemMapDto[];
}

export const quotationService = {
    getAllQuotations: async (): Promise<QuotationDto[]> => {
        const response = await apiClient.get('/Quotation');
        return response.data;
    },

    getQuotationById: async (id: number): Promise<QuotationDto> => {
        const response = await apiClient.get(`/Quotation/${id}`);
        return response.data;
    },

    createQuotation: async (data: CreateQuotationDto): Promise<QuotationDto> => {
        const response = await apiClient.post('/Quotation', data);
        return response.data;
    },

    updateQuotation: async (id: number, data: CreateQuotationDto): Promise<QuotationDto> => {
        const response = await apiClient.put(`/Quotation/${id}`, data);
        return response.data;
    },

    deleteQuotation: async (id: number): Promise<void> => {
        await apiClient.delete(`/Quotation/${id}`);
    },

    downloadPdf: async (id: number): Promise<Blob> => {
        const response = await apiClient.get(`/Quotation/${id}/pdf`, {
            responseType: 'blob',
        });
        return response.data;
    },

    sendEmail: async (id: number): Promise<void> => {
        await apiClient.post(`/Quotation/${id}/send-email`);
    },

    convertToWorkOrder: async (id: number): Promise<{ message: string; workOrderId: number }> => {
        const response = await apiClient.post(`/Quotation/${id}/convert-to-workorder`);
        return response.data;
    },

    submitForApproval: async (id: number): Promise<any> => {
        const response = await apiClient.post(`/Quotation/${id}/submit`);
        return response.data;
    },

    approve: async (id: number): Promise<any> => {
        const response = await apiClient.post(`/Quotation/${id}/approve`);
        return response.data;
    },

    reject: async (id: number, comment: string): Promise<any> => {
        const response = await apiClient.post(`/Quotation/${id}/reject`, JSON.stringify(comment), {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    convertToContract: async (id: number, startDate?: string): Promise<{ message: string; contractId: number }> => {
        const url = startDate ? `/Quotation/${id}/convert-to-contract?startDate=${encodeURIComponent(startDate)}` : `/Quotation/${id}/convert-to-contract`;
        const response = await apiClient.post(url);
        return response.data;
    },

    createFromFailure: async (data: ConvertFailureToQuoteDto): Promise<{ message: string; quoteId: number; nextStep: string }> => {
        const response = await apiClient.post(`/Quotation/create-from-failure`, data);
        return response.data;
    }
};
