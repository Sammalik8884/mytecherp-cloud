import { useState, useEffect, useMemo, Fragment } from "react";
import { createPortal } from "react-dom";
import { amountRequestApi, AmountRequestFormDto } from "../api/amountRequestApi";
import { expenseApi, ExpenseDto } from "../api/expenseApi";
import { officeApi } from "../api/officeApi";
import { siteService } from "../services/siteService";
import { authService } from "../services/authService";
import { SearchableSelect } from "../components/common/SearchableSelect";
import { Download, Calculator, AlertTriangle, CheckCircle2, Info, Wallet, X, ChevronDown, ChevronUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";

interface AuditRecord {
    arf: AmountRequestFormDto;
    expenses: ExpenseDto[];
    variance: number;
    status: "Balanced" | "Unaccounted Funds" | "Overspent";
    resolution: string;
    childRecords?: AuditRecord[];
}

export const ExpenseAuditorPage = () => {
    const [allArfs, setAllArfs] = useState<AmountRequestFormDto[]>([]);
    const [allExpenses, setAllExpenses] = useState<ExpenseDto[]>([]);
    
    // Entity Lists
    const [allOffices, setAllOffices] = useState<string[]>([]);
    const [allSites, setAllSites] = useState<string[]>([]);
    const [allEmployees, setAllEmployees] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
    const [expandedExpenseIds, setExpandedExpenseIds] = useState<number[]>([]);

    const toggleExpenseDetails = (expenseId: number) => {
        setExpandedExpenseIds(prev => 
            prev.includes(expenseId) ? prev.filter(id => id !== expenseId) : [...prev, expenseId]
        );
    };

    // Filters
    const [section, setSection] = useState<"offices" | "sites" | "employees">("offices");
    const [selectedEntity, setSelectedEntity] = useState<string>("");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [historyRes, expensesRes, officesRes, sitesRes, usersRes] = await Promise.all([
                amountRequestApi.getHistoryForAccounts(), // Fetches all completed/released ARFs
                expenseApi.getAll(),
                officeApi.getAll(),
                siteService.getAll(),
                authService.getUsers()
            ]);
            setAllArfs(historyRes.data);
            setAllExpenses(expensesRes);
            
            setAllOffices(officesRes.map(o => o.name));
            setAllSites(sitesRes.map(s => s.name));
            setAllEmployees(usersRes.map(u => u.fullName || u.email));
        } catch (error) {
            console.error("Error fetching auditor data", error);
            toast.error("Failed to load auditor data");
        } finally {
            setIsLoading(false);
        }
    };

    const getUniqueEntities = () => {
        if (section === "offices") return allOffices;
        if (section === "sites") return allSites;
        return allEmployees;
    };

    // Calculate Audit Report
    const auditReport = useMemo(() => {
        // 1. Filter ARFs by Entity & Date
        let filteredArfs = allArfs;

        if (selectedEntity) {
            if (section === "offices") {
                filteredArfs = filteredArfs.filter(f => 
                    f.officeName === selectedEntity || 
                    allExpenses.some(e => e.amountRequestFormId === f.id && e.officeName === selectedEntity)
                );
            } else if (section === "sites") {
                filteredArfs = filteredArfs.filter(f => 
                    (f.siteName || f.customSiteName) === selectedEntity ||
                    allExpenses.some(e => e.amountRequestFormId === f.id && e.siteName === selectedEntity)
                );
            } else if (section === "employees") {
                filteredArfs = filteredArfs.filter(f => 
                    f.employeeName === selectedEntity ||
                    allExpenses.some(e => e.amountRequestFormId === f.id && e.createdByEmail === selectedEntity)
                );
            }
        }

        if (dateRange.start) {
            filteredArfs = filteredArfs.filter(f => new Date(f.createdAt) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            filteredArfs = filteredArfs.filter(f => new Date(f.createdAt) <= endDate);
        }

        // Pre-calculate excess allocation sequentially
        const excessAllocations: Record<number, Record<number, number>> = {}; // expenseId -> arfId -> allocatedAmount
        const remainingExcessByExpense: Record<number, number> = {};
        const sortedArfs = [...allArfs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        sortedArfs.forEach(arf => {
            const expenseIdMatch = arf.purposeOfAdvance?.match(/\[ExpenseId:(\d+)\]/);
            if (expenseIdMatch) {
                const excessExpenseId = Number(expenseIdMatch[1]);
                
                if (remainingExcessByExpense[excessExpenseId] === undefined) {
                    const excessExpense = allExpenses.find(e => e.id === excessExpenseId);
                    remainingExcessByExpense[excessExpenseId] = excessExpense?.items?.filter(i => i.isExcessItem).reduce((sum, item) => sum + item.amount, 0) || 0;
                }

                const availableExcess = remainingExcessByExpense[excessExpenseId];
                const releasedAmount = arf.accountsReleasedAmount || arf.advanceRequested || 0;
                const allocation = Math.min(releasedAmount, availableExcess);
                
                if (allocation > 0) {
                    if (!excessAllocations[excessExpenseId]) excessAllocations[excessExpenseId] = {};
                    excessAllocations[excessExpenseId][arf.id] = allocation;
                    remainingExcessByExpense[excessExpenseId] -= allocation;
                }
            }
        });

        // 2. Map ARFs to Expenses
        const records: AuditRecord[] = filteredArfs.map(arf => {
            let connectedExpenses = allExpenses.filter(e => e.amountRequestFormId === arf.id).map(e => ({...e}));
            let totalExpenseAmount = connectedExpenses.reduce((sum, e) => sum + e.totalExpenseAmount, 0);

            // Add unallocated excess to this ARF's total (any excess that hasn't been claimed by an Excess ARF yet)
            connectedExpenses.forEach(e => {
                let unallocatedExcess = 0;
                if (remainingExcessByExpense[e.id] !== undefined) {
                    unallocatedExcess = remainingExcessByExpense[e.id];
                } else {
                    unallocatedExcess = e.items?.filter(i => i.isExcessItem).reduce((sum, item) => sum + item.amount, 0) || 0;
                }
                
                if (unallocatedExcess > 0) {
                    e.totalExpenseAmount += unallocatedExcess; // Reflect full amount in the UI
                    totalExpenseAmount += unallocatedExcess;
                    
                    // Deduct it so we don't double-count
                    remainingExcessByExpense[e.id] = 0;
                }
            });

            // Link excess ARFs to their corresponding expenses
            const expenseIdMatch = arf.purposeOfAdvance?.match(/\[ExpenseId:(\d+)\]/);
            if (expenseIdMatch) {
                const excessExpenseId = Number(expenseIdMatch[1]);
                const excessExpense = allExpenses.find(e => e.id === excessExpenseId);
                if (excessExpense) {
                    // Use the pre-allocated amount for this specific ARF, instead of the full excess amount
                    const allocatedAmount = excessAllocations[excessExpenseId]?.[arf.id] || 0;
                    totalExpenseAmount += allocatedAmount;
                    
                    if (allocatedAmount > 0) {
                        const excessExpenseClone = {
                            ...excessExpense,
                            totalExpenseAmount: allocatedAmount,
                            isExcessConnection: true
                        } as any;
                        
                        connectedExpenses = [...connectedExpenses, excessExpenseClone];
                    }
                }
            }
            
            // Use the released amount by default, fallback to requested if not released yet
            const releasedAmount = arf.accountsReleasedAmount || arf.advanceRequested || 0;
            
            const variance = releasedAmount - totalExpenseAmount;
            
            let status: AuditRecord["status"] = "Balanced";
            let resolution = "No action needed.";

            if (variance > 0) {
                status = "Unaccounted Funds";
                resolution = "Submit missing expenses or refund excess amount.";
            } else if (variance < 0) {
                status = "Overspent";
                resolution = "Generate a new ARF to claim out-of-pocket expenses.";
            }

            return {
                arf,
                expenses: connectedExpenses,
                variance,
                status,
                resolution,
                childRecords: []
            };
        });

        // Group excess ARFs under their original ARFs
        const topLevelRecords: AuditRecord[] = [];
        const recordsById = new Map<number, AuditRecord>();

        records.forEach(r => {
            recordsById.set(r.arf.id, r);
        });

        records.forEach(r => {
            const originalArfMatch = r.arf.purposeOfAdvance?.match(/\[OriginalArfId:(\d+)\]/);
            if (originalArfMatch) {
                const originalArfId = Number(originalArfMatch[1]);
                const parentRecord = recordsById.get(originalArfId);
                if (parentRecord) {
                    parentRecord.childRecords!.push(r);
                } else {
                    topLevelRecords.push(r);
                }
            } else {
                topLevelRecords.push(r);
            }
        });

        return topLevelRecords;
    }, [allArfs, allExpenses, section, selectedEntity, dateRange]);

    const sumReleased = (records: AuditRecord[]): number => {
        return records.reduce((sum, rec) => sum + (rec.arf.accountsReleasedAmount || rec.arf.advanceRequested || 0) + sumReleased(rec.childRecords || []), 0);
    };
    const sumExpense = (records: AuditRecord[]): number => {
        return records.reduce((sum, rec) => sum + rec.expenses.reduce((s, e) => s + e.totalExpenseAmount, 0) + sumExpense(rec.childRecords || []), 0);
    };

    const overallTotalReleased = sumReleased(auditReport);
    const overallTotalExpense = sumExpense(auditReport);
    const overallVariance = overallTotalReleased - overallTotalExpense;

    const generatePDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Expense Audit Report - ${section.toUpperCase()}`, 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Entity: ${selectedEntity || "All"}`, 14, 32);
        if (dateRange.start || dateRange.end) {
            doc.text(`Date Range: ${dateRange.start || "Any"} to ${dateRange.end || "Any"}`, 14, 40);
        }
        
        doc.text(`Total Released: ${overallTotalReleased.toLocaleString()}`, 14, 50);
        doc.text(`Total Expenses: ${overallTotalExpense.toLocaleString()}`, 14, 56);
        doc.text(`Net Variance: ${overallVariance.toLocaleString()}`, 14, 62);
        
        const tableColumn = ["ARF Number", "Entity", "Released Amt", "Expense Amt", "Variance", "Status"];
        const tableRows: any[] = [];

        auditReport.forEach(rec => {
            const entityName = rec.arf.siteName || rec.arf.customSiteName || rec.arf.officeName || "N/A";
            const rowData = [
                rec.arf.arfNumber || "N/A",
                entityName,
                (rec.arf.accountsReleasedAmount || rec.arf.advanceRequested || 0).toLocaleString(),
                rec.expenses.reduce((s, e) => s + e.totalExpenseAmount, 0).toLocaleString(),
                rec.variance.toLocaleString(),
                rec.status
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save(`Expense_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Auditor Data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Calculator className="w-7 h-7 text-primary" />
                        Expense Auditor
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Reconcile Released ARFs against Submitted Expenses.</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-medium whitespace-nowrap"
                >
                    <Download className="w-4 h-4" />
                    Export Audit PDF
                </button>
            </div>

            {/* Filters */}
            <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Audit Scope</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {["offices", "sites", "employees"].map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => { setSection(sec as any); setSelectedEntity(""); }}
                                    className={`px-5 py-2 text-sm rounded-lg border font-medium transition-colors ${
                                        section === sec ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/50 hover:bg-muted/30 text-foreground"
                                    }`}
                                >
                                    {sec.charAt(0).toUpperCase() + sec.slice(1)}
                                </button>
                            ))}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">Search & Select {section.charAt(0).toUpperCase() + section.slice(1).slice(0, -1)}</label>
                            <SearchableSelect
                                options={getUniqueEntities()}
                                value={selectedEntity}
                                onChange={(val) => setSelectedEntity(val)}
                                placeholder={`Search ${section}...`}
                            />
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Date Range</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Start Date</label>
                                <input 
                                    type="date" 
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">End Date</label>
                                <input 
                                    type="date" 
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total ARF Released</p>
                        <h3 className="text-3xl font-bold text-foreground">{overallTotalReleased.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-blue-500" />
                    </div>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Expensed</p>
                        <h3 className="text-3xl font-bold text-foreground">{overallTotalExpense.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                        <Calculator className="w-6 h-6 text-purple-500" />
                    </div>
                </div>
                <div className={`bg-card p-6 rounded-2xl border shadow-sm flex items-center justify-between ${overallVariance > 0 ? "border-amber-500/50" : overallVariance < 0 ? "border-rose-500/50" : "border-emerald-500/50"}`}>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Net Variance</p>
                        <h3 className={`text-3xl font-bold ${overallVariance > 0 ? "text-amber-500" : overallVariance < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                            {overallVariance > 0 ? "+" : ""}{overallVariance.toLocaleString()}
                        </h3>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallVariance > 0 ? "bg-amber-500/10" : overallVariance < 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}`}>
                        {overallVariance === 0 ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <AlertTriangle className={`w-6 h-6 ${overallVariance > 0 ? "text-amber-500" : "text-rose-500"}`} />}
                    </div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ARF Info</th>
                                <th className="px-6 py-4 font-semibold text-right">Released Amount</th>
                                <th className="px-6 py-4 font-semibold text-right">Total Expense</th>
                                <th className="px-6 py-4 font-semibold text-right">Variance</th>
                                <th className="px-6 py-4 font-semibold">Status & Resolution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {auditReport.map((rec, idx) => {
                                const renderRecord = (record: AuditRecord, isChild: boolean = false, index: number) => {
                                    return (
                                        <Fragment key={`${record.arf.id}-${index}`}>
                                            <tr 
                                                className={`hover:bg-muted/20 transition-colors group cursor-pointer ${isChild ? 'bg-muted/10' : ''}`}
                                                onClick={() => setSelectedRecord(record)}
                                            >
                                                <td className={`px-6 py-4 ${isChild ? 'pl-12' : ''}`}>
                                                    <div className="font-medium text-foreground flex items-center gap-2">
                                                        {isChild && <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />}
                                                        {record.arf.arfNumber || "Pending Ref"}
                                                        {isChild && <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Excess</span>}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {record.arf.siteName || record.arf.customSiteName || record.arf.officeName || "N/A"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-blue-600">
                                                    {(record.arf.accountsReleasedAmount || record.arf.advanceRequested || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-purple-600">
                                                    {record.expenses.reduce((s, e) => s + e.totalExpenseAmount, 0).toLocaleString()}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${record.variance > 0 ? "text-amber-500" : record.variance < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                                                    {record.variance > 0 ? "+" : ""}{record.variance.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                        record.status === "Balanced" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                        record.status === "Unaccounted Funds" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                        "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                    }`}>
                                                        {record.status === "Balanced" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                        {record.status}
                                                    </div>
                                                    {record.status !== "Balanced" && !isChild && (
                                                        <div className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                                                            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                            <span className="max-w-[200px] leading-snug">{record.resolution}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                            {record.childRecords?.map((child, cIdx) => renderRecord(child, true, cIdx))}
                                        </Fragment>
                                    );
                                };
                                return renderRecord(rec, false, idx);
                            })}
                            {auditReport.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No ARFs found for the selected criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedRecord && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl border border-border/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
                            <div>
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    Reconciliation Details
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    ARF Number: <span className="font-semibold text-foreground">{selectedRecord.arf.arfNumber || "Pending"}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedRecord(null)}
                                className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            
                            {/* ARF Info Section */}
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border/50 pb-2">Amount Request Form Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Entity / Location</p>
                                        <p className="font-medium text-sm">{selectedRecord.arf.siteName || selectedRecord.arf.customSiteName || selectedRecord.arf.officeName || "N/A"}</p>
                                    </div>
                                    <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Employee</p>
                                        <p className="font-medium text-sm">{selectedRecord.arf.employeeName} ({selectedRecord.arf.employeeEmail})</p>
                                    </div>
                                    <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Purpose of Advance</p>
                                        <p className="font-medium text-sm">{selectedRecord.arf.purposeOfAdvance || "N/A"}</p>
                                    </div>
                                    <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Released Amount</p>
                                        <p className="font-bold text-blue-600 text-lg">
                                            {(selectedRecord.arf.accountsReleasedAmount || selectedRecord.arf.advanceRequested || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Expenses Section */}
                            <section>
                                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Connected Expenses</h3>
                                    <span className="text-sm font-bold text-purple-600 bg-purple-500/10 px-3 py-1 rounded-full">
                                        Total: {selectedRecord.expenses.reduce((s, e) => s + e.totalExpenseAmount, 0).toLocaleString()}
                                    </span>
                                </div>
                                
                                {selectedRecord.expenses.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {selectedRecord.expenses.map((expense, idx) => {
                                            const isExpanded = expandedExpenseIds.includes(expense.id);
                                            return (
                                            <div key={idx} className="bg-muted/10 rounded-xl border border-border/50 overflow-hidden">
                                                <div 
                                                    className="p-4 flex flex-col md:flex-row justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                                                    onClick={() => toggleExpenseDetails(expense.id)}
                                                >
                                                    <div>
                                                        <p className="font-semibold text-sm mb-1 flex items-center">
                                                            {isExpanded ? <ChevronUp className="h-4 w-4 mr-2 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />}
                                                            Expense ID: {expense.id}
                                                            {(expense as any).isExcessConnection && <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Excess Portion</span>}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground ml-6">
                                                            Created by: {expense.createdByEmail} • 
                                                            <span className="ml-1 font-medium">{expense.siteName || expense.officeName || "N/A"}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground mb-1">Total Expense</p>
                                                        <p className="font-bold text-foreground text-base">
                                                            {expense.totalExpenseAmount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isExpanded && expense.items && expense.items.length > 0 && (
                                                    <div className="border-t border-border/50 bg-background/50 p-4">
                                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Expense Items</h4>
                                                        <div className="space-y-3">
                                                            {expense.items.map((item, itemIdx) => (
                                                                <div key={itemIdx} className="flex justify-between items-start text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                                                    <div className="flex-1 pr-4">
                                                                        <p className="font-medium">{item.expenseType || "Unspecified Expense"}</p>
                                                                        {item.descriptionItems ? (
                                                                            <p className="text-xs text-muted-foreground mt-0.5">{item.descriptionItems}</p>
                                                                        ) : (
                                                                            <p className="text-xs text-muted-foreground mt-0.5 italic">No description provided</p>
                                                                        )}
                                                                        {item.remarks && <p className="text-xs text-muted-foreground mt-1 italic">Note: {item.remarks}</p>}
                                                                    </div>
                                                                    <div className="text-right flex flex-col items-end">
                                                                        <p className="font-semibold">Rs {item.amount.toLocaleString()}</p>
                                                                        {item.isExcessItem && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">Excess Item</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-muted/10 rounded-xl border border-border/50 border-dashed">
                                        <p className="text-sm text-muted-foreground">No expenses have been connected to this ARF yet.</p>
                                    </div>
                                )}
                            </section>

                            {/* Variance Summary */}
                            <section className={`p-5 rounded-xl border flex items-center justify-between ${
                                selectedRecord.status === "Balanced" ? "bg-emerald-500/10 border-emerald-500/20" :
                                selectedRecord.status === "Unaccounted Funds" ? "bg-amber-500/10 border-amber-500/20" :
                                "bg-rose-500/10 border-rose-500/20"
                            }`}>
                                <div>
                                    <h4 className={`font-bold ${
                                        selectedRecord.status === "Balanced" ? "text-emerald-700" :
                                        selectedRecord.status === "Unaccounted Funds" ? "text-amber-700" :
                                        "text-rose-700"
                                    }`}>{selectedRecord.status}</h4>
                                    <p className="text-sm mt-1 opacity-80">{selectedRecord.resolution}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Net Variance</p>
                                    <p className={`text-2xl font-black ${
                                        selectedRecord.variance > 0 ? "text-amber-600" :
                                        selectedRecord.variance < 0 ? "text-rose-600" :
                                        "text-emerald-600"
                                    }`}>
                                        {selectedRecord.variance > 0 ? "+" : ""}{selectedRecord.variance.toLocaleString()}
                                    </p>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};
