import { apiClient } from '../services/apiClient';

export interface ArfReturnDto {
    id: number;
    amountRequestFormId: number;
    arfNumber: string;
    returnAmount: number;
    details: string;
    returnDate: string;
    returnedByEmail: string;
    isDebt: boolean;
}

export interface CreateArfReturnDto {
    amountRequestFormId: number;
    returnAmount: number;
    details: string;
}

export const arfReturnApi = {
    getAll: () => apiClient.get<ArfReturnDto[]>('/ArfReturns'),
    create: (data: CreateArfReturnDto) => apiClient.post<ArfReturnDto>('/ArfReturns', data),
    getDebtBalance: () => apiClient.get<number>('/ArfReturns/debt')
};

