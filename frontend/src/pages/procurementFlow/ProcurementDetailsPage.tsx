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
                </div>

                {request.quotes && request.quotes.length > 0 && (
                    <div className="p-6 border-t border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Submitted Vendor Quotes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {request.quotes.map((quote) => (
                                <div key={quote.id} className={`rounded-lg border p-4 shadow-sm relative ${quote.isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border bg-card'}`}>
                                    {quote.isSelected && (
                                        <span className="absolute top-3 right-3 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            Selected Lowest
                                        </span>
                                    )}
                                    <h4 className="font-semibold text-base mb-1 pr-24">{quote.vendorName}</h4>
                                    <p className="text-sm text-muted-foreground mb-4">Total Amount: <strong className="text-foreground">Rs {quote.totalAmount.toLocaleString()}</strong></p>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">City:</span>
                                            <span className="text-right">{quote.cityName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Contact:</span>
                                            <span className="text-right">{quote.contactPerson || 'N/A'}<br/><span className="text-xs">{quote.contactNumber || ''}</span></span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bank:</span>
                                            <span className="text-right">{quote.bankName || 'N/A'}<br/><span className="text-xs">{quote.accountNumber || ''}</span></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

                        {/* Acceptance Section */}
                        {request.completedDate && (
                            <div className="mt-6 pt-6 border-t border-border">
                                <h4 className="text-md font-medium mb-4">Site Supervisor Acceptance</h4>
                                {request.supervisorAcceptanceDate ? (
                                    <div className="bg-background rounded p-4 border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${request.isAcceptedBySupervisor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {request.isAcceptedBySupervisor ? 'Accepted' : 'Rejected'}
                                            </span>
                                            <span className="text-sm text-muted-foreground">on {format(new Date(request.supervisorAcceptanceDate), 'dd MMM yyyy HH:mm')}</span>
                                        </div>
                                        <p className="text-sm mt-2"><span className="font-semibold text-muted-foreground">Remarks:</span> {request.supervisorAcceptanceRemarks || 'None'}</p>
                                    </div>
                                ) : (
                                    <AcceptanceForm procurementId={request.id} onComplete={() => loadData(request.id)} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AcceptanceForm: React.FC<{ procurementId: number, onComplete: () => void }> = ({ procurementId, onComplete }) => {
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAcceptance = async (isAccepted: boolean) => {
        setLoading(true);
        try {
            await procurementFlowService.acceptDelivery(procurementId, { isAccepted, remarks });
            onComplete();
        } catch (error) {
            console.error(error);
            alert('Failed to submit acceptance.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <textarea
                className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter remarks..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={3}
            />
            <div className="flex gap-4">
                <button
                    onClick={() => handleAcceptance(true)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    Accept Delivery
                </button>
                <button
                    onClick={() => handleAcceptance(false)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    Reject Delivery
                </button>
            </div>
        </div>
    );
}

export default ProcurementDetailsPage;
