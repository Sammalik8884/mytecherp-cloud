import React, { useEffect, useState } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { ProcurementRequestDto } from '../../types/procurementFlow';
import { format } from 'date-fns';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PendingApprovalsPage: React.FC = () => {
    const [procurements, setProcurements] = useState<ProcurementRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ProcurementRequestDto | null>(null);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await procurementFlowService.getPendingPd();
            setProcurements(data);
        } catch (error) {
            console.error('Failed to load pending approvals', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (isApproved: boolean) => {
        if (!selectedRequest) return;
        try {
            await procurementFlowService.pdReview(selectedRequest.id, { isApproved, remarks });
            toast.success(`Request ${isApproved ? 'approved' : 'rejected'} successfully`);
            setSelectedRequest(null);
            setRemarks('');
            loadData();
        } catch (error) {
            console.error('Failed to submit review', error);
            toast.error('Failed to submit review');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Procurement Pending Approvals</h1>
                <p className="text-sm text-muted-foreground mt-1">Review and approve procurement requests initiated by supervisors.</p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">Procurement No.</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Supervisor</th>
                            <th className="px-6 py-3 font-medium">Items Count</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {procurements.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-medium">{p.procurementNumber}</td>
                                <td className="px-6 py-4">{format(new Date(p.createdAt), 'dd MMM yyyy')}</td>
                                <td className="px-6 py-4">{p.supervisorName}</td>
                                <td className="px-6 py-4">{p.items.length}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setSelectedRequest(p)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors h-8 px-3"
                                    >
                                        Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {procurements.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No pending approvals found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card w-full max-w-3xl rounded-lg shadow-lg flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">Review Request: {selectedRequest.procurementNumber}</h2>
                            <button onClick={() => setSelectedRequest(null)} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Submitted By:</span>
                                    <span className="font-medium">{selectedRequest.supervisorName} ({selectedRequest.supervisorEmail})</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Date:</span>
                                    <span className="font-medium">{format(new Date(selectedRequest.createdAt), 'dd MMM yyyy HH:mm')}</span>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-bold text-foreground mb-3">Items Needed</h3>
                                <div className="border border-border rounded-md overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-2 font-medium text-left border-b border-border">Item Name</th>
                                                <th className="px-4 py-2 font-medium text-left border-b border-border">Qty</th>
                                                <th className="px-4 py-2 font-medium text-left border-b border-border">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {selectedRequest.items.map(item => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-2">{item.itemName}</td>
                                                    <td className="px-4 py-2">{item.quantity}</td>
                                                    <td className="px-4 py-2">{item.reason || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Remarks (Required for rejection)</label>
                                <textarea
                                    rows={3}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add any remarks..."
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border flex justify-end space-x-3 bg-muted/30">
                            <button 
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleAction(false)}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition-colors"
                            >
                                <XCircle className="h-4 w-4" />
                                <span>Reject</span>
                            </button>
                            <button 
                                onClick={() => handleAction(true)}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <span>Approve</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingApprovalsPage;
