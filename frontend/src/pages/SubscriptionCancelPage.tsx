import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";

export const SubscriptionCancelPage: React.FC = () => {
    const navigate = useNavigate();

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
                    className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/20 text-destructive"
                >
                    <XCircle className="h-12 w-12" />
                </motion.div>
                
                <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-foreground">
                    Checkout Canceled
                </h1>
                
                <p className="mb-8 text-neutral-500 dark:text-neutral-400">
                    Your subscription checkout was canceled. No charges were made to your account.
                </p>

                <button
                    onClick={() => navigate("/subscription/plans")}
                    className="group relative flex w-full h-12 items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-transparent text-foreground font-bold tracking-wide transition-all hover:bg-accent"
                >
                    <span className="flex items-center justify-center gap-2">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        View Plans Again
                    </span>
                </button>
            </motion.div>
        </div>
    );
};
