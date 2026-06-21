import { apiClient } from './apiClient';
import {
  ProcurementRequestDto,
  CreateProcurementRequestDto,
  PdReviewProcurementDto,
  AssignProcurementExecutiveDto
} from '../types/procurementFlow';

const BASE_URL = '/Procurement';

export const procurementFlowService = {
  getAll: async (): Promise<ProcurementRequestDto[]> => {
    const response = await apiClient.get<ProcurementRequestDto[]>(BASE_URL);
    return response.data;
  },

  getPendingPd: async (): Promise<ProcurementRequestDto[]> => {
    const response = await apiClient.get<ProcurementRequestDto[]>(`${BASE_URL}/pending-pd`);
    return response.data;
  },

  getApproved: async (): Promise<ProcurementRequestDto[]> => {
    const response = await apiClient.get<ProcurementRequestDto[]>(`${BASE_URL}/approved`);
    return response.data;
  },

  getPendingExecutive: async (): Promise<ProcurementRequestDto[]> => {
    const response = await apiClient.get<ProcurementRequestDto[]>(`${BASE_URL}/pending-executive`);
    return response.data;
  },

  getCompletedExecutive: async (): Promise<ProcurementRequestDto[]> => {
    const response = await apiClient.get<ProcurementRequestDto[]>(`${BASE_URL}/completed-executive`);
    return response.data;
  },

  getById: async (id: number): Promise<ProcurementRequestDto> => {
    const response = await apiClient.get<ProcurementRequestDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateProcurementRequestDto): Promise<ProcurementRequestDto> => {
    const response = await apiClient.post<ProcurementRequestDto>(BASE_URL, data);
    return response.data;
  },

  pdReview: async (id: number, data: PdReviewProcurementDto): Promise<ProcurementRequestDto> => {
    const response = await apiClient.post<ProcurementRequestDto>(`${BASE_URL}/${id}/pd-review`, data);
    return response.data;
  },

  generateArf: async (id: number): Promise<ProcurementRequestDto> => {
    const response = await apiClient.post<ProcurementRequestDto>(`${BASE_URL}/${id}/generate-arf`, {});
    return response.data;
  },

  assign: async (id: number, data: AssignProcurementExecutiveDto): Promise<ProcurementRequestDto> => {
    const response = await apiClient.post<ProcurementRequestDto>(`${BASE_URL}/${id}/assign`, data);
    return response.data;
  },

  complete: async (id: number, text: string, files: File[]): Promise<ProcurementRequestDto> => {
    const formData = new FormData();
    if (text) {
      formData.append('deliveryNoteText', text);
    }
    if (files && files.length > 0) {
      files.forEach(f => formData.append('deliveryNoteDocuments', f));
    }
    const response = await apiClient.post<ProcurementRequestDto>(`${BASE_URL}/${id}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
