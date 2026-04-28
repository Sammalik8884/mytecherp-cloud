import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { CreateInvoiceDto, BankAccountDto } from "../../types/finance";
import { invoiceService } from "../../services/invoiceService";
import { QuotationDto, QuotationItemDto, quotationService } from "../../services/quotationService";
import { toast } from "react-hot-toast";

import { authService } from "../../services/authService";

interface GenerateInvoiceFromQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    quotation: QuotationDto;
}

interface SelectedItem {
    quotationItemId: number;
    description: string;
    quantity: number;
    maxQuantity: number;
    unitPrice: number;
    included: boolean;
    isFullyInvoiced: boolean;
    itemType: string;
}

export const GenerateInvoiceFromQuoteModal = ({ isOpen, onClose, onSuccess, quotation }: GenerateInvoiceFromQuoteModalProps) => {
    const [loading, setLoading] = useState(false);
    const [fetchingQuote, setFetchingQuote] = useState(false);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]);
    
    const [items, setItems] = useState<SelectedItem[]>([]);
    const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);
    const [freshQuotation, setFreshQuotation] = useState<QuotationDto | null>(null);

    const [bankAccounts, setBankAccounts] = useState<BankAccountDto[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [bankName, setBankName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [bankAccountTitle, setBankAccountTitle] = useState('');

    const [issuedByName, setIssuedByName] = useState('');
    const [issuedByPhone, setIssuedByPhone] = useState('');

    useEffect(() => {
        if (isOpen) {
            const user = authService.getCurrentUser();
            if (user) {
                setIssuedByName(user.fullName || user.name || user.username || '');
                setIssuedByPhone(user.email || '');
            }
            invoiceService.getBankAccounts()
                .then(data => {
                    setBankAccounts(data);
                    const defaultBank = data.find(b => b.isDefault);
                    if (defaultBank) {
                        setSelectedBankId(defaultBank.id.toString());
                        setBankName(defaultBank.bankName);
                        setBankAccountNumber(defaultBank.accountNumber);
                        setBankAccountTitle(defaultBank.accountTitle);
                    }
                })
                .catch(err => console.error("Failed to load bank accounts", err));
        }
    }, [isOpen]);

    // Re-fetch the quote by ID to get fresh invoiced quantity tracking data
    useEffect(() => {
        if (isOpen && quotation) {
            const fetchFreshQuote = async () => {
                setFetchingQuote(true);
                try {
                    const fresh = await quotationService.getQuotationById(quotation.id);
                    setFreshQuotation(fresh);

                    if (fresh && fresh.items) {
                        const mappedItems = fresh.items.map((item: QuotationItemDto) => {
                            const remaining = (item.quantity || 0) - (item.invoicedQuantity || 0);
                            const isFully = item.isFullyInvoiced || remaining <= 0;
                            return {
                                quotationItemId: item.id,
                                description: item.description,
                                quantity: isFully ? item.quantity : remaining,
                                maxQuantity: item.quantity,
                                unitPrice: item.unitPrice,
                                included: !isFully,
                                isFullyInvoiced: isFully,
                                itemType: item.itemType
                            };
                        });
                        
                        setItems(mappedItems);
                        
                        const allFullyInvoiced = mappedItems.every((i: SelectedItem) => i.isFullyInvoiced);
                        if (allFullyInvoiced) {
                            setShowEmptyPrompt(true);
                        } else {
                            setShowEmptyPrompt(false);
                        }
                    }
                } catch (error) {
                    toast.error("Failed to load quote details for tracking.");
                    onClose();
                } finally {
                    setFetchingQuote(false);
                }
            };
            fetchFreshQuote();
        }
    }, [isOpen, quotation?.id]);

    if (!isOpen) return null;

    const activeQuote = freshQuotation || quotation;

    if (fetchingQuote) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-card w-full max-w-md p-12 rounded-2xl shadow-2xl border border-border flex flex-col items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground text-sm">Loading quote tracking data...</p>
                </div>
            </div>
        );
    }

    const handlePromptYes = () => {
        setShowEmptyPrompt(false);
        // Reset all to be included with max quantity
        setItems(prev => prev.map(p => ({ ...p, included: true, quantity: p.maxQuantity })));
    };

    const handlePromptNo = () => {
        setShowEmptyPrompt(false);
        onClose();
    };

    if (showEmptyPrompt) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-border flex flex-col items-center text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">No Products Left</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                        There is not any product left for which invoice can be generated. Do you want to generate again?
                    </p>
                    <div className="flex space-x-4 w-full">
                        <button onClick={handlePromptNo} className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors">
                            No
                        </button>
                        <button onClick={handlePromptYes} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                            Yes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const includedItems = items.filter(i => i.included);

    const subTotal = includedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subTotal * ((activeQuote.gstPercentage || 0) / 100);
    const totalAmount = subTotal + taxAmount;

    const toggleItem = (index: number) => {
        const newItems = [...items];
        newItems[index].included = !newItems[index].included;
        setItems(newItems);
    };

    const updateQuantity = (index: number, val: number) => {
        const newItems = [...items];
        if (val >= 0) {
            newItems[index].quantity = val;
            setItems(newItems);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (includedItems.length === 0) {
            toast.error("Please include at least one item to generate an invoice.");
            return;
        }

        const dto: CreateInvoiceDto = {
            customerId: quotation.customerId,
            quotationId: quotation.id,
            issueDate: new Date(issueDate).toISOString(),
            dueDate: new Date(dueDate).toISOString(),
            subTotal,
            taxAmount,
            totalAmount,
            status: 0, // Draft
            items: includedItems.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                quotationItemId: i.quotationItemId
            })),
            bankName: bankName || undefined,
            bankAccountNumber: bankAccountNumber || undefined,
            bankAccountTitle: bankAccountTitle || undefined,
            issuedByName: issuedByName || undefined,
            issuedByPhone: issuedByPhone || undefined
        };

        try {
            setLoading(true);
            await invoiceService.createCustom(dto);
            toast.success("Invoice generated successfully from quote!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || "Failed to create invoice.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col border border-border rounded-2xl shadow-2xl relative my-auto">
                <div className="flex justify-between items-center p-6 border-b border-border shrink-0 bg-card z-10 rounded-t-2xl">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        Generate Invoice from Quote: {activeQuote.quoteNumber}
                    </h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-secondary/50">
                    <form id="quote-invoice-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Issue Date</label>
                                <input
                                    type="date"
                                    required
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>

                        {/* Bank Details & Issuer */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Bank Accounts */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <h3 className="text-sm font-semibold text-foreground mb-4">Bank Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Select Bank Account</label>
                                        <select
                                            value={selectedBankId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedBankId(val);
                                                if (val !== 'custom' && val !== '') {
                                                    const bank = bankAccounts.find(b => b.id.toString() === val);
                                                    if (bank) {
                                                        setBankName(bank.bankName);
                                                        setBankAccountNumber(bank.accountNumber);
                                                        setBankAccountTitle(bank.accountTitle);
                                                    }
                                                } else {
                                                    setBankName('');
                                                    setBankAccountNumber('');
                                                    setBankAccountTitle('');
                                                }
                                            }}
                                            className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            <option value="">-- No Bank Details --</option>
                                            {bankAccounts.map(b => (
                                                <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                                            ))}
                                            <option value="custom">Custom (Enter below)</option>
                                        </select>
                                    </div>
                                    {selectedBankId === 'custom' && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <input
                                                type="text"
                                                placeholder="Bank Name"
                                                value={bankName}
                                                onChange={e => setBankName(e.target.value)}
                                                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Account Number"
                                                value={bankAccountNumber}
                                                onChange={e => setBankAccountNumber(e.target.value)}
                                                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Account Title"
                                                value={bankAccountTitle}
                                                onChange={e => setBankAccountTitle(e.target.value)}
                                                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Issuer Details */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <h3 className="text-sm font-semibold text-foreground mb-4">Issued By (Optional)</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            value={issuedByName}
                                            onChange={e => setIssuedByName(e.target.value)}
                                            className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. +1 234 567 8900"
                                            value={issuedByPhone}
                                            onChange={e => setIssuedByPhone(e.target.value)}
                                            className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="border border-border rounded-xl overflow-hidden mt-6 bg-card">
                            <div className="bg-white/5 p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-medium text-foreground">Select Products to Invoice</h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {items.map((item, index) => {
                                    // Remove disabled logic so users can re-invoice items if needed
                                    const isFullyInvoicedButUnchecked = item.isFullyInvoiced && !item.included;
                                    return (
                                        <div key={index} className={`flex flex-wrap md:flex-nowrap gap-4 items-center p-3 rounded-lg border transition-all duration-300 ${item.included ? 'bg-primary/5 border-primary/30 shadow-sm' : isFullyInvoicedButUnchecked ? 'bg-secondary/30 border-border opacity-60' : 'bg-transparent border-dashed border-border'}`}>
                                            <div className="w-10 flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.included}
                                                    onChange={() => toggleItem(index)}
                                                    className="w-5 h-5 rounded border-card text-primary focus:ring-primary"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="block text-xs text-muted-foreground mb-1">Description</label>
                                                <div className={`font-medium ${isFullyInvoicedButUnchecked ? 'text-muted-foreground' : 'text-foreground'}`}>{item.description}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{item.itemType}</div>
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-xs text-muted-foreground mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0.01" step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(index, parseFloat(e.target.value))}
                                                    disabled={!item.included}
                                                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs text-muted-foreground mb-1">Unit Price ({activeQuote.currency || 'PKR'})</label>
                                                <div className="text-sm font-medium text-foreground">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs text-muted-foreground mb-1">Total ({activeQuote.currency || 'PKR'})</label>
                                                <div className="text-sm font-medium text-foreground">{(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            </div>
                                            <div className="w-10 flex justify-center">
                                                {item.included && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleItem(index)}
                                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                                        title="Remove from this invoice"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Totals Calculation */}
                        <div className="flex justify-end pt-4">
                            <div className="w-full max-w-xs space-y-3">
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Subtotal ({activeQuote.currency || 'PKR'}):</span>
                                    <span>{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Tax ({activeQuote.gstPercentage || 0}%):</span>
                                    <span>{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold text-foreground border-t border-border pt-3">
                                    <span>Grand Total ({activeQuote.currency || 'PKR'}):</span>
                                    <span className="text-primary">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-border bg-card shrink-0 flex justify-end space-x-4 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="quote-invoice-form"
                        disabled={loading || includedItems.length === 0}
                        className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold flex items-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        <span>Generate Invoice</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
