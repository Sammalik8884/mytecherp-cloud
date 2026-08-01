import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { siteService } from "../services/siteService";
import { amountRequestApi, AmountRequestFormDto } from "../api/amountRequestApi";
import { expenseApi, ExpenseDto, CreateExpenseDto, ExpenseItemDto } from "../api/expenseApi";
import { officeApi, OfficeDto } from "../api/officeApi";
import { SiteDto } from "../types/site";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import toast from "react-hot-toast";
import { Check, Plus, Trash2, X, AlertCircle, Info, ExternalLink, Paperclip, Download } from "lucide-react";
import dayjs from "dayjs";
import { SearchableObjectSelect } from "../components/common/SearchableObjectSelect";
import { FormPrompt } from "../components/common/FormPrompt";

export const AddExpensePage = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const [expenseStatus, setExpenseStatus] = useState<string | null>(null);
    const { user } = useAuth();
    // Page is locked (read-only) only when viewing a non-rejected existing expense, unless the user is Munawar
    const isMunawar = user?.email?.toLowerCase() === "munawar.hasan@mytecheng.com";
    const isLocked = isEditMode && expenseStatus !== null && expenseStatus !== "Rejected" && !isMunawar;

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const openAttachment = (url: string) => {
        if (/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i.test(url)) {
            setSelectedImage(url);
        } else {
            window.open(url, '_blank');
        }
    };
    
    const [showExcessModal, setShowExcessModal] = useState(false);
    const [excessItemIndices, setExcessItemIndices] = useState<number[]>([]);
    const [excessSaved, setExcessSaved] = useState(false);
    
    const [arfConsumedAmounts, setArfConsumedAmounts] = useState<Record<number, number>>({});
    const [closedArfWarning, setClosedArfWarning] = useState<{ isOpen: boolean; arfId: number } | null>(null);
    const [allExpenses, setAllExpenses] = useState<ExpenseDto[]>([]);
    const [showArfInfoModal, setShowArfInfoModal] = useState(false);

    const [sites, setSites] = useState<SiteDto[]>([]);
    const [offices, setOffices] = useState<OfficeDto[]>([]);
    const [arfs, setArfs] = useState<AmountRequestFormDto[]>([]);
    const [allArfs, setAllArfs] = useState<AmountRequestFormDto[]>([]);
    
    const [locationType, setLocationType] = useState<'site' | 'office'>('site');
    const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
    const [selectedOfficeId, setSelectedOfficeId] = useState<number | "">("");
    const [selectedArfId, setSelectedArfId] = useState<number | "">("");
    
    // State for the rows
    const [rows, setRows] = useState<ExpenseItemDto[]>(
        Array.from({ length: 5 }, () => ({
            expenseDate: dayjs().format("YYYY-MM-DD"),
            employeeName: user?.fullName || "",
            employeeDesignation: user?.designation || "",
            expenseType: "",
            descriptionItems: "",
            amount: 0,
            remarks: "",
            fileUrl: ""
        }))
    );

    const [submitting, setSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const siteData = await siteService.getAll();
            const officeData = await officeApi.getAll();
            const [arfDataResp, expenseData] = await Promise.all([
                amountRequestApi.getAll(),
                expenseApi.getAll()
            ]);
            const arfData = arfDataResp.data;
            setAllExpenses(expenseData);
            
            const consumedMap: Record<number, number> = {};
            expenseData.forEach((e: any) => {
                if (e.amountRequestFormId) {
                    if (isEditMode && String(e.id) === String(id)) return;
                    consumedMap[e.amountRequestFormId] = (consumedMap[e.amountRequestFormId] || 0) + e.totalExpenseAmount;
                }
            });
            setArfConsumedAmounts(consumedMap);
            
            setSites(siteData);
            setOffices(officeData);
            
            // Show all ARFs
            setArfs(arfData);
            setAllArfs(arfData);

            if (isEditMode && id) {
                const expense = await expenseApi.getById(Number(id));
                setExpenseStatus(expense.status || "Pending");
                if (expense.officeId) {
                    setLocationType('office');
                    setSelectedOfficeId(expense.officeId);
                } else {
                    setLocationType('site');
                    setSelectedSiteId(expense.siteId ?? "");
                }
                setSelectedArfId(expense.amountRequestFormId ?? "");
                
                if (expense.items && expense.items.length > 0) {
                    const mappedRows = expense.items.map(item => ({
                        ...item,
                        expenseDate: item.expenseDate ? dayjs(item.expenseDate).format('YYYY-MM-DD') : ""
                    }));
                    if (mappedRows.length < 5) {
                        const emptyRows = Array.from({ length: 5 - mappedRows.length }, () => ({
                            expenseDate: dayjs().format("YYYY-MM-DD"), employeeName: "", employeeDesignation: "", expenseType: "", descriptionItems: "", amount: 0, remarks: "", fileUrl: ""
                        }));
                        setRows([...mappedRows, ...emptyRows]);
                    } else {
                        setRows(mappedRows);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load initial data", error);
            toast.error("Failed to load necessary data");
        }
    };

    const handleArfSelect = (idStr: string) => {
        if (!idStr) {
            setSelectedArfId("");
            return;
        }
        
        const id = Number(idStr);
        const arf = arfs.find((a: any) => a.id === id);
        
        // Exclude the current expense from consumed total if in edit mode
        let currentExpenseTotal = 0;
        if (isEditMode) {
            currentExpenseTotal = rows.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);
        }
        
        const consumed = (arfConsumedAmounts[id] || 0) - currentExpenseTotal;
        const released = arf?.accountsReleasedAmount || 0;
        
        if (consumed >= released && released > 0 && !isEditMode) {
            setClosedArfWarning({ isOpen: true, arfId: id });
            setSelectedArfId(""); // Clear it until they confirm
        } else {
            setSelectedArfId(id);
        }
    };

    const handleRowChange = (index: number, field: keyof ExpenseItemDto, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleUploadFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        
        try {
            toast.loading(`Uploading ${files.length} attachment(s)...`, { id: `upload-${index}` });
            
            const currentRow = rows[index];
            const currentAttachments = currentRow.attachments || [];
            const newUrls: string[] = [];

            for (const file of files) {
                const url = await expenseApi.uploadAttachment(file);
                newUrls.push(url);
            }
            
            handleRowChange(index, "attachments", [...currentAttachments, ...newUrls]);
            toast.success("Attachments uploaded successfully", { id: `upload-${index}` });
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to upload attachment", { id: `upload-${index}` });
        } finally {
            e.target.value = ''; // Reset input
        }
    };

    const addRow = () => {
        setRows([...rows, {
            expenseDate: dayjs().format("YYYY-MM-DD"),
            employeeName: user?.fullName || "",
            employeeDesignation: user?.designation || "",
            expenseType: "",
            descriptionItems: "",
            amount: 0,
            remarks: "",
            fileUrl: ""
        }]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_: any, i: number) => i !== index));
        }
    };

    const selectedArf = arfs.find((a: any) => a.id === Number(selectedArfId));
    const excessCovered = selectedArf ? allArfs
        .filter(a => a.purposeOfAdvance?.includes(selectedArf.arfNumber || String(selectedArf.id)))
        .reduce((sum, a) => sum + Math.max(Number(a.accountsReleasedAmount) || 0, Number(a.advanceRequested) || 0), 0) : 0;
        
    const baseArfAmount = selectedArf?.status === "Released" ? (Number(selectedArf?.accountsReleasedAmount) || 0) : (Number(selectedArf?.advanceRequested) || 0);
    const releasedAmount = baseArfAmount + excessCovered;
    const alreadySpent = arfConsumedAmounts[Number(selectedArfId)] || 0;
    const remainingArfBalance = Math.max(0, releasedAmount - alreadySpent);
    
    // Calculate total
    const totalAmount = rows.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);
    
    // Check match
    const isAmountEqual = selectedArf ? totalAmount === remainingArfBalance : false;
    const isAmountAbove = selectedArf ? totalAmount > remainingArfBalance : false;
    const excessAmount = isAmountAbove ? totalAmount - remainingArfBalance : 0;

    const handleSubmit = async () => {
        if (locationType === 'site' && !selectedSiteId) return toast.error("Please select a site first.");
        if (locationType === 'office' && !selectedOfficeId) return toast.error("Please select an office first.");
        if (!selectedArfId) return toast.error("Please select an ARF.");
        
        // Filter out completely empty rows
        const validRows = rows.filter((r: any) => r.descriptionItems || r.amount > 0);
        
        if (validRows.length === 0) return toast.error("Please enter at least one expense item.");
        if (validRows.some((r: any) => !r.expenseDate)) return toast.error("Expense Date is required for all items.");
        if (validRows.some((r: any) => !r.expenseType?.trim())) return toast.error("Expense Type is required for all items.");
        if (validRows.some((r: any) => !r.descriptionItems?.trim())) return toast.error("Description is required for all items.");
        if (validRows.some((r: any) => typeof r.amount !== 'number' || isNaN(r.amount) || r.amount <= 0)) return toast.error("Amount must be greater than 0 for all items.");
        if (validRows.some((r: any) => (!r.attachments || r.attachments.length === 0) && !r.fileUrl)) return toast.error("At least one attachment (document or picture) is mandatory for each expense item.");

        if (isAmountAbove && !showExcessModal) {
            setShowExcessModal(true);
            return;
        }

        submitWithExcess(validRows);
    };

    const submitWithExcess = async (validRows: any[]) => {
        try {
            setSubmitting(true);
            
            let currentExcessToSplit = excessAmount;
            const itemsToSubmit: any[] = [];
            
            validRows.forEach((r, i) => {
                if (excessItemIndices.includes(i)) {
                    const amount = Number(r.amount) || 0;
                    if (currentExcessToSplit >= amount) {
                        itemsToSubmit.push({ ...r, isExcessItem: true });
                        currentExcessToSplit -= amount;
                    } else if (currentExcessToSplit > 0) {
                        // Split the item into excess and normal portions
                        itemsToSubmit.push({ ...r, amount: currentExcessToSplit, isExcessItem: true });
                        itemsToSubmit.push({ ...r, amount: amount - currentExcessToSplit, isExcessItem: false });
                        currentExcessToSplit = 0;
                    } else {
                        itemsToSubmit.push({ ...r, isExcessItem: false });
                    }
                } else {
                    itemsToSubmit.push({ ...r, isExcessItem: false });
                }
            });

            const payload: CreateExpenseDto = {
                siteId: locationType === 'site' ? Number(selectedSiteId) : null,
                officeId: locationType === 'office' ? Number(selectedOfficeId) : null,
                amountRequestFormId: Number(selectedArfId),
                items: itemsToSubmit
            };

            if (isEditMode && id) {
                await expenseApi.update(Number(id), payload);
                toast.success("Expense updated successfully");
                setIsSubmitted(true);
                
                if (isAmountAbove) {
                    setExcessSaved(true);
                } else {
                    navigate("/expenses");
                }
            } else {
                await expenseApi.create(payload);
                toast.success("Expense uploaded successfully");
                setIsSubmitted(true);
                
                if (isAmountAbove) {
                    setExcessSaved(true);
                } else {
                    navigate("/expenses");
                }
            }
        } catch (error) {
            console.error("Failed to submit expense", error);
            toast.error("Failed to submit expense");
        } finally {
            setSubmitting(false);
        }
    };

    const arfBoxClass = !selectedArfId 
        ? "border-border" 
        : isAmountEqual 
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-500" 
            : "border-amber-500 bg-amber-50 dark:bg-amber-900/10 ring-1 ring-amber-500";

    if (excessSaved) {
        return (
            <div className="p-6 max-w-[1400px] mx-auto space-y-6">
                <div className="bg-card border border-emerald-200 rounded-xl p-10 shadow-sm text-center">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Check className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-4">Expense Saved Successfully!</h1>
                    <p className="text-muted-foreground mb-8 text-lg">
                        You have spent Rs {excessAmount.toLocaleString()} more than the ARF allowed.<br />
                        This excess amount has been logged in history.
                    </p>
                    <button
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium text-lg inline-flex items-center"
                        onClick={() => {
                            const arfLabel = selectedArf?.arfNumber || selectedArfId;
                            const locParam = locationType === 'site' ? `siteId=${selectedSiteId}` : `officeId=${selectedOfficeId}`;
                            const locName = locationType === 'site' 
                                ? sites.find((s: any) => s.id === Number(selectedSiteId))?.name 
                                : offices.find((o: any) => o.id === Number(selectedOfficeId))?.name;
                            
                            navigate(`/amount-request?action=generateExcess&amount=${excessAmount}&${locParam}&siteName=${encodeURIComponent(locName || '')}&managedFromArf=${arfLabel}`);
                        }}
                    >
                        Generate ARF for Rs {excessAmount.toLocaleString()}
                        <ExternalLink className="ml-2 h-5 w-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
        <FormPrompt isDirty={!isSubmitted && !submitting && rows.some((r: ExpenseItemDto) => r.amount > 0 || !!r.employeeName || !!r.expenseType || !!r.descriptionItems)} />
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            {/* Closed ARF Warning Modal */}
            {closedArfWarning?.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center gap-2 text-amber-600 bg-amber-50">
                            <AlertCircle className="h-5 w-5" />
                            <h3 className="font-semibold">ARF Status Warning</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm">
                                This ARF (<strong>ARF-{closedArfWarning.arfId}</strong>) has been <strong>Closed</strong> or <strong>Submitted for Approval</strong> by the creator, meaning the work is considered finished.
                            </p>
                            <p className="text-sm font-medium">
                                Do you still want to add more expenses to this ARF?
                            </p>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                                <button
                                    onClick={() => {
                                        setClosedArfWarning(null);
                                        setSelectedArfId(""); // Revert selection
                                    }}
                                    className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors"
                                >
                                    Cancel Selection
                                </button>
                                <button
                                    onClick={() => {
                                        setClosedArfWarning(null);
                                        // Selection remains what user clicked
                                    }}
                                    className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                                >
                                    Yes, Proceed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ARF Info Modal */}
            {showArfInfoModal && selectedArf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                            <h3 className="font-semibold">ARF Consumption Details</h3>
                            <button onClick={() => setShowArfInfoModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                            <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-xs border border-amber-200">
                                This ARF was originally generated for <strong>{selectedArf.siteName || selectedArf.officeName || "Unknown Location"}</strong>.
                            </div>
                            
                            <div>
                                <h4 className="font-medium text-muted-foreground mb-2 text-xs uppercase tracking-wider">Related Expenses</h4>
                                {allExpenses.filter(e => e.amountRequestFormId === selectedArf.id && (!isEditMode || String(e.id) !== String(id))).length === 0 ? (
                                    <div className="text-muted-foreground italic text-xs">No other expenses found for this ARF.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {allExpenses
                                            .filter(e => e.amountRequestFormId === selectedArf.id && (!isEditMode || String(e.id) !== String(id)))
                                            .map(e => (
                                                <div key={e.id} className="flex justify-between items-center p-2 rounded border border-border bg-card">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">EXP-{e.id.toString().padStart(4, '0')}</span>
                                                        <span className="text-xs text-muted-foreground">{dayjs(e.createdAt).format('DD MMM YYYY')}</span>
                                                    </div>
                                                    <span className="font-semibold text-emerald-600">Rs {e.totalExpenseAmount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showExcessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-amber-600 flex items-center">
                                <span className="mr-2">⚠️</span> Excess Amount Detected
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                You have spent Rs {excessAmount.toLocaleString()} more than the ARF amount. 
                                Please select which specific item(s) below represent this excess amount.
                            </p>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-muted/10">
                            <div className="space-y-3">
                                {rows.filter((r: any) => r.expenseDate || r.descriptionItems || r.amount > 0).map((row: any, i: number) => (
                                    <label key={i} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${excessItemIndices.includes(i) ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-border bg-card hover:bg-muted/50'}`}>
                                        <input 
                                            type="checkbox" 
                                            className="mt-1 mr-3 h-5 w-5 text-amber-600 rounded focus:ring-amber-500"
                                            checked={excessItemIndices.includes(i)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setExcessItemIndices([...excessItemIndices, i]);
                                                } else {
                                                    setExcessItemIndices(excessItemIndices.filter(idx => idx !== i));
                                                }
                                            }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-sm">{row.descriptionItems || "No Description"}</span>
                                                <span className="font-bold text-amber-600">Rs {row.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {row.expenseType} • {row.employeeName}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-border bg-card flex justify-end space-x-3">
                            <button 
                                className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted"
                                onClick={() => {
                                    setShowExcessModal(false);
                                    setSubmitting(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50"
                                disabled={excessItemIndices.length === 0 || submitting}
                                onClick={() => {
                                    const validRows = rows.filter((r: any) => r.expenseDate || r.descriptionItems || r.amount > 0);
                                    submitWithExcess(validRows);
                                }}
                            >
                                {submitting ? "Saving..." : "Confirm Excess & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`bg-card border border-border rounded-xl p-6 shadow-sm`}>
                <h1 className={`text-2xl font-bold tracking-tight mb-6 text-center py-3 rounded-lg bg-muted/30 text-muted-foreground/80`}>
                    {isLocked ? "View Expense Details" : isEditMode ? (isMunawar ? "Update Expense" : "Resubmit Expense") : "Expense Details"}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Site Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-6 bg-muted/30 p-2 rounded-lg w-fit">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="locationType" 
                                    className="text-primary focus:ring-primary disabled:opacity-50"
                                    checked={locationType === 'site'} 
                                    onChange={() => setLocationType('site')} 
                                    disabled={isLocked}
                                />
                                <span className="text-sm font-medium">Site / Project</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="locationType" 
                                    className="text-primary focus:ring-primary disabled:opacity-50"
                                    checked={locationType === 'office'} 
                                    onChange={() => setLocationType('office')} 
                                    disabled={isLocked}
                                />
                                <span className="text-sm font-medium">Office</span>
                            </label>
                        </div>
                        
                        {locationType === 'site' ? (
                            <div className="space-y-2">
                                <SearchableObjectSelect
                                    options={sites.map((s: any) => ({ label: `${s.name} (${s.customerName || "No Client"})`, value: s.id }))}
                                    value={selectedSiteId}
                                    onChange={(val) => setSelectedSiteId(val === "" ? "" : Number(val))}
                                    placeholder="-- Select a Site --"
                                    disabled={isLocked}
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <select 
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                    value={selectedOfficeId}
                                    onChange={(e) => setSelectedOfficeId(e.target.value ? Number(e.target.value) : "")}
                                    disabled={isLocked}
                                >
                                    <option value="">-- Select an Office --</option>
                                    {offices.map((o: any) => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* ARF Selection */}
                    <div className="space-y-2">
                            <label className="text-sm font-medium">Select Approved ARF *</label>
                            <div className={`relative rounded-md transition-colors ${arfBoxClass}`}>
                                <select 
                                    className="w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm focus:outline-none appearance-none disabled:opacity-50"
                                    value={selectedArfId}
                                    onChange={(e) => handleArfSelect(e.target.value)}
                                    disabled={isLocked || (isAmountEqual && selectedArfId !== "")}
                                >
                                    <option value="">-- Select an ARF --</option>
                                    {arfs.map((a: any) => (
                                        <option key={a.id} value={a.id}>
                                            {a.arfNumber || `ARF-${a.id}`} - Rs {(a.status === "Released" ? a.accountsReleasedAmount : a.advanceRequested)?.toLocaleString() || 0} - {a.status === "Released" ? "Confirmed by accounts" : "Not confirmed by accounts yet"}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-2.5 pointer-events-none">
                                    {selectedArfId ? (
                                        isAmountEqual ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-red-600" />
                                    ) : null}
                                </div>
                            </div>
                            {selectedArf && (
                                <div className="text-xs flex justify-between mt-1">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground">{selectedArf?.status === "Released" ? "Released Amount" : "Requested Amount"}: Rs {releasedAmount.toLocaleString()}</span>
                                        {alreadySpent > 0 && (
                                            <>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-amber-600 font-medium">Already Spent: Rs {alreadySpent.toLocaleString()}</span>
                                                    <button type="button" onClick={() => setShowArfInfoModal(true)} className="text-amber-600 hover:text-amber-700 transition-colors p-0.5" title="View details">
                                                        <Info className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <span className="text-primary font-medium mt-0.5">Remaining Balance: Rs {remainingArfBalance.toLocaleString()}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={isAmountEqual ? "text-emerald-600 font-medium" : "text-red-600"}>
                                            Total Entered: Rs {totalAmount.toLocaleString()}
                                        </span>
                                        {isAmountAbove && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-red-600 font-bold mt-0.5">
                                                    Exceeds by: Rs {excessAmount.toLocaleString()}
                                                </span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const siteName = sites.find(s => s.id === selectedSiteId)?.name || '';
                                                        navigate(`/amount-request?action=generateExcess&amount=${excessAmount}&expenseId=${id || ''}&siteId=${locationType === 'site' ? selectedSiteId : ''}&officeId=${locationType === 'office' ? selectedOfficeId : ''}&siteName=${encodeURIComponent(siteName)}&managedFromArf=${selectedArf?.arfNumber || ''}`);
                                                    }}
                                                    className="text-xs text-emerald-600 hover:text-emerald-700 underline mt-1 font-medium bg-emerald-50 px-2 py-0.5 rounded"
                                                >
                                                    Generate ARF for Excess
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Spreadsheet-like Table */}
                <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
                    <table className="w-full text-xs">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-2 py-2 w-10 text-center border-b border-border">No.</th>
                                <th className="px-2 py-2 border-b border-border min-w-[130px]">Expense Date</th>
                                <th className="px-2 py-2 border-b border-border min-w-[140px]">Employee Name</th>
                                <th className="px-2 py-2 border-b border-border min-w-[140px]">Designation</th>
                                <th className="px-2 py-2 border-b border-border min-w-[130px]">Expense Type</th>
                                <th className="px-2 py-2 border-b border-border min-w-[180px]">Description Items</th>
                                <th className="px-2 py-2 border-b border-border min-w-[100px]">Amount</th>
                                <th className="px-2 py-2 border-b border-border min-w-[140px]">Remarks</th>
                                <th className="px-2 py-2 border-b border-border min-w-[80px]">Attachment</th>
                                {!isLocked && <th className="px-2 py-2 border-b border-border w-10"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.map((row: any, index: number) => (
                                <tr key={index} className="hover:bg-muted/30">
                                    <td className="px-2 py-1 text-center text-muted-foreground">{index + 1}:</td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="date" 
                                            value={row.expenseDate}
                                            onChange={(e) => handleRowChange(index, "expenseDate", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.employeeName}
                                            onChange={(e) => handleRowChange(index, "employeeName", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.employeeDesignation}
                                            onChange={(e) => handleRowChange(index, "employeeDesignation", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.expenseType}
                                            onChange={(e) => handleRowChange(index, "expenseType", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.descriptionItems}
                                            onChange={(e) => handleRowChange(index, "descriptionItems", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={row.amount || ''}
                                            onChange={(e) => handleRowChange(index, "amount", Number(e.target.value))}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.remarks}
                                            onChange={(e) => handleRowChange(index, "remarks", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[100px]">
                                            {row.fileUrl && (
                                                <button type="button" onClick={() => openAttachment(row.fileUrl!)} className="text-primary hover:text-primary/80" title="View Attachment">
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                            )}
                                            {row.attachments?.map((url: string, i: number) => (
                                                <button type="button" key={i} onClick={() => openAttachment(url)} className="text-primary hover:text-primary/80" title={`View Attachment ${i + 1}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                            ))}
                                            {!isLocked && (
                                                <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors ml-1" title="Upload Attachments">
                                                    <Paperclip className="h-4 w-4" />
                                                    <input type="file" multiple className="hidden" onChange={(e) => handleUploadFile(index, e)} />
                                                </label>
                                            )}
                                        </div>
                                    </td>
                                    {!isLocked && (
                                        <td className="px-1 py-1 text-center">
                                            <button 
                                                onClick={() => removeRow(index)}
                                                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                                                tabIndex={-1}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                    {!isLocked ? (
                        <button 
                            onClick={addRow}
                            className="flex items-center text-sm text-primary hover:text-primary/80 font-medium"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Row
                        </button>
                    ) : <div></div>}
                    
                    <div className="flex items-center space-x-6 text-sm">
                        <span className="font-semibold text-muted-foreground">Total Amount :</span>
                        <span className={`text-base font-bold ${isAmountEqual && totalAmount > 0 ? 'text-emerald-600' : 'text-foreground'} ${isAmountAbove ? 'text-red-600' : ''}`}>
                            Rs {totalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-border">
                    <button
                        className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted"
                        onClick={() => navigate("/expenses")}
                        disabled={submitting}
                    >
                        {isEditMode ? "Back" : "Cancel"}
                    </button>
                    {!isLocked && (
                        <button
                            className={`px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium disabled:opacity-50`}
                            onClick={handleSubmit}
                            disabled={submitting || (!selectedSiteId && !selectedOfficeId) || !selectedArfId}
                        >
                            {submitting ? (isEditMode && isMunawar ? "Updating..." : "Submitting...") : isEditMode ? (isMunawar ? "Update Expense" : "Resubmit Expense") : "Submit Expense"}
                        </button>
                    )}
                </div>
            </div>
        </div>

        {selectedImage && createPortal(
            <div
                className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                onClick={() => setSelectedImage(null)}
            >
                <div
                    className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center bg-black rounded-lg overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <a
                        href={selectedImage}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-4 right-16 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10 flex items-center gap-2 px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download className="h-4 w-4" />
                        <span className="text-sm font-medium">Download</span>
                    </a>

                    <img
                        src={selectedImage}
                        alt="Expense Attachment Preview"
                        className="max-w-full max-h-[90vh] object-contain"
                    />
                </div>
            </div>,
            document.body
        )}
        </>
    );
};
