import React, { useEffect, useState } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { authService } from '../../services/authService';
import { ProcurementRequestDto } from '../../types/procurementFlow';
import { format } from 'date-fns';
import { FileText, UserPlus, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProcurementApprovedPage: React.FC = () => {
    const [procurements, setProcurements] = useState<ProcurementRequestDto[]>([]);
    const [executives, setExecutives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [executiveEmail, setExecutiveEmail] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await procurementFlowService.getApproved();
            setProcurements(data);
            
            const users = await authService.getUsers();
            const execs = users.filter((u: any) => u.roles && u.roles.includes('Procurement Executive'));
            setExecutives(execs);
            if (execs.length > 0) {
                setExecutiveEmail(execs[0].email);
            }
        } catch (error) {
            console.error('Failed to load approved procurements or users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateArf = (p: ProcurementRequestDto) => {
        const purpose = encodeURIComponent(`Procurement for Request ${p.procurementNumber}`);
        const selectedQuote = p.quotes?.find(q => q.isSelected);
        const amount = selectedQuote ? selectedQuote.totalAmount : 0;
        navigate(`/amount-request?action=generateFromProcurement&procurementId=${p.id}&amount=${amount}&purpose=${purpose}${p.siteId ? `&siteId=${p.siteId}` : ''}`);
    };

    const openAssignModal = (id: number) => {
        setSelectedId(id);
        setAssignModalOpen(true);
        if (executives.length > 0) {
            setExecutiveEmail(executives[0].email);
        }
    };

    const handleAssign = async () => {
        if (!selectedId || !executiveEmail) return;
        try {
            await procurementFlowService.assign(selectedId, { executiveEmail });
            toast.success('Executive assigned successfully');
            setAssignModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to assign executive', error);
            toast.error('Failed to assign executive');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Approved Procurements</h1>
                <p className="text-sm text-muted-foreground mt-1">Generate ARFs and assign executives to fulfill the requests.</p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">Procurement No.</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Supervisor</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {procurements.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-medium">{p.procurementNumber}</td>
                                <td className="px-6 py-4">{format(new Date(p.createdAt), 'dd MMM yyyy')}</td>
                                <td className="px-6 py-4">{p.supervisorName}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button 
                                        onClick={() => navigate(`/procurement-flow/${p.id}`)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                    </button>
                                    {p.status === 'ApprovedByPD' && (
                                        <button 
                                            onClick={() => openAssignModal(p.id)}
                                            className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md transition-colors text-sm"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            <span>Assign</span>
                                        </button>
                                    )}
                                    {p.status === 'QuotesSubmitted' && (
                                        <button 
                                            onClick={() => handleGenerateArf(p)}
                                            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span>Generate ARF</span>
                                        </button>
                                    )}
                                    {p.status === 'ARFCreated' && (
                                        <>
                                            {p.isArfApproved ? (
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            await procurementFlowService.procure(p.id);
                                                            toast.success('Procurement moved to ready state.');
                                                            loadData();
                                                        } catch (error) {
                                                            toast.error('Failed to update procurement');
                                                        }
                                                    }}
                                                    className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    <span>Procure (ARF Approved)</span>
                                                </button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic flex items-center justify-end h-9 px-3">
                                                    Waiting for ARF approval
                                                </span>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {procurements.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No approved procurements pending action
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {assignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card w-full max-w-md rounded-lg shadow-lg flex flex-col">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">Assign Executive</h2>
                            <button onClick={() => setAssignModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <label className="block text-sm font-medium text-foreground mb-1">Executive Email *</label>
                            <select
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={executiveEmail}
                                onChange={(e) => setExecutiveEmail(e.target.value)}
                            >
                                <option value="" disabled>Select an Executive</option>
                                {executives.map(e => (
                                    <option key={e.email} value={e.email}>{e.fullName} ({e.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="px-6 py-4 border-t border-border flex justify-end space-x-3 bg-muted/30">
                            <button 
                                onClick={() => setAssignModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAssign}
                                disabled={!executiveEmail}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcurementApprovedPage;
