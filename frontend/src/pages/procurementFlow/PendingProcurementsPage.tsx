import React, { useEffect, useState } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { ProcurementRequestDto } from '../../types/procurementFlow';
import { format } from 'date-fns';
import { CheckSquare, XCircle, Plus, Trash2, Calculator, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

interface VendorQuoteFormState {
    id: string; // temp id for UI
    vendorName: string;
    cityName: string;
    contactPerson: string;
    contactNumber: string;
    bankAccountName: string;
    bankName: string;
    accountNumber: string;
    items: {
        procurementRequestItemId: number;
        unitRate: number;
    }[];
}

const PendingProcurementsPage: React.FC = () => {
    const [procurements, setProcurements] = useState<ProcurementRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    
    // For normal completion (after ARF is approved, ready to procure)
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [deliveryNoteText, setDeliveryNoteText] = useState('');
    const [deliveryNoteFiles, setDeliveryNoteFiles] = useState<File[]>([]);
    
    // For Submitting Quotes
    const [quotesModalOpen, setQuotesModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ProcurementRequestDto | null>(null);
    const [vendorQuotes, setVendorQuotes] = useState<VendorQuoteFormState[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await procurementFlowService.getPendingExecutive();
            setProcurements(data);
        } catch (error) {
            console.error('Failed to load pending procurements', error);
        } finally {
            setLoading(false);
        }
    };

    const openQuotesModal = (req: ProcurementRequestDto) => {
        setSelectedRequest(req);
        // Initialize with one vendor form
        setVendorQuotes([{
            id: Math.random().toString(36).substr(2, 9),
            vendorName: '',
            cityName: '',
            contactPerson: '',
            contactNumber: '',
            bankAccountName: '',
            bankName: '',
            accountNumber: '',
            items: req.items.map(i => ({ procurementRequestItemId: i.id, unitRate: 0 }))
        }]);
        setQuotesModalOpen(true);
    };

    const addVendor = () => {
        if (!selectedRequest) return;
        setVendorQuotes([
            ...vendorQuotes,
            {
                id: Math.random().toString(36).substr(2, 9),
                vendorName: '',
                cityName: '',
                contactPerson: '',
                contactNumber: '',
                bankAccountName: '',
                bankName: '',
                accountNumber: '',
                items: selectedRequest.items.map(i => ({ procurementRequestItemId: i.id, unitRate: 0 }))
            }
        ]);
    };

    const removeVendor = (id: string) => {
        setVendorQuotes(vendorQuotes.filter(v => v.id !== id));
    };

    const updateVendorField = (id: string, field: keyof VendorQuoteFormState, value: string) => {
        setVendorQuotes(vendorQuotes.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const updateVendorItemRate = (vendorId: string, itemId: number, rate: string) => {
        const numRate = parseFloat(rate) || 0;
        setVendorQuotes(vendorQuotes.map(v => {
            if (v.id === vendorId) {
                return {
                    ...v,
                    items: v.items.map(i => i.procurementRequestItemId === itemId ? { ...i, unitRate: numRate } : i)
                };
            }
            return v;
        }));
    };

    const calculateVendorTotal = (vendor: VendorQuoteFormState) => {
        if (!selectedRequest) return 0;
        return vendor.items.reduce((total, item) => {
            const reqItem = selectedRequest.items.find(i => i.id === item.procurementRequestItemId);
            const qty = reqItem ? reqItem.quantity : 0;
            return total + (qty * item.unitRate);
        }, 0);
    };

    const handleSubmitQuotes = async () => {
        if (!selectedRequest) return;
        
        // Basic validation
        for (const v of vendorQuotes) {
            if (!v.vendorName.trim()) {
                toast.error('All vendors must have a Vendor Name.');
                return;
            }
        }

        try {
            await procurementFlowService.submitQuotes(selectedRequest.id, {
                quotes: vendorQuotes.map(v => ({
                    vendorName: v.vendorName,
                    cityName: v.cityName,
                    contactPerson: v.contactPerson,
                    contactNumber: v.contactNumber,
                    bankAccountName: v.bankAccountName,
                    bankName: v.bankName,
                    accountNumber: v.accountNumber,
                    items: v.items
                }))
            });

            toast.success('Vendor quotes submitted successfully. Lowest quote automatically selected.');
            setQuotesModalOpen(false);
            setVendorQuotes([]);
            loadData();
        } catch (error) {
            console.error('Failed to submit quotes', error);
            toast.error('Failed to submit quotes');
        }
    };

    // Keep Complete Logic for "ReadyToProcure"
    const openCompleteModal = (req: ProcurementRequestDto) => {
        setSelectedRequest(req);
        setCompleteModalOpen(true);
    };

    const handleComplete = async () => {
        if (!selectedRequest) return;
        try {
            await procurementFlowService.complete(selectedRequest.id, deliveryNoteText, deliveryNoteFiles);
            toast.success('Procurement completed successfully');
            setCompleteModalOpen(false);
            setDeliveryNoteText('');
            setDeliveryNoteFiles([]);
            loadData();
        } catch (error) {
            console.error('Failed to complete procurement', error);
            toast.error('Failed to complete procurement');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    const assignedRequests = procurements.filter(p => p.status === 'AssignedToExecutive');
    const readyToProcureRequests = procurements.filter(p => p.status === 'ReadyToProcure');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Pending Procurements</h1>
                <p className="text-muted-foreground mt-2">Manage your assigned requests and vendor quotes.</p>
            </div>

            {/* Awaiting Quotes */}
            <div>
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Awaiting Vendor Quotes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignedRequests.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-card rounded-lg border border-border">
                            <p className="text-muted-foreground">No requests waiting for quotes.</p>
                        </div>
                    ) : (
                        assignedRequests.map((procurement) => (
                            <div key={procurement.id} className="bg-card rounded-lg border border-border shadow-sm p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{procurement.procurementNumber}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(procurement.createdAt), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Collect Rates
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Please collect vendor rates for {procurement.items.length} items.
                                </p>
                                <button
                                    onClick={() => openQuotesModal(procurement)}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Submit Quotes
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Ready for Procurement */}
            <div>
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2 mt-8">Ready For Procurement (ARF Approved)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {readyToProcureRequests.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-card rounded-lg border border-border">
                            <p className="text-muted-foreground">No approved requests ready for procurement.</p>
                        </div>
                    ) : (
                        readyToProcureRequests.map((procurement) => (
                            <div key={procurement.id} className="bg-card rounded-lg border border-border shadow-sm p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{procurement.procurementNumber}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            ARF Approved
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Ready
                                    </span>
                                </div>
                                <button
                                    onClick={() => openCompleteModal(procurement)}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    Complete & Attach Delivery Note
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quotes Modal */}
            {quotesModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-5xl rounded-lg border border-border shadow-lg flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
                            <h2 className="text-xl font-bold">Submit Vendor Quotes - {selectedRequest.procurementNumber}</h2>
                            <button onClick={() => setQuotesModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                            {vendorQuotes.map((vendor, idx) => (
                                <div key={vendor.id} className="border border-border rounded-lg p-5 bg-background shadow-sm">
                                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                                        <h3 className="font-semibold text-lg">Vendor {idx + 1}</h3>
                                        {vendorQuotes.length > 1 && (
                                            <button onClick={() => removeVendor(vendor.id)} className="text-destructive hover:text-destructive/80 text-sm flex items-center">
                                                <Trash2 className="w-4 h-4 mr-1" /> Remove
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Vendor Name *</label>
                                            <input type="text" value={vendor.vendorName} onChange={(e) => updateVendorField(vendor.id, 'vendorName', e.target.value)} className="w-full p-2 border rounded-md" placeholder="e.g. ABC Suppliers" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">City</label>
                                            <input type="text" value={vendor.cityName} onChange={(e) => updateVendorField(vendor.id, 'cityName', e.target.value)} className="w-full p-2 border rounded-md" placeholder="e.g. Karachi" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Contact Person</label>
                                            <input type="text" value={vendor.contactPerson} onChange={(e) => updateVendorField(vendor.id, 'contactPerson', e.target.value)} className="w-full p-2 border rounded-md" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Contact Number</label>
                                            <input type="text" value={vendor.contactNumber} onChange={(e) => updateVendorField(vendor.id, 'contactNumber', e.target.value)} className="w-full p-2 border rounded-md" />
                                        </div>
                                    </div>

                                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Bank Details (Optional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-muted/20 p-4 rounded-md">
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Account Title</label>
                                            <input type="text" value={vendor.bankAccountName} onChange={(e) => updateVendorField(vendor.id, 'bankAccountName', e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Bank Name</label>
                                            <input type="text" value={vendor.bankName} onChange={(e) => updateVendorField(vendor.id, 'bankName', e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Account / IBAN Number</label>
                                            <input type="text" value={vendor.accountNumber} onChange={(e) => updateVendorField(vendor.id, 'accountNumber', e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                                        </div>
                                    </div>

                                    <h4 className="font-medium mb-3 border-b border-border pb-2">Item Rates</h4>
                                    <div className="overflow-x-auto rounded-md border border-border">
                                        <table className="min-w-full divide-y divide-border">
                                            <thead className="bg-muted">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Item Name</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Requested Qty</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Rate</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-card divide-y divide-border">
                                                {selectedRequest.items.map(reqItem => {
                                                    const vItem = vendor.items.find(i => i.procurementRequestItemId === reqItem.id);
                                                    const rate = vItem ? vItem.unitRate : 0;
                                                    const total = reqItem.quantity * rate;
                                                    return (
                                                        <tr key={reqItem.id}>
                                                            <td className="px-4 py-3 text-sm">{reqItem.itemName}</td>
                                                            <td className="px-4 py-3 text-sm">{reqItem.quantity}</td>
                                                            <td className="px-4 py-3">
                                                                <input 
                                                                    type="number"
                                                                    min="0" step="0.01"
                                                                    value={rate === 0 ? '' : rate}
                                                                    onChange={(e) => updateVendorItemRate(vendor.id, reqItem.id, e.target.value)}
                                                                    className="w-32 p-1 border rounded-md"
                                                                    placeholder="0.00"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right font-medium">Rs {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-muted/50 font-bold">
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-right">Total Amount:</td>
                                                    <td className="px-4 py-3 text-right text-primary">Rs {calculateVendorTotal(vendor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-center pt-4 border-t border-border">
                                <button onClick={addVendor} className="flex items-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md border border-border shadow-sm">
                                    <Plus className="w-4 h-4 mr-2" /> Add Another Vendor Option
                                </button>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border flex justify-between items-center bg-muted/20 shrink-0">
                            <div className="text-sm text-muted-foreground flex items-center">
                                <Calculator className="w-4 h-4 mr-2" />
                                The system will automatically select the vendor with the lowest total amount.
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setQuotesModalOpen(false)} className="px-4 py-2 border border-input text-foreground rounded-md hover:bg-accent">Cancel</button>
                                <button onClick={handleSubmitQuotes} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Submit All Quotes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Modal */}
            {completeModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-lg rounded-lg border border-border shadow-lg flex flex-col">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">Complete Procurement</h2>
                            <button onClick={() => setCompleteModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Delivery Note Text</label>
                                <textarea
                                    value={deliveryNoteText}
                                    onChange={(e) => setDeliveryNoteText(e.target.value)}
                                    className="w-full p-2 border rounded-md h-24"
                                    placeholder="Enter delivery details or remarks..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Attach Delivery Note Document(s)</label>
                                <input 
                                    type="file" 
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setDeliveryNoteFiles(Array.from(e.target.files));
                                        }
                                    }}
                                    className="w-full p-2 border rounded-md text-sm"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-border flex justify-end gap-3">
                            <button onClick={() => setCompleteModalOpen(false)} className="px-4 py-2 border border-input rounded-md hover:bg-accent">Cancel</button>
                            <button onClick={handleComplete} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Submit Delivery</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingProcurementsPage;
