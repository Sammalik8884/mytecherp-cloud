import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { procurementFlowService } from '../../services/procurementFlowService';
import { ProcurementRequestDto } from '../../types/procurementFlow';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const ProcurementDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [request, setRequest] = useState<ProcurementRequestDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData(Number(id));
        }
    }, [id]);

    const loadData = async (procId: number) => {
        try {
            const data = await procurementFlowService.getById(procId);
            setRequest(data);
        } catch (error) {
            console.error('Failed to load procurement details', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    if (!request) return <div className="p-8 text-center text-destructive">Procurement request not found</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Procurement Details</h1>
                    <p className="text-sm text-muted-foreground mt-1">ID: {request.procurementNumber}</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-border">
                    <div className="space-y-3">
                        <div>
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                {request.status}
                            </span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initiated By</span>
                            <span className="block mt-1 text-sm font-medium">{request.supervisorName} <span className="text-muted-foreground font-normal">({request.supervisorEmail})</span></span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initiation Date</span>
                            <span className="block mt-1 text-sm font-medium">{format(new Date(request.createdAt), 'dd MMM yyyy HH:mm')}</span>
                        </div>
                        {request.siteId && (
                            <div>
                                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Site ID</span>
                                <span className="block mt-1 text-sm font-medium">{request.siteId}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div>
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">PD Review Date</span>
                            <span className="block mt-1 text-sm font-medium">{request.pdApprovalDate ? format(new Date(request.pdApprovalDate), 'dd MMM yyyy HH:mm') : 'N/A'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">PD Remarks</span>
                            <span className="block mt-1 text-sm font-medium">{request.pdRemarks || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">ARF ID</span>
                            <span className="block mt-1 text-sm font-medium">{request.amountRequestFormId || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Requested Items</h3>
                    <div className="border border-border rounded-md overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium border-b border-border">Item Name</th>
                                    <th className="px-4 py-3 font-medium border-b border-border">Quantity</th>
                                    <th className="px-4 py-3 font-medium border-b border-border">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {request.items.map(item => (
                                    <tr key={item.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">{item.itemName}</td>
                                        <td className="px-4 py-3">{item.quantity}</td>
                                        <td className="px-4 py-3">{item.reason || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {(request.assignedExecutiveEmail || request.completedDate) && (
                    <div className="p-6 border-t border-border bg-muted/10">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Fulfillment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Executive</span>
                                    <span className="block mt-1 text-sm font-medium">{request.assignedExecutiveEmail || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Date</span>
                                    <span className="block mt-1 text-sm font-medium">{request.assignedDate ? format(new Date(request.assignedDate), 'dd MMM yyyy HH:mm') : 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Date</span>
                                    <span className="block mt-1 text-sm font-medium">{request.completedDate ? format(new Date(request.completedDate), 'dd MMM yyyy HH:mm') : 'Pending'}</span>
                                </div>
                            </div>

                            {request.completedDate && (
                                <div className="space-y-3">
                                    <div>
                                        <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery Notes</span>
                                        <div className="mt-1 text-sm bg-background border border-border rounded-md p-3 whitespace-pre-wrap">
                                            {request.deliveryNoteText || 'No text notes provided.'}
                                        </div>
                                    </div>
                                    {request.deliveryNoteDocuments && request.deliveryNoteDocuments.length > 0 && (
                                        <div>
                                            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attached Documents</span>
                                            <ul className="mt-1 space-y-1">
                                                {request.deliveryNoteDocuments.map((doc, idx) => (
                                                    <li key={idx}>
                                                        <a href={doc} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                                            Document {idx + 1}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcurementDetailsPage;
