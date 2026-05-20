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
        const response = await apiClient.get<TermsAndConditionsTemplate[]>('/api/termsandconditions');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<TermsAndConditionsTemplate>(`/api/termsandconditions/${id}`);
        return response.data;
    },

    getDefault: async () => {
        try {
            const response = await apiClient.get<TermsAndConditionsTemplate>('/api/termsandconditions/default');
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                return null; // No default exists
            }
            throw error;
        }
    },

    create: async (data: Partial<TermsAndConditionsTemplate>) => {
        const response = await apiClient.post<TermsAndConditionsTemplate>('/api/termsandconditions', data);
        return response.data;
    },

    update: async (id: number, data: Partial<TermsAndConditionsTemplate>) => {
        const response = await apiClient.put<TermsAndConditionsTemplate>(`/api/termsandconditions/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/termsandconditions/${id}`);
    },

    setDefault: async (id: number) => {
        await apiClient.post(`/api/termsandconditions/${id}/default`);
    }
};
