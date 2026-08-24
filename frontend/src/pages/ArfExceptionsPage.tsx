import { useEffect, useState } from "react";
import { arfExceptionApi, ArfExceptionRequestDto } from "../api/arfExceptionApi";
import { toast } from "react-hot-toast";

const ArfExceptionsPage = () => {
    const [requests, setRequests] = useState<ArfExceptionRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ArfExceptionRequestDto | null>(null);
    const [comment, setComment] = useState("");
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    const fetchRequests = async () => {
        try {
            const res = await arfExceptionApi.getAll();
            setRequests(res.data);
        } catch (error) {
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (isApproved: boolean) => {
        if (!selectedRequest) return;
        if (!comment.trim()) {
            toast.error("Comment is compulsory");
            return;
        }

        try {
            await arfExceptionApi.approve(selectedRequest.id, { isApproved, comment });
            toast.success(`Request ${isApproved ? "approved" : "rejected"} successfully`);
            setIsApproveModalOpen(false);
            setComment("");
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data || "Action failed");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">ARF Exception Requests</h1>
            {loading ? (
                <p>Loading...</p>
            ) : requests.length === 0 ? (
                <p>No requests found.</p>
            ) : (
                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3">Email</th>
                                <th className="p-3">Requested Amount</th>
                                <th className="p-3">Reason</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Comment</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(r => (
                                <tr key={r.id} className="border-t">
                                    <td className="p-3 font-medium">{r.employeeEmail}</td>
                                    <td className="p-3 text-primary font-bold">Rs {r.requestedAmount.toLocaleString()}</td>
                                    <td className="p-3 text-muted-foreground max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                                    <td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            r.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                            r.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-muted-foreground max-w-[200px] truncate" title={r.munawarComment}>{r.munawarComment || "-"}</td>
                                    <td className="p-3 text-right">
                                        {r.status === 'Pending' && (
                                            <button 
                                                onClick={() => { setSelectedRequest(r); setIsApproveModalOpen(true); }}
                                                className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
                                            >
                                                Review
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isApproveModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background w-full max-w-md p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Review Request</h2>
                        <div className="space-y-4 mb-6 text-sm">
                            <p><strong>Employee:</strong> {selectedRequest.employeeEmail}</p>
                            <p><strong>Amount:</strong> Rs {selectedRequest.requestedAmount.toLocaleString()}</p>
                            <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Comment (Compulsory) *</label>
                                <textarea 
                                    className="w-full border rounded-md p-2 h-24"
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Add reason for approval or rejection..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsApproveModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                            <button onClick={() => handleAction(false)} className="px-4 py-2 bg-red-600 text-white rounded-md">Reject</button>
                            <button onClick={() => handleAction(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-md">Approve</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ArfExceptionsPage;
