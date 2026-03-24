import { useState, useEffect } from "react";
import {
    Loader2, Search, DollarSign, Calculator, Send, UserPlus,
    FileText, UserCircle, Briefcase, ChevronRight, X, TrendingUp,
    CheckCircle2, AlertCircle, RefreshCw, PlusCircle
} from "lucide-react";
import { payrollService } from "../services/payrollService";
import { authService } from "../services/authService";
import { PayslipDto, EmployeePayrollProfileDto } from "../types/hr";
import { toast } from "react-hot-toast";

export const PayrollPage = () => {
    // ---- Tabs & General State ----
    const [activeTab, setActiveTab] = useState<"payslips" | "profiles">("payslips");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // ---- Data ----
    const [payslips, setPayslips] = useState<PayslipDto[]>([]);
    const [profiles, setProfiles] = useState<EmployeePayrollProfileDto[]>([]);
    const [systemUsers, setSystemUsers] = useState<any[]>([]);

    // ---- Modals & Actions ----
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);

    // Entry Form
    const [entryForm, setEntryForm] = useState({
        userId: "",
        type: 1, // 1 = Bonus, 2 = Penalty per backend enum
        amount: 0,
        description: ""
    });

    // Profile Form
    const [profileForm, setProfileForm] = useState({
        userId: "",
        monthlyBaseSalary: 0,
        bankAccountNumber: "",
        bankName: ""
    });

    // Generate Payslip Form
    const [generateForm, setGenerateForm] = useState({
        userId: "",
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First of current month
        periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] // Last of current month
    });

    // ---- Data Fetching ----
    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedPayslips, fetchedProfiles, fetchedUsers] = await Promise.all([
                payrollService.getAllPayslips(),
                payrollService.getAllProfiles(),
                authService.getUsers().catch(() => [])
            ]);
            setPayslips(fetchedPayslips);
            setProfiles(fetchedProfiles);
            setSystemUsers(fetchedUsers);
        } catch (error) {
            toast.error("Failed to load payroll data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ---- Derived Stats ----
    const totalPayrollRun = payslips.reduce((acc, p) => acc + p.netPay, 0);
    const pendingPayments = payslips.filter(p => p.status === 0).length;
    const activeProfilesCount = profiles.length;
    const totalBonuses = payslips.reduce((acc, p) => acc + p.totalBonuses, 0);

    // Filtering
    const filteredPayslips = payslips.filter(ps =>
        (ps.employeeName && ps.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ps.userId && ps.userId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredProfiles = profiles.filter(p =>
        p.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ---- Handlers ----
    const handleGenerateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setProcessingId(-1);
            await payrollService.generatePayslip({
                userId: generateForm.userId,
                periodStart: new Date(generateForm.periodStart).toISOString(),
                periodEnd: new Date(generateForm.periodEnd).toISOString()
            });
            toast.success("Payslip generated successfully!");
            setShowGenerateModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Message || "Failed to generate payslip.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setProcessingId(-2);
            await payrollService.createProfile({
                userId: profileForm.userId,
                monthlyBaseSalary: profileForm.monthlyBaseSalary,
                bankAccountNumber: profileForm.bankAccountNumber,
                bankName: profileForm.bankName
            });
            toast.success("Payroll profile created successfully!");
            setShowProfileModal(false);
            setProfileForm({ userId: "", monthlyBaseSalary: 0, bankAccountNumber: "", bankName: "" });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Message || "Failed to create profile.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleEntrySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setProcessingId(-3);
            await payrollService.addEntry(entryForm);
            toast.success("Payroll entry recorded successfully!");
            setShowEntryModal(false);
            setEntryForm({ userId: "", type: 1, amount: 0, description: "" });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Message || "Failed to record entry.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveAndPay = async (id: number) => {
        if (!window.confirm("Approve this payslip and mark it as Paid? This action cannot be reversed.")) return;
        try {
            setProcessingId(id);
            await payrollService.approveAndPay(id);
            toast.success("Payslip marked as Paid!");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Message || "Failed to approve payment.");
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Users not yet profiled
    const unprofiledUsers = systemUsers.filter(u => !profiles.some(p => p.userId === u.id));

    return (
        <div className="p-4 sm:p-8 animate-in fade-in duration-700 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-400 to-accent flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-md">
                            <DollarSign className="h-8 w-8 text-primary shadow-primary/50" />
                        </div>
                        Payroll & Compensation
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm max-w-xl leading-relaxed">
                        A centralized command center for employee salaries, dynamic payslip generation, bonus distributions, and operational cost analytics.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowEntryModal(true)}
                        className="bg-secondary/80 text-foreground px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-secondary transition-all font-medium border border-border/50 hover:border-emerald-500/50 hover:shadow-lg backdrop-blur-md"
                    >
                        <PlusCircle className="h-4 w-4 text-emerald-500" />
                        <span className="hidden sm:inline">Add Entry</span>
                    </button>
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="bg-secondary/80 text-foreground px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-secondary transition-all font-medium border border-border/50 hover:border-blue-500/50 hover:shadow-lg backdrop-blur-md"
                    >
                        <UserPlus className="h-4 w-4 text-blue-500" />
                        <span className="hidden sm:inline">Add Profile</span>
                    </button>
                    <button
                        onClick={() => setShowGenerateModal(true)}
                        className="bg-gradient-to-r from-primary to-accent text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:shadow-[0_0_20px_rgba(var(--color-primary),0.4)] transition-all font-semibold hover:-translate-y-0.5 active:scale-95"
                    >
                        <Calculator className="h-5 w-5" />
                        <span>Run Payroll</span>
                    </button>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 relative z-10">
                {/* Stat Card 1 */}
                <div className="bg-gradient-to-br from-secondary/50 to-background/50 border border-border/50 rounded-3xl p-6 relative overflow-hidden group shadow-xl backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                        <DollarSign className="h-24 w-24 text-primary" />
                    </div>
                    <div className="relative z-10 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            Total Payroll Volume <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        </p>
                        <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground ">
                            {formatCurrency(totalPayrollRun)}
                        </p>
                        <p className="text-xs text-emerald-400/80 font-medium pt-1">+12.5% from last period</p>
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-gradient-to-br from-secondary/50 to-background/50 border border-border/50 rounded-3xl p-6 relative overflow-hidden group shadow-xl backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                        <UserCircle className="h-24 w-24 text-accent" />
                    </div>
                    <div className="relative z-10 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            Enrolled Profiles <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                        </p>
                        <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground ">
                            {activeProfilesCount}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(activeProfilesCount / (systemUsers.length || 1)) * 100}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{systemUsers.length} total staff</span>
                        </div>
                    </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-gradient-to-br from-secondary/50 to-background/50 border border-border/50 rounded-3xl p-6 relative overflow-hidden group shadow-xl backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                        <AlertCircle className="h-24 w-24 text-amber-500" />
                    </div>
                    <div className="relative z-10 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            Pending Clearances <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                        </p>
                        <p className="text-3xl sm:text-4xl font-bold tracking-tight text-amber-400 ">
                            {pendingPayments}
                        </p>
                        <p className="text-xs text-amber-400/60 font-medium pt-1">Awaiting approval & disbursal</p>
                    </div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-gradient-to-br from-secondary/50 to-background/50 border border-border/50 rounded-3xl p-6 relative overflow-hidden group shadow-xl backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                        <FileText className="h-24 w-24 text-emerald-500" />
                    </div>
                    <div className="relative z-10 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            Bonuses Distributed <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        </p>
                        <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground ">
                            {formatCurrency(totalBonuses)}
                        </p>
                        <p className="text-xs text-emerald-400/80 font-medium pt-1">Performance rewards payout</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="inline-flex bg-secondary p-1.5 rounded-full border border-border/50 backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab("payslips")}
                        className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === "payslips" ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-muted-foreground hover:text-white hover:bg-secondary/50"}`}
                    >
                        <FileText className="h-4 w-4" /> Payslips Record
                    </button>
                    <button
                        onClick={() => setActiveTab("profiles")}
                        className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === "profiles" ? "bg-accent text-white shadow-lg shadow-accent/25" : "text-muted-foreground hover:text-white hover:bg-secondary/50"}`}
                    >
                        <UserCircle className="h-4 w-4" /> Salary Profiles
                    </button>
                </div>

                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder={activeTab === "payslips" ? "Search payslips..." : "Search profiles..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all backdrop-blur-md shadow-inner"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-card border border-border/50 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl relative">

                {/* Decorative background gradients */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 w-full overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50 backdrop-blur-sm z-50">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground font-medium animate-pulse">Syncing Payroll Data...</p>
                        </div>
                    ) : null}

                    {activeTab === "payslips" && (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-xs uppercase bg-secondary/80 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-6 py-5 font-semibold">Employee</th>
                                    <th className="px-6 py-5 font-semibold">Payroll Period</th>
                                    <th className="px-6 py-5 font-semibold text-right">Base Salary</th>
                                    <th className="px-6 py-5 font-semibold text-right text-emerald-500">Bonuses</th>
                                    <th className="px-6 py-5 font-semibold text-right text-rose-500">Penalties</th>
                                    <th className="px-6 py-5 font-black text-right text-foreground/80">Net Pay</th>
                                    <th className="px-6 py-5 font-semibold text-center">Clearance</th>
                                    <th className="px-6 py-5 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {!loading && filteredPayslips.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-60">
                                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                                    <Calculator className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <p className="text-lg font-medium text-foreground mb-1">No Payslips Found</p>
                                                <p className="text-sm text-muted-foreground">Adjust filters or run a new payroll cycle.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayslips.map((ps) => (
                                        <tr key={ps.id} className="hover:bg-secondary/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border flex items-center justify-center shrink-0">
                                                        <span className="font-bold text-foreground shadow-sm">{ps.employeeName?.charAt(0) || ps.userId.charAt(0)}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground tracking-wide">{ps.employeeName || ps.userId}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {ps.userId.substring(0, 8)}...</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                                                    <div className="px-2.5 py-1 bg-secondary rounded-md border border-border/50">
                                                        {new Date(ps.periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <ChevronRight className="h-3 w-3 opacity-50" />
                                                    <div className="px-2.5 py-1 bg-secondary rounded-md border border-border/50">
                                                        {new Date(ps.periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-muted-foreground">
                                                {formatCurrency(ps.baseSalaryAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex px-2 py-0.5 rounded text-emerald-400 bg-emerald-400/10 font-medium">
                                                    +{formatCurrency(ps.totalBonuses)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex px-2 py-0.5 rounded text-rose-400 bg-rose-400/10 font-medium">
                                                    -{formatCurrency(ps.totalPenalties)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-black text-foreground drop-shadow-sm">
                                                    {formatCurrency(ps.netPay)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {ps.status !== 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Cleared
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                                                        <AlertCircle className="h-3.5 w-3.5" /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {ps.status === 0 ? (
                                                    <button
                                                        onClick={() => handleApproveAndPay(ps.id)}
                                                        disabled={processingId === ps.id}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg transition-all font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/20"
                                                    >
                                                        {processingId === ps.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                        <span>Disburse</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground font-medium italic px-4">Paid</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === "profiles" && (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-xs uppercase bg-secondary/80 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-6 py-5 font-semibold">Employee Details</th>
                                    <th className="px-6 py-5 font-semibold">System User ID</th>
                                    <th className="px-6 py-5 font-semibold text-right">Contracted Base Salary</th>
                                    <th className="px-6 py-5 font-semibold">Bank Name</th>
                                    <th className="px-6 py-5 font-semibold">Bank Destination</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {!loading && filteredProfiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-60">
                                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <p className="text-lg font-medium text-foreground mb-1">No Salary Profiles Setup</p>
                                                <p className="text-sm text-muted-foreground">Click "Add Profile" to onboard employees for payroll.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProfiles.map((p) => (
                                        <tr key={p.id} className="hover:bg-secondary/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-border flex items-center justify-center shrink-0">
                                                        <span className="font-bold text-foreground tracking-widest">{p.employeeName?.charAt(0) || p.userId.charAt(0)}</span>
                                                    </div>
                                                    <span className="font-semibold text-foreground tracking-wide">{p.employeeName || "Unnamed Employee"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex px-3 py-1 bg-secondary rounded border border-border/50 text-xs font-mono text-muted-foreground">
                                                    {p.userId}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-base font-bold text-emerald-400">
                                                    {formatCurrency(p.monthlyBaseSalary)}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-1">/mo</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-foreground tracking-wide">{p.bankName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                    <span className="font-mono text-muted-foreground text-sm tracking-wider">
                                                        {p.bankAccountNumber.replace(/.(?=.{4})/g, '• ')}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Glassmorphic Generate Payslip Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-3xl w-[90%] max-w-lg overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />

                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        <Calculator className="h-6 w-6 text-primary" /> Run Payroll Cycle
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Generate a comprehensive draft payslip.</p>
                                </div>
                                <button onClick={() => setShowGenerateModal(false)} className="bg-white/5 hover:bg-secondary/50 p-2 rounded-full transition-colors text-muted-foreground">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleGenerateSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Target Employee</label>
                                    <select
                                        required
                                        value={generateForm.userId}
                                        onChange={(e) => setGenerateForm({ ...generateForm, userId: e.target.value })}
                                        className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-primary/50 transition-colors cursor-pointer appearance-none"
                                    >
                                        <option value="" disabled>-- Select an enrolled profile --</option>
                                        {profiles.map(p => (
                                            <option key={p.id} value={p.userId} className="bg-card text-foreground py-2">
                                                {p.employeeName || p.userId}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border/50 p-4 rounded-2xl bg-white/5">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Period Start</label>
                                        <input
                                            type="date" required
                                            value={generateForm.periodStart}
                                            onChange={(e) => setGenerateForm({ ...generateForm, periodStart: e.target.value })}
                                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-primary/50 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Period End</label>
                                        <input
                                            type="date" required
                                            value={generateForm.periodEnd}
                                            onChange={(e) => setGenerateForm({ ...generateForm, periodEnd: e.target.value })}
                                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-primary/50 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                                    <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-200/80 leading-relaxed">
                                        Running the cycle will instantly lock in their <strong className="text-blue-300">Base Salary</strong>, aggregate pending <strong className="text-emerald-400">Bonuses</strong>, and subtract <strong className="text-rose-400">Penalties</strong> incurred between these dates.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processingId === -1}
                                    className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(var(--color-primary),0.3)] transition-all flex justify-center items-center gap-2 group disabled:opacity-50 disabled:grayscale"
                                >
                                    {processingId === -1 ? (
                                        <><Loader2 className="animate-spin h-5 w-5" /> Processing Engine...</>
                                    ) : (
                                        <>Compile Draft Payslip <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Glassmorphic Create Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-3xl w-[90%] max-w-lg overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent to-purple-500" />

                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        <UserPlus className="h-6 w-6 text-accent" /> Onboard Employee
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Enroll a system user into the payroll engine.</p>
                                </div>
                                <button onClick={() => setShowProfileModal(false)} className="bg-white/5 hover:bg-secondary/50 p-2 rounded-full transition-colors text-muted-foreground">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Unenrolled Staff</label>
                                    <select
                                        required
                                        value={profileForm.userId}
                                        onChange={(e) => setProfileForm({ ...profileForm, userId: e.target.value })}
                                        className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-accent/50 transition-colors cursor-pointer appearance-none"
                                    >
                                        <option value="" disabled>-- Select a system user --</option>
                                        {unprofiledUsers.map(u => (
                                            <option key={u.id} value={u.id} className="bg-card text-foreground py-2">
                                                {u.fullName || u.email}
                                            </option>
                                        ))}
                                        {unprofiledUsers.length === 0 && (
                                            <option value="" disabled className="bg-card text-amber-500">
                                                No users need onboarding!
                                            </option>
                                        )}
                                    </select>
                                    {unprofiledUsers.length === 0 && (
                                        <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1.5 font-medium">
                                            <AlertCircle className="h-3.5 w-3.5" /> All valid system users already have profiles.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Fixed Monthly Base Salary ($)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <DollarSign className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <input
                                            type="number" required min="1" step="0.01"
                                            value={profileForm.monthlyBaseSalary || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, monthlyBaseSalary: parseFloat(e.target.value) })}
                                            className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground text-lg font-bold outline-none focus:border-accent/50 transition-colors placeholder:font-normal placeholder:text-gray-600"
                                            placeholder="4500.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border/50 p-4 rounded-2xl bg-white/5">
                                    <div>
                                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Bank Name</label>
                                        <input
                                            type="text" required
                                            value={profileForm.bankName}
                                            onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                                            className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-accent/50 transition-colors placeholder:font-sans placeholder:text-gray-600"
                                            placeholder="EX: Chase Bank"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Account Number / IBAN</label>
                                        <input
                                            type="text" required
                                            value={profileForm.bankAccountNumber}
                                            onChange={(e) => setProfileForm({ ...profileForm, bankAccountNumber: e.target.value })}
                                            className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-mono outline-none focus:border-accent/50 transition-colors placeholder:font-sans placeholder:text-gray-600"
                                            placeholder="EX: GB1234..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processingId === -2 || unprofiledUsers.length === 0 || !profileForm.userId}
                                    className="w-full bg-accent text-foreground py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(var(--color-accent),0.3)] transition-all flex justify-center items-center gap-2 group mt-8 disabled:opacity-50 disabled:grayscale"
                                >
                                    {processingId === -2 ? (
                                        <><Loader2 className="animate-spin h-5 w-5" /> Enrolling...</>
                                    ) : (
                                        <>Finalize Setup <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Glassmorphic Add Entry Modal */}
            {showEntryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-3xl w-[90%] max-w-lg overflow-hidden shadow-2xl relative">
                        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${entryForm.type === 1 ? 'from-emerald-400 to-green-600' : 'from-rose-400 to-red-600'}`} />

                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        <PlusCircle className={`h-6 w-6 ${entryForm.type === 1 ? 'text-emerald-500' : 'text-rose-500'}`} /> Record Entry
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Add a bonus or penalty to the next payroll run.</p>
                                </div>
                                <button onClick={() => setShowEntryModal(false)} className="bg-white/5 hover:bg-secondary/50 p-2 rounded-full transition-colors text-muted-foreground">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEntrySubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Target Profile</label>
                                    <select
                                        required
                                        value={entryForm.userId}
                                        onChange={(e) => setEntryForm({ ...entryForm, userId: e.target.value })}
                                        className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-emerald-500/50 transition-colors cursor-pointer appearance-none"
                                    >
                                        <option value="" disabled>-- Select an enrolled profile --</option>
                                        {profiles.map(p => (
                                            <option key={p.id} value={p.userId} className="bg-card text-foreground py-2">
                                                {p.employeeName || p.userId}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Entry Type</label>
                                        <select
                                            required
                                            value={entryForm.type}
                                            onChange={(e) => setEntryForm({ ...entryForm, type: parseInt(e.target.value) })}
                                            className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-emerald-500/50 transition-colors cursor-pointer appearance-none"
                                        >
                                            <option value={1}>Bonus (+)</option>
                                            <option value={2}>Penalty (-)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Amount ($)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <DollarSign className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <input
                                                type="number" required min="1" step="0.01"
                                                value={entryForm.amount || ""}
                                                onChange={(e) => setEntryForm({ ...entryForm, amount: parseFloat(e.target.value) })}
                                                className={`w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3.5 text-foreground font-bold outline-none transition-colors ${entryForm.type === 1 ? 'focus:border-emerald-500/50 text-emerald-400' : 'focus:border-rose-500/50 text-rose-400'}`}
                                                placeholder="150.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Description / Reason</label>
                                    <input
                                        type="text" required
                                        value={entryForm.description}
                                        onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                                        className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-emerald-500/50 transition-colors placeholder:font-sans placeholder:text-gray-600"
                                        placeholder="EX: Outstanding performance in Q2"
                                    />
                                </div>

                                <div className="bg-secondary/50 border border-border/50 rounded-xl p-4 flex gap-3 items-start mt-2">
                                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        This {entryForm.type === 1 ? 'bonus' : 'penalty'} will be held as pending. When you next run a payroll cycle for this employee covering today's date, this entry will be automatically calculated into their Draft Payslip.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processingId === -3 || !entryForm.userId}
                                    className={`w-full text-foreground py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all flex justify-center items-center gap-2 group mt-8 disabled:opacity-50 disabled:grayscale ${entryForm.type === 1 ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'}`}
                                >
                                    {processingId === -3 ? (
                                        <><Loader2 className="animate-spin h-5 w-5" /> Recording...</>
                                    ) : (
                                        <>Record {entryForm.type === 1 ? 'Bonus' : 'Penalty'} <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
