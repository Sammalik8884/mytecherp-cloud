import React, { useEffect, useState } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { ProcurementRequestDto } from '../../types/procurementFlow';
import { format } from 'date-fns';
import { FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CompletedProcurementsPage: React.FC = () => {
    const [procurements, setProcurements] = useState<ProcurementRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await procurementFlowService.getCompletedExecutive();
            setProcurements(data);
        } catch (error) {
            console.error('Failed to load completed procurements', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Completed Procurements</h1>
                <p className="text-sm text-muted-foreground mt-1">View the procurement requests you have successfully completed.</p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">Procurement No.</th>
                            <th className="px-6 py-3 font-medium">Completed Date</th>
                            <th className="px-6 py-3 font-medium">Supervisor</th>
                            <th className="px-6 py-3 font-medium">Total Items</th>
                            <th className="px-6 py-3 font-medium">Documents</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {procurements.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-medium">{p.procurementNumber}</td>
                                <td className="px-6 py-4">{p.completedDate ? format(new Date(p.completedDate), 'dd MMM yyyy') : '-'}</td>
                                <td className="px-6 py-4">{p.supervisorName}</td>
                                <td className="px-6 py-4">{p.items.length}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-1">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>{p.deliveryNoteDocuments?.length || 0}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button 
                                        onClick={() => navigate(`/procurement-flow/${p.id}`)}
                                        className="inline-flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span>View Details</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {procurements.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    No completed procurements found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompletedProcurementsPage;
