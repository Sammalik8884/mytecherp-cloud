import { apiClient } from './apiClient';

export interface ProjectSpotCheckItem {
  id?: number;
  itemText: string;
  isYes: boolean;
  isNo: boolean;
  isNA: boolean;
  comments: string;
}

export interface ProjectSpotCheck {
  id: number;
  siteId: number;
  siteName: string;
  createdAt: string;
  createdByUserName: string;
  uploadedFiles?: string;
  items: ProjectSpotCheckItem[];
}

export interface CreateProjectSpotCheck {
  siteId: number;
  uploadedFiles?: string;
  items: ProjectSpotCheckItem[];
}

export const getProjectSpotChecks = async (): Promise<ProjectSpotCheck[]> => {
  const response = await apiClient.get('/ProjectSpotCheck');
  return response.data;
};

export const getProjectSpotCheckById = async (id: number): Promise<ProjectSpotCheck> => {
  const response = await apiClient.get(`/ProjectSpotCheck/${id}`);
  return response.data;
};

export const createProjectSpotCheck = async (data: CreateProjectSpotCheck): Promise<ProjectSpotCheck> => {
  const response = await apiClient.post('/ProjectSpotCheck', data);
  return response.data;
};

export const updateProjectSpotCheck = async (id: number, data: CreateProjectSpotCheck): Promise<ProjectSpotCheck> => {
  const response = await apiClient.put(`/ProjectSpotCheck/${id}`, data);
  return response.data;
};

export const deleteProjectSpotCheck = async (id: number): Promise<void> => {
  await apiClient.delete(`/ProjectSpotCheck/${id}`);
};
