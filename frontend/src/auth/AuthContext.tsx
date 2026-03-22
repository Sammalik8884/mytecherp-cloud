import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { UserDto, LoginDto, RegisterDto, PlanFeature } from "../types/auth";
import { authService } from "../services/authService";
import { apiClient } from "../services/apiClient";

interface AuthContextType {
    user: UserDto | null;
    isAuthenticated: boolean;
    login: (credentials: LoginDto) => Promise<any | void>;
    loginStepTwo: (tempToken: string, tenantId: number, credentials: LoginDto) => Promise<void>;
    register: (credentials: RegisterDto) => Promise<any>;
    logout: () => void;
    hasRole: (allowedRoles: string[]) => boolean;
    hasFeature: (feature: PlanFeature) => boolean;
    refreshPlanFeatures: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserDto | null>(() => authService.getCurrentUser());
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

    // Silently refresh planFeatures from the backend on every app load.
    // This ensures upgraded tenants get their new features immediately
    // without needing to log out and back in.
    const refreshPlanFeatures = useCallback(async () => {
        if (!authService.isAuthenticated()) return;
        try {
            const response = await apiClient.get<{ planFeatures: number; planName: string; status: string }>(
                "/subscription/refresh-features"
            );
            const { planFeatures } = response.data;
            setUser(prev => {
                if (!prev) return prev;
                const updated = { ...prev, planFeatures };
                sessionStorage.setItem("user", JSON.stringify(updated));
                return updated;
            });
        } catch {
            // Silently swallow — the user's cached planFeatures are still functional
        }
    }, []);

    // Refresh on app load
    useEffect(() => {
        if (isAuthenticated) {
            refreshPlanFeatures();
        }
    }, [isAuthenticated]);

    const login = async (credentials: LoginDto) => {
        try {
            const data = await authService.login(credentials);
            if (data.requiresTenantSelection) {
                return data; // Return to the UI so it can pop up the tenant selection
            }
            if (data.token) {
                sessionStorage.setItem("token", data.token);
                sessionStorage.setItem("erp_creds", btoa(JSON.stringify(credentials)));

                const userObj = {
                    email: data.email,
                    fullName: data.fullName,
                    roles: data.roles,
                    planFeatures: data.planFeatures
                };
                sessionStorage.setItem("user", JSON.stringify(userObj));
                setUser(userObj as any);
                setIsAuthenticated(true);
            } else {
                throw new Error("Invalid email or password.");
            }
        } catch (error: any) {
            if (error.response && error.response.status === 401) {
                throw new Error("Invalid email or password.");
            }
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Login failed. Please check your credentials.");
        }
    };

    const loginStepTwo = async (tempToken: string, tenantId: number, credentials: LoginDto) => {
        try {
            const data = await authService.loginStepTwo(tempToken, tenantId);
            if (data.token) {
                sessionStorage.setItem("token", data.token);
                sessionStorage.setItem("erp_creds", btoa(JSON.stringify(credentials)));

                const userObj = {
                    email: data.email,
                    fullName: data.fullName,
                    roles: data.roles,
                    planFeatures: data.planFeatures
                };
                sessionStorage.setItem("user", JSON.stringify(userObj));
                setUser(userObj as any);
                setIsAuthenticated(true);
            } else {
                throw new Error("Invalid workspace selection.");
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Login failed during workspace selection.");
        }
    };

    const register = async (credentials: RegisterDto) => {
        const data = await authService.register(credentials);
        return data;
    };

    const logout = () => {
        authService.logout();
        sessionStorage.removeItem("erp_creds");
        setUser(null);
        setIsAuthenticated(false);
    };

    const hasRole = (allowedRoles: string[]) => {
        if (!user || !user.roles || user.roles.length === 0) return false;
        return user.roles.some((role: string) => allowedRoles.includes(role));
    };

    const hasFeature = (feature: PlanFeature) => {
        if (!user || user.planFeatures === undefined || user.planFeatures === null) return false;
        // Bitwise AND to check if the specific feature flag is set
        return (user.planFeatures & feature) === feature;
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, loginStepTwo, register, logout, hasRole, hasFeature, refreshPlanFeatures }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
