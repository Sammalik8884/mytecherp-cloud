import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Briefcase, KeyRound, Mail, AlertCircle, Loader2, X, Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiClient } from "../services/apiClient";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const LoginPage = () => {
    const { login, loginStepTwo, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Multi-tenant selection states
    const [step, setStep] = useState<"credentials" | "tenant-selection">("credentials");
    const [tempToken, setTempToken] = useState("");
    const [tenants, setTenants] = useState<{ tenantId: number; companyName: string; userId: string }[]>([]);

    // PRE-WARM: Wake up Azure backend while user types their credentials
    useEffect(() => {
        apiClient.get("/health").catch(() => {});
    }, []);

    // Redirect if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await login({ email, password });
            if (data && data.requiresTenantSelection) {
                setTempToken(data.tempToken);
                setTenants(data.tenants);
                setStep("tenant-selection");
            } else {
                navigate("/");
            }
        } catch (err: any) {
            setError(err?.message || "An unexpected error occurred during login.");
        } finally {
            setLoading(false);
        }
    };

    const handleTenantSelect = async (tenantId: number) => {
        setError("");
        setLoading(true);

        try {
            await loginStepTwo(tempToken, tenantId, { email, password });
            navigate("/");
        } catch (err: any) {
            setError(err?.message || "Failed to enter workspace.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dark min-h-[100dvh] bg-background text-foreground flex items-center justify-center relative overflow-x-hidden overflow-y-auto px-4 py-8">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-secondary/40 border border-border/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                    {/* Subtle top border glow */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    {step === "credentials" ? (
                        <>
                            <div className="mb-8 text-center flex flex-col items-center">
                                <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                                    <Briefcase className="h-8 w-8 text-primary" />
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                                    Welcome Back
                                </h1>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    Sign in to secure Firetech ERP access.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg flex items-start space-x-2 animate-in fade-in zoom-in duration-300 relative pr-8 min-h-[50px]">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span className="leading-tight">{error}</span>
                                        <button
                                            type="button"
                                            onClick={() => setError("")}
                                            className="absolute top-2.5 right-2 text-destructive/70 hover:text-destructive transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
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

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-foreground/80">Password</label>
                                            <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative group">
                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-inner"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
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
                                    {loading ? <Loader2 className="h-5 w-5 border-2 animate-spin" /> : <span>Authenticate</span>}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <Link to="/signup" className="text-primary font-semibold hover:underline">
                                    Sign up
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-8 text-center flex flex-col items-center animate-in slide-in-from-right duration-300">
                                <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                                    <Briefcase className="h-8 w-8 text-primary" />
                                </div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                                    Select Workspace
                                </h1>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    You belong to multiple companies. Which one would you like to access?
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg flex items-start space-x-2 animate-in fade-in zoom-in duration-300 relative pr-8 min-h-[50px]">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span className="leading-tight">{error}</span>
                                    <button
                                        type="button"
                                        onClick={() => setError("")}
                                        className="absolute top-2.5 right-2 text-destructive/70 hover:text-destructive transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3 animate-in slide-in-from-bottom duration-500">
                                {tenants.map(t => (
                                    <button
                                        key={t.tenantId}
                                        onClick={() => handleTenantSelect(t.tenantId)}
                                        disabled={loading}
                                        className="w-full text-left bg-background hover:bg-muted/50 border border-border rounded-xl p-4 transition-all duration-200 group flex items-center space-x-3 hover:border-primary/50 relative overflow-hidden"
                                    >
                                        <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground rounded-lg flex items-center justify-center font-bold text-lg transition-colors">
                                            {t.companyName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.companyName}</p>
                                            <p className="text-xs text-muted-foreground/80">ID: {t.tenantId}</p>
                                        </div>
                                        
                                        {/* Hover glare effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 text-center">
                                <button 
                                    onClick={() => setStep("credentials")}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    &larr; Back to login
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};
