import { apiClient } from './apiClient';

export interface TermsAndConditionsTemplate {
    id: number;
    name: string;
    isDefault: boolean;
    paymentAndTax?: string;
    delivery?: string;
    warranty?: string;
    purchaseOrder?: string;
    validityAndTransportation?: string;
    general?: string;
}

export const termsAndConditionsService = {
    getAll: async () => {
        const response = await apiClient.get<TermsAndConditionsTemplate[]>('/TermsAndConditions');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<TermsAndConditionsTemplate>(`/TermsAndConditions/${id}`);
        return response.data;
    },

    getDefault: async () => {
        try {
            const response = await apiClient.get<TermsAndConditionsTemplate>('/TermsAndConditions/default');
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                return null; // No default exists
            }
            throw error;
        }
    },

    create: async (data: Partial<TermsAndConditionsTemplate>) => {
        const response = await apiClient.post<TermsAndConditionsTemplate>('/TermsAndConditions', data);
        return response.data;
    },

    update: async (id: number, data: Partial<TermsAndConditionsTemplate>) => {
        const response = await apiClient.put<TermsAndConditionsTemplate>(`/TermsAndConditions/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/TermsAndConditions/${id}`);
    },

    setDefault: async (id: number) => {
        await apiClient.post(`/TermsAndConditions/${id}/default`);
    }
};
