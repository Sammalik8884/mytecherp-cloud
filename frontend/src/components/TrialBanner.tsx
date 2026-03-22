import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, X, Clock, Zap } from "lucide-react";
import { apiClient } from "../services/apiClient";

interface TrialStatus {
    isOnTrial: boolean;
    hasActivePlan: boolean;
    isExpired: boolean;
    daysRemaining: number;
    trialEndsAt: string | null;
}

// Full-page blocking wall for expired trials
export const TrialExpiredWall: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md">
            <div className="w-full max-w-md mx-4 bg-card border border-border rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-destructive to-transparent opacity-60" />
                <div className="w-16 h-16 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight mb-2">Your Free Trial Has Ended</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    Your 14-day free trial is over. Choose a plan to keep using FiretechERP and retain all your data.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => navigate("/subscription/plans")}
                        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Zap className="w-4 h-4" />
                        Choose a Plan — From $49/mo
                    </button>
                    <p className="text-xs text-muted-foreground">No setup fees. Cancel anytime.</p>
                </div>
            </div>
        </div>
    );
};

// Sticky top banner showing days remaining
export const TrialBanner: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState<TrialStatus | null>(null);
    const [dismissed, setDismissed] = useState(false);

    // Don't show on auth or subscription pages
    const isPublicRoute = ["/login", "/signup", "/subscription"].some(p => location.pathname.startsWith(p));

    useEffect(() => {
        if (isPublicRoute) return;
        apiClient.get("/subscription/trial-status")
            .then((res: { data: TrialStatus }) => setStatus(res.data))
            .catch(() => {}); // Silently fail
    }, [location.pathname]);

    if (!status || status.hasActivePlan || isPublicRoute || dismissed) return null;

    const urgency = status.daysRemaining <= 3;

    return (
        <div className={`relative flex items-center justify-between px-4 py-2.5 text-sm font-medium ${
            urgency
                ? "bg-destructive/15 border-b border-destructive/30 text-destructive"
                : "bg-primary/10 border-b border-primary/20 text-primary"
        }`}>
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                    {status.daysRemaining > 0
                        ? <>Free trial: <strong>{status.daysRemaining} day{status.daysRemaining !== 1 ? "s" : ""} remaining</strong></>
                        : <strong>Your trial has expired</strong>
                    }
                </span>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/subscription/plans")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        urgency
                            ? "bg-destructive text-white hover:bg-destructive/90"
                            : "bg-primary text-white hover:bg-primary/90"
                    }`}
                >
                    Upgrade Now
                </button>
                {!urgency && (
                    <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

// Hook to check if the trial wall should be shown
export const useTrialEnforcement = () => {
    const [shouldBlock, setShouldBlock] = useState(false);
    const location = useLocation();
    const isPublicRoute = ["/login", "/signup", "/subscription"].some(p => location.pathname.startsWith(p));

    useEffect(() => {
        if (isPublicRoute) { setShouldBlock(false); return; }
        apiClient.get("/subscription/trial-status")
            .then((res: { data: TrialStatus }) => {
                const s: TrialStatus = res.data;
                setShouldBlock(s.isExpired && !s.hasActivePlan);
            })
            .catch(() => setShouldBlock(false));
    }, [location.pathname]);

    return shouldBlock;
};
