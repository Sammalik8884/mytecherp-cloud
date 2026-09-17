import React, { useState, useEffect } from 'react';
import { ChequeDto, chequeApi } from '../../api/chequeApi';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Edit, Trash, X } from 'lucide-react';

interface ChequeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChequeModal: React.FC<ChequeModalProps> = ({ isOpen, onClose }) => {
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
        if (isOpen) {
            fetchCheques();
        }
    }, [isOpen]);

    const fetchCheques = async () => {
        setIsLoading(true);
        try {
            const data = await chequeApi.getAll();
            setCheques(data);
        } catch (error) {
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
                await chequeApi.update(editingCheque.id, {
                    chequeNumber,
                    initialAmount: Number(initialAmount),
                    pictureUrl: finalPicUrl
                });
                toast.success("Cheque updated successfully");
            } else {
                await chequeApi.create({
                    chequeNumber,
                    initialAmount: Number(initialAmount),
                    pictureUrl: finalPicUrl
                });
                toast.success("Cheque created successfully");
            }
            setIsFormOpen(false);
            fetchCheques();
        } catch (error) {
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
        } catch (error) {
            toast.error("Failed to delete cheque");
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background w-full max-w-4xl rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Manage Cheques</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {!isFormOpen ? (
                    <>
                        <button 
                            onClick={() => handleOpenForm()}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded flex items-center gap-2 mb-4"
                        >
                            <Plus className="h-4 w-4" /> Add Cheque
                        </button>

                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-2">Picture</th>
                                            <th className="p-2">Cheque Number</th>
                                            <th className="p-2">Initial Amount</th>
                                            <th className="p-2">Released</th>
                                            <th className="p-2">Remaining</th>
                                            <th className="p-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cheques.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center p-4 text-muted-foreground">No cheques found.</td>
                                            </tr>
                                        ) : cheques.map(c => (
                                            <tr key={c.id} className="border-b">
                                                <td className="p-2">
                                                    {c.pictureUrl ? (
                                                        <a href={c.pictureUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline text-sm">View</a>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-2">{c.chequeNumber}</td>
                                                <td className="p-2">{c.initialAmount.toLocaleString()}</td>
                                                <td className="p-2 text-red-500">{c.releasedAmount.toLocaleString()}</td>
                                                <td className="p-2 text-green-600 font-bold">{c.remainingBalance.toLocaleString()}</td>
                                                <td className="p-2 flex gap-2">
                                                    <button onClick={() => handleOpenForm(c)} className="p-1 hover:bg-muted rounded"><Edit className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-muted rounded text-red-500"><Trash className="h-4 w-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Cheque Number</label>
                            <input 
                                required
                                value={chequeNumber}
                                onChange={(e) => setChequeNumber(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Initial Amount</label>
                            <input 
                                required
                                type="number"
                                value={initialAmount}
                                onChange={(e) => setInitialAmount(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Cheque Picture</label>
                            <input 
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setPictureFile(e.target.files[0]);
                                    }
                                }}
                                className="w-full p-2 border rounded"
                            />
                            {pictureUrl && !pictureFile && <p className="text-sm mt-1">Current picture uploaded. Select a new one to replace.</p>}
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded hover:bg-muted">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground px-4 py-2 rounded flex items-center gap-2">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
