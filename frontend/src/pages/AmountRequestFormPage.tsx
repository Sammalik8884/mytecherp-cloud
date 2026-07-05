import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { siteService } from "../services/siteService";
import { SiteDto } from "../types/site";
import { officeApi, OfficeDto } from "../api/officeApi";
import { amountRequestApi, AmountRequestFormDto, AmountRequestPayment } from "../api/amountRequestApi";
import { expenseApi, ExpenseDto } from "../api/expenseApi";

import { Plus, CheckCircle, XCircle, FileText, User, Wallet, Paperclip } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

const AmountRequestFormPage = () => {
    const { user, hasRole } = useAuth();
    const [forms, setForms] = useState<AmountRequestFormDto[]>([]);
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [offices, setOffices] = useState<OfficeDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams] = useSearchParams();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedForm, setSelectedForm] = useState<AmountRequestFormDto | null>(null);

    const [promptModal, setPromptModal] = useState<{ isOpen: boolean; id: number; role: string; isApproved: boolean; title: string; comment: string } | null>(null);

    // Form State
    const getSavedDefault = (key: string) => {
        try {
            const saved = localStorage.getItem('arfDefaults');
            if (saved) return JSON.parse(saved)[key];
        } catch (e) {
            console.error("Failed to parse arfDefaults", e);
        }
        return undefined;
    };

    const [employeeName, setEmployeeName] = useState(() => getSavedDefault('employeeName') || user?.fullName || "");
    const [employeeEmail, setEmployeeEmail] = useState(() => getSavedDefault('employeeEmail') || user?.email || "");
    const [advanceRequested, setAdvanceRequested] = useState<number | "">("");
    const [accountDetail, setAccountDetail] = useState(() => getSavedDefault('accountDetail') || "");
    const [dateOfFundRequired, setDateOfFundRequired] = useState("");
    
    const [locationType, setLocationType] = useState<'site' | 'office'>('site');
    const [siteId, setSiteId] = useState<number | string>("");
    const [officeId, setOfficeId] = useState<number | string>("");
    const [customSiteName, setCustomSiteName] = useState("");
    const [clientName, setClientName] = useState("");
    const [purposeOfAdvance, setPurposeOfAdvance] = useState("");
    const [hiddenExpenseId, setHiddenExpenseId] = useState<string | null>(null);
    const [redCount, setRedCount] = useState<number>(0);

    const isDirector = user?.email?.toLowerCase() === "shahbaz.ali@mytecheng.com" || hasRole(["Admin", "Manager"]);
    const isCEO = user?.email?.toLowerCase() === "munawar.hasan@mytecheng.com" || hasRole(["Admin", "Manager"]);
    const isAccounts = hasRole(["Admin", "Accounts Head", "Manager"]); 

    useEffect(() => {
        fetchData();
        
        const action = searchParams.get('action');
        if (action === 'generateExcess') {
            setIsFormOpen(true);
            setAdvanceRequested(Number(searchParams.get('amount') || 0));
            
            const pSiteId = searchParams.get('siteId');
            const pOfficeId = searchParams.get('officeId');
            if (pSiteId) {
                setLocationType('site');
                setSiteId(Number(pSiteId));
            } else if (pOfficeId) {
                setLocationType('office');
                setOfficeId(Number(pOfficeId));
            }

            const expenseId = searchParams.get('expenseId');
            const managedFromArf = searchParams.get('managedFromArf');
            const siteName = searchParams.get('siteName') || '';
            const amount = searchParams.get('amount') || '0';
            
            if (expenseId) {
                setHiddenExpenseId(expenseId);
                setPurposeOfAdvance(`This expense has been done at ${siteName} with amount Rs ${amount} [ExpenseId:${expenseId}]${managedFromArf ? ` [From ARF:${managedFromArf}]` : ""}`);
            } else if (managedFromArf) {
                setPurposeOfAdvance(`Excess amount of Rs ${amount} from ${managedFromArf} for ${siteName}`);
            }
        } else if (action === 'generateFromProcurement') {
            setIsFormOpen(true);
            const siteIdParam = searchParams.get('siteId');
            const purposeParam = searchParams.get('purpose');
            const amountParam = searchParams.get('amount');
            
            if (siteIdParam) {
                setLocationType('site');
                setSiteId(Number(siteIdParam));
            }
            if (purposeParam) {
                setPurposeOfAdvance(purposeParam);
            }
            if (amountParam) {
                setAdvanceRequested(Number(amountParam));
            }
        }
    }, [searchParams]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [formsRes, sitesRes, officesRes, expensesData] = await Promise.all([
                amountRequestApi.getAll(),
                siteService.getAll(),
                officeApi.getAll(),
                expenseApi.getAll().catch(() => [])
            ]);
            setForms(formsRes.data);
            setSites(sitesRes);
            setOffices(officesRes);

            // Calculate red count
            const totals: Record<number, number> = {};
            const expensesList = Array.isArray(expensesData) ? expensesData : [];
            
            expensesList.forEach((e: ExpenseDto) => {
                if (e.amountRequestFormId) {
                    totals[e.amountRequestFormId] = (totals[e.amountRequestFormId] || 0) + e.totalExpenseAmount;
                }
            });

            let currentRedCount = 0;
            expensesList.forEach((e: ExpenseDto) => {
                if (e.createdByEmail === user?.email) {
                    const totalForThisArf = e.amountRequestFormId ? (totals[e.amountRequestFormId] || 0) : 0;
                    if (e.arfReleasedAmount > 0 && totalForThisArf < e.arfReleasedAmount) {
                        currentRedCount++;
                    }
                }
            });
            setRedCount(currentRedCount);

        } catch (error: any) {
            toast.error(error.response?.data || "Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalPurpose = hiddenExpenseId ? `${purposeOfAdvance} [ExpenseId:${hiddenExpenseId}]` : purposeOfAdvance;
            const procIdParam = searchParams.get('procurementId');
            
            await amountRequestApi.create({
                employeeName,
                employeeEmail,
                advanceRequested: Number(advanceRequested),
                accountDetail,
                dateOfFundRequired: dateOfFundRequired || undefined,
                siteId: locationType === 'site' && siteId !== "custom" && siteId !== "" ? Number(siteId) : undefined,
                officeId: locationType === 'office' && officeId !== "" ? Number(officeId) : undefined,
                customSiteName: locationType === 'site' && siteId === "custom" ? customSiteName : "",
                clientName,
                purposeOfAdvance: finalPurpose,
                procurementId: procIdParam ? Number(procIdParam) : undefined
            });
            toast.success("Request submitted successfully");
            setIsFormOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to submit request");
        }
    };

    const resetForm = () => {
        let parsed: any = null;
        try {
            const saved = localStorage.getItem('arfDefaults');
            if (saved) parsed = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse arfDefaults in reset", e);
        }
        setEmployeeName(parsed?.employeeName || user?.fullName || "");
        setEmployeeEmail(parsed?.employeeEmail || user?.email || "");
        setAdvanceRequested("");
        setAccountDetail(parsed?.accountDetail || "");
        setDateOfFundRequired("");
        setLocationType("site");
        setSiteId("");
        setOfficeId("");
        setCustomSiteName("");
        setClientName("");
        setPurposeOfAdvance("");
        setHiddenExpenseId(null);
        setSelectedForm(null);
    };

    const handleApprove = (id: number, role: string, isApproved: boolean) => {
        setPromptModal({
            isOpen: true,
            id,
            role,
            isApproved,
            title: `Enter comment for ${isApproved ? 'Approval' : 'Rejection'}:`,
            comment: ""
        });
    };

    const submitApprove = async () => {
        if (!promptModal) return;

        try {
            await amountRequestApi.approve(promptModal.id, {
                approverRole: promptModal.role,
                approverName: user?.fullName || "",
                comment: promptModal.comment,
                isApproved: promptModal.isApproved
            });
            toast.success(`Form ${promptModal.isApproved ? 'approved' : 'rejected'} successfully`);
            fetchData();
            if (selectedForm?.id === promptModal.id) setSelectedForm(null);
            setPromptModal(null);
        } catch (error: any) {
            toast.error(error.response?.data || "Action failed");
        }
    };

    const handleReleaseAmount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedForm) return;

        const target = e.target as any;
        const dateOfEntry = target.dateOfEntry.value;
        const dateOfFundReleased = target.dateOfFundReleased.value;
        const releasedAmount = Number(target.releasedAmount.value);
        const remarks = target.remarks.value;

        try {
            await amountRequestApi.releaseAmount(selectedForm.id, {
                dateOfEntry: dateOfEntry || undefined,
                dateOfFundReleased: dateOfFundReleased || undefined,
                releasedAmount,
                remarks
            });
            toast.success("Amount released successfully");
            fetchData();
            const res = await amountRequestApi.getById(selectedForm.id);
            setSelectedForm(res.data);
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to release amount");
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedForm) return;

        const target = e.target as any;
        const payment: AmountRequestPayment = {
            releasedDate: target.paymentDate.value || undefined,
            releasedAmount: Number(target.paymentAmount.value),
            receivedBy: target.receivedBy.value,
            modeOfPayment: target.modeOfPayment.value,
            remarks: "Added via frontend"
        };

        try {
            await amountRequestApi.addPayment(selectedForm.id, payment);
            toast.success("Payment added successfully");
            fetchData();
            // Refresh selected form data
            const res = await amountRequestApi.getById(selectedForm.id);
            setSelectedForm(res.data);
            target.reset();
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to add payment");
        }
    };

    const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedForm || !e.target.files || e.target.files.length === 0) return;
        
        const files = Array.from(e.target.files) as File[];
        try {
            toast.loading(`Uploading ${files.length} attachment(s)...`, { id: "upload" });
            for (const file of files) {
                await amountRequestApi.uploadAttachment(selectedForm.id, file);
            }
            toast.success("Attachments uploaded successfully", { id: "upload" });
            fetchData();
            // Refresh selected form data
            const res = await amountRequestApi.getById(selectedForm.id);
            setSelectedForm(res.data);
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to upload attachments", { id: "upload" });
        } finally {
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-2xl shadow-sm border border-border/40 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Amount Advance Request Form</h1>
                    <p className="text-muted-foreground text-sm">Submit and track your advance payment requests</p>
                </div>
                {redCount >= 5 ? (
                    <div className="flex flex-col items-end">
                        <button
                            disabled
                            className="flex items-center space-x-2 bg-muted text-muted-foreground px-4 py-2 rounded-xl font-medium cursor-not-allowed opacity-70"
                        >
                            <Plus className="h-5 w-5" />
                            <span>New Request</span>
                        </button>
                        <span className="text-xs text-red-500 mt-1 font-medium">
                            Please clear your 5 outstanding expenses first.
                        </span>
                    </div>
                ) : (
                    <button
                        onClick={() => { resetForm(); setIsFormOpen(true); }}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl transition-colors font-medium shadow-sm shadow-primary/20"
                    >
                        <Plus className="h-5 w-5" />
                        <span>New Request</span>
                    </button>
                )}
            </div>

            {!isFormOpen && !selectedForm && (
                <div className="bg-card rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border/50">
                                    <th className="p-4 font-medium">Employee</th>
                                    <th className="p-4 font-medium">Amount</th>
                                    <th className="p-4 font-medium">Date Required</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading requests...</td></tr>
                                ) : forms.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No requests found.</td></tr>
                                ) : (
                                    forms.map(form => (
                                        <tr key={form.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-foreground">{form.employeeName}</div>
                                                <div className="text-xs text-muted-foreground">{form.purposeOfAdvance.replace(/\s*\[ExpenseId:\d+\]$/, '').substring(0, 30)}...</div>
                                            </td>
                                            <td className="p-4 font-semibold text-primary">{form.advanceRequested.toLocaleString()}</td>
                                            <td className="p-4 text-sm">{form.dateOfFundRequired ? new Date(form.dateOfFundRequired).toLocaleDateString() : '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                    form.status.includes('Approved') ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    form.status.includes('Rejected') ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                    form.status.includes('Released') ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                    'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                }`}>
                                                    {form.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setSelectedForm(form)}
                                                    className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/20">
                        <h2 className="text-xl font-bold text-foreground">Create Advance Request</h2>
                        <button onClick={() => setIsFormOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleCreateSubmit} className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Employee Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" /> Employee
                                    </h3>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            localStorage.setItem('arfDefaults', JSON.stringify({ employeeName, employeeEmail, accountDetail }));
                                            toast.success("Employee info saved for next time!");
                                        }}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Save Info
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Employee Name</label>
                                    <input required value={employeeName} onChange={e => setEmployeeName(e.target.value)} type="text" className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Employee Email</label>
                                    <input required value={employeeEmail} onChange={e => setEmployeeEmail(e.target.value)} type="email" className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Advance Requested</label>
                                    <input required value={advanceRequested} onChange={e => setAdvanceRequested(e.target.value ? Number(e.target.value) : "")} type="number" min="0" className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Account Detail</label>
                                    <input required value={accountDetail} onChange={e => setAccountDetail(e.target.value)} type="text" className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Bank Name, IBAN, etc." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Date of Fund Required</label>
                                    <input required value={dateOfFundRequired} onChange={e => setDateOfFundRequired(e.target.value)} type="date" className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                </div>
                            </div>

                            {/* Project/Purpose Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b border-border/50 pb-2 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" /> Personal / Office Use
                                </h3>
                                
                                <div className="flex items-center space-x-6 bg-muted/30 p-2 rounded-lg w-fit">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="arfLocationType" 
                                            className="text-primary focus:ring-primary"
                                            checked={locationType === 'site'} 
                                            onChange={() => setLocationType('site')} 
                                        />
                                        <span className="text-sm font-medium">Site / Project</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="arfLocationType" 
                                            className="text-primary focus:ring-primary"
                                            checked={locationType === 'office'} 
                                            onChange={() => setLocationType('office')} 
                                        />
                                        <span className="text-sm font-medium">Office</span>
                                    </label>
                                </div>

                                {locationType === 'site' ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Site Name</label>
                                        <select value={siteId} onChange={e => setSiteId(e.target.value === "custom" ? "custom" : Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                                            <option value="">-- Select a Site --</option>
                                            {sites.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                            <option value="custom">Other (Custom Site)</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Office Name</label>
                                        <select value={officeId} onChange={e => setOfficeId(e.target.value ? Number(e.target.value) : "")} className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                                            <option value="">-- Select an Office --</option>
                                            {offices.map(o => (
                                                <option key={o.id} value={o.id}>{o.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {locationType === 'site' && siteId === "custom" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-medium text-foreground">Custom Site Name</label>
                                        <input required value={customSiteName} onChange={e => setCustomSiteName(e.target.value)} type="text" className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Client Name</label>
                                    <input value={clientName} onChange={e => setClientName(e.target.value)} type="text" className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Purpose of Advance</label>
                                    <textarea required value={purposeOfAdvance} onChange={e => setPurposeOfAdvance(e.target.value)} rows={3} className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t border-border/50">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors font-medium">Cancel</button>
                            <button type="submit" className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors font-medium shadow-sm shadow-primary/20">Submit Request</button>
                        </div>
                    </form>
                </div>
            )}

            {/* View/Action Details */}
            {selectedForm && !isFormOpen && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <button onClick={() => setSelectedForm(null)} className="text-primary hover:underline text-sm font-medium mb-4 inline-block">&larr; Back to Requests</button>
                    
                    <div className="bg-card rounded-2xl shadow-sm border border-border/40 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Request Details</h2>
                                <p className="text-muted-foreground text-sm mt-1">Submitted on {new Date(selectedForm.createdAt).toLocaleString()}</p>
                            </div>
                            <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                                {selectedForm.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-muted/10 p-5 rounded-xl border border-border/50 space-y-3">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary"/> Employee</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-muted-foreground block">Name</span><span className="font-medium">{selectedForm.employeeName}</span></div>
                                    <div><span className="text-muted-foreground block">Advance Requested</span><span className="font-semibold text-primary text-base">{selectedForm.advanceRequested.toLocaleString()}</span></div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground block">Account Detail</span>
                                        {(hasRole(["Accounts Head"]) || user?.email === selectedForm.employeeEmail) ? (
                                            <span className="font-medium">{selectedForm.accountDetail}</span>
                                        ) : (
                                            <span className="font-medium italic text-muted-foreground">Hidden for security</span>
                                        )}
                                    </div>
                                    <div><span className="text-muted-foreground block">Date Required</span><span className="font-medium">{selectedForm.dateOfFundRequired ? new Date(selectedForm.dateOfFundRequired).toLocaleDateString() : '-'}</span></div>
                                </div>
                            </div>
                            <div className="bg-muted/10 p-5 rounded-xl border border-border/50 space-y-3">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Office Use</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="col-span-2"><span className="text-muted-foreground block">Site Name</span><span className="font-medium">{selectedForm.siteName || selectedForm.customSiteName || '-'}</span></div>
                                    <div className="col-span-2"><span className="text-muted-foreground block">Client Name</span><span className="font-medium">{selectedForm.clientName || '-'}</span></div>
                                    <div className="col-span-2"><span className="text-muted-foreground block">Purpose</span><span className="font-medium">{selectedForm.purposeOfAdvance?.replace(/\s*\[ExpenseId:\d+\]$/, '')}</span></div>
                                </div>
                            </div>
                        </div>



                        {/* Approvals Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Director Approval */}
                            <div className="border border-border/60 rounded-xl overflow-hidden">
                                <div className="bg-muted/30 px-4 py-3 border-b border-border/60 font-semibold text-foreground flex justify-between items-center">
                                    <span>Director Approval</span>
                                    {selectedForm.directorName && <CheckCircle className="h-5 w-5 text-green-500" />}
                                </div>
                                <div className="p-4 space-y-3 text-sm">
                                    {selectedForm.directorName ? (
                                        <>
                                            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedForm.directorName}</span></div>
                                            <div><span className="text-muted-foreground">Date:</span> <span>{selectedForm.directorApprovalDate ? new Date(selectedForm.directorApprovalDate).toLocaleString() : ''}</span></div>
                                            <div><span className="text-muted-foreground">Comment:</span> <span>{selectedForm.directorComment}</span></div>
                                        </>
                                    ) : (
                                        <div className="text-muted-foreground italic text-center py-4">Waiting for approval</div>
                                    )}
                                    
                                    {isDirector && !selectedForm.directorName && selectedForm.status.includes('Waiting for Director') && (
                                        <div className="flex gap-2 pt-2 border-t border-border/50 mt-2">
                                            <button onClick={() => handleApprove(selectedForm.id, "Director", true)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-md transition-colors text-xs font-medium">Approve</button>
                                            <button onClick={() => handleApprove(selectedForm.id, "Director", false)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-md transition-colors text-xs font-medium">Reject</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CEO Approval */}
                            <div className="border border-border/60 rounded-xl overflow-hidden">
                                <div className="bg-muted/30 px-4 py-3 border-b border-border/60 font-semibold text-foreground flex justify-between items-center">
                                    <span>CEO Approval</span>
                                    {selectedForm.ceoName && <CheckCircle className="h-5 w-5 text-green-500" />}
                                </div>
                                <div className="p-4 space-y-3 text-sm">
                                    {selectedForm.ceoName ? (
                                        <>
                                            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedForm.ceoName}</span></div>
                                            <div><span className="text-muted-foreground">Date:</span> <span>{selectedForm.ceoApprovalDate ? new Date(selectedForm.ceoApprovalDate).toLocaleString() : ''}</span></div>
                                            <div><span className="text-muted-foreground">Comment:</span> <span>{selectedForm.ceoComment}</span></div>
                                        </>
                                    ) : (
                                        <div className="text-muted-foreground italic text-center py-4">
                                            Waiting for approval
                                        </div>
                                    )}

                                    {isCEO && !selectedForm.ceoName && selectedForm.status.includes('Waiting for CEO') && (
                                        <div className="flex gap-2 pt-2 border-t border-border/50 mt-2">
                                            <button onClick={() => handleApprove(selectedForm.id, "CEO", true)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-md transition-colors text-xs font-medium">Approve</button>
                                            <button onClick={() => handleApprove(selectedForm.id, "CEO", false)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-md transition-colors text-xs font-medium">Reject</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Accounts Section */}
                        {selectedForm.status.includes('Approved') || selectedForm.status.includes('Released') ? (
                            <div className="mt-8 pt-8 border-t border-border/50">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Accounts & Payments</h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Accounts Use Only Form (Release Amount) */}
                                    <div className="lg:col-span-1 bg-card border border-primary/20 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 font-semibold text-primary">
                                            For Accounts Use Only
                                        </div>
                                        {selectedForm.accountsReleasedAmount ? (
                                             <div className="p-4 space-y-3 text-sm">
                                                 <div><span className="text-muted-foreground">Date of Entry:</span> <span className="font-medium">{selectedForm.accountsDateOfEntry ? new Date(selectedForm.accountsDateOfEntry).toLocaleDateString() : '-'}</span></div>
                                                 <div><span className="text-muted-foreground">Date Fund Released:</span> <span className="font-medium">{selectedForm.accountsDateOfFundReleased ? new Date(selectedForm.accountsDateOfFundReleased).toLocaleDateString() : '-'}</span></div>
                                                 <div><span className="text-muted-foreground">Released Amount:</span> <span className="font-bold text-primary">{selectedForm.accountsReleasedAmount.toLocaleString()}</span></div>
                                                 <div><span className="text-muted-foreground">Remarks:</span> <span>{selectedForm.accountsRemarks}</span></div>
                                             </div>
                                        ) : isAccounts ? (
                                            <form onSubmit={handleReleaseAmount} className="p-4 space-y-3 text-sm">
                                                <div>
                                                    <label className="block text-muted-foreground mb-1">Date of Entry</label>
                                                    <input name="dateOfEntry" type="date" required className="w-full p-2 rounded border border-input bg-background" />
                                                </div>
                                                <div>
                                                    <label className="block text-muted-foreground mb-1">Date Fund Released</label>
                                                    <input name="dateOfFundReleased" type="date" required className="w-full p-2 rounded border border-input bg-background" />
                                                </div>
                                                <div>
                                                    <label className="block text-muted-foreground mb-1">Released Amount</label>
                                                    <input name="releasedAmount" type="number" defaultValue={selectedForm.advanceRequested} required className="w-full p-2 rounded border border-input bg-background" />
                                                </div>
                                                <div>
                                                    <label className="block text-muted-foreground mb-1">Remarks</label>
                                                    <textarea name="remarks" rows={2} className="w-full p-2 rounded border border-input bg-background resize-none"></textarea>
                                                </div>
                                                <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md font-medium transition-colors">Done</button>
                                            </form>
                                        ) : (
                                            <div className="p-6 text-center text-muted-foreground text-sm italic">Accounts team will release funds here.</div>
                                        )}
                                    </div>

                                    {/* Released Payments Detail Table */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="border border-border/50 rounded-xl overflow-hidden">
                                            <div className="bg-muted/30 px-4 py-3 border-b border-border/50 font-semibold text-foreground">
                                                Released Payments Detail
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="bg-muted/10 border-b border-border/50 text-muted-foreground">
                                                            <th className="px-3 py-2">#</th>
                                                            <th className="px-3 py-2">Date</th>
                                                            <th className="px-3 py-2">Amount</th>
                                                            <th className="px-3 py-2">Received By</th>
                                                            <th className="px-3 py-2">Mode</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedForm.payments.length === 0 ? (
                                                            <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground italic">No payment details found</td></tr>
                                                        ) : (
                                                            selectedForm.payments.map((p, i) => (
                                                                <tr key={p.id} className="border-b border-border/50 last:border-0">
                                                                    <td className="px-3 py-2">{i + 1}</td>
                                                                    <td className="px-3 py-2">{p.releasedDate ? new Date(p.releasedDate).toLocaleDateString() : '-'}</td>
                                                                    <td className="px-3 py-2 font-medium">{p.releasedAmount.toLocaleString()}</td>
                                                                    <td className="px-3 py-2">{p.receivedBy}</td>
                                                                    <td className="px-3 py-2">{p.modeOfPayment}</td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Add Payment Form */}
                                        {isAccounts && (
                                            <form onSubmit={handleAddPayment} className="border border-border/50 rounded-xl p-4 bg-muted/5 flex flex-wrap gap-4 items-end">
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs text-muted-foreground mb-1">Date</label>
                                                    <input name="paymentDate" type="date" required className="w-full p-2 text-sm rounded border border-input bg-background" />
                                                </div>
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs text-muted-foreground mb-1">Amount</label>
                                                    <input name="paymentAmount" type="number" required className="w-full p-2 text-sm rounded border border-input bg-background" />
                                                </div>
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs text-muted-foreground mb-1">Received By</label>
                                                    <input name="receivedBy" type="text" required className="w-full p-2 text-sm rounded border border-input bg-background" />
                                                </div>
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs text-muted-foreground mb-1">Mode</label>
                                                    <input name="modeOfPayment" type="text" required placeholder="Cash/Check/Transfer" className="w-full p-2 text-sm rounded border border-input bg-background" />
                                                </div>
                                                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">Add Payment</button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Attachments Section */}
                        <div className="mt-8 pt-8 border-t border-border/50">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Paperclip className="h-6 w-6 text-primary" /> Attachments
                                </h3>
                                <div>
                                    <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl transition-colors font-medium text-sm border border-primary/20 flex items-center gap-2">
                                        <Plus className="h-4 w-4" /> Add File
                                        <input type="file" multiple className="hidden" onChange={handleUploadAttachment} />
                                    </label>
                                </div>
                            </div>
                            
                            {(!selectedForm.attachments || selectedForm.attachments.length === 0) ? (
                                <div className="p-8 text-center bg-muted/5 rounded-xl border border-dashed border-border/60 text-muted-foreground">
                                    No attachments found for this request.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedForm.attachments.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/10 hover:border-primary/30 transition-all group">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-sm font-medium text-foreground truncate">Attachment {i + 1}</div>
                                                <div className="text-xs text-muted-foreground truncate group-hover:text-primary transition-colors">Click to view</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
            {/* Custom Prompt Modal */}
            {promptModal && promptModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-card border border-border/50 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-foreground mb-4">{promptModal.title}</h3>
                        <textarea
                            autoFocus
                            value={promptModal.comment}
                            onChange={(e) => setPromptModal({ ...promptModal, comment: e.target.value })}
                            className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none mb-6"
                            rows={3}
                            placeholder="Type your comment here..."
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setPromptModal(null)}
                                className="px-5 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitApprove}
                                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-sm shadow-primary/20"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default AmountRequestFormPage;
