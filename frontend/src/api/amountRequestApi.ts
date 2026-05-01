import { apiClient as api } from "../services/apiClient";

export interface AmountRequestPayment {
  id?: number;
  releasedDate?: string;
  releasedAmount: number;
  receivedBy: string;
  modeOfPayment: string;
  remarks: string;
}

export interface AmountRequestFormDto {
  id: number;
  createdAt: string;
  employeeName: string;
  employeeEmail: string;
  advanceRequested: number;
  accountDetail: string;
  dateOfFundRequired?: string;
  siteId?: number;
  siteName?: string;
  customSiteName: string;
  clientName: string;
  purposeOfAdvance: string;
  status: string;
  directorName?: string;
  directorApprovalDate?: string;
  directorComment?: string;
  ceoName?: string;
  ceoApprovalDate?: string;
  ceoComment?: string;
  accountsDateOfEntry?: string;
  accountsDateOfFundReleased?: string;
  accountsReleasedAmount?: number;
  accountsRemarks?: string;
  payments: AmountRequestPayment[];
}

export const amountRequestApi = {
  getAll: () => api.get<AmountRequestFormDto[]>("/AmountRequestForms"),
  getById: (id: number) => api.get<AmountRequestFormDto>(`/AmountRequestForms/${id}`),
  create: (data: Partial<AmountRequestFormDto>) => api.post<AmountRequestFormDto>("/AmountRequestForms", data),
  approve: (id: number, data: { approverRole: string; approverName: string; comment: string; isApproved: boolean }) =>
    api.post<AmountRequestFormDto>(`/AmountRequestForms/${id}/approve`, data),
  releaseAmount: (id: number, data: { dateOfEntry?: string; dateOfFundReleased?: string; releasedAmount: number; remarks: string }) =>
    api.post<AmountRequestFormDto>(`/AmountRequestForms/${id}/release`, data),
  addPayment: (id: number, data: AmountRequestPayment) =>
    api.post<AmountRequestFormDto>(`/AmountRequestForms/${id}/payments`, data),
};
