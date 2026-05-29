import { apiClient } from './apiClient';

export interface DprActivityDto {
  id?: number;
  activityDone: string;
}

export interface DprEmployeeDto {
  id?: number;
  employeeName: string;
  inTime: string;
  outTime: string;
  overTime: string;
}

export interface DprMaterialDto {
  id?: number;
  item: string;
  quantity: string;
  remarks: string;
}

export interface DprAttachmentDto {
  id: number;
  fileName: string;
  fileUrl: string;
}

export interface DailyProgressReportDto {
  id: number;
  siteId: number;
  siteName?: string;
  date: string;
  siteInCharge: string;
  siteOpeningTime: string;
  siteClosingTime: string;
  totalWorkers: number;
  nextDayActivityPlan: string;
  createdByUserName: string;
  activities: DprActivityDto[];
  employees: DprEmployeeDto[];
  materials: DprMaterialDto[];
  attachments: DprAttachmentDto[];
}

export const dprService = {
  create: async (formData: FormData): Promise<DailyProgressReportDto> => {
    const response = await apiClient.post('/DailyProgressReport', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getBySiteId: async (siteId: number): Promise<DailyProgressReportDto[]> => {
    const response = await apiClient.get(`/DailyProgressReport/site/${siteId}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/DailyProgressReport/${id}`);
  },

  downloadPdf: async (id: number): Promise<void> => {
    const response = await apiClient.get(`/DailyProgressReport/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_Progress_Report_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
};
