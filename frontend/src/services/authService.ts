import { apiClient } from "./apiClient";
import { LoginDto, RegisterDto, AuthResponse, ForgotPasswordDto, ResetPasswordDto } from "../types/auth";

export const authService = {
    login: async (credentials: LoginDto): Promise<AuthResponse> => {
        // Map to the actual backend endpoint discovered in Program.cs
        const response = await apiClient.post<AuthResponse>("/Auth/login", credentials);
        return response.data;
    },

    loginStepTwo: async (tempToken: string, tenantId: number): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>("/Auth/login-step-two", { tempToken, tenantId });
        return response.data;
    },

    register: async (credentials: RegisterDto): Promise<any> => {
        // Map to the backend endpoint found in AuthController.cs
        const response = await apiClient.post<any>("/Auth/register", credentials);
        return response.data;
    },

    forgotPassword: async (data: ForgotPasswordDto): Promise<any> => {
        const response = await apiClient.post<any>("/Auth/forgot-password", data);
        return response.data;
    },

    resetPassword: async (data: ResetPasswordDto): Promise<any> => {
        const response = await apiClient.post<any>("/Auth/reset-password", data);
        return response.data;
    },

    getUsers: async (): Promise<any[]> => {
        const response = await apiClient.get<any[]>("/Auth/users");
        return response.data;
    },

    getRoles: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>("/Auth/roles");
        return response.data;
    },

    createUser: async (userData: any): Promise<any> => {
        const response = await apiClient.post<any>("/Auth/create-user", userData);
        return response.data;
    },

    logout: () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
    },

    getCurrentUser: () => {
        const userStr = sessionStorage.getItem("user");
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    isAuthenticated: (): boolean => {
        return !!sessionStorage.getItem("token");
    }
};
