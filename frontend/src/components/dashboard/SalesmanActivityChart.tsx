import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface Record {
    date: string;
    totalVisits: number;
    activityPercentage: number;
}

interface SalesmanSummary {
    salesmanUserId: string;
    salesmanName: string;
    totalVisitsInPeriod: number;
    averageVisitsPerDay: number;
    averageActivityPercentage: number;
    dailyRecords: Record[];
}

interface Props {
    salesmenSummary: SalesmanSummary[];
}

export const SalesmanActivityChart: React.FC<Props> = ({ salesmenSummary }) => {
    if (!salesmenSummary || salesmenSummary.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground bg-secondary/20 rounded-2xl border border-border">
                No salesman activity available for this period.
            </div>
        );
    }

    // Prepare data for the Bar Chart: Each bar represents a Salesman's Average Activity Percentage
    const chartData = salesmenSummary.map(s => ({
        name: s.salesmanName,
        percentage: s.averageActivityPercentage,
        visits: s.totalVisitsInPeriod
    }));

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Salesman Activity (Check & Balance)</h3>
                <p className="text-sm text-muted-foreground">Average activity percentage based on a benchmark of 5 daily site visits.</p>
            </div>
            
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 12 }} 
                        />
                        <YAxis 
                            domain={[0, 100]} 
                            tickFormatter={(v) => `${v}%`}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-xl">
                                            <p className="font-bold text-sm mb-1">{data.name}</p>
                                            <div className="flex items-center justify-between gap-4 text-xs">
                                                <span className="text-muted-foreground">Avg Activity:</span>
                                                <span className="font-medium text-primary">{data.percentage}%</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 text-xs mt-1">
                                                <span className="text-muted-foreground">Total Visits:</span>
                                                <span className="font-medium">{data.visits}</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => {
                                const color = entry.percentage >= 100 ? '#10b981' : (entry.percentage >= 80 ? '#f59e0b' : '#ef4444');
                                return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
