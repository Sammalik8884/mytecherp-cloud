import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
        const response = await axios.get(`${API_BASE_URL}/api/VehicleTravelForm`);
        return response.data;
    },
    
    create: async (data: CreateVehicleTravelFormDto): Promise<VehicleTravelFormDto> => {
        const response = await axios.post(`${API_BASE_URL}/api/VehicleTravelForm`, data);
        return response.data;
    }
};
