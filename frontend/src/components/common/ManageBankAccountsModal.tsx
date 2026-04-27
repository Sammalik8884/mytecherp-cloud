import { useState, useEffect } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { BankAccountDto } from "../../types/finance";
import { invoiceService } from "../../services/invoiceService";
import { toast } from "react-hot-toast";

interface ManageBankAccountsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ManageBankAccountsModal = ({ isOpen, onClose }: ManageBankAccountsModalProps) => {
    const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountTitle, setAccountTitle] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await invoiceService.getBankAccounts();
            setAccounts(data);
        } catch (error) {
            toast.error("Failed to load bank accounts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadAccounts();
        }
    }, [isOpen]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setAdding(true);
            await invoiceService.addBankAccount({
                bankName,
                accountNumber,
                accountTitle,
                isDefault,
                id: 0
            });
            toast.success("Bank account added!");
            setBankName('');
            setAccountNumber('');
            setAccountTitle('');
            setIsDefault(false);
            loadAccounts();
        } catch (error) {
            toast.error("Failed to add bank account.");
        } finally {
            setAdding(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-2xl flex flex-col border border-border rounded-2xl shadow-2xl relative">
                <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        Manage Bank Accounts
                    </h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6">
                    {/* Add Form */}
                    <form onSubmit={handleAdd} className="bg-secondary/30 border border-border p-4 rounded-xl space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Add New Bank Account</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text" placeholder="Bank Name" required
                                value={bankName} onChange={e => setBankName(e.target.value)}
                                className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                            />
                            <input
                                type="text" placeholder="Account Number" required
                                value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                                className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                            />
                            <input
                                type="text" placeholder="Account Title" required
                                value={accountTitle} onChange={e => setAccountTitle(e.target.value)}
                                className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                            />
                            <label className="flex items-center space-x-2 text-sm text-foreground">
                                <input
                                    type="checkbox"
                                    checked={isDefault}
                                    onChange={e => setIsDefault(e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                <span>Set as default</span>
                            </label>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={adding} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center text-sm font-medium">
                                {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Add Bank Account
                            </button>
                        </div>
                    </form>

                    {/* List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">Saved Accounts</h3>
                        {loading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : accounts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No bank accounts saved.</p>
                        ) : (
                            accounts.map(acc => (
                                <div key={acc.id} className="flex justify-between items-center p-3 border border-border rounded-lg bg-card">
                                    <div>
                                        <div className="font-medium text-foreground">{acc.bankName} {acc.isDefault && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">Default</span>}</div>
                                        <div className="text-xs text-muted-foreground">{acc.accountTitle} • {acc.accountNumber}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
