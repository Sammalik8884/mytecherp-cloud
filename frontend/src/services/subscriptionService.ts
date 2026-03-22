import { apiClient } from "./apiClient";

export interface SubscriptionPlan {
    id: number;
    name: string;
    stripePriceId: string;
    monthlyPrice: number;
    maxUsers: number;
    isActive: boolean;
}

export interface SubscriptionStatusResponse {
    hasSubscription: boolean;
    status: string;
    currentPeriodEnd: string | null;
    plan: SubscriptionPlan | null;
}

export const subscriptionService = {
    getPlans: async (): Promise<SubscriptionPlan[]> => {
        const response = await apiClient.get("/subscription/plans");
        return response.data;
    },

    getStatus: async (): Promise<SubscriptionStatusResponse> => {
        const response = await apiClient.get("/subscription/status");
        return response.data;
    },

    createCheckoutSession: async (stripePriceId: string, customerEmail: string): Promise<string> => {
        const response = await apiClient.post(`/subscription/create-checkout`, { stripePriceId, customerEmail });
        return response.data.checkoutUrl;
    }
};
