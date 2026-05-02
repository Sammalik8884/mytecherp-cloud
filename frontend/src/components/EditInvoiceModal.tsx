import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { CreateInvoiceDto, InvoiceDto, CreateInvoiceItemDto, BankAccountDto } from "../types/finance";
import { invoiceService } from "../services/invoiceService";
import { customerService } from "../services/customerService";
import { CustomerDto } from "../types/customer";
import { toast } from "react-hot-toast";
import { ProductSelectionModal } from "./common/ProductSelectionModal";
import { ProductDto } from "../types/product";

interface EditInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoiceId: number;
}

interface InvoiceLineItem extends CreateInvoiceItemDto {
    type: "product" | "asset" | "custom";
    itemId?: number;
}

export const EditInvoiceModal = ({ isOpen, onClose, onSuccess, invoiceId }: EditInvoiceModalProps) => {
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    const [customers, setCustomers] = useState<CustomerDto[]>([]);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);

    const [originalInvoice, setOriginalInvoice] = useState<InvoiceDto | null>(null);

    // Form State
    const [customerId, setCustomerId] = useState<number | "">("");
    const [issueDate, setIssueDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [items, setItems] = useState<InvoiceLineItem[]>([]);
    const [taxRate, setTaxRate] = useState(0);

    const [bankAccounts, setBankAccounts] = useState<BankAccountDto[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [bankName, setBankName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [bankAccountTitle, setBankAccountTitle] = useState('');

    const [issuedByName, setIssuedByName] = useState('');
    const [issuedByPhone, setIssuedByPhone] = useState('');

    const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subTotal * (taxRate / 100);
    const totalAmount = subTotal + taxAmount;

    useEffect(() => {
        if (isOpen && invoiceId) {
            const loadData = async () => {
                setDataLoading(true);
                try {
                    const [custs, banks, inv] = await Promise.all([
                        customerService.getAll(),
                        invoiceService.getBankAccounts(),
                        invoiceService.getById(invoiceId)
                    ]);
                    
                    setCustomers(custs);
                    setBankAccounts(banks);
                    setOriginalInvoice(inv);

                    setCustomerId(inv.customerId);
                    setIssueDate(inv.issueDate.split("T")[0]);
                    setDueDate(inv.dueDate.split("T")[0]);
                    
                    if (inv.subTotal > 0 && inv.taxAmount > 0) {
                        setTaxRate(Math.round((inv.taxAmount / inv.subTotal) * 100));
                    }

                    if (inv.bankName || inv.bankAccountNumber) {
                        const matchedBank = banks.find(b => b.bankName === inv.bankName && b.accountNumber === inv.bankAccountNumber);
                        if (matchedBank) {
                            setSelectedBankId(matchedBank.id.toString());
                        } else {
                            setSelectedBankId('custom');
                        }
                        setBankName(inv.bankName || '');
                        setBankAccountNumber(inv.bankAccountNumber || '');
                        setBankAccountTitle(inv.bankAccountTitle || '');
                    }

                    setIssuedByName(inv.issuedByName || '');
                    setIssuedByPhone(inv.issuedByPhone || '');

                    const loadedItems = inv.items?.map(i => ({
                        type: "custom" as const,
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        quotationItemId: i.quotationItemId
                    })) || [];
                    setItems(loadedItems.length > 0 ? loadedItems : [{ type: "custom", description: "", quantity: 1, unitPrice: 0 }]);

                } catch (error) {
                    toast.error("Failed to load invoice details.");
                    onClose();
                } finally {
                    setDataLoading(false);
                }
            };
            loadData();
        }
    }, [isOpen, invoiceId]);

    if (!isOpen) return null;

    const handleAddItem = (type: "product" | "asset" | "custom") => {
        const newIndex = items.length;
        setItems([...items, { type, description: "", quantity: 1, unitPrice: 0 }]);
        if (type === "product") {
            setCurrentItemIndex(newIndex);
            setIsProductModalOpen(true);
        }
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSelectProduct = (product: ProductDto) => {
        if (currentItemIndex !== null) {
            const newItems = [...items];
            newItems[currentItemIndex] = { 
                ...newItems[currentItemIndex], 
                itemId: product.id, 
                description: product.name, 
                unitPrice: product.price || 0 
            };
            setItems(newItems);
        }
        setIsProductModalOpen(false);
        setCurrentItemIndex(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerId) return toast.error("Please select a Customer");
        if (items.some(i => !i.description || i.quantity <= 0 || i.unitPrice < 0)) {
            return toast.error("Please ensure all items are valid.");
        }

        const dto: CreateInvoiceDto = {
            customerId: Number(customerId),
            quotationId: originalInvoice?.quotationId,
            workOrderId: originalInvoice?.workOrderId,
            issueDate: new Date(issueDate).toISOString(),
            dueDate: new Date(dueDate).toISOString(),
            subTotal,
            taxAmount,
            totalAmount,
            status: originalInvoice?.status || 0,
            items: items.map(i => ({
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
            await invoiceService.updateCustom(invoiceId, dto);
            toast.success("Invoice updated successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || "Failed to update invoice.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 sm:p-6 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col border border-border rounded-2xl shadow-2xl relative my-auto">
                <div className="flex justify-between items-center p-6 border-b border-border shrink-0 bg-card z-10 rounded-t-2xl">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        Edit Invoice #{originalInvoice?.invoiceNumber}
                        {dataLoading && <Loader2 className="h-4 w-4 text-primary animate-spin ml-2" />}
                    </h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-secondary/50">
                    <form id="edit-invoice-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Customer</label>
                                <select
                                    required
                                    value={customerId}
                                    onChange={(e) => setCustomerId(Number(e.target.value) || "")}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
                                    disabled={true} // Usually can't change customer on existing invoice
                                >
                                    <option value="" className="bg-card text-foreground">Select a Customer...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id} className="bg-card text-foreground">{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Issue Date</label>
                                <input
                                    type="date"
                                    required
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <h3 className="text-sm font-semibold text-foreground mb-4">Bank Details</h3>
                                <div className="space-y-4">
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
                                                setBankName(''); setBankAccountNumber(''); setBankAccountTitle('');
                                            }
                                        }}
                                        className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none"
                                    >
                                        <option value="">-- No Bank Details --</option>
                                        {bankAccounts.map(b => (
                                            <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                                        ))}
                                        <option value="custom">Custom (Enter below)</option>
                                    </select>
                                    {selectedBankId === 'custom' && (
                                        <div className="space-y-3">
                                            <input type="text" placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                                            <input type="text" placeholder="Account Number" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                                            <input type="text" placeholder="Account Title" value={bankAccountTitle} onChange={e => setBankAccountTitle(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <h3 className="text-sm font-semibold text-foreground mb-4">Issued By (Optional)</h3>
                                <div className="space-y-4">
                                    <input type="text" placeholder="Name" value={issuedByName} onChange={e => setIssuedByName(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                                    <input type="text" placeholder="Phone" value={issuedByPhone} onChange={e => setIssuedByPhone(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="border border-border rounded-xl overflow-hidden mt-6 bg-card">
                            <div className="bg-secondary/30 p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-medium text-foreground">Line Items</h3>
                                <div className="flex items-center space-x-2">
                                    <button type="button" onClick={() => handleAddItem("product")} className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                                        <Plus className="h-3 w-3" /><span>Product</span>
                                    </button>
                                    <button type="button" onClick={() => handleAddItem("custom")} className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 text-muted-foreground">
                                        <Plus className="h-3 w-3" /><span>Service</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs text-muted-foreground mb-1">Description</label>
                                            {item.type === "product" ? (
                                                <div className="flex space-x-2">
                                                    <input readOnly value={item.description || "Select product..."} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 text-sm text-foreground" />
                                                    <button type="button" onClick={() => { setCurrentItemIndex(index); setIsProductModalOpen(true); }} className="px-3 py-2 bg-primary/10 text-primary rounded-lg">Search</button>
                                                </div>
                                            ) : (
                                                <input required value={item.description} onChange={(e) => handleItemChange(index, "description", e.target.value)} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 text-sm text-foreground" />
                                            )}
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-xs text-muted-foreground mb-1">Qty</label>
                                            <input type="number" required min="0.01" step="0.01" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 text-sm text-foreground" />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs text-muted-foreground mb-1">Price</label>
                                            <input type="number" required min="0" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 text-sm text-foreground" />
                                        </div>
                                        <div className="w-10 flex justify-center pb-2">
                                            <button type="button" onClick={() => handleRemoveItem(index)} disabled={items.length === 1} className="text-gray-500 hover:text-red-500 disabled:opacity-30">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <div className="w-full max-w-xs space-y-3">
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Subtotal:</span><span>${subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span className="flex items-center space-x-2">
                                        <span>Tax (%):</span>
                                        <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-16 bg-secondary/30 border border-border rounded text-right px-2 py-1" />
                                    </span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold text-foreground border-t border-border pt-3">
                                    <span>Grand Total:</span><span className="text-primary">${totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border bg-card shrink-0 flex justify-end space-x-4 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary">Cancel</button>
                    <button type="submit" form="edit-invoice-form" disabled={loading} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            <ProductSelectionModal isOpen={isProductModalOpen} onClose={() => { setIsProductModalOpen(false); setCurrentItemIndex(null); }} onSelect={handleSelectProduct} />
        </div>
    );
};
