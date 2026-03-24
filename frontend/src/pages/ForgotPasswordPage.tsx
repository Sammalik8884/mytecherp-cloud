import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Mail, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { authService } from "../services/authService";
import { isAxiosError } from "axios";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setIsSuccess(false);

        try {
            const res = await authService.forgotPassword({ email });
            setIsSuccess(true);
            setMessage(res.message || "Reset link has been sent to your inbox.");
        } catch (error: any) {
            setIsSuccess(false);
            if (isAxiosError(error) && error.response?.data?.error) {
                setMessage(error.response.data.error);
            } else {
                setMessage("An error occurred. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center relative overflow-x-hidden overflow-y-auto px-4 py-8">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-secondary/40 border border-border/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    <div className="mb-8 text-center flex flex-col items-center">
                        <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                            <Briefcase className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                            Reset Password
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Enter your email to receive a password reset link.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {message && (
                            <div className={cn(
                                "border text-sm p-3 rounded-lg flex items-start space-x-2 animate-in fade-in zoom-in duration-300",
                                isSuccess ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            )}>
                                {isSuccess ? (
                                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                )}
                                <span>{message}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-inner"
                                        placeholder="admin@mytecherp.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(var(--primary),0.5)]",
                                loading ? "opacity-80 cursor-not-allowed" : "hover:-translate-y-0.5"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                            {loading ? <Loader2 className="h-5 w-5 border-2 animate-spin" /> : <span>Send Reset Link</span>}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Back to Login
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};
