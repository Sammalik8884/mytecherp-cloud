import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EstimatorActivitySummary } from '../../services/dashboardService';

interface Props {
    estimatorsSummary: EstimatorActivitySummary[];
}

export const EstimatorActivityChart: React.FC<Props> = ({ estimatorsSummary }) => {
    // Transform data for Quotes breakdown
    const quotesData = estimatorsSummary.map(s => ({
        name: s.estimatorName,
        Made: s.madeQuotesCount,
        Pending: s.pendingQuotesCount,
    }));

    // Transform data for Lines breakdown
    const linesData = estimatorsSummary.map(s => ({
        name: s.estimatorName,
        'Local Supply': s.localSupplyLines,
        'Imported Supply': s.importedSupplyLines,
        'Local Install': s.localInstallLines,
        'Imported Install': s.importedInstallLines,
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Quotes Activity</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quotesData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Made" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="Pending" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Line Items Breakdown</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={linesData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Local Supply" stackId="a" fill="#3b82f6" />
                            <Bar dataKey="Imported Supply" stackId="a" fill="#10b981" />
                            <Bar dataKey="Local Install" stackId="a" fill="#f59e0b" />
                            <Bar dataKey="Imported Install" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
