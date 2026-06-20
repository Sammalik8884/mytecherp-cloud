import React, { useEffect, useState } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { ProcurementRequestDto } from '../../types/procurementFlow';
import { format } from 'date-fns';
import { CheckSquare, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PendingProcurementsPage: React.FC = () => {
    const [procurements, setProcurements] = useState<ProcurementRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ProcurementRequestDto | null>(null);
    const [deliveryNoteText, setDeliveryNoteText] = useState('');

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

    const openCompleteModal = (req: ProcurementRequestDto) => {
        setSelectedRequest(req);
        setCompleteModalOpen(true);
    };

    const handleComplete = async () => {
        if (!selectedRequest) return;
        try {
            await procurementFlowService.complete(selectedRequest.id, { deliveryNoteText, deliveryNoteDocuments: [] });
            toast.success('Procurement completed successfully');
            setCompleteModalOpen(false);
            setDeliveryNoteText('');
            loadData();
        } catch (error) {
            console.error('Failed to complete procurement', error);
            toast.error('Failed to complete procurement');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Pending Procurements</h1>
                <p className="text-sm text-muted-foreground mt-1">Your assigned procurements to fulfill and mark as complete.</p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">Procurement No.</th>
                            <th className="px-6 py-3 font-medium">Assigned Date</th>
                            <th className="px-6 py-3 font-medium">Supervisor</th>
                            <th className="px-6 py-3 font-medium">Items Count</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {procurements.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-medium">{p.procurementNumber}</td>
                                <td className="px-6 py-4">{format(new Date(p.assignedDate || p.createdAt), 'dd MMM yyyy')}</td>
                                <td className="px-6 py-4">{p.supervisorName}</td>
                                <td className="px-6 py-4">{p.items.length}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => openCompleteModal(p)}
                                        className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                                    >
                                        <CheckSquare className="h-4 w-4" />
                                        <span>Complete Procurement</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {procurements.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No procurements assigned to you currently
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {completeModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card w-full max-w-2xl rounded-lg shadow-lg flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">Complete Procurement: {selectedRequest.procurementNumber}</h2>
                            <button onClick={() => setCompleteModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-foreground mb-3">Requested Items to Deliver</h3>
                                <div className="border border-border rounded-md overflow-hidden bg-muted/20 p-4">
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {selectedRequest.items.map(i => (
                                            <li key={i.id}>{i.itemName} <span className="font-semibold">(Qty: {i.quantity})</span> {i.reason ? <span className="text-muted-foreground">- {i.reason}</span> : ''}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Delivery Note Text (Required)</label>
                                <textarea
                                    rows={4}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={deliveryNoteText}
                                    onChange={(e) => setDeliveryNoteText(e.target.value)}
                                    placeholder="Enter details of delivered items, DO numbers, or remarks..."
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    * Document upload feature will be integrated via FileService in future updates.
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border flex justify-end space-x-3 bg-muted/30">
                            <button 
                                onClick={() => setCompleteModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleComplete}
                                disabled={!deliveryNoteText.trim()}
                                className="px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                            >
                                Mark as Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingProcurementsPage;
