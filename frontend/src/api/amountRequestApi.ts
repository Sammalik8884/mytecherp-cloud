import { apiClient as api } from "../services/apiClient";

export interface AmountRequestPayment {
  id?: number;
  releasedDate?: string;
  releasedAmount: number;
  receivedBy: string;
  modeOfPayment: string;
  remarks: string;
  paymentSlipUrl?: string;
}

export interface AmountRequestFormDto {
  id: number;
  arfNumber?: string;
  createdAt: string;
  employeeName: string;
  employeeEmail: string;
  advanceRequested: number;
  accountDetail: string;
  dateOfFundRequired?: string;
  siteId?: number;
  siteName?: string;
  officeId?: number;
  officeName?: string;
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
  attachments?: string[];
  procurementId?: number;
}

export const amountRequestApi = {
  getAll: () => api.get<AmountRequestFormDto[]>("/AmountRequestForms"),
  getPendingForAccounts: () => api.get<AmountRequestFormDto[]>("/AmountRequestForms/accounts/pending"),
  getPartialForAccounts: () => api.get<AmountRequestFormDto[]>("/AmountRequestForms/accounts/partial"),
  getHistoryForAccounts: () => api.get<AmountRequestFormDto[]>("/AmountRequestForms/accounts/history"),
  getById: (id: number) => api.get<AmountRequestFormDto>(`/AmountRequestForms/${id}`),
  create: (data: Partial<AmountRequestFormDto>) => api.post<AmountRequestFormDto>("/AmountRequestForms", data),
  approve: (id: number, data: { approverRole: string; approverName: string; comment: string; isApproved: boolean }) =>
    api.post<AmountRequestFormDto>(`/AmountRequestForms/${id}/approve`, data),
  delete: (id: number) => api.delete<void>(`/AmountRequestForms/${id}`),
  bulkDelete: (ids: number[]) => api.post<void>("/AmountRequestForms/bulk-delete", ids),
  releaseAmount: (id: number, data: { dateOfEntry?: string; dateOfFundReleased?: string; releasedAmount: number; remarks: string; paymentSlips?: FileList | File[] }) => {
    const formData = new FormData();
    if (data.dateOfEntry) formData.append('dateOfEntry', data.dateOfEntry);
    if (data.dateOfFundReleased) formData.append('dateOfFundReleased', data.dateOfFundReleased);
    formData.append('releasedAmount', data.releasedAmount.toString());
    formData.append('remarks', data.remarks);
    if (data.paymentSlips && data.paymentSlips.length > 0) {
      Array.from(data.paymentSlips).forEach(file => {
        formData.append('paymentSlips', file);
      });
    }
    return api.post<AmountRequestFormDto>(`/AmountRequestForms/${id}/release`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  addPayment: (id: number, data: AmountRequestPayment) =>
    api.post<AmountRequestFormDto>(`/AmountRequestForms/${id}/payments`, data),
  uploadAttachment: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<AmountRequestFormDto>(`/AmountRequestForms/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
