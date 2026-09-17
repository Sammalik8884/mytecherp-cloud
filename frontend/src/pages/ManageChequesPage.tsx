import React, { useState, useEffect } from 'react';
import { ChequeDto, chequeApi } from '../api/chequeApi';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Edit, Trash, X } from 'lucide-react';

const ManageChequesPage: React.FC = () => {
    const [cheques, setCheques] = useState<ChequeDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCheque, setEditingCheque] = useState<ChequeDto | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [chequeNumber, setChequeNumber] = useState('');
    const [initialAmount, setInitialAmount] = useState('');
    const [pictureUrl, setPictureUrl] = useState('');
    const [pictureFile, setPictureFile] = useState<File | null>(null);

    useEffect(() => {
        fetchCheques();
    }, []);

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
            setPictureUrl(cheque.pictureUrl || '');
            setPictureFile(null);
        } else {
            setEditingCheque(null);
            setChequeNumber('');
            setInitialAmount('');
            setPictureUrl('');
            setPictureFile(null);
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let finalPicUrl = pictureUrl;
            if (pictureFile) {
                finalPicUrl = await chequeApi.uploadPicture(pictureFile);
            }
            if (editingCheque) {
                await chequeApi.update(editingCheque.id, { chequeNumber, initialAmount: Number(initialAmount), pictureUrl: finalPicUrl });
                toast.success("Cheque updated successfully");
            } else {
                await chequeApi.create({ chequeNumber, initialAmount: Number(initialAmount), pictureUrl: finalPicUrl });
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

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Manage Cheques</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Track cheque balances and link them to ARF releases</p>
                </div>
                {!isFormOpen && (
                    <button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add Cheque
                    </button>
                )}
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
                            <input required value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} className="w-full p-2.5 border border-input rounded-lg bg-background" placeholder="e.g. CHQ-001234" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Initial Amount *</label>
                            <input required type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} className="w-full p-2.5 border border-input rounded-lg bg-background" placeholder="e.g. 500000" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium mb-1">Cheque Picture</label>
                            <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setPictureFile(e.target.files[0]); }} className="w-full p-2.5 border border-input rounded-lg bg-background" />
                            {pictureUrl && !pictureFile && (
                                <p className="text-xs text-muted-foreground mt-1">Current picture uploaded. Select a new one to replace it. <a href={pictureUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">View current</a></p>
                            )}
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
                    <span className="font-semibold text-foreground">Cheque Ledger</span>
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
                                    <th className="px-4 py-3 text-left font-medium">Picture</th>
                                    <th className="px-4 py-3 text-left font-medium">Cheque Number</th>
                                    <th className="px-4 py-3 text-right font-medium">Initial Amount</th>
                                    <th className="px-4 py-3 text-right font-medium">Released</th>
                                    <th className="px-4 py-3 text-right font-medium">Remaining Balance</th>
                                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cheques.map(c => (
                                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3">
                                            {c.pictureUrl
                                                ? <a href={c.pictureUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs">View</a>
                                                : <span className="text-muted-foreground text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3 font-medium">{c.chequeNumber}</td>
                                        <td className="px-4 py-3 text-right">{c.initialAmount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-500">{c.releasedAmount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-bold ${c.remainingBalance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {c.remainingBalance.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
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
