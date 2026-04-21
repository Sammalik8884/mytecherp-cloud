import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { CreateInvoiceDto } from "../../types/finance";
import { invoiceService } from "../../services/invoiceService";
import { QuotationDto, QuotationItemDto } from "../../services/quotationService";
import { toast } from "react-hot-toast";

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
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]);
    
    const [items, setItems] = useState<SelectedItem[]>([]);
    const [ignoreFullyInvoiced, setIgnoreFullyInvoiced] = useState(false);
    const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);

    useEffect(() => {
        if (isOpen && quotation && quotation.items) {
            const mappedItems = quotation.items.map((item: QuotationItemDto) => {
                const remaining = (item.quantity || 0) - (item.invoicedQuantity || 0);
                const isFully = item.isFullyInvoiced || remaining <= 0;
                return {
                    quotationItemId: item.id,
                    description: item.description,
                    quantity: isFully ? item.quantity : remaining, // if fully invoiced but ignored later, we use original quantity
                    maxQuantity: item.quantity,
                    unitPrice: item.unitPrice,
                    included: !isFully, // Included by default if not fully invoiced
                    isFullyInvoiced: isFully,
                    itemType: item.itemType
                };
            });
            
            setItems(mappedItems);
            setIgnoreFullyInvoiced(false);
            
            const allFullyInvoiced = mappedItems.every((i: SelectedItem) => i.isFullyInvoiced);
            if (allFullyInvoiced) {
                setShowEmptyPrompt(true);
            } else {
                setShowEmptyPrompt(false);
            }
        }
    }, [isOpen, quotation]);

    if (!isOpen) return null;

    const handlePromptYes = () => {
        setIgnoreFullyInvoiced(true);
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

    const includedItems = items.filter(i => i.included && (!i.isFullyInvoiced || ignoreFullyInvoiced));

    const subTotal = includedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subTotal * (quotation.gstPercentage / 100);
    const totalAmount = subTotal + taxAmount; // We ignore income tax + adjustment for simplicity or adapt as needed. Let's just calculate basic subtotal/tax

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
            }))
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
                        Generate Invoice from Quote: {quotation.quoteNumber}
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

                        {/* Line Items */}
                        <div className="border border-border rounded-xl overflow-hidden mt-6 bg-card">
                            <div className="bg-white/5 p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-medium text-foreground">Select Products to Invoice</h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {items.map((item, index) => {
                                    const isDisabled = item.isFullyInvoiced && !ignoreFullyInvoiced;
                                    return (
                                        <div key={index} className={`flex flex-wrap md:flex-nowrap gap-4 items-center p-3 rounded-lg border transition-all duration-300 ${isDisabled ? 'bg-secondary/30 border-border opacity-50' : item.included ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-transparent border-dashed border-border'}`}>
                                            <div className="w-10 flex justify-center">
                                                {!isDisabled && (
                                                    <input
                                                        type="checkbox"
                                                        checked={item.included}
                                                        onChange={() => toggleItem(index)}
                                                        className="w-5 h-5 rounded border-card text-primary focus:ring-primary"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="block text-xs text-muted-foreground mb-1">Description</label>
                                                <div className={`font-medium ${isDisabled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.description}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{item.itemType}</div>
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-xs text-muted-foreground mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0.01" max={item.maxQuantity} step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(index, parseFloat(e.target.value))}
                                                    disabled={isDisabled || !item.included}
                                                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="w-28">
                                                <label className="block text-xs text-muted-foreground mb-1">Unit Price ($)</label>
                                                <div className="text-sm font-medium text-foreground">${item.unitPrice.toFixed(2)}</div>
                                            </div>
                                            <div className="w-28">
                                                <label className="block text-xs text-muted-foreground mb-1">Total</label>
                                                <div className="text-sm font-medium text-foreground">${(item.quantity * item.unitPrice).toFixed(2)}</div>
                                            </div>
                                            <div className="w-10 flex justify-center">
                                                {item.included && !isDisabled && (
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
                                    <span>Subtotal:</span>
                                    <span>${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Tax ({quotation.gstPercentage}%):</span>
                                    <span>${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold text-foreground border-t border-border pt-3">
                                    <span>Grand Total:</span>
                                    <span className="text-primary">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
