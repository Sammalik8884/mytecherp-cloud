import React, { useState, useEffect } from "react";
import { amountRequestApi, AmountRequestFormDto, AmountRequestPayment } from "../api/amountRequestApi";
import { Download, Wallet, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AccountsArfDashboardPage = () => {
    const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
    
    const [pendingForms, setPendingForms] = useState<AmountRequestFormDto[]>([]);
    const [historyForms, setHistoryForms] = useState<AmountRequestFormDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedForm, setSelectedForm] = useState<AmountRequestFormDto | null>(null);

    // History Tab State
    const [historySection, setHistorySection] = useState<"offices" | "sites" | "employees">("offices");
    const [selectedEntity, setSelectedEntity] = useState<string>("");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [pendingRes, historyRes] = await Promise.all([
                amountRequestApi.getPendingForAccounts(),
                amountRequestApi.getHistoryForAccounts()
            ]);
            setPendingForms(pendingRes.data);
            setHistoryForms(historyRes.data);
        } catch (error) {
            console.error("Error fetching ARFs for accounts", error);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReleaseAmount = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedForm) return;

        const target = e.target as any;
        const dateOfEntry = target.dateOfEntry?.value;
        const dateOfFundReleased = target.dateOfFundReleased?.value;
        const releasedAmount = Number(target.releasedAmount?.value);
        const remarks = target.remarks?.value;

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

    const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedForm) return;

        const target = e.target as any;
        const payment: AmountRequestPayment = {
            releasedDate: target.paymentDate.value || undefined,
            releasedAmount: Number(target.paymentAmount.value),
            receivedBy: target.receivedBy.value,
            modeOfPayment: target.modeOfPayment.value,
            remarks: "Added via Accounts Dashboard"
        };

        try {
            await amountRequestApi.addPayment(selectedForm.id, payment);
            toast.success("Payment added successfully");
            const res = await amountRequestApi.getById(selectedForm.id);
            setSelectedForm(res.data);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to add payment");
        }
    };

    // Filter History
    const getUniqueEntities = () => {
        if (historySection === "offices") {
            const offices = historyForms.map(f => f.officeName).filter(Boolean) as string[];
            return Array.from(new Set(offices));
        } else if (historySection === "sites") {
            const sites = historyForms.map(f => f.siteName || f.customSiteName).filter(Boolean) as string[];
            return Array.from(new Set(sites));
        } else {
            const employees = historyForms.map(f => f.employeeName).filter(Boolean) as string[];
            return Array.from(new Set(employees));
        }
    };

    const getFilteredHistory = () => {
        let filtered = historyForms;
        
        if (selectedEntity) {
            if (historySection === "offices") {
                filtered = filtered.filter(f => f.officeName === selectedEntity);
            } else if (historySection === "sites") {
                filtered = filtered.filter(f => (f.siteName || f.customSiteName) === selectedEntity);
            } else if (historySection === "employees") {
                filtered = filtered.filter(f => f.employeeName === selectedEntity);
            }
        }

        if (dateRange.start) {
            filtered = filtered.filter(f => new Date(f.createdAt) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(f => new Date(f.createdAt) <= endDate);
        }

        return filtered;
    };

    const filteredHistory = getFilteredHistory();
    const totalAmount = filteredHistory.reduce((sum, f) => sum + (f.accountsReleasedAmount || 0), 0);

    const generatePDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`ARF History Report - ${historySection.toUpperCase()}`, 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Entity: ${selectedEntity || "All"}`, 14, 32);
        if (dateRange.start || dateRange.end) {
            doc.text(`Date Range: ${dateRange.start || "Any"} to ${dateRange.end || "Any"}`, 14, 40);
        }
        
        const tableColumn = ["Date", "ARF Number", "Employee", "Location", "Requested", "Released Amount"];
        const tableRows: any[] = [];

        filteredHistory.forEach(form => {
            const location = form.siteName || form.officeName || form.customSiteName || "-";
            const rowData = [
                new Date(form.createdAt).toLocaleDateString(),
                form.arfNumber || "-",
                form.employeeName,
                location,
                form.advanceRequested,
                form.accountsReleasedAmount || 0
            ];
            tableRows.push(rowData);
        });

        tableRows.push(["", "", "", "", "TOTAL:", totalAmount]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] },
            footStyles: { fillColor: [240, 240, 240] }
        });

        doc.save(`ARF_History_${historySection}_${selectedEntity || "All"}.pdf`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Accounts ARF Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Process pending requests and view history</p>
                </div>
            </div>

            <div className="flex space-x-1 bg-card p-1 rounded-xl border border-border/50 w-fit">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        activeTab === "pending"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                >
                    Pending ARFs ({pendingForms.length})
                </button>
                <button
                    onClick={() => setActiveTab("completed")}
                    className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        activeTab === "completed"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                >
                    Completed History
                </button>
            </div>

            {activeTab === "pending" && (
                <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/50 text-muted-foreground">
                                    <th className="p-4 font-medium">Employee</th>
                                    <th className="p-4 font-medium">Amount</th>
                                    <th className="p-4 font-medium">Date Required</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading pending ARFs...</td></tr>
                                ) : pendingForms.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No pending ARFs for accounts.</td></tr>
                                ) : (
                                    pendingForms.map(form => (
                                        <tr key={form.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-foreground">{form.employeeName}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{form.employeeEmail}</div>
                                            </td>
                                            <td className="p-4 font-medium text-primary">{form.advanceRequested?.toLocaleString()}</td>
                                            <td className="p-4">{form.dateOfFundRequired ? new Date(form.dateOfFundRequired).toLocaleDateString() : '-'}</td>
                                            <td className="p-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                    {form.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => setSelectedForm(form)} className="text-primary hover:text-primary/80 font-medium text-sm transition-colors">
                                                    View & Release
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

            {activeTab === "completed" && (
                <div className="space-y-6">
                    <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-6">
                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Report Type</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {["offices", "sites", "employees"].map(sec => (
                                        <button
                                            key={sec}
                                            onClick={() => { setHistorySection(sec as any); setSelectedEntity(""); }}
                                            className={`px-5 py-2 text-sm rounded-lg border font-medium transition-colors ${
                                                historySection === sec ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/50 hover:bg-muted/30 text-foreground"
                                            }`}
                                        >
                                            {sec.charAt(0).toUpperCase() + sec.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">Search & Select {historySection.charAt(0).toUpperCase() + historySection.slice(1).slice(0, -1)}</label>
                                    <input 
                                        list="entities-list"
                                        placeholder={`Search ${historySection}...`}
                                        value={selectedEntity} 
                                        onChange={(e) => setSelectedEntity(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                    <datalist id="entities-list">
                                        <option value="">All</option>
                                        {getUniqueEntities().map(ent => (
                                            <option key={ent} value={ent}>{ent}</option>
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date Filter</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs mb-1">Start Date</label>
                                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="w-full p-2 rounded-lg border border-input bg-background" />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1">End Date</label>
                                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="w-full p-2 rounded-lg border border-input bg-background" />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button onClick={generatePDF} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm">
                                        <Download className="w-4 h-4" /> Export PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/50 text-muted-foreground">
                                        <th className="p-4 font-medium">Date</th>
                                        <th className="p-4 font-medium">Employee</th>
                                        <th className="p-4 font-medium">Location</th>
                                        <th className="p-4 font-medium">Requested</th>
                                        <th className="p-4 font-medium">Released</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredHistory.map(form => (
                                        <tr key={form.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="p-4">{new Date(form.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 font-medium">{form.employeeName}</td>
                                            <td className="p-4">{form.siteName || form.officeName || form.customSiteName || '-'}</td>
                                            <td className="p-4">{form.advanceRequested?.toLocaleString()}</td>
                                            <td className="p-4 font-semibold text-green-600">{form.accountsReleasedAmount?.toLocaleString()}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => setSelectedForm(form)} className="text-primary hover:text-primary/80 font-medium text-sm">
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredHistory.length > 0 && (
                                        <tr className="bg-muted/10 font-bold text-base">
                                            <td colSpan={4} className="p-4 text-right">Total Released:</td>
                                            <td className="p-4 text-green-600">{totalAmount.toLocaleString()}</td>
                                            <td></td>
                                        </tr>
                                    )}
                                    {filteredHistory.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records found for the selected filters.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {selectedForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50 p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Amount Request Detail</h2>
                                <p className="text-sm text-muted-foreground mt-1">Ref: {selectedForm.arfNumber || "N/A"}</p>
                            </div>
                            <button onClick={() => setSelectedForm(null)} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
                                <XCircle className="w-6 h-6 text-muted-foreground" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Employee</span><span className="font-medium text-lg">{selectedForm.employeeName}</span></div>
                                    <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Requested Amount</span><span className="font-bold text-xl text-primary">{selectedForm.advanceRequested?.toLocaleString()}</span></div>
                                    <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Status</span><span className="font-medium">{selectedForm.status}</span></div>
                                    <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Location</span><span className="font-medium">{selectedForm.siteName || selectedForm.officeName || selectedForm.customSiteName || '-'}</span></div>
                                </div>
                                <div className="space-y-4">
                                    <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Account Detail</span><span className="font-medium">{selectedForm.accountDetail}</span></div>
                                    <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Purpose</span><span className="font-medium">{selectedForm.purposeOfAdvance}</span></div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-border/50">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Accounts & Payments</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-1 bg-card border border-primary/20 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 font-semibold text-primary">For Accounts Use Only</div>
                                        {selectedForm.accountsReleasedAmount ? (
                                            <div className="p-4 space-y-3 text-sm">
                                                <div><span className="text-muted-foreground">Date of Entry:</span> <span className="font-medium">{selectedForm.accountsDateOfEntry ? new Date(selectedForm.accountsDateOfEntry).toLocaleDateString() : '-'}</span></div>
                                                <div><span className="text-muted-foreground">Date Fund Released:</span> <span className="font-medium">{selectedForm.accountsDateOfFundReleased ? new Date(selectedForm.accountsDateOfFundReleased).toLocaleDateString() : '-'}</span></div>
                                                <div><span className="text-muted-foreground">Released Amount:</span> <span className="font-bold text-primary">{selectedForm.accountsReleasedAmount.toLocaleString()}</span></div>
                                                <div><span className="text-muted-foreground">Remarks:</span> <span>{selectedForm.accountsRemarks}</span></div>
                                            </div>
                                        ) : activeTab === "pending" ? (
                                            <form onSubmit={handleReleaseAmount} className="p-4 space-y-3 text-sm">
                                                <div><label className="block text-muted-foreground mb-1">Date of Entry</label><input name="dateOfEntry" type="date" required className="w-full p-2 rounded border border-input bg-background" /></div>
                                                <div><label className="block text-muted-foreground mb-1">Date Fund Released</label><input name="dateOfFundReleased" type="date" required className="w-full p-2 rounded border border-input bg-background" /></div>
                                                <div><label className="block text-muted-foreground mb-1">Released Amount</label><input name="releasedAmount" type="number" defaultValue={selectedForm.advanceRequested} required className="w-full p-2 rounded border border-input bg-background" /></div>
                                                <div><label className="block text-muted-foreground mb-1">Remarks</label><input name="remarks" type="text" className="w-full p-2 rounded border border-input bg-background" /></div>
                                                <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md font-medium transition-colors">Confirm Release</button>
                                            </form>
                                        ) : (
                                            <div className="p-4 text-center text-muted-foreground text-sm italic">Not yet released by accounts.</div>
                                        )}
                                    </div>

                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="border border-border/50 rounded-xl overflow-hidden">
                                            <div className="bg-muted/30 px-4 py-3 border-b border-border/50 font-semibold text-foreground flex justify-between items-center">
                                                <span>Released Payments Detail</span>
                                                <span className="text-xs font-normal text-muted-foreground">Total: {selectedForm.advanceRequested?.toLocaleString()}</span>
                                            </div>
                                            
                                            {/* Running Balance Summary */}
                                            {(() => {
                                                const totalPaid = selectedForm.payments?.reduce((sum, p) => sum + p.releasedAmount, 0) || 0;
                                                const remaining = selectedForm.advanceRequested - totalPaid;
                                                const progress = Math.min(100, Math.max(0, (totalPaid / selectedForm.advanceRequested) * 100)) || 0;
                                                
                                                return (
                                                    <div>
                                                        <div className="p-4 bg-muted/5 grid grid-cols-2 gap-4 border-b border-border/50 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground block text-xs">Total Paid So Far</span>
                                                                <span className="font-semibold text-green-600">{totalPaid.toLocaleString()}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block text-xs">Remaining Balance</span>
                                                                <span className={`font-semibold ${remaining > 0 ? "text-amber-600" : "text-muted-foreground"}`}>{remaining.toLocaleString()}</span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                                                                    <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left text-sm">
                                                                <thead>
                                                                    <tr className="bg-muted/10 border-b border-border/50 text-muted-foreground"><th className="px-3 py-2">#</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Received By</th><th className="px-3 py-2">Mode</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    {selectedForm.payments?.length === 0 ? (
                                                                        <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground italic">No payment details found</td></tr>
                                                                    ) : (
                                                                        selectedForm.payments?.map((p, i) => (
                                                                            <tr key={p.id} className="border-b border-border/50"><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{p.releasedDate ? new Date(p.releasedDate).toLocaleDateString() : '-'}</td><td className="px-3 py-2 font-medium">{p.releasedAmount.toLocaleString()}</td><td className="px-3 py-2">{p.receivedBy}</td><td className="px-3 py-2">{p.modeOfPayment}</td></tr>
                                                                        ))
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {(activeTab === "pending" || activeTab === "completed") && remaining > 0 && (
                                                            <form onSubmit={handleAddPayment} className="border-t border-border/50 p-4 bg-muted/5 flex flex-wrap gap-4 items-end">
                                                                <div className="flex-1 min-w-[120px]"><label className="block text-xs text-muted-foreground mb-1">Date</label><input name="paymentDate" type="date" required className="w-full p-2 text-sm rounded border border-input bg-background" /></div>
                                                                <div className="flex-1 min-w-[120px]"><label className="block text-xs text-muted-foreground mb-1">Amount</label><input name="paymentAmount" type="number" max={remaining} defaultValue={remaining} required className="w-full p-2 text-sm rounded border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                                                                <div className="flex-1 min-w-[120px]"><label className="block text-xs text-muted-foreground mb-1">Received By</label><input name="receivedBy" type="text" required className="w-full p-2 text-sm rounded border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                                                                <div className="flex-1 min-w-[120px]">
                                                                    <label className="block text-xs text-muted-foreground mb-1">Mode</label>
                                                                    <select name="modeOfPayment" required className="w-full p-2 text-sm rounded border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none">
                                                                        <option value="Transfer">Bank Transfer</option>
                                                                        <option value="Cash">Cash</option>
                                                                        <option value="Check">Check</option>
                                                                    </select>
                                                                </div>
                                                                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">Add Payment</button>
                                                            </form>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountsArfDashboardPage;
