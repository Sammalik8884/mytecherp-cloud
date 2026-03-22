import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Info, CheckCircle2, Zap, Shield } from "lucide-react";
import { subscriptionService, SubscriptionPlan, SubscriptionStatusResponse } from "../services/subscriptionService";
import { useAuth } from "../auth/AuthContext";
import toast from "react-hot-toast";

export const SubscriptionPlansPage: React.FC = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isChekouingOut, setIsCheckingOut] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [plansData, statusData] = await Promise.all([
                subscriptionService.getPlans(),
                subscriptionService.getStatus().catch(() => null) // 404 means no active sub
            ]);
            setPlans(plansData);
            setStatus(statusData);
        } catch (error) {
            toast.error("Failed to load subscription data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async (stripePriceId: string) => {
        try {
            setIsCheckingOut(stripePriceId);
            const checkoutUrl = await subscriptionService.createCheckoutSession(stripePriceId, user?.email || "");
            window.location.href = checkoutUrl;
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to start checkout session.");
            setIsCheckingOut(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Choose Your <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Power Plan</span>
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                    Scale your operations unconditionally with our industry-leading ERP tools. No hidden fees, just pure productivity.
                </p>
            </motion.div>

            {/* Current Status Banner */}
            {status && status.hasSubscription && status.status !== "Canceled" && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-12 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8"
                >
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Your current plan: {status.plan?.name || "Active"}</h3>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Status: <span className="uppercase text-primary">{status.status}</span>
                                    {status.currentPeriodEnd && ` • Renews on ${new Date(status.currentPeriodEnd).toLocaleDateString()}`}
                                </p>
                            </div>
                        </div>
                        {status.status === "PastDue" && (
                            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-destructive flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                <span className="text-sm font-semibold">Payment failed. Please update your billing method.</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Pricing Cards */}
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:gap-12">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex flex-col overflow-hidden rounded-3xl border bg-card p-8 shadow-xl transition-all hover:shadow-2xl sm:p-10"
                    >
                        {index === 1 && (
                            <div className="absolute right-0 top-0 rounded-bl-3xl rounded-tr-3xl bg-gradient-to-r from-blue-600 to-primary px-6 py-2 text-sm font-bold tracking-wide text-white uppercase shadow-sm">
                                Most Popular
                            </div>
                        )}
                        
                        <div className="mb-8">
                            <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                            <div className="mb-6 flex items-baseline">
                                <span className="text-5xl font-extrabold tracking-tight">${plan.monthlyPrice}</span>
                                <span className="ml-2 text-muted-foreground">/mo</span>
                            </div>
                            <p className="text-muted-foreground">
                                Perfect for growing teams needing full access to the ERP modules.
                            </p>
                        </div>

                        <div className="mb-8 flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>Up to <strong>{plan.maxUsers}</strong> Active Users</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>Unlimited Customers & Assets</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>Full API & Webhook Access</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>24/7 Priority Support</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSubscribe(plan.stripePriceId)}
                            disabled={isChekouingOut !== null || (status?.hasSubscription && status?.plan?.id === plan.id && status?.status === "Active")}
                            className={`group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl font-bold tracking-wide text-white transition-all ${
                                status?.hasSubscription && status?.plan?.id === plan.id && status?.status === "Active"
                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                    : index === 1 
                                        ? "bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90" 
                                        : "bg-primary hover:bg-primary/90"
                            }`}
                        >
                            {isChekouingOut === plan.stripePriceId ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : status?.hasSubscription && status?.plan?.id === plan.id && status?.status === "Active" ? (
                                "Current Plan"
                            ) : (
                                <>
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Subscribe to {plan.name}
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </>
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>
            
            <div className="mt-16 text-center text-sm tracking-wide flex items-center justify-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 text-emerald-500" />
                <p>Payments are securely encrypted and processed by Stripe.</p>
            </div>
        </div>
    );
};
