import React, { useEffect, useState } from 'react';
import { procurementFlowService } from '../../services/procurementFlowService';
import { ProcurementRequestDto } from '../../types/procurementFlow';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';

const ProcurementDashboardPage: React.FC = () => {
    const [procurements, setProcurements] = useState<ProcurementRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await procurementFlowService.getAll();
            setProcurements(data);
        } catch (error) {
            console.error('Failed to load procurements', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Procurement Dashboard</h1>
                <button 
                    onClick={() => navigate('/procurement-flow/create')}
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Initiate Request</span>
                </button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">Procurement No.</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Supervisor</th>
                            <th className="px-6 py-3 font-medium">Done By</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {procurements.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-medium">{p.procurementNumber}</td>
                                <td className="px-6 py-4">{format(new Date(p.createdAt), 'dd MMM yyyy')}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{p.supervisorName}</td>
                                <td className="px-6 py-4">{p.assignedExecutiveEmail || 'N/A'}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => navigate(`/procurement-flow/${p.id}`)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {procurements.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    No procurements found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProcurementDashboardPage;
