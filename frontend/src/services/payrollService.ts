import { apiClient } from "./apiClient";
import { GeneratePayslipDto, PayslipDto, EmployeePayrollProfileDto, CreatePayrollProfileDto } from "../types/hr";

export const payrollService = {
    // This assumes there's an endpoint to get all payslips in the backend. If not, it can be added later.
    getAllPayslips: async (): Promise<PayslipDto[]> => {
        try {
            const response = await apiClient.get<PayslipDto[]>("/Payroll/payslips");
            return response.data;
        } catch (error: any) {
            // Gracefully handle if endpoint isn't fully scaffolded natively yet
            if (error.response?.status === 404) return [];
            throw error;
        }
    },

    generatePayslip: async (request: GeneratePayslipDto): Promise<PayslipDto> => {
        const response = await apiClient.post<PayslipDto>("/Payroll/generate", request);
        return response.data;
    },

    approveAndPay: async (payslipId: number): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(`/Payroll/payslips/${payslipId}/pay`);
        return response.data;
    },

    // Get profiles assumes backend has this route, typically needed for the UI dropdowns
    getAllProfiles: async (): Promise<EmployeePayrollProfileDto[]> => {
        try {
            const response = await apiClient.get<EmployeePayrollProfileDto[]>("/Payroll/profiles");
            return response.data;
        } catch (error) {
            return []; // Mocks are handled in PayrollPage for backwards compatibility if needed
        }
    },

    createProfile: async (request: CreatePayrollProfileDto): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>("/Payroll/profile", request);
        return response.data;
    },

    addEntry: async (request: { userId: string, type: number, amount: number, description: string, workOrderId?: number }): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>("/Payroll/entry", request);
        return response.data;
    }
};
