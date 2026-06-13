import { apiClient } from "../services/apiClient";

export interface ExpenseItemDto {
    id?: number;
    expenseDate: string;
    employeeName: string;
    employeeDesignation: string;
    expenseType: string;
    descriptionItems: string;
    amount: number;
    remarks: string;
    isExcessItem?: boolean;
    fileUrl?: string;
    attachments?: string[];
}

export interface ExpenseDto {
    id: number;
    siteId?: number | null;
    siteName?: string;
    officeId?: number | null;
    officeName?: string;
    amountRequestFormId?: number | null;
    arfNumber: string;
    totalExpenseAmount: number;
    arfReleasedAmount: number;
    createdByEmail: string;
    createdAt: string;
    items: ExpenseItemDto[];
}

export interface CreateExpenseDto {
    siteId?: number | null;
    officeId?: number | null;
    amountRequestFormId?: number | null;
    items: ExpenseItemDto[];
}

export const expenseApi = {
    getAll: async () => {
        const response = await apiClient.get<ExpenseDto[]>("/Expenses");
        return response.data;
    },
    getById: async (id: number) => {
        const response = await apiClient.get<ExpenseDto>(`/Expenses/${id}`);
        return response.data;
    },
    getBySiteId: async (siteId: number) => {
        const response = await apiClient.get<ExpenseDto[]>(`/Expenses/site/${siteId}`);
        return response.data;
    },
    create: async (data: CreateExpenseDto) => {
        const response = await apiClient.post<ExpenseDto>("/Expenses", data);
        return response.data;
    },
    update: async (id: number, data: CreateExpenseDto) => {
        const response = await apiClient.put<ExpenseDto>(`/Expenses/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/Expenses/${id}`);
        return response.data;
    },
    uploadAttachment: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post<{ url: string }>("/Expenses/upload-attachment", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data.url;
    }
};
