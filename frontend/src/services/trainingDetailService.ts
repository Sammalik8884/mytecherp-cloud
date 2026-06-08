import { apiClient } from './apiClient';

export interface TrainingDetailParticipantDto {
    id: number;
    trainingDetailId: number;
    participantName: string;
    employeeId: string;
    department: string;
    designation: string;
    contactDetails: string;
    employeeStatus: string;
}

export interface TrainingDetailDto {
    id: number;
    trainerName: string;
    fromTime: string;
    toTime: string;
    date: string;
    location: string;
    trainingType: string;
    participants: TrainingDetailParticipantDto[];
}

export const trainingDetailService = {
    getAll: async (): Promise<TrainingDetailDto[]> => {
        const response = await apiClient.get('/TrainingDetail');
        return response.data;
    },

    getById: async (id: number): Promise<TrainingDetailDto> => {
        const response = await apiClient.get(`/TrainingDetail/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<TrainingDetailDto> => {
        const response = await apiClient.post('/TrainingDetail', data);
        return response.data;
    },

    update: async (id: number, data: any): Promise<void> => {
        await apiClient.put(`/TrainingDetail/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/TrainingDetail/${id}`);
    },

    updateParticipant: async (participantId: number, data: { name: string, status: string }): Promise<void> => {
        await apiClient.put(`/TrainingDetail/participant/${participantId}`, data);
    },

    deleteParticipant: async (participantId: number): Promise<void> => {
        await apiClient.delete(`/TrainingDetail/participant/${participantId}`);
    }
};
