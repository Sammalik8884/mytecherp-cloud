export interface EmployeePayrollProfileDto {
    id: number;
    userId: string;
    employeeName?: string;
    monthlyBaseSalary: number;
    bankAccountNumber: string;
    bankName: string;
}

export interface CreatePayrollProfileDto {
    userId: string;
    monthlyBaseSalary: number;
    bankAccountNumber: string;
    bankName: string;
}

export interface PayrollEntryDto {
    id: number;
    userId: string;
    workOrderId?: number;
    type: number; // 0=Bonus, 1=Penalty
    amount: number;
    description: string;
    dateIncurred: string;
}

export interface GeneratePayslipDto {
    userId: string;
    periodStart: string;
    periodEnd: string;
}

export interface PayslipDto {
    id: number;
    userId: string;
    employeeName?: string;
    periodStart: string;
    periodEnd: string;
    baseSalaryAmount: number;
    totalBonuses: number;
    totalPenalties: number;
    netPay: number;
    status: number; // 0=Draft, 1=Paid
}
