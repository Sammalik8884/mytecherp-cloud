import { useState, useEffect } from "react";
import { siteService } from "../services/siteService";
import { amountRequestApi, AmountRequestFormDto } from "../api/amountRequestApi";
import { expenseApi, CreateExpenseDto, ExpenseItemDto } from "../api/expenseApi";
import { SiteDto } from "../types/site";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, X, Plus, Trash2 } from "lucide-react";

export const AddExpensePage = () => {
    const navigate = useNavigate();
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [arfs, setArfs] = useState<AmountRequestFormDto[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
    const [selectedArfId, setSelectedArfId] = useState<number | "">("");
    
    // State for the rows
    const [rows, setRows] = useState<ExpenseItemDto[]>(
        Array.from({ length: 5 }, () => ({
            expenseDate: "",
            employeeName: "",
            employeeDesignation: "",
            expenseType: "",
            descriptionItems: "",
            amount: 0,
            remarks: "",
            fileUrl: ""
        }))
    );

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const siteData = await siteService.getAll();
            const arfDataResp = await amountRequestApi.getAll();
            const arfData = arfDataResp.data;
            setSites(siteData);
            
            // Only approved/released ARFs for the current user
            const availableArfs = arfData.filter((a: any) => 
                (a.status === "Released" || a.status === "Approved - Ready for Accounts") 
                // && a.employeeEmail === user?.email // Assuming the API already filters if not admin
            );
            setArfs(availableArfs);
        } catch (error) {
            console.error("Failed to load initial data", error);
            toast.error("Failed to load necessary data");
        }
    };

    const handleRowChange = (index: number, field: keyof ExpenseItemDto, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const addRow = () => {
        setRows([...rows, {
            expenseDate: "",
            employeeName: "",
            employeeDesignation: "",
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
    const releasedAmount = selectedArf?.accountsReleasedAmount || 0;
    
    // Calculate total
    const totalAmount = rows.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);
    
    // Check match
    const isAmountMatched = selectedArf ? totalAmount === releasedAmount : false;

    const handleSubmit = async () => {
        if (!selectedSiteId) return toast.error("Please select a site first.");
        if (!selectedArfId) return toast.error("Please select an ARF.");
        
        // Filter out completely empty rows
        const validRows = rows.filter((r: any) => r.expenseDate || r.descriptionItems || r.amount > 0);
        
        if (validRows.length === 0) return toast.error("Please enter at least one expense item.");
        
        if (!isAmountMatched) {
            return toast.error("Total expense amount must equal the ARF released amount.");
        }

        try {
            setSubmitting(true);
            const payload: CreateExpenseDto = {
                siteId: Number(selectedSiteId),
                amountRequestFormId: Number(selectedArfId),
                items: validRows
            };

            await expenseApi.create(payload);
            toast.success("Expense uploaded successfully");
            navigate("/expenses");
        } catch (error) {
            console.error("Failed to submit expense", error);
            toast.error("Failed to submit expense");
        } finally {
            setSubmitting(false);
        }
    };

    const arfBoxClass = !selectedArfId 
        ? "border-border" 
        : isAmountMatched 
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-500" 
            : "border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500";

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight mb-6 text-center text-muted-foreground/80 bg-muted/30 py-3 rounded-lg">Expense Details</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Site Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Site / Project *</label>
                        <select 
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={selectedSiteId}
                            onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">-- Select a Site --</option>
                            {sites.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.customerName || "No Client"})</option>
                            ))}
                        </select>
                    </div>

                    {/* ARF Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Approved ARF *</label>
                        <div className={`relative rounded-md transition-colors ${arfBoxClass}`}>
                            <select 
                                className="w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm focus:outline-none appearance-none"
                                value={selectedArfId}
                                onChange={(e) => setSelectedArfId(e.target.value ? Number(e.target.value) : "")}
                                disabled={isAmountMatched && selectedArfId !== ""}
                            >
                                <option value="">-- Select an ARF --</option>
                                {arfs.map((a: any) => (
                                    <option key={a.id} value={a.id}>
                                        {a.arfNumber || `ARF-${a.id}`} - Rs {a.accountsReleasedAmount?.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-2.5 pointer-events-none">
                                {selectedArfId ? (
                                    isAmountMatched ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-red-600" />
                                ) : null}
                            </div>
                        </div>
                        {selectedArf && (
                            <div className="text-xs flex justify-between mt-1">
                                <span className="text-muted-foreground">Released Amount: Rs {releasedAmount.toLocaleString()}</span>
                                <span className={isAmountMatched ? "text-emerald-600 font-medium" : "text-red-600"}>
                                    Total Entered: Rs {totalAmount.toLocaleString()}
                                </span>
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
                                <th className="px-2 py-2 border-b border-border w-10"></th>
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
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.employeeName}
                                            onChange={(e) => handleRowChange(index, "employeeName", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.employeeDesignation}
                                            onChange={(e) => handleRowChange(index, "employeeDesignation", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.expenseType}
                                            onChange={(e) => handleRowChange(index, "expenseType", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.descriptionItems}
                                            onChange={(e) => handleRowChange(index, "descriptionItems", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={row.amount || ''}
                                            onChange={(e) => handleRowChange(index, "amount", Number(e.target.value))}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input 
                                            type="text" 
                                            value={row.remarks}
                                            onChange={(e) => handleRowChange(index, "remarks", e.target.value)}
                                            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <button 
                                            onClick={() => removeRow(index)}
                                            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                                            tabIndex={-1}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <button 
                        onClick={addRow}
                        className="flex items-center text-sm text-primary hover:text-primary/80 font-medium"
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add Row
                    </button>
                    
                    <div className="flex items-center space-x-6 text-sm">
                        <span className="font-semibold text-muted-foreground">Total Amount :</span>
                        <span className={`text-base font-bold ${isAmountMatched && totalAmount > 0 ? 'text-emerald-600' : 'text-foreground'}`}>
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
                        Cancel
                    </button>
                    <button
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={submitting || !selectedSiteId || !selectedArfId || !isAmountMatched}
                    >
                        {submitting ? "Submitting..." : "Submit Expense"}
                    </button>
                </div>
            </div>
        </div>
    );
};
