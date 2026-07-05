import React, { useEffect, useState } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { ProcurementRequestDto } from '../../types/procurementFlow';
import { format } from 'date-fns';
import { XCircle, Eye, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const RegionalHeadApprovalsPage: React.FC = () => {
    const [procurements, setProcurements] = useState<ProcurementRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ProcurementRequestDto | null>(null);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Reusing getPendingPd logic for simplicity, or we should add a getPendingRegionalHead method
            // Actually, procurementService.getAll() filters for "PendingRegionalHead" for Regional Head role.
            // Let's use getAll.
            const data = await procurementFlowService.getAll();
            const pending = data.filter(d => d.status === 'PendingRegionalHead');
            setProcurements(pending);
        } catch (error) {
            console.error('Failed to load pending approvals', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (isApproved: boolean) => {
        if (!selectedRequest) return;
        try {
            const updatedItems = selectedRequest.items.map(item => ({
                itemId: item.id > 0 ? item.id : null,
                itemName: item.itemName,
                quantity: item.quantity,
                reason: item.reason
            }));

            await procurementFlowService.rhReview(selectedRequest.id, { 
                isApproved, 
                remarks, 
                updatedItems 
            });

            toast.success(`Request ${isApproved ? 'approved' : 'rejected'} successfully`);
            setSelectedRequest(null);
            setRemarks('');
            loadData();
        } catch (error) {
            console.error('Failed to submit review', error);
            toast.error('Failed to submit review');
        }
    };

    const handleItemChange = (itemId: number, field: string, value: any) => {
        setSelectedRequest(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                items: prev.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
            };
        });
    };

    const handleRemoveItem = (itemId: number) => {
        setSelectedRequest(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                items: prev.items.filter(i => i.id !== itemId)
            };
        });
    };

    const handleAddItem = () => {
        setSelectedRequest(prev => {
            if (!prev) return prev;
            const newItem = {
                id: -Date.now(),
                procurementRequestId: prev.id,
                itemName: '',
                quantity: 1,
                reason: ''
            };
            return {
                ...prev,
                items: [...prev.items, newItem]
            };
        });
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Regional Head Approvals</h1>
                <p className="text-muted-foreground mt-2">Review pending procurement requests from Site Supervisors.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {procurements.length === 0 ? (
                    <div className="col-span-full p-8 text-center bg-card rounded-lg border border-border">
                        <p className="text-muted-foreground">No pending approvals at this time.</p>
                    </div>
                ) : (
                    procurements.map((procurement) => (
                        <div key={procurement.id} className="bg-card rounded-lg border border-border shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{procurement.procurementNumber}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(procurement.createdAt), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                                    Pending Review
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Supervisor:</span>
                                    <span className="font-medium">{procurement.supervisorName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Items:</span>
                                    <span className="font-medium">{procurement.items.length}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedRequest(procurement)}
                                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Review
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-2xl rounded-lg border border-border shadow-lg flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">Review Request {selectedRequest.procurementNumber}</h2>
                            <button onClick={() => setSelectedRequest(null)} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div>
                                <h3 className="font-medium mb-3 flex items-center justify-between">
                                    <span>Requested Items</span>
                                    <button 
                                        onClick={handleAddItem}
                                        className="text-sm flex items-center text-primary hover:text-primary/80"
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> Add Item
                                    </button>
                                </h3>
                                <div className="space-y-3">
                                    {selectedRequest.items.map((item) => (
                                        <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-muted/50 rounded-md">
                                            <div className="flex-1 space-y-2 w-full">
                                                <input 
                                                    type="text" 
                                                    value={item.itemName}
                                                    onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                                                    placeholder="Item Name"
                                                    className="w-full px-2 py-1 border border-input rounded-md bg-background text-foreground"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={item.reason || ''}
                                                    onChange={(e) => handleItemChange(item.id, 'reason', e.target.value)}
                                                    placeholder="Reason (Optional)"
                                                    className="w-full text-sm px-2 py-1 border border-input rounded-md bg-background text-foreground"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                <label className="text-sm">Qty:</label>
                                                <input 
                                                    type="number" 
                                                    min="0.01"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val >= 0) handleItemChange(item.id, 'quantity', val);
                                                    }}
                                                    className="w-20 px-2 py-1 border border-input rounded-md bg-background text-foreground"
                                                />
                                                <button 
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedRequest.items.length === 0 && (
                                        <div className="text-sm text-muted-foreground text-center p-4">
                                            No items in request. Please add an item.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-input"
                                    placeholder="Enter your review remarks..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 border border-input text-foreground rounded-md hover:bg-accent hover:text-accent-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(false)}
                                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleAction(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Approve Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegionalHeadApprovalsPage;
