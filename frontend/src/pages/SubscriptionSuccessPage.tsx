import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export const SubscriptionSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (sessionId) {
            toast.success("Subscription payment successful!");
        }
    }, [sessionId]);

    return (
        <div className="flex h-screen items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full rounded-3xl border bg-card p-8 shadow-xl text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
                    className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500"
                >
                    <CheckCircle2 className="h-12 w-12" />
                </motion.div>
                
                <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground">
                    Subscription Active!
                </h1>
                
                <p className="mb-8 text-lg text-muted-foreground">
                    Thank you. Your account has been successfully upgraded and your new limits are instantly active.
                </p>

                <button
                    onClick={() => navigate("/dashboard")}
                    className="group relative flex w-full h-12 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground font-bold tracking-wide transition-all hover:bg-primary/90"
                >
                    <span className="flex items-center justify-center gap-2">
                        Go to Dashboard
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </button>
            </motion.div>
        </div>
    );
};
