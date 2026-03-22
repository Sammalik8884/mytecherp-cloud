export enum PlanFeature {
    None = 0,
    HrPayroll = 1,
    ChecklistFormBuilder = 2,
    AuditLogs = 4,
    AdvancedAnalytics = 8,
    OfflineSync = 16
}

export interface LoginDto {
    email?: string;
    password?: string;
}

export interface RegisterDto {
    email?: string;
    password?: string;
    fullName?: string;
    companyName?: string;
}

export interface UserDto {
    id?: string;
    fullName?: string;
    email: string;
    roles?: string[];
    tenantId?: string | null;
    planFeatures?: number;
}

export interface AuthResponse {
    token: string;
    email: string;
    fullName: string;
    roles: string[];
    planFeatures: number;
    requiresTenantSelection?: boolean;
    tempToken?: string;
    tenants?: { tenantId: number; companyName: string; userId: string }[];
}

export interface ForgotPasswordDto {
    email: string;
}

export interface ResetPasswordDto {
    email: string;
    token: string;
    newPassword: string;
}
