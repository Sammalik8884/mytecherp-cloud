import { apiClient as api } from '../services/apiClient';

export interface VehicleTravelFormAttachmentDto {
    id?: number;
    fileName: string;
    fileUrl: string;
}

export interface VehicleTravelFormDto {
    id: number;
    createdAt: string;
    employeeName: string;
    employeeId: string;
    contact: string;
    vehicleName: string;
    registrationNumber: string;
    startReading: number;
    endReading: number;
    currentDate: string;
    createdByUserId: string;
    createdByUserName: string;
    attachments: VehicleTravelFormAttachmentDto[];
}

export interface CreateVehicleTravelFormDto {
    employeeName: string;
    employeeId: string;
    contact: string;
    vehicleName: string;
    registrationNumber: string;
    startReading: number;
    endReading: number;
    currentDate: string;
    attachments: VehicleTravelFormAttachmentDto[];
}

export const vehicleTravelFormApi = {
    getAll: async (): Promise<VehicleTravelFormDto[]> => {
        const response = await api.get(`/VehicleTravelForm`);
        return response.data;
    },
    
    create: async (data: any): Promise<VehicleTravelFormDto> => {
        const response = await api.post(`/VehicleTravelForm`, data);
        return response.data;
    }
};
