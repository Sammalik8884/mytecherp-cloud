import React, { useState, useEffect } from 'react';
import { ChequeDto, ChequeLedgerDto, chequeApi } from '../api/chequeApi';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Edit, Trash, X, FileText, Eye, Download, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ManageChequesPage: React.FC = () => {
    const [cheques, setCheques] = useState<ChequeDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCheque, setEditingCheque] = useState<ChequeDto | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Ledger state
    const [ledger, setLedger] = useState<ChequeLedgerDto | null>(null);
    const [isLoadingLedger, setIsLoadingLedger] = useState(false);

    // Form fields
    const [chequeNumber, setChequeNumber] = useState('');
    const [initialAmount, setInitialAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [pictureUrl, setPictureUrl] = useState('');
    const [pictureFile, setPictureFile] = useState<File | null>(null);

    useEffect(() => { fetchCheques(); }, []);

    const fetchCheques = async () => {
        setIsLoading(true);
        try {
            const data = await chequeApi.getAll();
            setCheques(data);
        } catch {
            toast.error("Failed to load cheques");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (cheque?: ChequeDto) => {
        if (cheque) {
            setEditingCheque(cheque);
            setChequeNumber(cheque.chequeNumber);
            setInitialAmount(cheque.initialAmount.toString());
            setBankName(cheque.bankName || '');
            setAccountName(cheque.accountName || '');
            setAccountNumber(cheque.accountNumber || '');
            setPictureUrl(cheque.pictureUrl || '');
            setPictureFile(null);
        } else {
            setEditingCheque(null);
            setChequeNumber('');
            setInitialAmount('');
            setBankName('');
            setAccountName('');
            setAccountNumber('');
            setPictureUrl('');
            setPictureFile(null);
        }
        setIsFormOpen(true);
        setLedger(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let finalPicUrl = pictureUrl;
            if (pictureFile) finalPicUrl = await chequeApi.uploadPicture(pictureFile);

            const payload = { chequeNumber, initialAmount: Number(initialAmount), bankName, accountName, accountNumber, pictureUrl: finalPicUrl };
            if (editingCheque) {
                await chequeApi.update(editingCheque.id, payload);
                toast.success("Cheque updated successfully");
            } else {
                await chequeApi.create(payload);
                toast.success("Cheque created successfully");
            }
            setIsFormOpen(false);
            fetchCheques();
        } catch {
            toast.error("Failed to save cheque");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this cheque?")) return;
        setIsLoading(true);
        try {
            await chequeApi.delete(id);
            toast.success("Cheque deleted");
            fetchCheques();
        } catch {
            toast.error("Failed to delete cheque");
            setIsLoading(false);
        }
    };

    const handleViewLedger = async (cheque: ChequeDto) => {
        setIsLoadingLedger(true);
        setLedger(null);
        setIsFormOpen(false);
        try {
            const data = await chequeApi.getLedger(cheque.id);
            setLedger(data);
        } catch {
            toast.error("Failed to load ledger");
        } finally {
            setIsLoadingLedger(false);
        }
    };

    const exportLedgerPDF = () => {
        if (!ledger) return;
        const doc = new jsPDF();
        const c = ledger.cheque;
        doc.setFontSize(16);
        doc.text(`Cheque Ledger — ${c.chequeNumber}`, 14, 18);
        doc.setFontSize(10);
        doc.text(`Bank: ${c.bankName || '-'}  |  Account: ${c.accountName} (${c.accountNumber})`, 14, 26);
        doc.text(`Initial: ${c.initialAmount.toLocaleString()}  |  Released: ${c.releasedAmount.toLocaleString()}  |  Remaining: ${c.remainingBalance.toLocaleString()}`, 14, 32);

        autoTable(doc, {
            startY: 38,
            head: [['ARF#', 'Employee', 'Site', 'Amount', 'Date', 'Remarks']],
            body: ledger.payments.map(p => [
                p.arfNumber, p.employeeName, p.siteName,
                p.releasedAmount.toLocaleString(),
                p.releasedDate ? new Date(p.releasedDate).toLocaleDateString() : '-',
                p.remarks
            ])
        });
        doc.save(`Cheque_Ledger_${c.chequeNumber}.pdf`);
    };

    const exportLedgerExcel = () => {
        if (!ledger) return;
        const c = ledger.cheque;
        const summary = [
            ['Cheque Number', c.chequeNumber],
            ['Bank Name', c.bankName || '-'],
            ['Account Name', c.accountName || '-'],
            ['Account Number', c.accountNumber || '-'],
            ['Initial Amount', c.initialAmount],
            ['Released Amount', c.releasedAmount],
            ['Remaining Balance', c.remainingBalance],
            [],
        ];
        const headers = [['ARF Number', 'Employee', 'Site', 'Amount', 'Date', 'Remarks']];
        const rows = ledger.payments.map(p => [
            p.arfNumber, p.employeeName, p.siteName,
            p.releasedAmount,
            p.releasedDate ? new Date(p.releasedDate).toLocaleDateString() : '-',
            p.remarks
        ]);
        const ws = XLSX.utils.aoa_to_sheet([...summary, ...headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
        XLSX.writeFile(wb, `Cheque_Ledger_${c.chequeNumber}.xlsx`);
    };

    const exportAllPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Cheque Management Ledger', 14, 18);
        autoTable(doc, {
            startY: 24,
            head: [['Cheque#', 'Bank', 'Account Name', 'Acc#', 'Initial', 'Released', 'Remaining']],
            body: cheques.map(c => [
                c.chequeNumber, c.bankName || '-', c.accountName || '-', c.accountNumber || '-',
                c.initialAmount.toLocaleString(),
                c.releasedAmount.toLocaleString(),
                c.remainingBalance.toLocaleString()
            ])
        });
        doc.save('Cheques_Summary.pdf');
    };

    const exportAllExcel = () => {
        const rows = cheques.map(c => ({
            'Cheque Number': c.chequeNumber,
            'Bank Name': c.bankName || '-',
            'Account Name': c.accountName || '-',
            'Account Number': c.accountNumber || '-',
            'Initial Amount': c.initialAmount,
            'Released Amount': c.releasedAmount,
            'Remaining Balance': c.remainingBalance,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cheques');
        XLSX.writeFile(wb, 'Cheques_Summary.xlsx');
    };

    // ─── LEDGER VIEW ───
    if (ledger) {
        const c = ledger.cheque;
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
                <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setLedger(null)} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Cheque Ledger — {c.chequeNumber}</h1>
                            <p className="text-muted-foreground text-sm">{c.bankName} | {c.accountName} | {c.accountNumber}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportLedgerPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"><FileText className="h-4 w-4" /> PDF</button>
                        <button onClick={exportLedgerExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm"><Download className="h-4 w-4" /> Excel</button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Initial Amount', value: c.initialAmount, color: 'text-foreground' },
                        { label: 'Total Released', value: c.releasedAmount, color: 'text-red-500' },
                        { label: 'Remaining Balance', value: c.remainingBalance, color: c.remainingBalance <= 0 ? 'text-red-600' : 'text-green-600' },
                    ].map(card => (
                        <div key={card.label} className="bg-card rounded-xl border border-border/50 p-4 text-center">
                            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                            <p className={`text-xl font-bold ${card.color}`}>PKR {card.value.toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Payments Table */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                    <div className="bg-muted/30 px-6 py-4 border-b border-border/50 font-semibold">ARF Payment History ({ledger.payments.length})</div>
                    {ledger.payments.length === 0 ? (
                        <div className="text-center text-muted-foreground p-10">No payments made using this cheque yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 text-muted-foreground bg-muted/10">
                                        <th className="px-4 py-3 text-left font-medium">#</th>
                                        <th className="px-4 py-3 text-left font-medium">ARF Number</th>
                                        <th className="px-4 py-3 text-left font-medium">Employee</th>
                                        <th className="px-4 py-3 text-left font-medium">Site</th>
                                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                                        <th className="px-4 py-3 text-left font-medium">Date</th>
                                        <th className="px-4 py-3 text-left font-medium">Remarks</th>
                                        <th className="px-4 py-3 text-center font-medium">Slip</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledger.payments.map((p, i) => (
                                        <tr key={p.paymentId} className="border-b border-border/50 hover:bg-muted/10">
                                            <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                                            <td className="px-4 py-3 font-medium text-primary">{p.arfNumber}</td>
                                            <td className="px-4 py-3">{p.employeeName}</td>
                                            <td className="px-4 py-3">{p.siteName || '-'}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-red-600">PKR {p.releasedAmount.toLocaleString()}</td>
                                            <td className="px-4 py-3">{p.releasedDate ? new Date(p.releasedDate).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{p.remarks}</td>
                                            <td className="px-4 py-3 text-center">
                                                {p.paymentSlipUrl
                                                    ? <a href={p.paymentSlipUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs">View</a>
                                                    : <span className="text-muted-foreground text-xs">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── MAIN LIST VIEW ───
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            {isLoadingLedger && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-background rounded-xl p-6 flex items-center gap-3 shadow-xl">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading ledger...
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Manage Cheques</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Track cheque balances and link them to ARF releases</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={exportAllPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"><FileText className="h-4 w-4" /> Export PDF</button>
                    <button onClick={exportAllExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm"><Download className="h-4 w-4" /> Export Excel</button>
                    {!isFormOpen && (
                        <button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                            <Plus className="h-4 w-4" /> Add Cheque
                        </button>
                    )}
                </div>
            </div>

            {/* Add / Edit Form */}
            {isFormOpen && (
                <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">{editingCheque ? 'Edit Cheque' : 'Add New Cheque'}</h2>
                        <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-muted rounded-full"><X className="h-4 w-4" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Cheque Number *</label>
                            <input required value={chequeNumber} onChange={e => setChequeNumber(e.target.value)} className="w-full p-2.5 border border-input rounded-lg bg-background" placeholder="e.g. CHQ-001234" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Initial Amount *</label>
                            <input required type="number" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} className="w-full p-2.5 border border-input rounded-lg bg-background" placeholder="e.g. 500000" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bank Name</label>
                            <input value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-2.5 border border-input rounded-lg bg-background" placeholder="e.g. HBL, MCB, UBL" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Account Name</label>
                            <input value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full p-2.5 border border-input rounded-lg bg-background" placeholder="Account holder name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Account Number</label>
                            <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full p-2.5 border border-input rounded-lg bg-background" placeholder="e.g. 0123456789" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Cheque Picture</label>
                            <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) setPictureFile(e.target.files[0]); }} className="w-full p-2.5 border border-input rounded-lg bg-background" />
                            {pictureUrl && !pictureFile && <p className="text-xs text-muted-foreground mt-1">Current picture uploaded. <a href={pictureUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">View</a></p>}
                        </div>
                        <div className="sm:col-span-2 flex gap-3 justify-end">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : (editingCheque ? 'Update Cheque' : 'Create Cheque')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Cheques Table */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b border-border/50">
                    <span className="font-semibold text-foreground">Cheque Ledger ({cheques.length})</span>
                </div>
                {isLoading ? (
                    <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : cheques.length === 0 ? (
                    <div className="text-center text-muted-foreground p-10">No cheques added yet. Click "Add Cheque" to create one.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/10 text-muted-foreground">
                                    <th className="px-4 py-3 text-left font-medium">Cheque#</th>
                                    <th className="px-4 py-3 text-left font-medium">Bank</th>
                                    <th className="px-4 py-3 text-left font-medium">Account Name</th>
                                    <th className="px-4 py-3 text-left font-medium">Acc#</th>
                                    <th className="px-4 py-3 text-right font-medium">Initial</th>
                                    <th className="px-4 py-3 text-right font-medium">Released</th>
                                    <th className="px-4 py-3 text-right font-medium">Remaining</th>
                                    <th className="px-4 py-3 text-left font-medium">Pic</th>
                                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cheques.map(c => (
                                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3 font-medium">{c.chequeNumber}</td>
                                        <td className="px-4 py-3">{c.bankName || '—'}</td>
                                        <td className="px-4 py-3">{c.accountName || '—'}</td>
                                        <td className="px-4 py-3">{c.accountNumber || '—'}</td>
                                        <td className="px-4 py-3 text-right">{c.initialAmount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-500">{c.releasedAmount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-bold ${c.remainingBalance <= 0 ? 'text-red-600' : 'text-green-600'}`}>{c.remainingBalance.toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.pictureUrl ? <a href={c.pictureUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs">View</a> : <span className="text-muted-foreground text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleViewLedger(c)} title="View Ledger" className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 transition-colors"><Eye className="h-4 w-4" /></button>
                                                <button onClick={() => handleOpenForm(c)} title="Edit" className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(c.id)} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"><Trash className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageChequesPage;
