import { apiClient } from './apiClient';

export interface VendorDto {
    id: number;
    vendorName: string;
    cityName?: string;
    contactPerson?: string;
    contactNumber?: string;
    bankAccountName?: string;
    bankName?: string;
    accountNumber?: string;
}

const BASE_URL = '/Vendor';

export const vendorService = {
    getAll: async (): Promise<VendorDto[]> => {
        const response = await apiClient.get<VendorDto[]>(BASE_URL);
        return response.data;
    },
    create: async (data: Partial<VendorDto>): Promise<VendorDto> => {
        const response = await apiClient.post<VendorDto>(BASE_URL, data);
        return response.data;
    },
    update: async (id: number, data: Partial<VendorDto>): Promise<VendorDto> => {
        const response = await apiClient.put<VendorDto>(`${BASE_URL}/${id}`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
    }
};
